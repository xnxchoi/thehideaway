import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "@/lib/auth/getServerSession";
import { isSameOrigin } from "@/lib/api/isSameOrigin";

export const runtime = "nodejs";

const BodySchema = z.object({
  check_in_code: z.string().min(8).max(64)
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
  status?: string | null;
  checked_in?: boolean | null;
  user?: unknown;
  event?: unknown;
  ticket_number?: number | null;
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
  const role = session.user.role;
  if (role !== "admin" && role !== "editor") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
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
    where: { check_in_code: { equals: body.check_in_code } },
    limit: 1,
    depth: 1,
    overrideAccess: true
  });
  const ticket = found?.docs?.[0] as TicketDoc | undefined;
  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: "ticket-not-found" },
      { status: 404 }
    );
  }

  if (ticket.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "ticket-not-active", status: ticket.status },
      { status: 409 }
    );
  }

  // Idempotency: already checked in.
  if (ticket.checked_in) {
    const eventName =
      typeof ticket.event === "object" && ticket.event
        ? (ticket.event as { name?: string }).name
        : undefined;
    return NextResponse.json(
      {
        ok: true,
        already_checked_in: true,
        ticket_number: ticket.ticket_number,
        event_name: eventName
      },
      { status: 200 }
    );
  }

  const adminId = String(session.user.id);
  await payload.update({
    collection: "tickets",
    id: ticket.id,
    overrideAccess: true,
    data: {
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: adminId
    } as never
  });

  // Notify ticket holder of check-in (best-effort).
  const userId = idOf(ticket.user);
  const eventName =
    typeof ticket.event === "object" && ticket.event
      ? (ticket.event as { name?: string }).name
      : undefined;
  if (userId) {
    try {
      await payload.create({
        collection: "notifications",
        overrideAccess: true,
        data: {
          recipient: userId,
          type: "access",
          title: "Checked in",
          content: `You've been checked in to ${eventName ?? "the event"}.`,
          importance: 1
        } as never
      });
    } catch {
      // best-effort
    }
  }

  let userName: string | undefined;
  if (userId) {
    const u = (await payload
      .findByID({
        collection: "users",
        id: userId,
        depth: 0,
        overrideAccess: true
      })
      .catch(() => null)) as { name?: string; username?: string } | null;
    userName = u?.name ?? u?.username ?? undefined;
  }

  return NextResponse.json(
    {
      ok: true,
      ticket_number: ticket.ticket_number,
      event_name: eventName,
      user_name: userName
    },
    { status: 200 }
  );
}
