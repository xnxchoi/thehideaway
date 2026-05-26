import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { beginIdempotent } from "@/lib/api/idempotency";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import { buildPortOnePaymentPayload } from "@/lib/lost-commerce/portone";
import { resolveLostCheckout } from "@/lib/lost-commerce/cart";

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

function requestOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  return new URL(req.url).origin;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad-origin" }, { status: 403 });
  }

  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() });
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const userId = String(auth.user.id);
  const rl = await rateLimitOr429(req, "mutation", userId);
  if (rl) return rl;

  const idem = beginIdempotent(req, "lost/checkout/intent", userId);
  const replay = idem.get();
  if (replay) return replay as NextResponse;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  let resolved: Awaited<ReturnType<typeof resolveLostCheckout>>;
  try {
    resolved = await resolveLostCheckout({
      payload,
      user: auth.user,
      lines: parsed.data.lines
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 }
    );
  }

  const orderRef = makeLostOrderRef(
    resolved.mode === "request_to_order"
      ? "lis_rto"
      : resolved.mode === "private_order"
        ? "lis_private"
        : "lis"
  );

  const order = (await payload.create({
    collection: "product-orders" as never,
    overrideAccess: true,
    data: {
      order_ref: orderRef,
      user: userId,
      storefront: "lostinseoul",
      order_mode: resolved.mode,
      status:
        parsed.data.paymentProvider === "manual" ? "pending_payment" : "pending_payment",
      payment_status:
        parsed.data.paymentProvider === "manual" ? "pending_manual" : "pending",
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

  let portonePayload: unknown = null;
  let paymentStatus = "manual_pending";
  if (parsed.data.paymentProvider === "portone") {
    try {
      portonePayload = buildPortOnePaymentPayload({
        orderRef,
        amount: resolved.totalAmount,
        currency: resolved.currency,
        origin: requestOrigin(req),
        paymentChannel: parsed.data.paymentChannel,
        paymentMethod: parsed.data.paymentMethod
      });
      paymentStatus = "initiated";
    } catch (err) {
      await payload.update({
        collection: "product-orders" as never,
        id: order.id,
        overrideAccess: true,
        data: { status: "draft", payment_status: "unpaid" } as never
      });
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 503 }
      );
    }
  }

  const paymentRef = `${orderRef}_${parsed.data.paymentProvider}`;
  await payload.create({
    collection: "product-payments" as never,
    overrideAccess: true,
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

  const response = NextResponse.json({
    ok: true,
    order: { id: order.id, order_ref: order.order_ref },
    paymentProvider: parsed.data.paymentProvider,
    portone: portonePayload
  });
  await idem.put(response);
  return response;
}
