import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { syncProductPayment } from "@/lib/lost-commerce/product-payment";

const BodySchema = z.object({ payment_id: z.string().min(1) });

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, error: "bad-origin" }, { status: 403 });
  }
  const body = BodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() }).catch(() => null);
  if (!auth?.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const userId = String(auth.user.id);
  const limited = await rateLimitOr429(req, "mutation", userId);
  if (limited) return limited;

  const result = await syncProductPayment({
    payload,
    paymentId: body.data.payment_id,
    expectedUserId: userId
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: result.status }
    );
  }
  return NextResponse.json(result);
}
