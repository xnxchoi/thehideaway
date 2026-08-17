import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "src/payload.config";
import type { Currency, Plan, Price } from "src/payload-types";
import { isSameOrigin } from "src/lib/api/isSameOrigin";
import { rateLimitOr429 } from "src/lib/api/rateLimit";
import { beginIdempotent } from "src/lib/api/idempotency";
import { makeLostOrderRef } from "src/lib/lost-commerce/format";
import {
  buildPlanPortOnePayload,
  isPortOneCheckoutEnabled
} from "src/lib/lost-commerce/portone";
import type { LostCurrency } from "src/lib/lost-commerce/types";

export const runtime = "nodejs";

/**
 * Plans one-time card checkout — start.
 *
 * Creates a pending subscription pinned to the plan's active Price and
 * returns the PortOne browser-SDK payload. The subscription carries a
 * unique `payment_ref` (the PortOne paymentId); the browser completes the
 * card window, then `/checkout/return` calls the verify route which flips
 * the row to paid only after server-side verification. The webhook
 * reconciles the same ref idempotently as a backstop.
 *
 * Guards, all server-side (never trust the client for money):
 *   - auth required
 *   - plan active, card enabled in the plan's payment_methods
 *   - active KRW Price resolved server-side; amount taken from the Price row
 *   - reject unit_amount <= 0 (no ₩0 products through card)
 *   - seat-cap re-checked here (page render check is TOCTOU)
 *
 * Retry / abandonment: a pending *card* sub for the same (user, plan) is
 * REUSED, not rejected. If a buyer opens the PortOne window and closes it,
 * a second start refreshes the existing pending row with a fresh
 * `payment_ref` (invalidating the abandoned window's id) and returns a new
 * PortOne payload — so retry works and no phantom second row is minted. The
 * `subscriptions_pending_user_plan_uniq` partial index is the backstop for
 * the TOCTOU race: on a unique violation we re-read and reuse the winner.
 * Pending card subs still count toward the seat cap while live (a genuine
 * in-flight hold); they are reclaimed by `sweepStalePendingCardSubs` once
 * older than the abandonment window.
 */

// A pending card checkout older than this is treated as abandoned and may be
// swept / reused. Long enough to complete a real PortOne payment, short
// enough that an abandoned hold does not occupy a seat indefinitely.
const PENDING_CARD_TTL_MS = 30 * 60 * 1000;

const BodySchema = z.object({
  plan_id: z.string().min(1),
  price_id: z.string().min(1).optional()
});

const SUPPORTED_CARD_CURRENCIES: readonly LostCurrency[] = ["KRW"];

function currencyCodeOf(price: Price): string | null {
  const currency = price.currency;
  return typeof currency === "string" ? currency : (currency?.name ?? null);
}

function requestOrigin(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  return new URL(req.url).origin;
}

/**
 * Reclaim seats held by abandoned card checkouts. A pending CARD sub whose
 * row has not been touched (updated_at) within PENDING_CARD_TTL_MS is treated
 * as abandoned and canceled, so a stale hold does not occupy a seat on a
 * seat-limited plan forever. Best-effort; failures here never block checkout.
 * Manual (bank_transfer/cash) pending subs are NOT swept — those are
 * deliberately long-lived until an admin confirms receipt.
 */
