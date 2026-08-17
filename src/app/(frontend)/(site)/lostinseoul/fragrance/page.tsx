import type { Metadata } from "next";
import { createTranslator } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { isManualPaymentEnabled } from "@/lib/lost-commerce/payment-methods";
import {
  isLostCommercePaymentPreviewEnabled,
  isLostCommercePaymentUiEnabled
} from "@/lib/lost-commerce/payment-preview";
import { isPortOneCheckoutEnabled } from "@/lib/lost-commerce/portone";
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
// ko.json mirrors en.json's key structure (missing keys fail loudly), so the
// en shape types both and the translator keeps real key checking.
function fragranceTranslator(locale: "en" | "ko") {
  return createTranslator({
    locale,
    messages: (locale === "ko" ? koMessages : enMessages) as typeof enMessages,
    namespace: "LOSTINSEOUL.fragrance"
  });
}

type FragranceTranslator = ReturnType<typeof fragranceTranslator>;

function copyFrom(t: FragranceTranslator): LostFragranceCopy {
  const phase = (id: "open" | "bloom" | "suspend") => ({
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
  const checkoutEnabled = isLostCommercePaymentUiEnabled({
    configured: isPortOneCheckoutEnabled() || isManualPaymentEnabled(),
    previewEnabled: isLostCommercePaymentPreviewEnabled()
  });

  return (
    <RPage slug={["lostinseoul", "fragrance"]} theme="dark" type="pages">
      <LostFragranceChapter
        checkoutEnabled={checkoutEnabled}
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
