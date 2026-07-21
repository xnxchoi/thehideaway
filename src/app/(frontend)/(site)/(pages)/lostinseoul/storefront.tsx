"use client";

import type { LostProductCard } from "@/lib/lost-commerce/queries";
import { useCallback, useMemo, useRef, useState } from "react";
import { getLostProductListingPrice } from "./product-price-display";
import type {
  LostBusinessDisclosureIdentifiers,
  LostBusinessDisclosureLabels
} from "./business-footer";
import {
  LostAnnouncementBar,
  LostEntrySequence,
  LostFocusProductSection,
  LostFooter,
  LostGlobalFooterOverride,
  LostHeader,
  LostHero,
  LostProductSection,
  LostStatement,
  LostVideoCollections
} from "./components";
import "./index.css";

const LOST_HOME_VIDEO_URL = "/assets/lostinseoul/home-video.mov";

type Props = {
  title: string;
  eyebrow: string;
  lede: string;
  announcement: string;
  productsLabel: string;
  emptyLabel: string;
  cartLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  clearSearchLabel: string;
  searchResultsLabel: string;
  searchNoResultsLabel: string;
  backLabel: string;
  checkoutLabel: string;
  removeLabel: string;
  totalLabel: string;
  viewProductLabel: string;
  watchLabel: string;
  closeVideoLabel: string;
  playVideoLabel: string;
  pauseVideoLabel: string;
  muteVideoLabel: string;
  unmuteVideoLabel: string;
  shopLabel: string;
  archiveLabel: string;
  collectionLabel: string;
  yearLabel: string;
  objectsLabel: string;
  incomingLabel: string;
  focusTitleLabel: string;
  collectionsEyebrowLabel: string;
  collectionsTitleLabel: string;
  standardModeLabel: string;
  requestModeLabel: string;
  privateModeLabel: string;
  requestQuoteLabel: string;
  footerBusinessIdentifiers: LostBusinessDisclosureIdentifiers;
  footerBusinessLabels: LostBusinessDisclosureLabels;
  footerInfoLabel: string;
  footerContactLabel: string;
  footerPrivacyLabel: string;
  footerTermsLabel: string;
  footerReturnsLabel: string;
  footerCopyrightLabel: string;
  products: LostProductCard[];
  drops: Array<{ title: string; slug: string; kicker?: string; lede?: string }>;
};

