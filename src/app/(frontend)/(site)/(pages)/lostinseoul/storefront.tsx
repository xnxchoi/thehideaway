"use client";

import type { LostProductCard } from "@/lib/lost-commerce/queries";
import { useCallback, useMemo, useRef, useState } from "react";
import type {
  LostBusinessDisclosureIdentifiers,
  LostBusinessDisclosureLabels
} from "./business-footer";
import {
  LostAnnouncementBar,
  LostCursorBridge,
  LostEntrySequence,
  LostFocusProductSection,
  LostFooter,
  LostHeader,
  LostHero,
  LostProductSection,
  LostStatement,
  LostVideoCollections
} from "./components";
import "./index.css";

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
  footerBusinessIdentifiers: LostBusinessDisclosureIdentifiers;
  footerBusinessLabels: LostBusinessDisclosureLabels;
  footerInfoLabel: string;
  footerMediaLabel: string;
  footerContactLabel: string;
  footerPrivacyLabel: string;
  footerTermsLabel: string;
  footerReturnsLabel: string;
  footerCopyrightLabel: string;
  products: LostProductCard[];
  drops: Array<{ title: string; slug: string; kicker?: string; lede?: string }>;
};

const FALLBACK_HERO = "/assets/env_hdr1.webp";
const FALLBACK_HERO_VIDEO = "/assets/lostinseoul/oflyn/hero-reference.mp4";
const FALLBACK_FOCUS_IMAGE = "/assets/media/unsplash-omRMbFSqN6A.webp";

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
  footerMediaLabel,
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
  privateModeLabel
}: Props) {
  const commerceRootRef = useRef<HTMLElement>(null);
  const featureImage = products[0]?.imageUrl ?? FALLBACK_HERO;
  const focusImage = products[0]?.imageUrl ?? FALLBACK_FOCUS_IMAGE;
  const featureVideo = products[0]?.heroVideoUrl ?? FALLBACK_HERO_VIDEO;
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
        product.price,
        product.stockState,
        product.campaign?.title,
        ...product.modes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(needle);
    });
  }, [products, searchQuery]);

  return (
    <>
      <LostCursorBridge />
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
            footerMediaLabel={footerMediaLabel}
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
