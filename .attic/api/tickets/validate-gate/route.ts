import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPayload } from "payload";
import config from "src/payload.config";
import { isSameOrigin } from "src/lib/api/isSameOrigin";
import { rateLimitOr429 } from "src/lib/api/rateLimit";
import { safeEqual } from "src/lib/api/safeEqual";
import {
  EVENT_GATE_TTL_MS,
  eventGateCookieName,
  issueEventGateCookieValue
} from "src/lib/event-gate";

export const runtime = "nodejs";

const BodySchema = z.object({
  event_slug: z.string().min(1).max(200),
  password: z.string().min(1).max(200)
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  // Brute-force defense: gate passwords are short shared secrets.
  const rl = await rateLimitOr429(req, "auth");
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

  const res = NextResponse.json({ ok: true }, { status: 200 });
  const { value, expiresAt } = issueEventGateCookieValue(
    event.id,
    EVENT_GATE_TTL_MS
  );
  res.cookies.set(eventGateCookieName(body.event_slug), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
  return res;
}
