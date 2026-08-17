import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "src/payload.config";

import { safeEqual } from "src/lib/api/safeEqual";
import { TicketMailer, siteUrl } from "src/lib/email/ticket-mailer";

export const runtime = "nodejs";

/**
 * Pre-event reminder cron.
 *
 * Designed to be called once per day (e.g. 18:00 KST). Finds events
 * starting in the next 23–25 hours, then mails every active+claimed
 * ticket holder a reminder with their QR link.
 *
 * Two guards against double-sends:
 *   1. **Window narrowness** — 23–25h is a 2-hour band; two consecutive
 *      daily runs don't overlap unless the cron is wildly off-schedule.
 *   2. **Per-ticket `reminder_sent_at`** — every successful send stamps
 *      this field. The next pass skips tickets where the stamp is newer
 *      than `now - REMINDER_DEDUPE_HOURS`. Survives manual re-runs.
 *
 * Method is **POST** (not GET) so the `CRON_SECRET` never leaks via a
 * stray Referer or proxy access log.
 *
 * Auth: a Bearer token matching `CRON_SECRET`. The same secret should
 * be configured in whatever scheduler invokes the URL.
 */

const REMINDER_WINDOW_MIN_HOURS = 23;
const REMINDER_WINDOW_MAX_HOURS = 25;
/**
 * Dedup window: any ticket whose `reminder_sent_at` is newer than this
 * threshold is skipped. Half the reminder window keeps the math
 * defensively wide while preventing same-day re-sends.
 */
const REMINDER_DEDUPE_HOURS = 12;

const TICKETS_PAGE_LIMIT = 500;

/**
 * Per-process mutex preventing concurrent invocations from racing on
 * the read-then-stamp window for `reminder_sent_at`. Without this,
 * two simultaneous runs (scheduled + manual rerun) both see
 * unstamped rows and both send.
 *
 * Single-process scope is fine for our VPS deployment; when scaled
 * across replicas this becomes a Redis lock.
 */
let runInFlight = false;

type EventDoc = {
  id: string;
  name?: string | null;
  date?: string | null;
  location?: string | null;
  ticket_price?: number | null;
  state?: string | null;
};

type TicketDoc = {
  id: string;
  ticket_number?: number | null;
  status?: string | null;
  reminder_sent_at?: string | null;
  user?: { id?: string; email?: string | null; name?: string | null } | string;
  event?: unknown;
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

  // Mutex: refuse overlapping runs in the same process. Returns 409
  // (Conflict) — callers can retry after the current run finishes.
  if (runInFlight) {
    return NextResponse.json(
      { ok: false, error: "run-in-flight" },
      { status: 409 }
    );
  }
  runInFlight = true;

  try {
    return await runReminders(req);
  } finally {
    runInFlight = false;
  }
}

async function runReminders(_req: NextRequest): Promise<NextResponse> {
  const payload = await getPayload({ config });
  const now = new Date();
  const windowStart = new Date(
    now.getTime() + REMINDER_WINDOW_MIN_HOURS * 60 * 60 * 1000
  );
  const windowEnd = new Date(
    now.getTime() + REMINDER_WINDOW_MAX_HOURS * 60 * 60 * 1000
  );
  const dedupeAfter = new Date(
    now.getTime() - REMINDER_DEDUPE_HOURS * 60 * 60 * 1000
  );

  const events = await payload.find({
    collection: "events",
    overrideAccess: true,
    depth: 0,
    limit: 50,
    where: {
      and: [
        { state: { in: ["open", "closed"] } },
        { date: { greater_than_equal: windowStart.toISOString() } },
        { date: { less_than_equal: windowEnd.toISOString() } }
      ]
    }
  });

  const mailer = new TicketMailer(payload);
  let sent = 0;
  let skipped = 0;
  let dedup_skipped = 0;

  for (const ev of events.docs as EventDoc[]) {
    // Paginate — earlier the inner loop quietly truncated past 500
    // tickets per event. For Hideaway scale that's overkill, but the
    // loop is cheap and the bug is real.
    let page = 1;
    let exhausted = false;
    while (!exhausted) {
      // Dedup at the DB layer — only fetch tickets that either never
      // had a reminder stamped OR were stamped before `dedupeAfter`.
      // Postgres skips already-mailed rows entirely; the app-code
      // re-check below narrows the read-then-stamp TOCTOU window
      // further in case of read-replica lag.
      const tickets = await payload.find({
        collection: "tickets",
        overrideAccess: true,
        depth: 1,
        limit: TICKETS_PAGE_LIMIT,
        page,
        where: {
          and: [
            { event: { equals: ev.id } },
            { status: { equals: "active" } },
            {
              or: [
                { reminder_sent_at: { exists: false } },
                { reminder_sent_at: { less_than: dedupeAfter.toISOString() } }
              ]
            }
          ]
        }
      });

      for (const t of tickets.docs as TicketDoc[]) {
        // Defensive re-check — see note above.
        if (t.reminder_sent_at) {
          const lastSent = new Date(t.reminder_sent_at);
          if (!isNaN(lastSent.getTime()) && lastSent > dedupeAfter) {
            dedup_skipped++;
            continue;
          }
        }

        const user = typeof t.user === "object" && t.user ? t.user : null;
        const email = user?.email;
        if (!email) {
          skipped++;
          continue;
        }

        const hoursUntil = ev.date
          ? Math.max(
              0,
              (new Date(ev.date).getTime() - now.getTime()) / (60 * 60 * 1000)
            )
          : 24;

        const ok = await mailer.sendReminder({
          ticketId: t.id,
          ticketNumber: t.ticket_number ?? null,
          eventName: ev.name ?? "Hideaway event",
          eventDate: ev.date ?? null,
          eventLocation: ev.location ?? null,
          ticketPrice: ev.ticket_price ?? null,
          recipientEmail: email,
          recipientName: user?.name ?? null,
          qrUrl: `${siteUrl}/tickets/my/${t.id}`,
          hoursUntil
        });

        if (ok) {
          sent++;
          // Stamp the guard ONLY on success — a failed send (SMTP down,
          // bounced mailbox) leaves the field null so the next pass
          // tries again.
          try {
            await payload.update({
              collection: "tickets",
              id: t.id,
              overrideAccess: true,
              data: { reminder_sent_at: now.toISOString() } as never
            });
          } catch (err) {
            payload.logger.warn?.(
              `[reminders] failed to stamp reminder_sent_at on ${t.id}: ${(err as Error).message}`
            );
          }
        } else {
          skipped++;
        }
      }

      if (tickets.docs.length < TICKETS_PAGE_LIMIT) exhausted = true;
      else page++;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      events_processed: events.docs.length,
      sent,
      skipped,
      dedup_skipped
    },
    { status: 200 }
  );
}
