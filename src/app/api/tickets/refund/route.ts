import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";

import { getServerSession } from "@/lib/auth/getServerSession";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { beginIdempotent } from "@/lib/api/idempotency";
import { TicketMailer } from "@/lib/email/ticket-mailer";
import { quoteRefund } from "@/lib/tickets/refund-schedule";

export const runtime = "nodejs";

/**
 * Admin-only refund endpoint.
 *
 * Computes a refund amount from the published schedule (`/refund`) based
 * on how many days remain until the event, marks the ticket
 * `status:"canceled"`, drops an in-app notification, and emails the
 * attendee with the refunded amount.
 *
 * The actual PG-side refund is out-of-scope for this endpoint (no PG is
 * wired yet); the endpoint records the customer-facing outcome and the
 * admin processes the bank-side reversal manually. When PortOne is
 * integrated, the PG refund call slots in just before the status flip.
 */

const BodySchema = z.object({
  ticket_id: z.string().min(1),
  /**
   * Optional override (0–100). When omitted, the schedule decides.
   * Use sparingly — admin override is for exceptional refunds outside
   * the policy schedule (e.g. event cancellation by the organizer).
   */
  override_percent: z.number().int().min(0).max(100).optional(),
  /** Optional admin note, surfaced in logs but not in the email. */
  note: z.string().max(500).optional()
});

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
  status?: string | null;
  paid?: boolean | null;
  user?: unknown;
  event?: unknown;
  order?: unknown;
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

type TicketOrderLite = {
  unit_amount?: number | null;
  total_amount?: number | null;
  quantity?: number | null;
  currency?: string | null;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const session = await getServerSession(await nextHeaders());
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }
  if (session.user.role !== "admin" && session.user.role !== "editor") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  // Mutation rate limit + idempotent replay protection — double-click on
  // the Refund button returns the original result instead of issuing a
  // second email + notification (and, post-PortOne, a second PG refund).
  const rl = await rateLimitOr429(req, "mutation", String(session.user.id));
  if (rl) return rl;
  const idem = beginIdempotent(req, "tickets/refund", String(session.user.id));
  const replay = idem.get();
  if (replay) return replay as NextResponse;

  const payload = await getPayload({ config });

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const ticket = (await payload
    .findByID({
      collection: "tickets",
      id: body.ticket_id,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as TicketDoc | null;

  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: "ticket-not-found" },
      { status: 404 }
    );
  }
  if (ticket.status === "canceled") {
    return NextResponse.json(
      { ok: false, error: "already-canceled" },
      { status: 409 }
    );
  }
  if (ticket.status === "used") {
    return NextResponse.json(
      { ok: false, error: "ticket-used" },
      { status: 409 }
    );
  }

  const eventId = idOf(ticket.event);
  const userId = idOf(ticket.user);

  const event = eventId
    ? ((await payload
        .findByID({
          collection: "events",
          id: eventId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null)) as EventLite | null)
    : null;

  const orderId = idOf(ticket.order);
  const order = orderId
    ? ((await payload
        .findByID({
          collection: "ticket-orders",
          id: orderId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null)) as TicketOrderLite | null)
    : null;

  const snapshotUnitAmount =
    typeof order?.unit_amount === "number" && order.unit_amount > 0
      ? order.unit_amount
      : null;
  const ticketPrice = snapshotUnitAmount ?? event?.ticket_price ?? 0;
  const quote = quoteRefund(ticketPrice, event?.date ?? null);
  const refundPercent = body.override_percent ?? quote.refundPercent;
  const refundAmount =
    body.override_percent !== undefined
      ? Math.round((ticketPrice * body.override_percent) / 100)
      : quote.refundAmount;

  // Conditional update — guards against two concurrent refund clicks
  // (without an idempotency key) both passing the `status` check above
  // and both running the side effects. The `where` predicate ensures
  // only one of the racing requests transitions the row; the other
  // sees `affected: 0` and reports `already-canceled`.
  const updateResult = await payload.update({
    collection: "tickets",
    overrideAccess: true,
    where: {
      and: [
        { id: { equals: ticket.id } },
        { status: { in: ["pending", "active"] } }
      ]
    },
    data: {
      status: "canceled"
    } as never
  });
  const affected =
    (updateResult as { docs?: unknown[] } | undefined)?.docs?.length ?? 0;
  if (affected === 0) {
    // Lost the race — another request just canceled this ticket.
    return NextResponse.json(
      { ok: false, error: "already-canceled" },
      { status: 409 }
    );
  }

  payload.logger.info?.(
    `[tickets/refund] ticket ${ticket.id} canceled by ${session.user.id}; refund ${refundPercent}% = ₩${refundAmount}${body.note ? ` (note: ${body.note})` : ""}`
  );

  // Customer comms — only meaningful if the ticket was paid AND there's a
  // bound attendee with an email. Cancelling a pending/unpaid reservation
  // is a silent admin action.
  if (ticket.paid === true && userId) {
    const user = (await payload
      .findByID({
        collection: "users",
        id: userId,
        depth: 0,
        overrideAccess: true
      })
      .catch(() => null)) as UserLite | null;

    if (user?.email) {
      const mailer = new TicketMailer(payload);
      await mailer.sendRefund({
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number ?? null,
        eventName: event?.name ?? "Hideaway event",
        eventDate: event?.date ?? null,
        eventLocation: event?.location ?? null,
        ticketPrice,
        recipientEmail: user.email,
        recipientName: user.name ?? null,
        refundAmount,
        refundPercent
      });

      try {
        await payload.create({
          collection: "notifications",
          overrideAccess: true,
          data: {
            recipient: userId,
            type: "access",
            title: "Refund issued",
            content: `Your ticket has been canceled. Refund: ₩${refundAmount.toLocaleString("ko-KR")} (${refundPercent}%).`,
            importance: 2
          } as never
        });
      } catch (err) {
        payload.logger.warn?.(
          `[tickets/refund] notification failed for ${ticket.id}: ${(err as Error).message}`
        );
      }
    }
  }

  const response = NextResponse.json(
    {
      ok: true,
      ticket_id: ticket.id,
      refund_percent: refundPercent,
      refund_amount: refundAmount,
      days_until_event: quote.daysUntilEvent
    },
    { status: 200 }
  );
  await idem.put(response);
  return response;
}
