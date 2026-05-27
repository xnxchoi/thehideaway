import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { getLostCollectionBySlug } from "@/lib/lost-commerce/queries";
import { LostStorefront } from "../../storefront";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LostCollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const collection = await getLostCollectionBySlug(slug).catch(() => null);
  if (!collection) notFound();

  const t = await getTranslations("LOSTINSEOUL");

  return (
    <RPage slug={["lostinseoul", "collections", slug]} type="pages">
      <LostStorefront
        announcement={t("home.announcement")}
        backLabel={t("nav.back")}
        cartLabel={t("nav.cart")}
        clearSearchLabel={t("nav.clearSearch")}
        checkoutLabel={t("cart.checkout")}
        searchLabel={t("nav.search")}
        searchNoResultsLabel={t("nav.searchNoResults")}
        searchPlaceholder={t("nav.searchPlaceholder")}
        searchResultsLabel={t("nav.searchResults")}
        drops={[]}
        emptyLabel={t("home.empty")}
        eyebrow={collection.kicker ?? t("home.eyebrow")}
        lede={collection.lede ?? ""}
        viewProductLabel={t("actions.view")}
        closeVideoLabel={t("video.close")}
        playVideoLabel={t("video.play")}
        pauseVideoLabel={t("video.pause")}
        muteVideoLabel={t("video.mute")}
        unmuteVideoLabel={t("video.unmute")}
        products={collection.products}
        productsLabel={t("home.products")}
        removeLabel={t("cart.remove")}
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
        footerInfoLabel={t("footer.info")}
        footerMediaLabel={t("footer.media")}
        footerContactLabel={t("footer.contact")}
        footerPrivacyLabel={t("footer.privacy")}
        footerTermsLabel={t("footer.terms")}
        footerReturnsLabel={t("footer.returns")}
        footerCopyrightLabel={t("footer.copyright")}
        title={collection.title}
        totalLabel={t("cart.total")}
        watchLabel={t("actions.watchVideo")}
      />
    </RPage>
  );
}
