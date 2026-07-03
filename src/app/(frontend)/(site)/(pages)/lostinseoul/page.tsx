import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { getLostHomeData } from "@/lib/lost-commerce/queries";
import { getLostBusinessFooterProps } from "./business-footer-props";
import { LostStorefront } from "./storefront";

export const metadata: Metadata = {
  title: "LOSTINSEOUL",
  description:
    "A small storefront for Seoul objects, editions, and commitments."
};

export default async function LOSTINSEOULPage() {
  const t = await getTranslations("LOSTINSEOUL");
  const businessFooterProps = getLostBusinessFooterProps(t);
  const data = await getLostHomeData().catch(() => ({
    products: [],
    drops: []
  }));

  return (
    <RPage slug={["lostinseoul"]} type="pages">
      <LostStorefront
        title={t("home.title")}
        eyebrow={t("home.eyebrow")}
        lede={t("home.lede")}
        announcement={t("home.announcement")}
        productsLabel={t("home.products")}
        emptyLabel={t("home.empty")}
        cartLabel={t("nav.cart")}
        searchLabel={t("nav.search")}
        searchPlaceholder={t("nav.searchPlaceholder")}
        clearSearchLabel={t("nav.clearSearch")}
        searchResultsLabel={t("nav.searchResults")}
        searchNoResultsLabel={t("nav.searchNoResults")}
        backLabel={t("nav.back")}
        checkoutLabel={t("cart.checkout")}
        removeLabel={t("cart.remove")}
        totalLabel={t("cart.total")}
        viewProductLabel={t("actions.view")}
        watchLabel={t("actions.watchVideo")}
        closeVideoLabel={t("video.close")}
        playVideoLabel={t("video.play")}
        pauseVideoLabel={t("video.pause")}
        muteVideoLabel={t("video.mute")}
        unmuteVideoLabel={t("video.unmute")}
        shopLabel={t("nav.shop")}
        archiveLabel={t("nav.archive")}
        collectionLabel={t("home.collection")}
        yearLabel={t("home.year")}
        objectsLabel={t("home.objects")}
        incomingLabel={t("home.incoming")}
        focusTitleLabel={t("home.focusTitle")}
        collectionsEyebrowLabel={t("home.collectionsEyebrow")}
        collectionsTitleLabel={t("home.collectionsTitle")}
        standardModeLabel={t("modes.standard")}
        requestModeLabel={t("modes.request")}
        privateModeLabel={t("modes.private")}
        {...businessFooterProps}
        footerInfoLabel={t("footer.info")}
        footerMediaLabel={t("footer.media")}
        footerContactLabel={t("footer.contact")}
        footerPrivacyLabel={t("footer.privacy")}
        footerTermsLabel={t("footer.terms")}
        footerReturnsLabel={t("footer.returns")}
        footerCopyrightLabel={t("footer.copyright")}
        products={data.products}
        drops={data.drops}
      />
    </RPage>
  );
}
