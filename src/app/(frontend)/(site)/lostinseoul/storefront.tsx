"use client";

import type { LostProductCard } from "@/lib/lost-commerce/queries";
import { LostEntryProvider, useLostCommerceRootRef } from "./lost-page-state";
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
  const commerceRootRef = useLostCommerceRootRef();
  const featureImage = products[0]?.imageUrl ?? null;
  const focusImage = products[0]?.imageUrl ?? null;
  const featureVideo = products[0]?.heroVideoUrl ?? LOST_HOME_VIDEO_URL;

  return (
    <LostEntryProvider>
      <LostGlobalFooterOverride />
      <LostEntrySequence />
      <div className="lost-commerce-chrome fixed inset-x-0 top-0 z-[1002]">
        <LostAnnouncementBar>{announcement}</LostAnnouncementBar>
        <LostHeader drops={drops} />
      </div>
      <main
        className="lost-commerce-root relative z-[1001] min-h-screen bg-[var(--lost-paper)] text-[var(--lost-paper-ink)] selection:bg-[var(--fg)] selection:text-[var(--bg)]"
        ref={commerceRootRef}
      >
        <div className="lost-commerce-inner" data-lost-commerce-inner>
          <LostHero
            eyebrow={eyebrow}
            imageUrl={featureImage}
            title={title}
            videoUrl={featureVideo}
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
            products={products}
            productsLabel={productsLabel}
            privateModeLabel={privateModeLabel}
            requestQuoteLabel={requestQuoteLabel}
            requestModeLabel={requestModeLabel}
            searchLabel={searchLabel}
            searchNoResultsLabel={searchNoResultsLabel}
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
    </LostEntryProvider>
  );
}
