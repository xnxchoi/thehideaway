import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "@/lib/auth/getServerSession";
import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { TicketMailer, siteUrl } from "@/lib/email/ticket-mailer";
import { validateClaim } from "./validate";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string().min(8).max(64)
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
  user?: unknown;
  event?: unknown;
  order?: unknown;
  status?: string | null;
  paid?: boolean | null;
  claim_token?: string | null;
  claim_email?: string | null;
};

type EventLite = {
  name?: string;
  slug?: string | null;
  date?: string | null;
  location?: string | null;
  ticket_price?: number | null;
  max_per_user?: number | null;
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

  const found = await payload.find({
    collection: "tickets",
    where: { claim_token: { equals: body.token } },
    limit: 1,
    depth: 0,
    overrideAccess: true
  });
  const ticket = found?.docs?.[0] as TicketDoc | undefined;

  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: "invalid-or-claimed" },
      { status: 404 }
    );
  }

  const userId = String(session.user.id);
  const existingUser = idOf(ticket.user);

  const eventId = idOf(ticket.event);
  let event: EventLite | null = null;
  let capLimit = 3;
  let existingCount = 0;
  if (eventId) {
    event = (await payload
      .findByID({
        collection: "events",
        id: eventId,
        depth: 0,
        overrideAccess: true
      })
      .catch(() => null)) as EventLite | null;
    if (event?.slug === "day-n-night" && idOf(ticket.order)) {
      return NextResponse.json(
        { ok: false, error: "password-required" },
        { status: 403 }
      );
    }
    capLimit = event?.max_per_user ?? 3;
    const countResult = await payload.count({
      collection: "tickets",
      overrideAccess: true,
      where: {
        and: [
          { event: { equals: eventId } },
          { user: { equals: userId } },
          { status: { in: ["pending", "active", "used"] } }
        ]
      }
    });
    existingCount = countResult.totalDocs ?? 0;
  }

  const validation = validateClaim(
    {
      status: ticket.status ?? null,
      user: existingUser,
      claim_email: ticket.claim_email ?? null
    },
    userId,
    session.user.email ?? null,
    existingCount,
    capLimit
  );

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: validation.error,
        ...(validation.error === "user-cap-reached" ? { cap: capLimit } : {})
      },
      { status: validation.httpStatus }
    );
  }

  if (validation.alreadyClaimed) {
    return NextResponse.json(
      { ok: true, ticket_id: ticket.id, already_claimed: true },
      { status: 200 }
    );
  }

  await payload.update({
    collection: "tickets",
    id: ticket.id,
    overrideAccess: true,
    data: {
      user: userId,
      claim_token: null,
      claimed_at: new Date().toISOString()
    } as never
  });

  // If the gift ticket was already paid (purchaser settled before the
  // recipient claimed), onTicketPaid skipped its activation email — there
  // was no bound user at the time. Send the activation now.
  if (ticket.paid === true && session.user.email) {
    const mailer = new TicketMailer(payload);
    await mailer.sendActivation({
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number ?? null,
      eventName: event?.name ?? "Hideaway event",
      eventDate: event?.date ?? null,
      eventLocation: event?.location ?? null,
      ticketPrice: event?.ticket_price ?? null,
      recipientEmail: session.user.email,
      recipientName: session.user.name ?? null,
      qrUrl: `${siteUrl}/tickets/my/${ticket.id}`
    });
  }

  return NextResponse.json({ ok: true, ticket_id: ticket.id }, { status: 200 });
}
