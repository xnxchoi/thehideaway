import type { CollectionAfterChangeHook } from "payload";

type OrderDoc = {
  id: string;
  paid?: boolean | null;
  purchaser?: unknown;
  event?: unknown;
};

type EventLite = {
  name?: string | null;
};

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

/**
 * Admin-paid in-app notification for the order's purchaser (P4C-3).
 *
 * Triggered on the `paid:false → true` edge of a `ticket-orders` row —
 * the same edge that `issueOrderPaidPassword` fires the password mail on.
 * The two hooks are independent channels: the mail can fail (no SMTP,
 * Brevo outage) and the notification still lands; the notification can
 * fail (Payload outage on the notifications collection) and the mail
 * still goes out. Both are best-effort and never throw.
 *
 * Idempotency / re-entry:
 *   `issueOrderPaidPassword` issues an internal `payload.update` after
 *   the password is minted, which re-fires this hook chain. On that
 *   re-entry the previousDoc already has `paid: true`, so this hook
 *   short-circuits at the `becamePaid` check — exactly one notification
 *   per genuine paid edge.
 *
 * Mirrors the shape of `onTicketPaid` (notifications.type "access",
 * importance 2, English copy) so a future i18n sweep can hit both
 * hooks at once.
 */
export const onOrderPaid: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req
}) => {
  try {
    const current = doc as OrderDoc;
    const prev = previousDoc as OrderDoc | undefined;

    const becamePaid = current.paid === true && prev?.paid !== true;
    if (!becamePaid) return doc;

    const purchaserId = idOf(current.purchaser);
    if (!purchaserId) {
      req.payload.logger?.warn?.(
        `[onOrderPaid] order ${current.id} has no purchaser id; skipping notification`
      );
      return doc;
    }

    // Event name is descriptive flavor in the notification body — best
    // effort lookup; the notification still goes out if the lookup fails.
    const eventId = idOf(current.event);
    const event = eventId
      ? ((await req.payload
          .findByID({
            collection: "events",
            id: eventId,
            depth: 0,
            overrideAccess: true
          })
          .catch(() => null)) as EventLite | null)
      : null;
    const eventName = event?.name ?? "your event";

    await req.payload.create({
      collection: "notifications",
      overrideAccess: true,
      data: {
        recipient: purchaserId,
        type: "access",
        title: "Your reservation is paid",
        content: `Payment for ${eventName} has been confirmed. Check your inbox for the 48h order password.`,
        importance: 2
      } as never
    });

    req.payload.logger?.info?.(
      `[onOrderPaid] notification dispatched for order ${current.id} → purchaser ${purchaserId}`
    );
    return doc;
  } catch (err) {
    req.payload.logger?.error?.(
      `[onOrderPaid] failed for order ${(doc as { id?: string })?.id}: ${(err as Error).message}`
    );
    return doc;
  }
};