async function sweepStalePendingCardSubs(
  payload: Awaited<ReturnType<typeof getPayload>>,
  planId: string
): Promise<void> {
  const cutoff = new Date(Date.now() - PENDING_CARD_TTL_MS).toISOString();
  try {
    const stale = await payload.find({
      collection: "subscriptions",
      overrideAccess: true,
      depth: 0,
      limit: 50,
      where: {
        and: [
          { plan: { equals: planId } },
          { subscription_status: { equals: "pending" } },
          { request_method: { equals: "card" } },
          { paid: { not_equals: true } },
          { updatedAt: { less_than: cutoff } }
        ]
      }
    });
    for (const doc of stale.docs as { id: string }[]) {
      await payload
        .update({
          collection: "subscriptions",
          id: doc.id,
          overrideAccess: true,
          data: { subscription_status: "canceled" }
        })
        .catch(() => undefined);
    }
  } catch {
    // Non-fatal — checkout proceeds even if the sweep fails.
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  if (!isPortOneCheckoutEnabled()) {
    return NextResponse.json(
      { ok: false, error: "card-unavailable" },
      { status: 503 }
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

  const idem = beginIdempotent(req, "checkout/card", userId);
  const replay = idem.get();
  if (replay) return replay as NextResponse;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const plan = (await payload
    .findByID({
      collection: "plans",
      id: body.plan_id,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as Plan | null;
  if (!plan || plan.state !== "active") {
    return NextResponse.json(
      { ok: false, error: "plan-not-found" },
      { status: 404 }
    );
  }

  // Card must be enabled for this plan.
  if (!(plan.payment_methods ?? []).includes("card")) {
    return NextResponse.json(
      { ok: false, error: "card-not-enabled" },
      { status: 400 }
    );
  }

  // Resolve Price (server-side; the amount is never client-supplied).
  let price: Price | null;
  if (body.price_id) {
    price = (await payload
      .findByID({
        collection: "prices",
        id: body.price_id,
        depth: 1,
        overrideAccess: true
      })
      .catch(() => null)) as Price | null;
    const pricePlanId =
      typeof price?.plan === "string" ? price.plan : price?.plan?.id;
    if (!price || !price.active || pricePlanId !== plan.id) {
      return NextResponse.json(
        { ok: false, error: "price-mismatch" },
        { status: 400 }
      );
    }
  } else {
    const priceList = await payload
      .find({
        collection: "prices",
        depth: 1,
        limit: 50,
        overrideAccess: true,
        where: {
          and: [{ plan: { equals: plan.id } }, { active: { equals: true } }]
        }
      })
      .catch(() => null);
    const activePrices = (priceList?.docs ?? []) as Price[];
    price =
      activePrices.find((candidate) => currencyCodeOf(candidate) === "KRW") ??
      activePrices[0] ??
      null;
  }
  if (!price) {
    return NextResponse.json({ ok: false, error: "no-price" }, { status: 404 });
  }

  const currencyCode = currencyCodeOf(price) as LostCurrency | null;
  if (!currencyCode || !SUPPORTED_CARD_CURRENCIES.includes(currencyCode)) {
    return NextResponse.json(
      { ok: false, error: "currency-unsupported" },
      { status: 400 }
    );
  }

  // No ₩0 (or negative) card charges.
  if (!(price.unit_amount > 0)) {
    return NextResponse.json(
      { ok: false, error: "invalid-amount" },
      { status: 400 }
    );
  }

  // Reclaim seats held by abandoned card checkouts before counting.
  await sweepStalePendingCardSubs(payload, plan.id);

  // Look up the caller's OWN pending sub for this plan BEFORE the seat gate.
  // A retrying buyer who already holds a pending seat must not be rejected as
  // sold-out by their own hold — reuse consumes no new seat.
  const existing = await payload
    .find({
      collection: "subscriptions",
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: {
        and: [
          { user: { equals: userId } },
          { plan: { equals: plan.id } },
          { subscription_status: { equals: "pending" } }
        ]
      }
    })
    .catch(() => null);
  const existingPending = existing?.docs?.[0] as
    | {
        id: string;
        paid?: boolean | null;
        request_method?: string | null;
      }
    | undefined;
  // Only a reusable pending CARD hold lets us skip the seat gate. A manual
  // or already-paid pending row is rejected below, not reused.
  const isReusableHold =
    !!existingPending &&
    existingPending.paid !== true &&
    existingPending.request_method === "card";

  // Seat-cap re-check (page render is TOCTOU). Skipped when the caller is
  // reusing their own existing pending card hold (no new seat consumed).
  if (!isReusableHold && plan.seat_limit && plan.seat_limit > 0) {
    const seats = await payload
      .count({
        collection: "subscriptions",
        overrideAccess: true,
        where: {
          and: [
            { plan: { equals: plan.id } },
            { subscription_status: { in: ["active", "pending"] } }
          ]
        }
      })
      .catch(() => ({ totalDocs: 0 }));
    if ((seats.totalDocs ?? 0) >= plan.seat_limit) {
      return NextResponse.json(
        { ok: false, error: "sold-out" },
        { status: 409 }
      );
    }
  }

  const currencyId =
    typeof price.currency === "string"
      ? price.currency
      : (price.currency as Currency | null | undefined)?.id;
  if (!currencyId) {
    payload.logger.error?.(
      `[card checkout] price ${price.id} has no currency id`
    );
    return NextResponse.json(
      { ok: false, error: "price-currency-missing" },
      { status: 500 }
    );
  }

  const paymentRef = makeLostOrderRef("hda_plan");

  // Reuse-or-create. A buyer who abandons the PortOne window must be able to
  // retry: reuse their own existing pending CARD sub for this plan (refresh
  // its payment_ref so the abandoned window's id can no longer be verified)
  // rather than dead-ending on the unique index.
  let subscriptionId: string;
  if (existingPending) {
    // A paid (but not-yet-activated) row, or a manual bank-transfer/cash hold,
    // is a different flow — do not hijack it into a card window.
    if (existingPending.paid === true) {
      return NextResponse.json(
        { ok: false, error: "already-paid" },
        { status: 409 }
      );
    }
    if (existingPending.request_method !== "card") {
      return NextResponse.json(
        { ok: false, error: "pending-manual-exists" },
        { status: 409 }
      );
    }
    // Refresh the pending card row for a fresh attempt.
    try {
      await payload.update({
        collection: "subscriptions",
        id: existingPending.id,
        overrideAccess: true,
        data: {
          price: price.id,
          amount: price.unit_amount,
          currency: currencyId,
          provider: "portone",
          request_method: "card",
          payment_ref: paymentRef,
          portone_transaction_ref: null
        }
      });
    } catch (err) {
      payload.logger.error?.(
        `[card checkout] pending refresh failed: ${(err as Error).message}`
      );
      return NextResponse.json(
        { ok: false, error: "create-failed" },
        { status: 500 }
      );
    }
    subscriptionId = existingPending.id;
  } else {
    // No pending row — create one. The partial unique index is the backstop
    // for the sub-second TOCTOU race; on collision, re-read and reuse.
    try {
      const created = (await payload.create({
        collection: "subscriptions",
        overrideAccess: true,
        data: {
          user: userId,
          plan: plan.id,
          price: price.id,
          amount: price.unit_amount,
          currency: currencyId,
          start_date: new Date().toISOString(),
          subscription_status: "pending",
          paid: false,
          provider: "portone",
          request_method: "card",
          payment_ref: paymentRef
        }
      })) as { id: string };
      subscriptionId = created.id;
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const isUniqueViolation =
        msg.includes("subscriptions_pending_user_plan_uniq") ||
        msg.includes("duplicate key") ||
        (err as { code?: string }).code === "23505";
      if (!isUniqueViolation) {
        payload.logger.error?.(
          `[card checkout] subscription create failed: ${msg}`
        );
        return NextResponse.json(
          { ok: false, error: "create-failed" },
          { status: 500 }
        );
      }
      // The winner of the race created the pending row; adopt it and refresh
      // its payment_ref to our fresh id.
      const race = await payload
        .find({
          collection: "subscriptions",
          overrideAccess: true,
          depth: 0,
          limit: 1,
          where: {
            and: [
              { user: { equals: userId } },
              { plan: { equals: plan.id } },
              { subscription_status: { equals: "pending" } }
            ]
          }
        })
        .catch(() => null);
      const winner = race?.docs?.[0] as
        { id: string; paid?: boolean | null } | undefined;
      if (!winner || winner.paid === true) {
        return NextResponse.json(
          { ok: false, error: "pending-exists" },
          { status: 409 }
        );
      }
      await payload
        .update({
          collection: "subscriptions",
          id: winner.id,
          overrideAccess: true,
          data: {
            provider: "portone",
            request_method: "card",
            payment_ref: paymentRef,
            portone_transaction_ref: null
          }
        })
        .catch(() => undefined);
      subscriptionId = winner.id;
    }
  }

  let portone;
  try {
    portone = buildPlanPortOnePayload({
      paymentRef,
      subscriptionId,
      amount: price.unit_amount,
      currency: currencyCode,
      origin: requestOrigin(req),
      orderName: `${plan.tier_label} · ${plan.name}`
    });
  } catch {
    // PortOne payload could not be built (misconfig). Leave the pending row
    // as-is: it will be reused on the next attempt or swept once stale — we
    // no longer hard-cancel, so a transient config blip doesn't destroy a
    // legitimate in-flight hold.
    return NextResponse.json(
      { ok: false, error: "card-unavailable" },
      { status: 503 }
    );
  }

  const response = NextResponse.json(
    { ok: true, subscriptionId, paymentRef, portone },
    { status: 200 }
  );
  await idem.put(response);
  return response;
}
