import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { readLocaleCookie } from "./cookie";

export default getRequestConfig(async () => {
  const store = await cookies();
  // Global fallback is "en" to match the long-standing default of the
  // public surface. Locale-specific surfaces (e.g. day-n-night ticket
  // orders) override the fallback to "ko" via `readLocaleCookie` at
  // their own callsite.
  const locale = readLocaleCookie(store, "en");
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
