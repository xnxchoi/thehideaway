import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { productCartLock } from "@/lib/db/sequences";
import { resolveLostCheckout } from "@/lib/lost-commerce/cart";

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
  lines: z.array(LineSchema).max(50)
});

const CLIENT_CART_ERRORS = new Set([
  "active-sku-required",
  "bad-quantity",
  "campaign-ended",
  "campaign-full",
  "campaign-not-allowed",
  "campaign-not-open",
  "campaign-required",
  "campaign-sku-ineligible",
  "duplicate-sku-option",
  "insufficient-inventory",
  "invalid-sku-number",
  "invalid-sku-option",
  "invalid-sku-options",
  "invalid-sku-price",
  "mixed-campaigns",
  "mixed-currency",
  "mixed-order-modes",
  "out-of-stock",
  "private-disabled",
  "product-unavailable",
  "quantity-out-of-range",
  "request-disabled",
  "sku-inactive",
  "sku-not-found",
  "sku-product-mismatch",
  "sku-required",
  "standard-disabled",
  "standard-unavailable"
]);

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;
type TransactionRequest = NonNullable<
  Parameters<PayloadInstance["create"]>[0]["req"]
>;

async function getAuth() {
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() });
  return { payload, user: auth.user };
}

async function findActiveCart(
  payload: PayloadInstance,
  userId: string,
  req?: TransactionRequest
) {
  const res = await payload.find({
    collection: "product-carts",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { user: { equals: userId } },
        { storefront: { equals: "lostinseoul" } },
        { status: { equals: "active" } }
      ]
    },
    ...(req ? { req } : {})
  });
  return (res.docs?.[0] ?? null) as {
    id: string;
    line_schema_version?: unknown;
    lines?: unknown[];
  } | null;
}

export async function GET(): Promise<NextResponse> {
  const { payload, user } = await getAuth();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const cart = await findActiveCart(payload, String(user.id));
  return NextResponse.json({
    ok: true,
    cart: cart?.line_schema_version === 3 ? cart : null
  });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const { payload, user } = await getAuth();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const rl = await rateLimitOr429(req, "mutation", String(user.id));
  if (rl) return rl;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const userId = String(user.id);
  let transactionID: string | number | null = null;
  try {
    transactionID = await payload.db.beginTransaction();
    if (transactionID == null) throw new Error("transaction-failed");
    const txReq = {
      payload,
      transactionID,
      context: {}
    } as TransactionRequest;

    await productCartLock(payload, transactionID, userId, "lostinseoul");
    const resolved = parsed.data.lines.length
      ? await resolveLostCheckout({
          payload,
          user,
          lines: parsed.data.lines,
          req: txReq
        })
      : { currency: "KRW" as const, lines: [] };
    const existing = await findActiveCart(payload, userId, txReq);
    const data = {
      user: userId,
      storefront: "lostinseoul",
      status: "active",
      currency: resolved.currency,
      line_schema_version: 3,
      lines: resolved.lines
    };

    const cart = existing
      ? await payload.update({
          collection: "product-carts",
          id: existing.id,
          overrideAccess: true,
          req: txReq,
          data: data
        })
      : await payload.create({
          collection: "product-carts",
          overrideAccess: true,
          req: txReq,
          data: data
        });

    await payload.db.commitTransaction(transactionID);
    return NextResponse.json({ ok: true, cart });
  } catch (error) {
    if (transactionID != null) {
      await payload.db
        .rollbackTransaction(transactionID)
        .catch(() => undefined);
    }
    const reason = error instanceof Error ? error.message : "unknown-error";
    if (reason === "private-order-forbidden") {
      return NextResponse.json({ ok: false, error: reason }, { status: 403 });
    }
    if (reason === "campaign-capacity-reservations-unavailable") {
      return NextResponse.json({ ok: false, error: reason }, { status: 503 });
    }
    if (CLIENT_CART_ERRORS.has(reason)) {
      return NextResponse.json({ ok: false, error: reason }, { status: 400 });
    }

    payload.logger.error?.({
      code: "lost-cart-persistence-failed",
      context: "PATCH /api/lost/cart"
    });
    return NextResponse.json(
      { ok: false, error: "cart-persistence-failed" },
      { status: 500 }
    );
  }
}
