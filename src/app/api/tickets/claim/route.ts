import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "@/lib/auth/getServerSession";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string().min(8).max(64)
});

const isSameOrigin = (req: NextRequest): boolean => {
  const allowed = process.env.NEXT_PUBLIC_SERVER_URL;
  if (!allowed) return true;
  const candidate =
    req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!candidate) return false;
  try {
    const u = new URL(candidate);
    const a = new URL(allowed);
    return u.host === a.host && u.protocol === a.protocol;
  } catch {
    return false;
  }
};

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
  user?: unknown;
  event?: unknown;
  status?: string | null;
  claim_token?: string | null;
  claim_email?: string | null;
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
      { ok: false, error: "bad-request", detail: String(err) },
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
    // Maybe already claimed: search by user + null token won't help since we
    // don't have the original token. Just return claimed-or-invalid.
    return NextResponse.json(
      { ok: false, error: "invalid-or-claimed" },
      { status: 404 }
    );
  }

  if (ticket.status === "canceled") {
    return NextResponse.json(
      { ok: false, error: "ticket-canceled" },
      { status: 409 }
    );
  }

  const userId = String(session.user.id);
  const existingUser = idOf(ticket.user);

  // Idempotency: same user re-claiming.
  if (existingUser === userId) {
    return NextResponse.json(
      { ok: true, ticket_id: ticket.id, already_claimed: true },
      { status: 200 }
    );
  }

  if (existingUser) {
    return NextResponse.json(
      { ok: false, error: "already-claimed" },
      { status: 409 }
    );
  }

  // Email restriction.
  if (ticket.claim_email) {
    const userEmail = session.user.email;
    if (
      !userEmail ||
      userEmail.trim().toLowerCase() !== ticket.claim_email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { ok: false, error: "email-mismatch" },
        { status: 403 }
      );
    }
  }

  // Per-user cap dedup: ensure claiming user doesn't already exceed event cap.
  const eventId = idOf(ticket.event);
  if (eventId) {
    const event = (await payload
      .findByID({
        collection: "events",
        id: eventId,
        depth: 0,
        overrideAccess: true
      })
      .catch(() => null)) as { max_per_user?: number } | null;
    const cap = event?.max_per_user ?? 3;
    const existingForUser = await payload.count({
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
    if ((existingForUser.totalDocs ?? 0) >= cap) {
      return NextResponse.json(
        { ok: false, error: "user-cap-reached", cap },
        { status: 409 }
      );
    }
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

  return NextResponse.json({ ok: true, ticket_id: ticket.id }, { status: 200 });
}
