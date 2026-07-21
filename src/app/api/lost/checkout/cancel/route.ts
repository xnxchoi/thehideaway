import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { cancelUnpaidProductOrder } from "@/lib/lost-commerce/orders";
import { syncProductPayment } from "@/lib/lost-commerce/product-payment";

export const runtime = "nodejs";

const BodySchema = z.object({
  order_ref: z.string().min(1)
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
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

  const result = await payload.find({
    collection: "product-orders" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { order_ref: { equals: parsed.data.order_ref } },
        { user: { equals: String(auth.user.id) } }
      ]
    } as never
  });

  const order = result.docs[0] as Record<string, unknown> | undefined;
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "order-not-found" },
      { status: 404 }
    );
  }

  try {
    const payments = await payload.find({
      collection: "product-payments" as never,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { order: { equals: String(order.id) } },
          { provider: { equals: "portone" } }
        ]
      }
    });
    const payment = payments.docs[0] as
      | { provider?: string; portone_order_ref?: string }
      | undefined;
    if (payment?.provider === "portone") {
      const paymentId = payment.portone_order_ref || parsed.data.order_ref;
      const syncResult = await syncProductPayment({
        payload,
        paymentId,
        expectedUserId: String(auth.user.id)
      });
      return NextResponse.json(syncResult, { status: syncResult.ok ? 200 : syncResult.status });
    }
    const cancelResult = await cancelUnpaidProductOrder({ payload, order });
    return NextResponse.json(cancelResult);
  } catch (err) {
    payload.logger.error?.(
      `[lost/checkout/cancel] failed for ${parsed.data.order_ref}: ${(err as Error).message}`
    );
    return NextResponse.json(
      { ok: false, error: "cancel-failed" },
      { status: 500 }
    );
  }
}
