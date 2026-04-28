import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Plan } from "@/payload-types";

export const runtime = "nodejs";

const BodySchema = z.object({
  plan_id: z.string().min(1),
  method: z.enum(["bank_transfer", "cash"]),
  note: z.string().max(500).optional()
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

  const plan = (await payload
    .findByID({
      collection: "plans",
      id: body.plan_id,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as Plan | null;
  if (!plan || plan.state !== "active") {
    return NextResponse.json(
      { ok: false, error: "plan-not-found" },
      { status: 404 }
    );
  }

  const created = await payload.create({
    collection: "subscriptions",
    overrideAccess: true,
    data: {
      user: String(auth.user.id),
      plan: plan.id,
      start_date: new Date().toISOString(),
      subscription_status: "pending",
      paid: false,
      request_method: body.method,
      ...(body.note ? { request_note: body.note } : {})
    }
  });

  // Best-effort admin notification — failure here must not block the response.
  try {
    await payload.create({
      collection: "deferred-emails" as never,
      overrideAccess: true,
      data: {
        to: process.env.ADMIN_EMAIL ?? "concierge@hideawayseoul.com",
        subject: `[Hideaway] Manual subscription pending — ${plan.tier_label}`,
        body: `User ${String(auth.user.id)} requested a ${
          body.method
        } subscription to "${plan.name}".\n\nNote: ${body.note ?? "—"}\n\nMark Subscription ${created.id} as paid in /vault to activate.`
      } as never
    });
  } catch (err) {
    payload.logger.warn?.(
      `[manual checkout] failed to enqueue admin email: ${(err as Error).message}`
    );
  }

  return NextResponse.json(
    {
      ok: true,
      subscriptionId: created.id,
      status: "pending",
      method: body.method
    },
    { status: 200 }
  );
}
