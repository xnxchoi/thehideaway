import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

import { TicketMailer, siteUrl } from "@/lib/email/ticket-mailer";

export const runtime = "nodejs";

/**
 * Pre-event reminder cron.
 *
 * Designed to be called once per day (e.g. 18:00 KST). Finds events
 * starting in the next 23–25 hours, then mails every active+claimed
 * ticket holder a reminder with their QR link. The narrow 2-hour
 * window deliberately prevents accidental double-sends across two
 * consecutive daily runs.
 *
 * Auth: a Bearer token matching `CRON_SECRET`. The same secret should
 * be configured in whatever scheduler invokes the URL (Vercel Cron,
 * EasyCloud crontab, etc.).
 */

const REMINDER_WINDOW_MIN_HOURS = 23;
const REMINDER_WINDOW_MAX_HOURS = 25;

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
  user?: { id?: string; email?: string | null; name?: string | null } | string;
  event?: unknown;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "cron-not-configured" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const payload = await getPayload({ config });
  const now = new Date();
  const windowStart = new Date(
    now.getTime() + REMINDER_WINDOW_MIN_HOURS * 60 * 60 * 1000
  );
  const windowEnd = new Date(
    now.getTime() + REMINDER_WINDOW_MAX_HOURS * 60 * 60 * 1000
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

  for (const ev of events.docs as EventDoc[]) {
    const tickets = await payload.find({
      collection: "tickets",
      overrideAccess: true,
      depth: 1,
      limit: 500,
      where: {
        and: [{ event: { equals: ev.id } }, { status: { equals: "active" } }]
      }
    });

    for (const t of tickets.docs as TicketDoc[]) {
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
      if (ok) sent++;
      else skipped++;
    }
  }

  return NextResponse.json(
    {
      ok: true,
      events_processed: events.docs.length,
      sent,
      skipped
    },
    { status: 200 }
  );
}
