import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { beginIdempotent } from "@/lib/api/idempotency";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { productInventoryLock } from "@/lib/db/sequences";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import { buildPortOnePaymentPayload } from "@/lib/lost-commerce/portone";
import { resolveLostCheckout } from "@/lib/lost-commerce/cart";
import type { LostCartLineSnapshot } from "@/lib/lost-commerce/types";

export const runtime = "nodejs";

const LineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  mode: z.enum(["standard_purchase", "request_to_order", "private_order"]),
  quantity: z.number().int().min(1).max(99),
  campaignId: z.string().min(1).optional()
});

const BodySchema = z.object({
  lines: z.array(LineSchema).min(1).max(50),
  paymentProvider: z.enum(["portone", "manual"]),
  paymentChannel: z.string().min(1).optional(),
  paymentMethod: z.string().min(1).optional(),
  shipping: z.record(z.string(), z.unknown()).optional(),
  contact: z.record(z.string(), z.unknown()).optional()
});

type AnyDoc = Record<string, any>;

function requestOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  return new URL(req.url).origin;
}

function lostStorefrontBase(origin: string): string {
  const host = new URL(origin).hostname;
  return host === "lostinseoul.com" || host === "www.lostinseoul.com"
    ? ""
    : "/lostinseoul";
}

function reservationKey(line: LostCartLineSnapshot): string {
  return `${line.productId}:${line.variantId ?? ""}`;
}

function aggregateStandardLines(lines: LostCartLineSnapshot[]) {
  const reservations = new Map<
    string,
    { productId: string; quantity: number; variantId?: string }
  >();
  for (const line of lines) {
    if (line.mode !== "standard_purchase") continue;
    const key = reservationKey(line);
    const existing = reservations.get(key);
    if (existing) {
      existing.quantity += line.quantity;
      continue;
    }
    reservations.set(key, {
      productId: line.productId,
      quantity: line.quantity,
      ...(line.variantId ? { variantId: line.variantId } : {})
    });
  }
  return [...reservations.values()];
}

