import type { cookies } from "next/headers";

import { locales } from "./locales";

/**
 * Single source of truth for the locale cookie name. next-intl reads
 * this in `i18n/request.ts`, server routes read it via `readLocaleCookie`,
 * and the user-facing locale switcher (`actions/locale.ts`,
 * `me/settings/_helpers/setLocale.ts`) writes it. If we ever rotate the
 * cookie key, this constant is the only edit point.
 */
export const LOCALE_COOKIE_NAME = "locale";

/** Locales next-intl is configured to serve. Mirrors `i18n/locales.ts`. */
export type AppLocale = (typeof locales)[number];

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Read the locale cookie and narrow it to one of the configured locales.
 * Falls back to `fallback` (caller's choice) for missing or unknown
 * values — different surfaces want different defaults: the global
 * next-intl resolver defaults to "en" (matches `i18n/request.ts`),
 * but day-n-night ticket orders default to "ko" because their audience
 * is Korean-leaning. Each callsite picks its own fallback explicitly so
 * the contract stays legible.
 */
export function readLocaleCookie(
  store: CookieStore,
  fallback: AppLocale
): AppLocale {
  const raw = store.get(LOCALE_COOKIE_NAME)?.value;
  return (locales as readonly string[]).includes(raw ?? "")
    ? (raw as AppLocale)
    : fallback;
}
