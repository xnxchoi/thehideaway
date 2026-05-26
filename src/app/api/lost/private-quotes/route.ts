import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { makeLostOrderRef } from "@/lib/lost-commerce/format";
import { assertLostRoleGate } from "@/lib/lost-commerce/cart";

export const runtime = "nodejs";

const BodySchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(99),
  note: z.string().max(1000).optional(),
  shipping: z.record(z.string(), z.unknown()).optional(),
  contact: z.record(z.string(), z.unknown()).optional()
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad-origin" }, { status: 403 });
  }

  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() });
  if (!auth.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rl = await rateLimitOr429(req, "mutation", String(auth.user.id));
  if (rl) return rl;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  const product = (await payload.findByID({
    collection: "products" as never,
    id: parsed.data.productId,
    depth: 0,
    overrideAccess: true
  })) as {
    id: string;
    name?: string;
    private_order_enabled?: boolean;
    private_tier_gate?: string;
  };

  if (!product?.private_order_enabled) {
    return NextResponse.json(
      { ok: false, error: "private-order-unavailable" },
      { status: 400 }
    );
  }

  try {
    assertLostRoleGate(auth.user, product.private_tier_gate);
  } catch {
    return NextResponse.json(
      { ok: false, error: "private-order-forbidden" },
      { status: 403 }
    );
  }

  const order = await payload.create({
    collection: "product-orders" as never,
    overrideAccess: true,
    data: {
      order_ref: makeLostOrderRef("lis_quote"),
      user: String(auth.user.id),
      storefront: "lostinseoul",
      order_mode: "private_order",
      status: "quote_requested",
      payment_status: "unpaid",
      fulfillment_status: "unfulfilled",
      currency: "KRW",
      subtotal_amount: 0,
      total_amount: 0,
      lines: [
        {
          productId: parsed.data.productId,
          productName: product.name,
          variantId: parsed.data.variantId,
          mode: "private_order",
          quantity: parsed.data.quantity,
          note: parsed.data.note
        }
      ],
      shipping: parsed.data.shipping,
      contact: parsed.data.contact,
      quote: { state: "requested", note: parsed.data.note }
    } as never
  });

  return NextResponse.json({ ok: true, order });
}
