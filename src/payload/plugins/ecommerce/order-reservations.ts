import type { Payload, PayloadRequest } from "payload";

import { inventoryReservationTerminalCommandKey } from "@/lib/lost-commerce/inventory-reservation-idempotency";
import { consumeInventoryReservationInTransaction } from "@/lib/lost-commerce/inventory-reservations";
import { releaseOrderInventoryReservationsInTransaction } from "@/lib/lost-commerce/order-inventory-reservations";

function relationId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : undefined;
  }
  return undefined;
}

function inventoryEnabled(payload: Payload): boolean {
  return Boolean(
    payload.collections && "inventory-reservations" in payload.collections
  );
}

export async function commitPluginOrderReservations(input: {
  payload: Payload;
  req: PayloadRequest;
  orderId: string;
  idempotencyKey: string;
  effectiveAt: string;
  paymentId?: string;
}): Promise<{ kind: "committed" | "skipped" | "paid_inventory_review" }> {
  if (!inventoryEnabled(input.payload)) return { kind: "skipped" };

  const found = await input.payload.find({
    collection: "inventory-reservations" as never,
    req: input.req,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    where: { order: { equals: input.orderId } }
  });
  const docs = found.docs ?? [];
  if (docs.length === 0) return { kind: "skipped" };

  for (const reservation of docs) {
    const reservationId = relationId((reservation as { id?: unknown }).id);
    const skuId = relationId((reservation as { sku?: unknown }).sku);
    const locationId = relationId(
      (reservation as { location?: unknown }).location
    );
    const quantity = Number((reservation as { quantity?: unknown }).quantity);
    if (!reservationId || !skuId || !locationId) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    const result = await consumeInventoryReservationInTransaction({
      payload: input.payload,
      req: input.req as never,
      paymentId: input.paymentId ?? input.orderId,
      request: {
        idempotencyKey: inventoryReservationTerminalCommandKey({
          baseKey: input.idempotencyKey,
          reservationId,
          operation: "consume"
        }),
        operation: "consume",
        orderId: input.orderId,
        reservationId,
        skuId,
        locationId,
        quantity,
        effectiveAt: input.effectiveAt
      }
    });
    if (result.kind === "paid_inventory_review") {
      return { kind: "paid_inventory_review" };
    }
  }
  return { kind: "committed" };
}

export async function releasePluginOrderReservations(input: {
  payload: Payload;
  req: PayloadRequest;
  orderId: string;
  idempotencyKey: string;
  effectiveAt: string;
}): Promise<void> {
  if (!inventoryEnabled(input.payload)) return;
  await releaseOrderInventoryReservationsInTransaction({
    payload: input.payload,
    req: input.req as never,
    orderId: input.orderId,
    idempotencyKey: input.idempotencyKey,
    effectiveAt: input.effectiveAt
  });
}
