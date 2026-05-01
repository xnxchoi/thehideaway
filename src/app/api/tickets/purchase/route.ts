import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

const BodySchema = z.object({
  event_slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  password: z.string().min(1)
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

type EventDoc = {
  id: string;
  name?: string | null;
  slug?: string | null;
  gate_password?: string | null;
  capacity?: number | null;
  max_per_user?: number | null;
  ticket_price?: number | null;
  state?: string | null;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const payload = await getPayload({ config });

  let auth: Awaited<ReturnType<typeof payload.auth>>;
  try {
    const headers = await nextHeaders();
    auth = await payload.auth({ headers });
  } catch {
    return NextResponse.json(
      { ok: false, error: "auth-failed" },
      { status: 401 }
    );
  }
  if (!auth.user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "bad-request", detail: String(err) },
      { status: 400 }
    );
  }

  const found = await payload
    .find({
      collection: "events",
      where: { slug: { equals: body.event_slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null);

  const event = found?.docs?.[0] as EventDoc | undefined;
  if (!event) {
    return NextResponse.json(
      { ok: false, error: "event-not-found" },
      { status: 404 }
    );
  }
  if (event.state !== "open") {
    return NextResponse.json(
      { ok: false, error: "event-not-open" },
      { status: 409 }
    );
  }

  if ((event.gate_password ?? "") !== body.password) {
    return NextResponse.json(
      { ok: false, error: "invalid-password" },
      { status: 401 }
    );
  }

  const userId = String(auth.user.id);

  // Capacity check: count active+pending tickets across all users.
  if (event.capacity && event.capacity > 0) {
    const total = await payload.count({
      collection: "tickets",
      overrideAccess: true,
      where: {
        and: [
          { event: { equals: event.id } },
          { status: { in: ["pending", "active", "used"] } }
        ]
      }
    });
    const remaining = event.capacity - (total.totalDocs ?? 0);
    if (remaining < body.quantity) {
      return NextResponse.json(
        { ok: false, error: "sold-out", remaining: Math.max(0, remaining) },
        { status: 409 }
      );
    }
  }

  // Per-user cap: count purchaser's existing tickets for this event.
  const cap = event.max_per_user ?? 3;
  const existingForUser = await payload.count({
    collection: "tickets",
    overrideAccess: true,
    where: {
      and: [
        { event: { equals: event.id } },
        { purchaser: { equals: userId } },
        { status: { in: ["pending", "active", "used"] } }
      ]
    }
  });
  const userRemaining = cap - (existingForUser.totalDocs ?? 0);
  if (userRemaining < body.quantity) {
    return NextResponse.json(
      {
        ok: false,
        error: "user-cap-reached",
        cap,
        remaining: Math.max(0, userRemaining)
      },
      { status: 409 }
    );
  }

  // Auto-increment ticket_number — same pattern as invoice_number.
  const last = await payload.find({
    collection: "tickets",
    limit: 1,
    sort: "-ticket_number",
    overrideAccess: true,
    depth: 0
  });
  const lastNumber =
    (last.docs?.[0] as { ticket_number?: number } | undefined)?.ticket_number ??
    0;

  const created: Array<{
    id: string;
    ticket_number: number;
    claim_token: string | null;
    claim_url: string | null;
  }> = [];

  for (let i = 0; i < body.quantity; i++) {
    const isPurchaserOwn = i === 0;
    const claimToken = isPurchaserOwn ? null : nanoid(24);
    const checkInCode = nanoid(16);
    const ticketNumber = lastNumber + 1 + i;

    const doc = await payload.create({
      collection: "tickets",
      overrideAccess: true,
      data: {
        ticket_number: ticketNumber,
        event: event.id,
        user: isPurchaserOwn ? userId : null,
        purchaser: userId,
        status: "pending",
        paid: false,
        claim_token: claimToken,
        check_in_code: checkInCode
      } as never
    });

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "";
    const claimUrl = claimToken
      ? `${baseUrl}/tickets/claim/${claimToken}`
      : null;

    created.push({
      id: String(doc.id),
      ticket_number: ticketNumber,
      claim_token: claimToken,
      claim_url: claimUrl
    });
  }

  // Best-effort admin notification.
  try {
    await payload.create({
      collection: "deferred-emails" as never,
      overrideAccess: true,
      data: {
        to: process.env.ADMIN_EMAIL ?? "concierge@hideawayseoul.com",
        subject: `[Hideaway] ${body.quantity} ticket(s) pending — ${event.name ?? event.slug}`,
        body: `User ${userId} requested ${body.quantity} ticket(s) for "${event.name}".\n\nTicket IDs: ${created.map((t) => t.id).join(", ")}\n\nMark each ticket as paid in /vault once Toss receipt is confirmed.`
      } as never
    });
  } catch (err) {
    payload.logger.warn?.(
      `[tickets/purchase] failed to enqueue admin email: ${(err as Error).message}`
    );
  }

  return NextResponse.json(
    {
      ok: true,
      tickets: created,
      total_amount: (event.ticket_price ?? 0) * body.quantity
    },
    { status: 200 }
  );
}
