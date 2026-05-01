import type { CollectionAfterChangeHook } from "payload";

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
  paid?: boolean | null;
  status?: string | null;
  user?: unknown;
  event?: unknown;
};

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

    if (userId && eventId) {
      const event = (await req.payload
        .findByID({
          collection: "events",
          id: eventId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null)) as { name?: string } | null;

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
    }

    try {
      await req.payload.create({
        collection: "deferred-emails" as never,
        overrideAccess: true,
        data: {
          to: process.env.ADMIN_EMAIL ?? "concierge@hideawayseoul.com",
          subject: `[Hideaway] Ticket activated — ${current.id}`,
          body: `Ticket ${current.id} has been marked paid and is now active.`
        } as never
      });
    } catch {
      // best-effort
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
