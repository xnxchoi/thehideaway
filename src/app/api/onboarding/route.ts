import { getSession } from "@/lib/actions/auth";
import { getPayload } from "@/lib/payload";
import { User } from "@payload-types";
import { NextRequest, NextResponse } from "next/server";

type OnboardingBody = {
  step?: string;
  fields?: Record<string, unknown>;
  complete?: boolean;
};

/**
 * POST /api/onboarding
 * Accepts JSON body: { step?, fields?, complete? }
 *
 * - `complete: true` → sets `onboarded: true`, clears `onboardingProgress`
 * - `step` provided  → updates `onboardingProgress` JSON with current step info
 * - `fields` provided → persisted as-is in onboardingProgress for resume
 *
 * Uses overrideAccess since the onboarded field is admin-only via Payload's
 * collection access control, but a user completing their own onboarding is
 * the intended trigger.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload();

    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body: OnboardingBody = await req.json().catch(() => ({}));

    const ctx = {
      overrideAccess: true,
      user: { role: session.user.role as unknown as User["role"] }
    };

    if (body.complete) {
      // Final step — mark onboarded, clear progress
      await payload.update({
        collection: "users",
        id: userId,
        overrideAccess: true,
        context: ctx,
        data: {
          onboarded: true,
          onboardingProgress: null
        }
      });

      return NextResponse.json({ ok: true, completed: true });
    }

    // Intermediate step — persist progress
    if (body.step) {
      const existing = await payload.findByID({
        collection: "users",
        id: userId,
        overrideAccess: true,
        select: { onboardingProgress: true }
      });

      const prev = (existing.onboardingProgress as Record<string, unknown>) ?? {};
      const completedSteps = Array.isArray(prev.completedSteps)
        ? prev.completedSteps
        : [];

      if (!completedSteps.includes(body.step)) {
        completedSteps.push(body.step);
      }

      await payload.update({
        collection: "users",
        id: userId,
        overrideAccess: true,
        context: ctx,
        data: {
          onboardingProgress: {
            lastStep: body.step,
            completedSteps,
            fields: body.fields ?? prev.fields ?? {},
            updatedAt: new Date().toISOString()
          }
        }
      });

      return NextResponse.json({ ok: true, step: body.step });
    }

    // Fallback: legacy call with no body — just mark complete
    await payload.update({
      collection: "users",
      id: userId,
      overrideAccess: true,
      context: ctx,
      data: { onboarded: true }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[onboarding]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
