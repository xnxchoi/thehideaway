import type { Payload } from "payload";
import {
  productInventoryLock,
  productSkuMutationLock
} from "@/lib/db/sequences";

type AnyDoc = Record<string, any>;

type ProductLine = {
  schemaVersion?: number | null;
  mode?: string | null;
  productId?: string | null;
  skuId?: string | null;
  variantId?: string | null;
  quantity?: number | null;
};

function numericInventory(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function aggregateStandardLines(lines: ProductLine[]) {
  const reservations = new Map<
    string,
    { productId: string; quantity: number; skuId?: string; variantId?: string }
  >();
  for (const line of lines) {
    if (line.mode !== "standard_purchase") continue;
    if (!line.productId) continue;
    const quantity = Number(line.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    const key = `${line.productId}:${line.skuId ?? line.variantId ?? ""}`;
    const existing = reservations.get(key);
    if (existing) {
      existing.quantity += quantity;
      continue;
    }
    reservations.set(key, {
      productId: line.productId,
      quantity,
      ...(line.skuId ? { skuId: line.skuId } : {}),
      ...(line.variantId ? { variantId: line.variantId } : {})
    });
  }
  return [...reservations.values()];
}

export async function releaseStandardInventory(input: {
  payload: Payload;
  order: AnyDoc;
  req?: Record<string, unknown>;
}): Promise<void> {
  if (input.order.order_mode !== "standard_purchase") return;
  if (input.order.payment_status === "paid") return;

  const lines = Array.isArray(input.order.lines)
    ? (input.order.lines as ProductLine[])
    : [];
  const reservations = aggregateStandardLines(lines);
  const transactionID = input.req?.transactionID as string | number | undefined;
  if (transactionID) {
    const productIds = [
      ...new Set(reservations.map((reservation) => reservation.productId))
    ].sort();
    for (const productId of productIds) {
      await productInventoryLock(input.payload, transactionID, productId);
    }

    const skuIds = [
      ...new Set(
        reservations.flatMap((reservation) =>
          reservation.skuId ? [reservation.skuId] : []
        )
      )
    ].sort();
    for (const skuId of skuIds) {
      await productSkuMutationLock(input.payload, transactionID, skuId);
    }
  }

  for (const reservation of reservations) {
    if (reservation.skuId) {
      const sku = (await input.payload.findByID({
        collection: "product-variants",
        id: reservation.skuId,
        depth: 0,
        req: input.req as never,
        overrideAccess: true
      })) as AnyDoc;
      const skuInventory = numericInventory(sku.inventory);
      if (skuInventory === null) continue;
      const nextInventory = skuInventory + reservation.quantity;
      await input.payload.update({
        collection: "product-variants",
        id: reservation.skuId,
        req: input.req as never,
        overrideAccess: true,
        data: {
          inventory: nextInventory,
          ...(sku.stock_state === "out_of_stock"
            ? { stock_state: "in_stock" }
            : {})
        }
      });
      continue;
    }

    const product = (await input.payload.findByID({
      collection: "products" as never,
      id: reservation.productId,
      depth: 0,
      req: input.req as never,
      overrideAccess: true
    })) as AnyDoc;

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variantIndex = reservation.variantId
      ? variants.findIndex(
          (variant: AnyDoc) => variant?.id === reservation.variantId
        )
      : -1;
    const variant =
      reservation.variantId && variantIndex >= 0
        ? (variants[variantIndex] as AnyDoc)
        : null;

    const variantInventory = numericInventory(variant?.inventory);
    if (variant && variantInventory !== null) {
      const nextInventory = variantInventory + reservation.quantity;
      const nextVariants = variants.map((candidate: AnyDoc, index: number) => {
        if (index !== variantIndex) return candidate;
        return {
          ...candidate,
          inventory: nextInventory,
          ...(candidate.stock_state === "out_of_stock"
            ? { stock_state: "in_stock" }
            : {})
        };
      });
      await input.payload.update({
        collection: "products" as never,
        id: reservation.productId,
        req: input.req as never,
        overrideAccess: true,
        data: { variants: nextVariants } as never
      });
      continue;
    }

    const productInventory = numericInventory(product.inventory);
    if (productInventory === null) continue;

    const nextInventory = productInventory + reservation.quantity;
    await input.payload.update({
      collection: "products" as never,
      id: reservation.productId,
      req: input.req as never,
      overrideAccess: true,
      data: {
        inventory: nextInventory,
        ...(product.stock_state === "out_of_stock"
          ? { stock_state: "in_stock" }
          : {})
      } as never
    });
  }
}
