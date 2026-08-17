import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "src/payload.config";

import { safeEqual } from "src/lib/api/safeEqual";

export const runtime = "nodejs";

/**
 * Subscription expiry sweep cron.
 *
 * The platform's role model relies on `subscription_status === "active"`
 * gating tier access (`member` / `patron`). The collection has an
 * `expires_at` field, but nothing was watching it — expired subscribers
 * kept their elevated role indefinitely until an admin noticed and
 * edited the row by hand.
 *
 * This cron walks every `subscription_status: "active"` row where
 * `expires_at < now`, flips it to `expired`, and lets the existing
 * `syncRoleAfterSubscriptionChange` afterChange hook handle the role
 * demotion (it already checks the active→non-active transition).
 *
 * Lifetime plans (`validity: "lifetime"`) have `expires_at: null` —
 * the `less_than` predicate excludes them naturally.
 *
 * Designed to run daily (e.g. 03:00 KST). Re-runs are safe: subsequent
 * passes find no more `active` rows past their expiry. Idempotent.
 *
 * Auth: a Bearer token matching `CRON_SECRET`. Same pattern as the
 * pre-event reminder cron.
 */

const PAGE_LIMIT = 200;

type SubscriptionDoc = {
  id: string;
  expires_at?: string | null;
  subscription_status?: string | null;
};

function authorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization") ?? "";
  return safeEqual(auth, `Bearer ${expected}`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: "cron-not-configured" },
      { status: 503 }
    );
  }
  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const payload = await getPayload({ config });
  const now = new Date().toISOString();

  let page = 1;
  let exhausted = false;
  let expired = 0;
  let failed = 0;

  while (!exhausted) {
    const found = await payload.find({
      collection: "subscriptions",
      overrideAccess: true,
      depth: 0,
      limit: PAGE_LIMIT,
      page,
      where: {
        and: [
          { subscription_status: { equals: "active" } },
          { expires_at: { less_than: now } }
        ]
      }
    });

    for (const sub of found.docs as SubscriptionDoc[]) {
      try {
        await payload.update({
          collection: "subscriptions",
          id: sub.id,
          overrideAccess: true,
          data: { subscription_status: "expired" } as never
        });
        expired++;
      } catch (err) {
        payload.logger.warn?.(
          `[subscriptions/cron/expire] failed to expire ${sub.id}: ${(err as Error).message}`
        );
        failed++;
      }
    }

    if (found.docs.length < PAGE_LIMIT) exhausted = true;
    else page++;
  }

  return NextResponse.json(
    {
      ok: true,
      expired,
      failed
    },
    { status: 200 }
  );
}
