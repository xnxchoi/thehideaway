import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";

export const runtime = "nodejs";

const LineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  mode: z.enum(["standard_purchase", "request_to_order", "private_order"]),
  quantity: z.number().int().min(1).max(99),
  campaignId: z.string().min(1).optional()
});

const BodySchema = z.object({
  lines: z.array(LineSchema).max(50)
});

async function getAuth() {
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() });
  return { payload, user: auth.user };
}

async function findActiveCart(payload: Awaited<ReturnType<typeof getPayload>>, userId: string) {
  const res = await payload.find({
    collection: "product-carts" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { user: { equals: userId } },
        { storefront: { equals: "lostinseoul" } },
        { status: { equals: "active" } }
      ]
    }
  });
  return (res.docs?.[0] ?? null) as { id: string; lines?: unknown[] } | null;
}

export async function GET(): Promise<NextResponse> {
  const { payload, user } = await getAuth();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const cart = await findActiveCart(payload, String(user.id));
  return NextResponse.json({ ok: true, cart: cart ?? { lines: [] } });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad-origin" }, { status: 403 });
  }

  const { payload, user } = await getAuth();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rl = await rateLimitOr429(req, "mutation", String(user.id));
  if (rl) return rl;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  const userId = String(user.id);
  const existing = await findActiveCart(payload, userId);
  const data = {
    user: userId,
    storefront: "lostinseoul",
    status: "active",
    currency: "KRW",
    lines: parsed.data.lines
  };

  const cart = existing
    ? await payload.update({
        collection: "product-carts" as never,
        id: existing.id,
        overrideAccess: true,
        data: data as never
      })
    : await payload.create({
        collection: "product-carts" as never,
        overrideAccess: true,
        data: data as never
      });

  return NextResponse.json({ ok: true, cart });
}
