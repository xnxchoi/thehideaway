"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALE_COOKIE_NAME } from "@/i18n/cookie";
import { locales } from "@/i18n/locales";

type Locale = (typeof locales)[number];

export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!(locales as readonly string[]).includes(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  const store = await cookies();
  store.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax"
  });
  revalidatePath("/", "layout");
}
