import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload, type PayloadRequest } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import {
  productInventoryLock,
  productSkuMutationLock
} from "@/lib/db/sequences";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import { resolveLostCheckout } from "@/lib/lost-commerce/cart";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "@/lib/lost-commerce/commerce-commands";
import { createPrivateQuoteLineSnapshot } from "@/lib/lost-commerce/contracts";
import { hasPositivePrivateOrderPreset } from "@/lib/lost-commerce/product-skus";

const BodySchema = z
  .object({
    productId: z.string().min(1),
    skuId: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
    note: z.string().max(1000).optional(),
    shipping: z.record(z.string(), z.unknown()).optional(),
    contact: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

const CLIENT_QUOTE_ERRORS = new Set([
  "active-sku-required",
  "bad-quantity",
  "duplicate-sku-option",
  "invalid-sku-number",
  "invalid-sku-option",
  "invalid-sku-options",
  "invalid-sku-price",
  "private-disabled",
  "private-order-unavailable",
  "product-unavailable",
  "quantity-out-of-range",
  "sku-inactive",
  "sku-not-found",
  "sku-product-mismatch",
  "sku-required"
]);

function quoteErrorResponse(
  payload: Awaited<ReturnType<typeof getPayload>>,
  error: unknown
): NextResponse {
  const reason = error instanceof Error ? error.message : "unknown-error";
  if (reason === "private-order-forbidden") {
    return NextResponse.json({ ok: false, error: reason }, { status: 403 });
  }
  if (CLIENT_QUOTE_ERRORS.has(reason)) {
    return NextResponse.json({ ok: false, error: reason }, { status: 400 });
  }

  payload.logger.error?.({
    code: "lost-private-quote-request-failed",
    context: "POST /api/lost/private-quotes"
  });
  return NextResponse.json(
    { ok: false, error: "quote-request-failed" },
    { status: 500 }
  );
}

async function lockQuoteProducts(input: {
  payload: Awaited<ReturnType<typeof getPayload>>;
  productIds: string[];
  transactionID: string | number;
}): Promise<void> {
  for (const productId of [...new Set(input.productIds)].sort()) {
    await productInventoryLock(input.payload, input.transactionID, productId);
  }
}

async function lockQuoteSkus(input: {
  payload: Awaited<ReturnType<typeof getPayload>>;
  skuIds: string[];
  transactionID: string | number;
}): Promise<void> {
  for (const skuId of [...new Set(input.skuIds)].sort()) {
    await productSkuMutationLock(input.payload, input.transactionID, skuId);
  }
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

  const rl = await rateLimitOr429(req, "mutation", String(auth.user.id));
  if (rl) return rl;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const userId = String(auth.user.id);
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
    endpoint: "lost/private-quotes",
    userId,
    key: clientCommandKey
  });
  let commandClaim;
  try {
    commandClaim = await claimCommerceCommand({
      payload,
      commandKey,
      validatedInput: parsed.data,
      createBusinessKey: () => makeLostOrderRef("lis_quote")
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

  let transactionID: string | number | null = null;
  try {
    transactionID = await payload.db.beginTransaction();
    if (transactionID == null) throw new Error("transaction-failed");

    const txReq = {
      payload,
      transactionID,
      context: {}
    } as PayloadRequest;
    const line = {
      productId: parsed.data.productId,
      skuId: parsed.data.skuId,
      mode: "private_order" as const,
      quantity: parsed.data.quantity
    };

    await lockQuoteProducts({
      payload,
      productIds: [line.productId],
      transactionID
    });

    await lockQuoteSkus({
      payload,
      skuIds: [line.skuId],
      transactionID
    });

    const product = (await payload.findByID({
      collection: "products",
      id: line.productId,
      depth: 0,
      disableErrors: true,
      req: txReq,
      overrideAccess: true
    })) as unknown as {
      id: string;
      name?: string;
      private_order_enabled?: boolean;
      private_preset_price_enabled?: boolean;
      private_unit_amount?: number | null;
    } | null;
    if (!product?.private_order_enabled) {
      throw new Error("private-order-unavailable");
    }
    if (
      product.private_preset_price_enabled === true &&
      !hasPositivePrivateOrderPreset(product)
    ) {
      throw new Error("private-order-unavailable");
    }

    const resolved = await resolveLostCheckout({
      payload,
      user: auth.user,
      lines: [line],
      req: txReq,
      allowUnpricedPrivateOrder: true
    });

    const snapshot = resolved.lines[0];
    if (!snapshot || snapshot.skuId !== line.skuId) {
      throw new Error("sku-not-found");
    }
    const quoteLine = createPrivateQuoteLineSnapshot(snapshot);
    const hasPresetPrice = quoteLine.unitAmount !== null;

    const order = (await payload.create({
      collection: "product-orders",
      overrideAccess: true,
      req: txReq,
      data: {
        order_ref: commandClaim.businessKey,
        user: userId,
        storefront: "lostinseoul",
        order_mode: "private_order",
        status: "quote_requested",
        payment_status: "unpaid",
        fulfillment_status: "unfulfilled",
        currency: resolved.currency,
        subtotal_amount: hasPresetPrice ? resolved.subtotalAmount : 0,
        total_amount: hasPresetPrice ? resolved.totalAmount : 0,
        line_snapshot_version: 3,
        lines: [quoteLine],
        shipping: parsed.data.shipping,
        contact: parsed.data.contact,
        quote: { state: "requested", note: parsed.data.note }
      }
    })) as unknown as { id: string | number; order_ref: string };

    const response = {
      ok: true as const,
      order: {
        id: String(order.id),
        order_ref: String(order.order_ref)
      }
    };
    await completeCommerceCommand({
      payload,
      req: txReq,
      commandKey,
      requestHash: commandClaim.requestHash,
      leaseToken: commandClaim.leaseToken,
      response,
      resource: { type: "product-order", id: String(order.id) }
    });

    await payload.db.commitTransaction(transactionID);
    return NextResponse.json(response);
  } catch (error) {
    if (transactionID != null) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
    }
    return quoteErrorResponse(payload, error);
  }
}
