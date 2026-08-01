import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createLocalReq, getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import {
  productInventoryLock,
  productSkuMutationLock
} from "@/lib/db/sequences";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import {
  buildPortOnePaymentPayload,
  isPortOneCheckoutEnabled
} from "@/lib/lost-commerce/portone";
import { resolveLostCheckout } from "@/lib/lost-commerce/cart";
import { claimRequestOrderCapacity } from "@/lib/lost-commerce/campaigns";
import {
  createCommerceMoney,
  createCommerceTotalsSnapshot
} from "@/lib/lost-commerce/contracts";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "@/lib/lost-commerce/commerce-commands";
import { isManualPaymentEnabled } from "@/lib/lost-commerce/payment-methods";
import { requireInventoryReservationPolicyForCheckout } from "@/lib/lost-commerce/inventory-reservations";
import { reserveCheckoutOrderInventoryInTransaction } from "@/lib/lost-commerce/checkout-inventory-reservations";
import type { ReservationTransactionRequest } from "@/lib/lost-commerce/inventory-reservation-store";

export const runtime = "nodejs";

const LineSchema = z
  .object({
    productId: z.string().min(1),
    skuId: z.string().min(1),
    mode: z.enum(["standard_purchase", "request_to_order", "private_order"]),
    quantity: z.number().int().min(1).max(99),
    campaignId: z.string().min(1).optional()
  })
  .strict();

const BodySchema = z.object({
  lines: z.array(LineSchema).min(1).max(50),
  paymentProvider: z.enum(["portone", "manual"]),
  paymentChannel: z.string().min(1).optional(),
  paymentMethod: z.string().min(1).optional(),
  shipping: z.record(z.string(), z.unknown()).optional(),
  contact: z.record(z.string(), z.unknown()).optional()
});

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

async function lockCheckoutProducts(input: {
  lines: z.infer<typeof LineSchema>[];
  payload: Awaited<ReturnType<typeof getPayload>>;
  transactionID: string | number;
}) {
  const productIds = [
    ...new Set(input.lines.map((line) => line.productId))
  ].sort();

  for (const productId of productIds) {
    await productInventoryLock(input.payload, input.transactionID, productId);
  }
}

async function lockCheckoutSkus(input: {
  payload: Awaited<ReturnType<typeof getPayload>>;
  skuIds: string[];
  transactionID: string | number;
}) {
  for (const skuId of [...new Set(input.skuIds)].sort()) {
    await productSkuMutationLock(input.payload, input.transactionID, skuId);
  }
}

const CHECKOUT_ERROR_STATUS = new Map<string, number>([
  ["portone-not-configured", 503],
  ["insufficient-available-to-promise", 409],
  ["insufficient-inventory", 409],
  ["out-of-stock", 409],
  ["campaign-full", 409],
  ["campaign-capacity-reservations-unavailable", 503],
  ["campaign-not-allowed", 400],
  ["sku-not-found", 400],
  ["sku-inactive", 400],
  ["sku-product-mismatch", 400],
  ["sku-unavailable", 400],
  ["sku-required", 400],
  ["standard-unavailable", 400],
  ["product-unavailable", 400],
  ["standard-disabled", 400],
  ["request-disabled", 400],
  ["private-disabled", 400],
  ["private-order-forbidden", 400],
  ["campaign-required", 400],
  ["campaign-ended", 400],
  ["campaign-not-open", 400],
  ["campaign-sku-ineligible", 400],
  ["mixed-order-modes", 400],
  ["mixed-campaigns", 400],
  ["mixed-currency", 400],
  ["quantity-out-of-range", 400],
  ["bad-quantity", 400],
  ["invalid-sku-options", 400],
  ["invalid-sku-option", 400],
  ["duplicate-sku-option", 400],
  ["sku-product-required", 400],
  ["invalid-sku-number", 400],
  ["active-sku-required", 400],
  ["invalid-sku-price", 400],
  ["invalid-amount", 400],
  ["invalid-commerce-amount", 400],
  ["invalid-commerce-currency", 400],
  ["commerce-totals-mismatch", 400],
  ["empty-cart", 400]
]);

