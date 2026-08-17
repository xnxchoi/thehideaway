import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "src/payload.config";
import { z } from "zod";

import { rateLimitOr429 } from "src/lib/api/rateLimit";
import { isSameOrigin } from "src/lib/api/isSameOrigin";
import { getServerSession } from "src/lib/auth/getServerSession";

export const runtime = "nodejs";

const BodySchema = z.object({
  order_id: z.string().trim().min(1).max(120)
});

type OrderDoc = {
  id: string;
  purchaser?: unknown;
  event?: unknown;
  purchaser_name?: string | null;
  sender_name?: string | null;
  paid?: boolean | null;
  payment_submitted_at?: string | null;
};

type UserDoc = {
  id: string;
  role?: string | null;
};

type EventDoc = {
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

  const rl = await rateLimitOr429(req, "auth", String(session.user.id));
  if (rl) return rl;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const payload = await getPayload({ config });
  const order = (await payload
    .findByID({
      collection: "ticket-orders",
      id: body.order_id,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as OrderDoc | null;

  if (!order || idOf(order.purchaser) !== String(session.user.id)) {
    return NextResponse.json(
      { ok: false, error: "not-found" },
      { status: 404 }
    );
  }

  if (order.paid) {
    return NextResponse.json({
      ok: true,
      paid: true,
      already_submitted: Boolean(order.payment_submitted_at),
      payment_submitted_at: order.payment_submitted_at ?? null
    });
  }

  if (order.payment_submitted_at) {
    return NextResponse.json({
      ok: true,
      paid: false,
      already_submitted: true,
      payment_submitted_at: order.payment_submitted_at
    });
  }

  const submittedAt = new Date().toISOString();
  const updated = (await payload.update({
    collection: "ticket-orders",
    id: order.id,
    depth: 0,
    overrideAccess: true,
    data: {
      payment_submitted_at: submittedAt
    } as never
  })) as OrderDoc;

  await notifyPaymentSubmitted({
    payload,
    order: updated,
    fallbackSubmittedAt: submittedAt
  });

  return NextResponse.json({
    ok: true,
    paid: false,
    already_submitted: false,
    payment_submitted_at: updated.payment_submitted_at ?? submittedAt
  });
}

async function notifyPaymentSubmitted({
  payload,
  order,
  fallbackSubmittedAt
}: {
  payload: Awaited<ReturnType<typeof getPayload>>;
  order: OrderDoc;
  fallbackSubmittedAt: string;
}) {
  try {
    const [admins, event] = await Promise.all([
      payload
        .find({
          collection: "users",
          depth: 0,
          limit: 25,
          pagination: false,
          overrideAccess: true,
          where: {
            role: { in: ["admin", "cofounder", "editor"] }
          }
        })
        .catch(() => null),
      idOf(order.event)
        ? payload
            .findByID({
              collection: "events",
              id: idOf(order.event) as string,
              depth: 0,
              overrideAccess: true
            })
            .catch(() => null)
        : Promise.resolve(null)
    ]);

    const eventName = (
      (event as EventDoc | null)?.name ?? "Day n Night"
    ).trim();
    const purchaserName = order.purchaser_name?.trim() || "A purchaser";
    const senderName = order.sender_name?.trim();
    const submittedAt = order.payment_submitted_at ?? fallbackSubmittedAt;
    const adminDocs = (admins?.docs ?? []) as UserDoc[];

    await Promise.allSettled(
      adminDocs.map((admin) =>
        payload.create({
          collection: "notifications",
          overrideAccess: true,
          data: {
            recipient: admin.id,
            type: "access",
            title: "Ticket payment submitted",
            content: `${purchaserName} marked ${eventName} order ${order.id} as transferred${senderName ? ` from ${senderName}` : ""}. Submitted at ${submittedAt}.`,
            importance: 2
          } as never
        })
      )
    );
  } catch (err) {
    payload.logger?.error?.(
      `[tickets/payment-submitted] notification failed for order ${order.id}: ${(err as Error).message}`
    );
  }
}