export function LostStorefront({
  announcement,
  archiveLabel,
  backLabel,
  cartLabel,
  checkoutLabel,
  clearSearchLabel,
  closeVideoLabel,
  collectionLabel,
  drops,
  emptyLabel,
  eyebrow,
  focusTitleLabel,
  collectionsEyebrowLabel,
  collectionsTitleLabel,
  footerBusinessIdentifiers,
  footerBusinessLabels,
  footerContactLabel,
  footerCopyrightLabel,
  footerInfoLabel,
  footerPrivacyLabel,
  footerReturnsLabel,
  footerTermsLabel,
  incomingLabel,
  lede,
  muteVideoLabel,
  objectsLabel,
  pauseVideoLabel,
  playVideoLabel,
  products,
  productsLabel,
  removeLabel,
  searchLabel,
  searchNoResultsLabel,
  searchPlaceholder,
  searchResultsLabel,
  shopLabel,
  title,
  totalLabel,
  unmuteVideoLabel,
  viewProductLabel,
  watchLabel,
  yearLabel,
  standardModeLabel,
  requestModeLabel,
  privateModeLabel,
  requestQuoteLabel
}: Props) {
  const commerceRootRef = useRef<HTMLElement>(null);
  const featureImage = products[0]?.imageUrl ?? null;
  const focusImage = products[0]?.imageUrl ?? null;
  const featureVideo = products[0]?.heroVideoUrl ?? LOST_HOME_VIDEO_URL;
  const [searchQuery, setSearchQuery] = useState("");
  const [bagOpen, setBagOpen] = useState(false);
  const [heroSceneReady, setHeroSceneReady] = useState(false);
  const markHeroSceneReady = useCallback(() => {
    setHeroSceneReady(true);
  }, []);
  const filteredProducts = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return products;

    return products.filter((product) => {
      const searchable = [
        product.name,
        product.summary,
        product.displayPrice,
        getLostProductListingPrice(
          product.displayPrice,
          requestQuoteLabel,
          product.modes
        ),
        product.stockState,
        product.campaign?.title,
        ...product.modes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(needle);
    });
  }, [products, requestQuoteLabel, searchQuery]);

  return (
    <>
      <LostGlobalFooterOverride />
      <LostEntrySequence sceneReady={heroSceneReady} />
      <div className="lost-commerce-chrome fixed inset-x-0 top-0 z-[1002]">
        <LostAnnouncementBar bagOpen={bagOpen}>
          {announcement}
        </LostAnnouncementBar>
        <LostHeader
          archiveLabel={archiveLabel}
          backLabel={backLabel}
          bagOpen={bagOpen}
          cartLabel={cartLabel}
          clearSearchLabel={clearSearchLabel}
          checkoutLabel={checkoutLabel}
          commerceRootRef={commerceRootRef}
          drops={drops}
          emptyLabel={emptyLabel}
          removeLabel={removeLabel}
          searchLabel={searchLabel}
          searchPlaceholder={searchPlaceholder}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          shopLabel={shopLabel}
          totalLabel={totalLabel}
          onBagOpenChange={setBagOpen}
        />
      </div>
      <main
        className="lost-commerce-root relative z-[1001] min-h-screen bg-[var(--lost-paper)] text-[var(--lost-paper-ink)] selection:bg-[var(--fg)] selection:text-[var(--bg)]"
        ref={commerceRootRef}
      >
        <div className="lost-commerce-inner" data-lost-commerce-inner>
          <LostHero
            bagOpen={bagOpen}
            closeLabel={closeVideoLabel}
            collectionLabel={collectionLabel}
            eyebrow={eyebrow}
            imageUrl={featureImage}
            onSceneReady={markHeroSceneReady}
            muteLabel={muteVideoLabel}
            pauseLabel={pauseVideoLabel}
            playLabel={playVideoLabel}
            productsLabel={productsLabel}
            title={title}
            unmuteLabel={unmuteVideoLabel}
            videoUrl={featureVideo}
            watchLabel={watchLabel}
            yearLabel={yearLabel}
          />
          <LostStatement
            count={products.length}
            lede={lede}
            objectsLabel={objectsLabel}
          />
          <LostProductSection
            cartLabel={cartLabel}
            emptyLabel={emptyLabel}
            incomingLabel={incomingLabel}
            products={filteredProducts}
            productsLabel={productsLabel}
            privateModeLabel={privateModeLabel}
            requestQuoteLabel={requestQuoteLabel}
            requestModeLabel={requestModeLabel}
            searchLabel={searchLabel}
            searchNoResultsLabel={searchNoResultsLabel}
            searchQuery={searchQuery}
            searchResultsLabel={searchResultsLabel}
            standardModeLabel={standardModeLabel}
            viewProductLabel={viewProductLabel}
          />
          <LostFocusProductSection
            focusTitleLabel={focusTitleLabel}
            imageUrl={focusImage}
            products={products}
            productsLabel={productsLabel}
            requestQuoteLabel={requestQuoteLabel}
            viewProductLabel={viewProductLabel}
          />
          <LostVideoCollections
            collectionsEyebrowLabel={collectionsEyebrowLabel}
            collectionsTitleLabel={collectionsTitleLabel}
            drops={drops}
            fallbackImageUrl={featureImage}
            products={products}
            productsLabel={productsLabel}
          />
          <LostFooter
            archiveLabel={archiveLabel}
            footerBusinessIdentifiers={footerBusinessIdentifiers}
            footerBusinessLabels={footerBusinessLabels}
            footerContactLabel={footerContactLabel}
            footerCopyrightLabel={footerCopyrightLabel}
            footerInfoLabel={footerInfoLabel}
            footerPrivacyLabel={footerPrivacyLabel}
            footerReturnsLabel={footerReturnsLabel}
            footerTermsLabel={footerTermsLabel}
            shopLabel={shopLabel}
          />
        </div>
      </main>
    </>
  );
}
