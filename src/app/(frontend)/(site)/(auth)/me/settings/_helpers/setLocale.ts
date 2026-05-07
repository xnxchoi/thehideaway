"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const SUPPORTED = ["en", "ko"] as const;
type Locale = (typeof SUPPORTED)[number];

export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!SUPPORTED.includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  const store = await cookies();
  store.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });
  revalidatePath("/", "layout");
}
