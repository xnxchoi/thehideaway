"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { locales } from "@/i18n/locales";

type Locale = (typeof locales)[number];

const COOKIE_MAX_AGE_DAYS = 365;

function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && (locales as readonly string[]).includes(value));
}

export async function setLocale(rawLocale: string): Promise<void> {
  if (!isLocale(rawLocale)) {
    throw new Error(`Unsupported locale: ${rawLocale}`);
  }
  const store = await cookies();
  store.set("locale", rawLocale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    sameSite: "lax"
  });
  revalidatePath("/", "layout");
}
