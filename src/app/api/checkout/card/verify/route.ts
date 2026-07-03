import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { syncPlanPayment } from "@/lib/lost-commerce/plan-payment";

export const runtime = "nodejs";

/**
 * Plans card checkout — verify (browser-return path).
 *
 * Called from `/checkout/return` after the PortOne payment window closes.
 * Delegates to the shared idempotent `syncPlanPayment`, which fetches the
 * authoritative payment record, verifies it (status PAID, amount, currency,
 * non-TEST channel in prod), and flips the pending subscription to paid.
 *
 * Security posture (matches `/api/checkout/card` and every other
 * money-adjacent route):
 *   - `isSameOrigin` — CSRF.
 *   - `payload.auth()` — an authenticated session is required (401 otherwise).
 *   - `rateLimitOr429(req, "mutation", userId)` — bounds the outbound
 *     PortOne fetch amplification / enumeration surface.
 *   - Ownership: the subscription behind `payment_ref` must belong to the
 *     caller. A non-owner (or missing ref) gets an identical 404 — no
 *     existence oracle for other users' refs (via `expectedUserId` inside
 *     `syncPlanPayment`, checked BEFORE any PortOne call).
 *
 * Idempotent with the webhook: whichever runs first drives the pending→paid
 * edge; the second is a no-op that returns the same active subscription.
 */

const BodySchema = z.object({
  payment_ref: z.string().min(1)
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const payload = await getPayload({ config });
  let auth: Awaited<ReturnType<typeof payload.auth>>;
  try {
    auth = await payload.auth({ headers: await nextHeaders() });
  } catch {
    return NextResponse.json(
      { ok: false, error: "auth-failed" },
      { status: 401 }
    );
  }
  if (!auth.user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }
  const userId = String(auth.user.id);

  const rl = await rateLimitOr429(req, "mutation", userId);
  if (rl) return rl;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const result = await syncPlanPayment({
    payload,
    paymentId: body.payment_ref,
    expectedUserId: userId
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    subscriptionId: result.subscriptionId,
    status: result.status,
    alreadyProcessed: result.alreadyProcessed
  });
}
