import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";

const BodySchema = z.object({
  event_slug: z.string().min(1).max(200),
  password: z.string().min(1).max(200)
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

const safeEqual = (a: string, b: string): boolean => {
  const max = Math.max(a.length, b.length, 1);
  const aBuf = Buffer.alloc(max);
  const bBuf = Buffer.alloc(max);
  aBuf.write(a);
  bBuf.write(b);
  return a.length === b.length && timingSafeEqual(aBuf, bBuf);
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
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

  const payload = await getPayload({ config });
  const found = await payload
    .find({
      collection: "events",
      where: { slug: { equals: body.event_slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null);

  const event = found?.docs?.[0] as
    | { id: string; gate_password?: string | null; state?: string | null }
    | undefined;

  if (!event) {
    // Constant-time compare against placeholder to avoid leaking event existence.
    safeEqual(body.password, "_no_event_password_placeholder_");
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  const stored = event.gate_password ?? "";
  if (!safeEqual(body.password, stored)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
