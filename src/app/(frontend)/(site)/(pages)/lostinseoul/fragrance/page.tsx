import type { Metadata } from "next";
import { createTranslator } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import {
  getLostFragranceData,
  getLostHomeData
} from "@/lib/lost-commerce/queries";
import enMessages from "../../../../../../../messages/en.json";
import koMessages from "../../../../../../../messages/ko.json";
import { getLostBusinessFooterProps } from "../business-footer-props";
import { LostFragranceChapter, type LostFragranceCopy } from "./page.client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LOSTINSEOUL.fragrance");
  return {
    title: t("metaTitle"),
    description: t("metaDescription")
  };
}

// The app's request config resolves locale from the cookie and ignores
// per-call overrides, so the bilingual display pair reads both message
// files directly — messages/*.json stays the single source of strings.
type FragranceTranslator = ReturnType<typeof createTranslator>;

function fragranceTranslator(locale: "en" | "ko"): FragranceTranslator {
  return createTranslator({
    locale,
    messages: (locale === "ko" ? koMessages : enMessages) as never,
    namespace: "LOSTINSEOUL.fragrance" as never
  });
}

function copyFrom(t: FragranceTranslator): LostFragranceCopy {
  const phase = (id: string) => ({
    display: t(`phases.${id}.display`),
    reading: t(`phases.${id}.reading`)
  });
  return {
    eyebrow: t("eyebrow"),
    titleDisplay: t("titleDisplay"),
    titleReading: t("titleReading"),
    enter: t("enter"),
    placeholderName: t("placeholderName"),
    placeholderNote: t("placeholderNote"),
    phases: {
      open: phase("open"),
      bloom: phase("bloom"),
      suspend: phase("suspend")
    },
    reveal: {
      eyebrow: t("reveal.eyebrow"),
      editionNote: t("reveal.editionNote"),
      viewObject: t("reveal.viewObject")
    }
  };
}

export default async function LostFragrancePage() {
  const [product, home, rawLocale, t] = await Promise.all([
    getLostFragranceData().catch(() => null),
    getLostHomeData().catch(() => ({ drops: [], products: [] })),
    getLocale(),
    getTranslations("LOSTINSEOUL")
  ]);
  const locale = rawLocale === "ko" ? "ko" : "en";
  const tEn = fragranceTranslator("en");
  const tKo = fragranceTranslator("ko");

  return (
    <RPage slug={["lostinseoul", "fragrance"]} type="pages">
      <LostFragranceChapter
        copy={{ en: copyFrom(tEn), ko: copyFrom(tKo) }}
        drops={home.drops}
        locale={locale}
        product={product}
        labels={{
          ...getLostBusinessFooterProps(t),
          announcement: t("home.announcement"),
          archiveLabel: t("nav.archive"),
          backLabel: t("nav.back"),
          cartLabel: t("nav.cart"),
          checkoutLabel: t("cart.checkout"),
          clearSearchLabel: t("nav.clearSearch"),
          emptyLabel: t("cart.empty"),
          removeLabel: t("cart.remove"),
          searchLabel: t("nav.search"),
          searchPlaceholder: t("nav.searchPlaceholder"),
          shopLabel: t("nav.shop"),
          totalLabel: t("cart.total"),
          footerContactLabel: t("footer.contact"),
          footerCopyrightLabel: t("footer.copyright"),
          footerInfoLabel: t("footer.info"),
          footerMediaLabel: t("footer.media"),
          footerPrivacyLabel: t("footer.privacy"),
          footerReturnsLabel: t("footer.returns"),
          footerTermsLabel: t("footer.terms"),
          standardModeLabel: t("modes.standard"),
          requestModeLabel: t("modes.request"),
          privateModeLabel: t("modes.private"),
          addLabel: t("actions.add"),
          addedLabel: t("actions.added"),
          requestQuoteLabel: t("actions.requestQuote")
        }}
      />
    </RPage>
  );
}