function numericInventory(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stockStateOf(product: AnyDoc, variant?: AnyDoc | null): string {
  return String(variant?.stock_state ?? product.stock_state ?? "in_stock");
}

function assertReservable(stockState: string) {
  if (stockState === "out_of_stock") throw new Error("out-of-stock");
  if (stockState === "on_request") throw new Error("standard-unavailable");
}

function decrement(value: number, quantity: number): number {
  if (quantity > value) throw new Error("insufficient-inventory");
  return value - quantity;
}

async function lockStandardProducts(input: {
  lines: z.infer<typeof LineSchema>[];
  payload: Awaited<ReturnType<typeof getPayload>>;
  transactionID: string | number;
}) {
  const productIds = [
    ...new Set(
      input.lines
        .filter((line) => line.mode === "standard_purchase")
        .map((line) => line.productId)
    )
  ].sort();

  for (const productId of productIds) {
    await productInventoryLock(input.payload, input.transactionID, productId);
  }
}

async function reserveStandardInventory(input: {
  lines: LostCartLineSnapshot[];
  payload: Awaited<ReturnType<typeof getPayload>>;
  req: Record<string, unknown>;
}) {
  const reservations = aggregateStandardLines(input.lines);
  for (const reservation of reservations) {
    const product = (await input.payload.findByID({
      collection: "products" as never,
      id: reservation.productId,
      depth: 0,
      req: input.req as never,
      overrideAccess: true
    })) as AnyDoc;

    if (!product?.active) throw new Error("product-unavailable");

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
    if (reservation.variantId && !variant) throw new Error("variant-not-found");

    assertReservable(stockStateOf(product, variant));

    const variantInventory = numericInventory(variant?.inventory);
    if (variant && variantInventory !== null) {
      const nextInventory = decrement(variantInventory, reservation.quantity);
      const nextVariants = variants.map((candidate: AnyDoc, index: number) => {
        if (index !== variantIndex) return candidate;
        return {
          ...candidate,
          inventory: nextInventory,
          ...(nextInventory === 0 ? { stock_state: "out_of_stock" } : {})
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

    const nextInventory = decrement(productInventory, reservation.quantity);
    await input.payload.update({
      collection: "products" as never,
      id: reservation.productId,
      req: input.req as never,
      overrideAccess: true,
      data: {
        inventory: nextInventory,
        ...(nextInventory === 0 ? { stock_state: "out_of_stock" } : {})
      } as never
    });
  }
}

function checkoutErrorStatus(error: string): number {
  if (error === "portone-not-configured") return 503;
  if (
    error === "insufficient-inventory" ||
    error === "out-of-stock" ||
    error === "campaign-full"
  ) {
    return 409;
  }
  if (
    error === "variant-not-found" ||
    error === "standard-unavailable" ||
    error === "product-unavailable" ||
    error.endsWith("-disabled") ||
    error.endsWith("-forbidden") ||
    error.endsWith("-required") ||
    error.endsWith("-ended") ||
    error.endsWith("-not-open") ||
    error.endsWith("-ineligible") ||
    error === "mixed-order-modes" ||
    error === "mixed-campaigns" ||
    error === "mixed-currency" ||
    error === "quantity-out-of-range" ||
    error === "bad-quantity" ||
    error === "invalid-amount" ||
    error === "empty-cart"
  ) {
    return 400;
  }
  return 500;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() });
  if (!auth.user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const userId = String(auth.user.id);
  const rl = await rateLimitOr429(req, "mutation", userId);
  if (rl) return rl;

  const idem = beginIdempotent(req, "lost/checkout/intent", userId);
  const replay = idem.get();
  if (replay) return replay as NextResponse;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const orderRef = makeLostOrderRef(
    parsed.data.lines[0]?.mode === "request_to_order"
      ? "lis_rto"
      : parsed.data.lines[0]?.mode === "private_order"
        ? "lis_private"
        : "lis"
  );

  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return NextResponse.json(
      { ok: false, error: "transaction-failed" },
      { status: 500 }
    );
  }
  const txReq = {
    payload,
    transactionID,
    context: {}
  } as Parameters<typeof payload.create>[0]["req"];

  let order: { id: string; order_ref: string };
  let portonePayload: unknown = null;
  let paymentStatus = "manual_pending";
  try {
    await lockStandardProducts({
      lines: parsed.data.lines,
      payload,
      transactionID
    });

    const resolved = await resolveLostCheckout({
      payload,
      user: auth.user,
      lines: parsed.data.lines,
      req: txReq as never
    });

    // Fixed-price discipline (PG review): no ₩0 / negative-total orders may
    // enter the payment path. `resolved.totalAmount` is server-computed from
    // catalog prices, never client-supplied — this rejects a TEST / ₩0
    // product before it can reach a card window.
    if (!(resolved.totalAmount > 0)) {
      throw new Error("invalid-amount");
    }

    if (parsed.data.paymentProvider === "portone") {
      const origin = requestOrigin(req);
      const storefrontBase = lostStorefrontBase(origin);

      portonePayload = buildPortOnePaymentPayload({
        orderRef,
        amount: resolved.totalAmount,
        currency: resolved.currency,
        origin,
        paymentChannel: parsed.data.paymentChannel,
        paymentMethod: parsed.data.paymentMethod,
        products: resolved.lines.map((line) => ({
          id: line.variantId
            ? `${line.productId}:${line.variantId}`
            : line.productId,
          name: line.variantLabel
            ? `${line.productName} / ${line.variantLabel}`
            : line.productName,
          amount: line.unitAmount,
          quantity: line.quantity,
          link: `${origin}${storefrontBase}/products/${line.productSlug}`
        }))
      });
      paymentStatus = "initiated";
    }

    await reserveStandardInventory({
      payload,
      req: txReq as never,
      lines: resolved.lines
    });

    order = (await payload.create({
      collection: "product-orders" as never,
      overrideAccess: true,
      req: txReq,
      data: {
        order_ref: orderRef,
        user: userId,
        storefront: "lostinseoul",
        order_mode: resolved.mode,
        status: "pending_payment",
        payment_status:
          parsed.data.paymentProvider === "manual"
            ? "pending_manual"
            : "pending",
        fulfillment_status:
          resolved.mode === "request_to_order" ? "reserved" : "unfulfilled",
        currency: resolved.currency,
        subtotal_amount: resolved.subtotalAmount,
        total_amount: resolved.totalAmount,
        campaign: resolved.campaignId,
        lines: resolved.lines,
        shipping: parsed.data.shipping,
        contact: parsed.data.contact
      } as never
    })) as { id: string; order_ref: string };

    const paymentRef = `${orderRef}_${parsed.data.paymentProvider}`;
    await payload.create({
      collection: "product-payments" as never,
      overrideAccess: true,
      req: txReq,
      data: {
        payment_ref: paymentRef,
        order: order.id,
        user: userId,
        provider: parsed.data.paymentProvider,
        status: paymentStatus,
        amount: resolved.totalAmount,
        currency: resolved.currency,
        portone_order_ref:
          parsed.data.paymentProvider === "portone" ? orderRef : undefined,
        payment_channel: parsed.data.paymentChannel,
        payment_method: parsed.data.paymentMethod,
        request_payload: portonePayload
      } as never
    });

    await payload.db.commitTransaction(transactionID);
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    const error = (err as Error).message;
    const status = checkoutErrorStatus(error);
    if (status >= 500) {
      payload.logger.error?.(
        `[lost/checkout/intent] transaction failed: ${error}`
      );
    }
    if (status === 503) {
      return NextResponse.json({ ok: false, error }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error }, { status });
  }

  const response = NextResponse.json({
    ok: true,
    order: { id: order.id, order_ref: order.order_ref },
    paymentProvider: parsed.data.paymentProvider,
    portone: portonePayload
  });
  await idem.put(response);
  return response;
}