function checkoutErrorStatus(error: string): number | undefined {
  return CHECKOUT_ERROR_STATUS.get(error);
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

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  if (parsed.data.paymentProvider === "manual" && !isManualPaymentEnabled()) {
    return NextResponse.json(
      { ok: false, error: "payment-method-unavailable" },
      { status: 409 }
    );
  }
  if (
    parsed.data.paymentProvider === "portone" &&
    !isPortOneCheckoutEnabled()
  ) {
    return NextResponse.json(
      { ok: false, error: "portone-not-configured" },
      { status: 503 }
    );
  }

  let reservationPolicy:
    ReturnType<typeof requireInventoryReservationPolicyForCheckout> | undefined;
  if (parsed.data.lines.some((line) => line.mode === "standard_purchase")) {
    try {
      reservationPolicy = requireInventoryReservationPolicyForCheckout({
        paymentProvider: parsed.data.paymentProvider
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "inventory-reservations-unavailable" },
        { status: 503 }
      );
    }
  }

  let clientCommandKey: string;
  try {
    clientCommandKey = validateCommerceCommandKey(
      req.headers.get("idempotency-key")
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 400 }
    );
  }
  const commandKey = hashCommerceCommandInput({
    endpoint: "lost/checkout/intent",
    userId,
    key: clientCommandKey
  });
  let commandClaim;
  try {
    commandClaim = await claimCommerceCommand({
      payload,
      commandKey,
      validatedInput: parsed.data,
      createBusinessKey: () =>
        makeLostOrderRef(
          parsed.data.lines[0]?.mode === "request_to_order"
            ? "lis_rto"
            : parsed.data.lines[0]?.mode === "private_order"
              ? "lis_private"
              : "lis"
        )
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "commerce-command-unavailable" },
      { status: 503 }
    );
  }
  if (commandClaim.kind === "conflict") {
    return NextResponse.json(
      { ok: false, error: "idempotency-key-conflict" },
      { status: 409 }
    );
  }
  if (commandClaim.kind === "in_progress") {
    return NextResponse.json(
      { ok: false, error: "idempotency-in-progress" },
      {
        status: 409,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil(commandClaim.retryAfterMs / 1000))
          )
        }
      }
    );
  }
  if (commandClaim.kind === "replay") {
    return NextResponse.json(commandClaim.response, {
      headers: { "Idempotent-Replay": "true" }
    });
  }

  const orderRef = commandClaim.businessKey;

  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    return NextResponse.json(
      { ok: false, error: "transaction-failed" },
      { status: 500 }
    );
  }
  let order: { id: string; order_ref: string };
  let portonePayload: unknown = null;
  let paymentStatus = "manual_pending";
  try {
    const txReq = {
      ...(await createLocalReq(
        {
          req: { headers: req.headers, transactionID },
          user: auth.user
        },
        payload
      )),
      transactionID
    } satisfies ReservationTransactionRequest;

    await lockCheckoutProducts({
      lines: parsed.data.lines,
      payload,
      transactionID
    });

    let skuIds = parsed.data.lines.flatMap((line) =>
      line.skuId ? [line.skuId] : []
    );
    if (parsed.data.lines.some((line) => !line.skuId)) {
      const discovery = await resolveLostCheckout({
        payload,
        user: auth.user,
        lines: parsed.data.lines,
        req: txReq as never
      });
      skuIds = discovery.lines.map((line) => line.skuId);
    }
    await lockCheckoutSkus({ payload, skuIds, transactionID });

    const resolved = await resolveLostCheckout({
      payload,
      user: auth.user,
      lines: parsed.data.lines,
      req: txReq as never
    });
    if (resolved.mode === "request_to_order") {
      if (!resolved.campaignId) throw new Error("campaign-required");
      await claimRequestOrderCapacity({
        payload,
        campaignId: resolved.campaignId,
        productId: resolved.lines[0]?.productId ?? "",
        skuIds: [...new Set(resolved.lines.map((line) => line.skuId))].sort(),
        req: txReq as never
      });
    }

    // Fixed-price discipline (PG review): no ₩0 / negative-total orders may
    // enter the payment path. `resolved.totalAmount` is server-computed from
    // catalog prices, never client-supplied — this rejects a TEST / ₩0
    // product before it can reach a card window.
    if (!(resolved.totalAmount > 0)) {
      throw new Error("invalid-amount");
    }

    const totals = createCommerceTotalsSnapshot({
      currency: resolved.currency,
      subtotalAmount: resolved.subtotalAmount,
      discountAmount: 0,
      shippingAmount: 0,
      taxAmount: 0,
      totalAmount: resolved.totalAmount
    });
    const paymentMoney = createCommerceMoney(
      totals.totalAmount,
      totals.currency
    );

    if (parsed.data.paymentProvider === "portone") {
      // Master gate: reject the card path server-side when card checkout is
      // dark, so a direct POST can't mint a PortOne intent even with keys
      // present (e.g. during sandbox validation). Maps to 503 below.
      if (!isPortOneCheckoutEnabled()) {
        throw new Error("portone-not-configured");
      }

      const origin = requestOrigin(req);
      const storefrontBase = lostStorefrontBase(origin);

      portonePayload = buildPortOnePaymentPayload({
        orderRef,
        amount: paymentMoney.amount,
        currency: paymentMoney.currency,
        origin,
        paymentChannel: parsed.data.paymentChannel,
        paymentMethod: parsed.data.paymentMethod,
        products: resolved.lines.map((line) => ({
          id: `${line.productId}:${line.skuId}`,
          name: line.skuLabel
            ? `${line.productName} / ${line.skuLabel}`
            : line.productName,
          amount: line.unitAmount,
          quantity: line.quantity,
          link: `${origin}${storefrontBase}/products/${line.productSlug}`
        }))
      });
      paymentStatus = "initiated";
    }

    const expiresAt = reservationPolicy
      ? new Date(
          Date.now() + reservationPolicy.ttlMinutes * 60_000
        ).toISOString()
      : undefined;

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
        currency: totals.currency,
        subtotal_amount: totals.subtotalAmount,
        total_amount: totals.totalAmount,
        campaign: resolved.campaignId,
        line_snapshot_version: 3,
        lines: resolved.lines,
        shipping: parsed.data.shipping,
        contact: parsed.data.contact,
        expires_at: expiresAt
      } as never
    })) as { id: string; order_ref: string };

    if (reservationPolicy) {
      await reserveCheckoutOrderInventoryInTransaction({
        payload,
        req: txReq,
        order: { ...order, expires_at: expiresAt },
        lines: resolved.lines,
        policy: reservationPolicy,
        commandKey,
        effectiveAt: new Date().toISOString()
      });
    }

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
        amount: paymentMoney.amount,
        currency: paymentMoney.currency,
        portone_order_ref:
          parsed.data.paymentProvider === "portone" ? orderRef : undefined,
        payment_channel: parsed.data.paymentChannel,
        payment_method: parsed.data.paymentMethod,
        request_payload: portonePayload
      } as never
    });

    await completeCommerceCommand({
      payload,
      req: txReq,
      commandKey,
      requestHash: commandClaim.requestHash,
      leaseToken: commandClaim.leaseToken,
      response: {
        ok: true,
        order: { id: String(order.id), order_ref: order.order_ref },
        paymentProvider: parsed.data.paymentProvider,
        portone: portonePayload as never
      },
      resource: { type: "product-order", id: String(order.id) }
    });

    await payload.db.commitTransaction(transactionID);
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    const error = (err as Error).message;
    const status = checkoutErrorStatus(error);
    if (status === undefined) {
      payload.logger.error?.("[lost/checkout/intent] transaction failed");
      return NextResponse.json(
        { ok: false, error: "checkout-failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: false, error }, { status });
  }

  return NextResponse.json({
    ok: true,
    order: { id: order.id, order_ref: order.order_ref },
    paymentProvider: parsed.data.paymentProvider,
    portone: portonePayload
  });
}
