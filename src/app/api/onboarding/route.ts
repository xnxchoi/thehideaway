import { getPayload } from "@/lib/payload";
import { User } from "@payload-types";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/onboarding
 * Mark the authenticated user's onboarding as complete.
 * Uses overrideAccess since the onboarded field is admin-only via Payload's
 * collection access control, but a user completing their own onboarding is
 * the intended trigger.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload();

    // Resolve session via better-auth
    const session = await payload.betterAuth.api.getSession({
      headers: req.headers
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await payload.update({
      collection: "users",
      id: userId,
      overrideAccess: true,
      context: {
        overrideAccess: true,
        user: { role: session.user.role as unknown as User["role"] }
      },
      data: { onboarded: true }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[onboarding/complete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
