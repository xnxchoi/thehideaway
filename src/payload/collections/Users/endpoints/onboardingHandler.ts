import { User } from "@payload-types";
import { NextResponse } from "next/server";
import { addDataAndFileToRequest, PayloadHandler } from "payload";
import { z } from "zod";

type OnboardingBody = z.infer<typeof reqSchema>;
const reqSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("welcome"),
    fields: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      bio: z.string().max(500).optional(),
      link: z.url().optional(),
      location: z.string().optional()
    }),
    complete: z.boolean().optional()
  }),
  z.object({
    step: z.literal("profile"),
    fields: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      bio: z.string().max(500).optional()
    }),
    complete: z.boolean().optional()
  }),
  z.object({
    step: z.literal("details"),
    fields: z.object({
      link: z.url().optional(),
      location: z.string().optional()
    }),
    complete: z.boolean().optional()
  }),
  z.object({
    step: z.literal("complete"),
    fields: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      bio: z.string().max(500).optional(),
      link: z.url().optional(),
      location: z.string().optional()
    }),
    complete: z.boolean().optional()
  })
]);
export const onboardingHandler: PayloadHandler = async (req) => {
  await addDataAndFileToRequest(req);
  const { payload, context, user, data } = req;
  try {
    const payload = req.payload;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body: OnboardingBody = reqSchema.parse(data);

    const ctx = context;
    const passedData: Partial<User> = {};
    if (body.fields) {
      if ("firstName" in body.fields) {
        !!body.fields.firstName &&
          (passedData.firstName = body.fields.firstName);
      }
      if ("lastName" in body.fields) {
        !!body.fields.lastName && (passedData.lastName = body.fields.lastName);
      }
      if ("bio" in body.fields) {
        !!body.fields.bio && (passedData.bio = body.fields.bio);
      }
      if ("link" in body.fields) {
        !!body.fields.link && (passedData.link = body.fields.link);
      }
      if ("location" in body.fields) {
        !!body.fields.location && (passedData.location = body.fields.location);
      }
    }
    if (body.complete) {
      // Final step — mark onboarded, clear progress
      await payload.update({
        collection: "users",
        id: userId,
        overrideAccess: true,
        context: {
          ...ctx,
          overrideAccess: true
        },
        data: {
          ...passedData,
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

      const prev =
        (existing.onboardingProgress as Record<string, unknown>) ?? {};
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
          ...passedData,
          onboarded: body.complete,

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
};
