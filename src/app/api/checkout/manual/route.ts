import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Plan, Price } from "@/payload-types";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { beginIdempotent } from "@/lib/api/idempotency";

export const runtime = "nodejs";

const BodySchema = z.object({
  plan_id: z.string().min(1),
  /**
   * Optional explicit Price selection (Stripe-style). If omitted, the
   * server picks the first active Price for the plan — which is the
   * common case at launch (one KRW one-time Price per Plan). Clients
   * that surface multi-currency / multi-cadence pickers should send
   * this explicitly to avoid silent default drift.
   */
  price_id: z.string().min(1).optional(),
  method: z.enum(["bank_transfer", "cash"]),
  note: z.string().max(500).optional()
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
    const headers = await nextHeaders();
    auth = await payload.auth({ headers });
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

  const rl = await rateLimitOr429(req, "mutation", String(auth.user.id));
  if (rl) return rl;

  // Idempotent replay protection — double-click on the checkout button
  // returns the same pending subscription instead of minting a duplicate.
  const idem = beginIdempotent(req, "checkout/manual", String(auth.user.id));
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

  // Resolve Price. Either the client picked one explicitly (validate it
  // belongs to this Plan and is active) or we pick the first active Price
  // for the Plan. The Subscription pins to this Price so post-checkout
  // catalog edits cannot retroactively rewrite the transacted amount.
  let price: Price | null;
  if (body.price_id) {
    price = (await payload
      .findByID({
        collection: "prices",
        id: body.price_id,
        depth: 0,
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
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: {
          and: [{ plan: { equals: plan.id } }, { active: { equals: true } }]
        }
      })
      .catch(() => null);
    price = (priceList?.docs?.[0] ?? null) as Price | null;
    if (!price) {
      payload.logger.error?.(
        `[manual checkout] no active Price for plan ${plan.id}`
      );
      return NextResponse.json(
        { ok: false, error: "no-price" },
        { status: 404 }
      );
    }
  }

  // Pre-create dedup — without a unique partial index on
  // (user, plan, subscription_status='pending'), two clicks from two
  // tabs (no shared idempotency-key) would each create a new pending
  // row. Returning the existing pending sub here keeps the admin
  // inbox uncluttered and avoids ambiguous "which pending do I
  // confirm?" reconciliation.
  //
  // Caveat: this read-then-create still has a sub-second TOCTOU
  // window. Two genuinely-simultaneous requests can both miss the
  // existing row. Sprint 1 closes this with a partial unique index
  // (requires migration).
  const userId = String(auth.user.id);
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
  const existingPending = existing?.docs?.[0] as { id: string } | undefined;
  if (existingPending) {
    const replayResponse = NextResponse.json(
      {
        ok: true,
        subscriptionId: existingPending.id,
        status: "pending",
        method: body.method,
        deduped: true
      },
      { status: 200 }
    );
    await idem.put(replayResponse);
    return replayResponse;
  }

  // Backstop for the sub-second TOCTOU window: the partial unique index
  // `subscriptions_pending_user_plan_uniq` rejects a second pending row
  // for the same (user, plan). If we race past the pre-check above, we
  // catch the unique-violation and re-fetch the row the winner created.
  let created: { id: string };
  try {
    created = (await payload.create({
      collection: "subscriptions",
      overrideAccess: true,
      data: {
        user: userId,
        plan: plan.id,
        price: price.id,
        start_date: new Date().toISOString(),
        subscription_status: "pending",
        paid: false,
        request_method: body.method,
        ...(body.note ? { request_note: body.note } : {})
      }
    })) as { id: string };
  } catch (err) {
    const msg = (err as Error).message ?? "";
    // pg unique-violation surfaces with code 23505; Drizzle bubbles the
    // index name in the message. Detect either signal.
    const isUniqueViolation =
      msg.includes("subscriptions_pending_user_plan_uniq") ||
      msg.includes("duplicate key") ||
      (err as { code?: string }).code === "23505";
    if (!isUniqueViolation) {
      payload.logger.error?.(
        `[manual checkout] subscription create failed: ${msg}`
      );
      return NextResponse.json(
        { ok: false, error: "create-failed" },
        { status: 500 }
      );
    }
    const race = await payload.find({
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
    });
    const winner = race.docs?.[0] as { id: string } | undefined;
    if (!winner) {
      // The unique violation said "exists", but a follow-up read shows
      // nothing — the winning row must have been canceled between the
      // collision and our re-read. Fall through to a 409 rather than
      // creating a fresh row that re-races.
      return NextResponse.json(
        { ok: false, error: "race-no-winner" },
        { status: 409 }
      );
    }
    const replayResponse = NextResponse.json(
      {
        ok: true,
        subscriptionId: winner.id,
        status: "pending",
        method: body.method,
        deduped: true
      },
      { status: 200 }
    );
    await idem.put(replayResponse);
    return replayResponse;
  }

  // Best-effort admin notification — failure here must not block the response.
  try {
    await payload.create({
      collection: "deferred-emails" as never,
      overrideAccess: true,
      data: {
        to: process.env.ADMIN_EMAIL ?? "concierge@hideawayseoul.com",
        subject: `[Hideaway] Manual subscription pending — ${plan.tier_label}`,
        body: `User ${userId} requested a ${
          body.method
        } subscription to "${plan.name}".\n\nNote: ${body.note ?? "—"}\n\nMark Subscription ${created.id} as paid in /vault to activate.`
      } as never
    });
  } catch (err) {
    payload.logger.warn?.(
      `[manual checkout] failed to enqueue admin email: ${(err as Error).message}`
    );
  }

  const response = NextResponse.json(
    {
      ok: true,
      subscriptionId: created.id,
      status: "pending",
      method: body.method
    },
    { status: 200 }
  );
  await idem.put(response);
  return response;
}
