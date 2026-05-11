import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { nanoid } from "nanoid";
import { getServerSession } from "@/lib/auth/getServerSession";
import { TicketMailer, siteUrl } from "@/lib/email/ticket-mailer";

export const runtime = "nodejs";

const GiftSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(120).optional()
});

const BodySchema = z.object({
  event_slug: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  password: z.string().min(1),
  /**
   * Optional per-extra-ticket recipient details. Index 0 corresponds to
   * the first gift ticket (i.e. the second ticket overall — index 0 is
   * always the purchaser's own). If shorter than (quantity - 1), the
   * remaining gift tickets are minted without a bound recipient email.
   */
  gifts: z.array(GiftSchema).max(9).optional()
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
  payment_instructions?: string | null;
  date?: string | null;
  location?: string | null;
  state?: string | null;
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

  const userId = String(session.user.id);

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
    recipient_email: string | null;
  }> = [];

  for (let i = 0; i < body.quantity; i++) {
    const isPurchaserOwn = i === 0;
    const claimToken = isPurchaserOwn ? null : nanoid(24);
    const checkInCode = nanoid(16);
    const ticketNumber = lastNumber + 1 + i;
    const giftIndex = isPurchaserOwn ? -1 : i - 1;
    const giftDetail = giftIndex >= 0 ? body.gifts?.[giftIndex] : undefined;
    const claimEmail = giftDetail?.email ?? null;

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
        claim_email: claimEmail,
        check_in_code: checkInCode
      } as never
    });

    const claimUrl = claimToken
      ? `${siteUrl}/tickets/claim/${claimToken}`
      : null;

    created.push({
      id: String(doc.id),
      ticket_number: ticketNumber,
      claim_token: claimToken,
      claim_url: claimUrl,
      recipient_email: claimEmail
    });
  }

  // Customer-facing emails. All best-effort: a mail failure must not roll
  // back the reservation, since the purchaser already has a record in DB.
  const mailer = new TicketMailer(payload);
  const totalAmount = (event.ticket_price ?? 0) * body.quantity;
  const purchaserEmail = session.user.email ?? null;
  const purchaserName = session.user.name ?? null;

  if (purchaserEmail) {
    await mailer.sendPurchaseReceipt({
      ticketId: created[0]?.id ?? "",
      ticketNumber: created[0]?.ticket_number ?? null,
      eventName: event.name ?? "Hideaway event",
      eventDate: event.date ?? null,
      eventLocation: event.location ?? null,
      ticketPrice: event.ticket_price ?? null,
      recipientEmail: purchaserEmail,
      recipientName: purchaserName,
      quantity: body.quantity,
      totalAmount,
      paymentInstructions: event.payment_instructions ?? null
    });
  }

  for (const t of created) {
    if (!t.claim_url || !t.recipient_email) continue;
    await mailer.sendGiftInvite({
      ticketId: t.id,
      ticketNumber: t.ticket_number,
      eventName: event.name ?? "Hideaway event",
      eventDate: event.date ?? null,
      eventLocation: event.location ?? null,
      ticketPrice: event.ticket_price ?? null,
      recipientEmail: t.recipient_email,
      recipientName: null,
      claimUrl: t.claim_url,
      fromName: purchaserName
    });
  }

  return NextResponse.json(
    {
      ok: true,
      tickets: created,
      total_amount: totalAmount
    },
    { status: 200 }
  );
}
