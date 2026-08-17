import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { getServerSession } from "@/lib/auth/getServerSession";
import { isSameOrigin } from "@/lib/api/isSameOrigin";

export const runtime = "nodejs";

const BodySchema = z.object({
  ticket_id: z.string().min(1),
  recipient_name: z.string().min(1).max(120),
  address: z.string().min(1).max(500),
  phone: z.string().min(1).max(40)
});

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
    .catch(() => null)) as {
    id: string;
    user?: unknown;
    checked_in?: boolean | null;
  } | null;

  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: "ticket-not-found" },
      { status: 404 }
    );
  }

  if (idOf(ticket.user) !== String(session.user.id)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  if (!ticket.checked_in) {
    return NextResponse.json(
      { ok: false, error: "not-checked-in" },
      { status: 409 }
    );
  }

  await payload.update({
    collection: "tickets",
    id: ticket.id,
    overrideAccess: true,
    data: {
      delivery_address: {
        recipient_name: body.recipient_name,
        address: body.address,
        phone: body.phone,
        submitted_at: new Date().toISOString()
      }
    } as never
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
