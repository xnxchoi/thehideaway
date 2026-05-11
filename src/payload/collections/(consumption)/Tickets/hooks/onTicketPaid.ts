import type { CollectionAfterChangeHook } from "payload";

import { TicketMailer, siteUrl } from "@/lib/email/ticket-mailer";

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

type TicketDoc = {
  id: string;
  ticket_number?: number | null;
  paid?: boolean | null;
  status?: string | null;
  user?: unknown;
  event?: unknown;
};

type EventLite = {
  name?: string;
  date?: string | null;
  location?: string | null;
  ticket_price?: number | null;
};

type UserLite = {
  email?: string | null;
  name?: string | null;
};

/**
 * Triggered on `paid:false → true`. Flips the ticket to `active`, stamps
 * `paid_at`, drops an in-app notification, and emails the bound attendee
 * with their QR-link to the ticket page.
 */
export const onTicketPaid: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req
}) => {
  try {
    const current = doc as TicketDoc;
    const prev = previousDoc as TicketDoc | undefined;

    const becamePaid = current.paid === true && prev?.paid !== true;
    if (!becamePaid) return doc;

    const userId = idOf(current.user);
    const eventId = idOf(current.event);
    const nowIso = new Date().toISOString();

    const updates: Record<string, unknown> = {};
    if (current.status !== "active" && current.status !== "used") {
      updates.status = "active";
    }
    if (!prev?.paid) {
      updates.paid_at = nowIso;
    }

    if (Object.keys(updates).length > 0) {
      await req.payload.update({
        collection: "tickets",
        id: current.id,
        overrideAccess: true,
        data: updates
      });
    }

    // No attendee bound yet (gift ticket awaiting claim) — nothing to mail.
    if (!userId || !eventId) {
      req.payload.logger.info?.(
        `[onTicketPaid] ticket ${current.id} activated (unclaimed gift)`
      );
      return doc;
    }

    const [event, user] = await Promise.all([
      req.payload
        .findByID({
          collection: "events",
          id: eventId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null) as Promise<EventLite | null>,
      req.payload
        .findByID({
          collection: "users",
          id: userId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null) as Promise<UserLite | null>
    ]);

    const eventName = event?.name ?? "your event";

    try {
      await req.payload.create({
        collection: "notifications",
        overrideAccess: true,
        data: {
          recipient: userId,
          type: "access",
          title: "Your ticket is confirmed",
          content: `Your ticket for ${eventName} has been confirmed. We can't wait to see you.`,
          importance: 2
        } as never
      });
    } catch (err) {
      req.payload.logger.warn?.(
        `[onTicketPaid] failed to create notification for ticket ${current.id}: ${(err as Error).message}`
      );
    }

    if (user?.email) {
      const mailer = new TicketMailer(req.payload);
      const qrUrl = `${siteUrl}/tickets/my/${current.id}`;
      await mailer.sendActivation({
        ticketId: current.id,
        ticketNumber: current.ticket_number ?? null,
        eventName,
        eventDate: event?.date ?? null,
        eventLocation: event?.location ?? null,
        ticketPrice: event?.ticket_price ?? null,
        recipientEmail: user.email,
        recipientName: user.name ?? null,
        qrUrl
      });
    } else {
      req.payload.logger.warn?.(
        `[onTicketPaid] no email on user ${userId} for ticket ${current.id}; skipping activation mail`
      );
    }

    req.payload.logger.info?.(`[onTicketPaid] ticket ${current.id} activated`);
    return doc;
  } catch (err) {
    req.payload.logger.error?.(
      `[onTicketPaid] failed for ticket ${(doc as { id?: string })?.id}: ${(err as Error).message}`
    );
    return doc;
  }
};
