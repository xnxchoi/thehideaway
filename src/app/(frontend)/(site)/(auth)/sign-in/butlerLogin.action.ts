"use server";

/**
 * @dev-only — Butler bypass sign-in.
 *
 * Double-gated:
 *   1. NODE_ENV must be "development" — production builds will hard-throw.
 *   2. DEV_BUTLER_PASSWORD must be present — production environments will
 *      not have this var set, so even if the action somehow gets called
 *      (e.g. via a leaked dev build), it will refuse.
 *
 * Both gates are independent. Removing one still leaves the other.
 */

import { getPayload } from "@/lib/payload";
import { BUTLER_DEV_EMAIL } from "@/lib/auth/dev/seedButler";
import { headers } from "next/headers";

export async function butlerLoginAction(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Disabled in production." };
  }
  const password = process.env.DEV_BUTLER_PASSWORD;
  if (!password) {
    return { ok: false, error: "DEV_BUTLER_PASSWORD is not set." };
  }

  try {
    const payload = await getPayload();
    // Better Auth's `nextCookies` plugin (loaded in lib/auth/options.ts) sets
    // the session cookie on the Next.js response automatically when called
    // from a server action.
    await payload.betterAuth.api.signInEmail({
      body: { email: BUTLER_DEV_EMAIL, password },
      headers: await headers()
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Sign-in failed."
    };
  }
}
