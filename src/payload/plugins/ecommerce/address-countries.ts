import { defaultCountries } from "@payloadcms/plugin-ecommerce/client/react";
import type { CountryType } from "@payloadcms/plugin-ecommerce/types";
import { createTranslator } from "next-intl";
import messages from "../../../../messages/en.json";

const t = createTranslator({
  locale: "en",
  messages,
  namespace: "Commerce.countries"
});

// Payload 3.88 CountryType accepts a static string label. Keep the plugin's
// default English labels and source our added label from next-intl as well.
// Address support does not authorize physical shipping to these countries.
export const addressCountries: CountryType[] = [
  ...defaultCountries.filter(({ value }) => value !== "KR"),
  { label: t("KR"), value: "KR" }
];
