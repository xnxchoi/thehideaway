"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import type { LostProductDetail } from "@/lib/lost-commerce/queries";
import type { LostOrderMode } from "@/lib/lost-commerce/types";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";
import { Footer } from "@lostinseoul/parts/Footer";
import { useCartOpen } from "@lostinseoul/page-status";
import type {
  LostBusinessDisclosureIdentifiers,
  LostBusinessDisclosureLabels
} from "@lostinseoul/parts/Footer/business-footer";
import {
  canUseLostProductActions,
  getLostProductDetailPrice,
  getLostProductVariantPrice,
  getLostProductVariantsForMode,
  hasLostPrivatePresetPrice
} from "@lostinseoul/product-price-display";
import {
  getLostFragranceRenderTier,
  readLostFragranceTierInput,
  type LostFragranceRenderTier
} from "./fragrance-tier";
import {
  getLostFragranceSceneMode,
  type LostFragranceSceneMode
} from "./fragrance-scene-selection";
import "@lostinseoul/index.css";
import "./fragrance.css";

// Legacy imperative scene, kept mountable via `?scene=legacy` for
// side-by-side comparison against the live r3f scene; its chunk only
// loads when the toggle is actually on.
const LostFragranceScene = dynamic(
  () => import("./fragrance-scene").then((mod) => mod.LostFragranceScene),
  { ssr: false }
);

// The live scene: r3f with the catalyst-10 GLB flacon (fragrance-catalyst.tsx).
const LostFragranceSceneR3F = dynamic(
  () =>
    import("./fragrance-scene-r3f").then((mod) => mod.LostFragranceSceneR3F),
  { ssr: false }
);

/** Editorial copy beats (i18n `phases.*`) — NOT the scene's reaction phases in
 *  fragrance-phases.ts. The two vocabularies were once shared and have drifted
 *  apart on purpose: the scene speaks dormant→held, the copy speaks open→suspend. */
type LostFragranceCopyPhaseId = "open" | "bloom" | "suspend";

type LostFragrancePhaseCopy = {
  display: string;
  reading: string;
};

export type LostFragranceCopy = {
  eyebrow: string;
  titleDisplay: string;
  titleReading: string;
  enter: string;
  placeholderName: string;
  placeholderNote: string;
  phases: Record<LostFragranceCopyPhaseId, LostFragrancePhaseCopy>;
  reveal: {
    eyebrow: string;
    editionNote: string;
    viewObject: string;
  };
};

type ChromeLabels = {
  announcement: string;
  archiveLabel: string;
  backLabel: string;
  cartLabel: string;
  checkoutLabel: string;
  clearSearchLabel: string;
  emptyLabel: string;
  removeLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  shopLabel: string;
  totalLabel: string;
  footerBusinessIdentifiers: LostBusinessDisclosureIdentifiers;
  footerBusinessLabels: LostBusinessDisclosureLabels;
  footerContactLabel: string;
  footerCopyrightLabel: string;
  footerInfoLabel: string;
  footerPrivacyLabel: string;
  footerReturnsLabel: string;
  footerTermsLabel: string;
  standardModeLabel: string;
  requestModeLabel: string;
  privateModeLabel: string;
  addLabel: string;
  addedLabel: string;
  requestQuoteLabel: string;
};

const PHASE_ORDER: LostFragranceCopyPhaseId[] = ["open", "bloom", "suspend"];

const MODE_LABEL_KEY: Record<
  LostOrderMode,
  "standardModeLabel" | "requestModeLabel" | "privateModeLabel"
> = {
  standard_purchase: "standardModeLabel",
  request_to_order: "requestModeLabel",
  private_order: "privateModeLabel"
};

const REVEAL_ANCHOR_ID = "lost-fragrance-object";
const AFFORDANCE_ENTER_PROGRESS = 0.18;
const AFFORDANCE_EXIT_PROGRESS = 0.84;
const ENTER_HINT_FADE_PROGRESS = 0.06;

const beatReveal = {
  initial: { opacity: 0, y: 28 },
  transition: { duration: 0.7, ease: [0.6, 0, 0.3, 1] as const },
  viewport: { margin: "-18% 0px", once: true },
  whileInView: { opacity: 1, y: 0 }
};

export function LostFragranceChapter({
  copy,
  checkoutEnabled,
  labels,
  locale,
  product
}: {
  copy: { en: LostFragranceCopy; ko: LostFragranceCopy };
  checkoutEnabled: boolean;
  drops: Array<{ title: string; slug: string }>;
  labels: ChromeLabels;
  locale: "en" | "ko";
  product: LostProductDetail | null;
}) {
  const reading = copy[locale];
  const displayLocale = locale === "ko" ? "en" : "ko";
  const display = copy[displayLocale];

  const chapterRef = useRef<HTMLDivElement>(null);
  const { open: bagOpen } = useCartOpen();
  const [tier, setTier] = useState<LostFragranceRenderTier>("editorial");
  const [sceneReady, setSceneReady] = useState(false);
  // window.location instead of useSearchParams: a dev-only toggle shouldn't
  // impose a Suspense boundary on the whole chapter
  const [sceneMode, setSceneMode] = useState<LostFragranceSceneMode>("r3f");
  const [added, setAdded] = useState(false);
  const [hintFaded, setHintFaded] = useState(false);
  const [affordanceVisible, setAffordanceVisible] = useState(false);
  const { add } = useStoreCart();
  const [mode, setMode] = useState<LostOrderMode | null>(
    product?.modes[0] ?? null
  );

  const { scrollYProgress } = useScroll({
    offset: ["start start", "end end"],
    target: chapterRef
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setHintFaded(progress > ENTER_HINT_FADE_PROGRESS);
    setAffordanceVisible(
      progress > AFFORDANCE_ENTER_PROGRESS &&
        progress < AFFORDANCE_EXIT_PROGRESS
    );
  });

  useEffect(() => {
    setTier(getLostFragranceRenderTier(readLostFragranceTierInput()));
    setSceneMode(getLostFragranceSceneMode(window.location.search));
  }, []);

  // Quote-only private orders and multi-variant selection belong to the
  // product page's full flow — the chapter CTA defers to it in those cases.
  const configuredPrivateUnitAmount = product?.privateUnitAmount;
  const privatePresetUnitAmount = hasLostPrivatePresetPrice(
    product?.privatePresetPriceEnabled,
    configuredPrivateUnitAmount
  )
    ? configuredPrivateUnitAmount
    : null;
  const isQuoteOnly =
    mode === "private_order" && product?.privatePresetPriceEnabled !== true;
  const actionableVariants = getLostProductVariantsForMode(
    product?.variants ?? [],
    mode
  );
  const primaryVariant = actionableVariants[0] ?? null;
  const canUseActions = canUseLostProductActions({
    allowWithoutCheckout: isQuoteOnly,
    checkoutEnabled,
    mode,
    modes: product?.modes ?? [],
    privatePresetPriceEnabled: product?.privatePresetPriceEnabled,
    privateUnitAmount: product?.privateUnitAmount,
    selectedSku: primaryVariant
  });
  const needsProductPage =
    canUseActions && (isQuoteOnly || actionableVariants.length > 1);
  const unitAmount =
    mode === "private_order" && privatePresetUnitAmount !== null
      ? privatePresetUnitAmount
      : (primaryVariant?.amount ?? product?.unitAmount ?? 0);
  const modePrice =
    mode === "private_order" && privatePresetUnitAmount !== null && product
      ? formatLostMoney(privatePresetUnitAmount, product.currency)
      : product
        ? getLostProductVariantPrice(actionableVariants, product.currency)
        : null;
  const displayedPrice = getLostProductDetailPrice({
    quoteOnly: isQuoteOnly,
    requestQuoteLabel: labels.requestQuoteLabel,
    selectedPrice: canUseActions && !isQuoteOnly ? modePrice : null
  });

  const addToBag = () => {
    if (
      !product ||
      !canUseActions ||
      !displayedPrice ||
      !mode ||
      !primaryVariant ||
      needsProductPage
    )
      return;
    void Promise.resolve(
      add({
        campaignId:
          mode === "request_to_order" ? product.campaign?.id : undefined,
        currency: product.currency,
        imageUrl: product.imageUrl,
        mode,
        price: displayedPrice,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        quantity: 1,
        unitAmount,
        skuId: primaryVariant.id,
        variantLabel: primaryVariant.label
      })
    )
      .then(() => setAdded(true))
      .catch(() => undefined);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="lost-fragrance-root relative z-[1001] min-h-screen"
        data-lost-cursor-theme="dark"
        data-lost-fragrance-scene-ready={sceneReady}
        data-lost-fragrance-tier={tier}
      >
        <div ref={chapterRef}>
          {tier === "webgl" && sceneMode === "r3f" ? (
            <LostFragranceSceneR3F
              bagOpen={bagOpen}
              onReady={() => setSceneReady(true)}
              progress={scrollYProgress}
            />
          ) : null}
          {tier === "webgl" && sceneMode === "legacy" ? (
            <LostFragranceScene
              bagOpen={bagOpen}
              onReady={() => setSceneReady(true)}
              progress={scrollYProgress}
            />
          ) : null}

          {PHASE_ORDER.map((phaseId, index) => {
            const isOpen = index === 0;
            const Heading = isOpen ? "h1" : "h2";
            return (
              <section
                className={
                  index % 2 === 1
                    ? "lost-fragrance-beat lost-fragrance-beat--alt"
                    : "lost-fragrance-beat"
                }
                data-lost-fragrance-phase={phaseId}
                id={`lost-fragrance-phase-${phaseId}`}
                key={phaseId}
              >
                <m.div {...beatReveal}>
                  {isOpen ? (
                    <p className="lost-fragrance-eyebrow">{reading.eyebrow}</p>
                  ) : null}
                  <Heading className="lost-fragrance-display">
                    <span aria-hidden lang={displayLocale}>
                      {display.phases[phaseId].display}
                    </span>
                    <span className="sr-only" lang={locale}>
                      {reading.phases[phaseId].display}
                    </span>
                  </Heading>
                  <p className="lost-fragrance-reading" lang={locale}>
                    {reading.phases[phaseId].reading}
                  </p>
                  {isOpen ? (
                    <p
                      className="lost-fragrance-reading lost-fragrance-subline"
                      lang={locale}
                    >
                      {reading.titleReading}
                    </p>
                  ) : null}
                </m.div>
                {isOpen ? (
                  <span className="lost-fragrance-enter" data-faded={hintFaded}>
                    {reading.enter}
                  </span>
                ) : null}
              </section>
            );
          })}

          <section
            className="lost-fragrance-beat"
            data-lost-fragrance-phase="resolve"
            id={REVEAL_ANCHOR_ID}
          >
            <m.div {...beatReveal}>
              <p className="lost-fragrance-eyebrow">{reading.reveal.eyebrow}</p>
              {product ? (
                <>
                  <h2 className="lost-fragrance-display">{product.name}</h2>
                  <div className="lost-fragrance-reveal-panel">
                    {product.summary ? (
                      <p className="lost-fragrance-reading">
                        {product.summary}
                      </p>
                    ) : null}
                    <p className="lost-fragrance-price">{displayedPrice}</p>
                    {product.modes.length > 1 ? (
                      <div
                        className="flex flex-wrap gap-2"
                        role="group"
                        aria-label={reading.reveal.eyebrow}
                      >
                        {product.modes.map((productMode) => (
                          <button
                            aria-pressed={mode === productMode}
                            className="lost-fragrance-mode"
                            data-selected={mode === productMode}
                            key={productMode}
                            onClick={() => {
                              setMode(productMode);
                              setAdded(false);
                            }}
                            type="button"
                          >
                            {labels[MODE_LABEL_KEY[productMode]]}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <p className="lost-fragrance-reading lost-fragrance-edition">
                      {reading.reveal.editionNote}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      {canUseActions && needsProductPage ? (
                        <Link
                          className="lost-fragrance-cta"
                          href={`/lostinseoul/products/${product.slug}`}
                        >
                          {isQuoteOnly
                            ? labels.requestQuoteLabel
                            : reading.reveal.viewObject}
                        </Link>
                      ) : canUseActions ? (
                        <button
                          className="lost-fragrance-cta"
                          disabled={added}
                          onClick={addToBag}
                          type="button"
                        >
                          {added ? labels.addedLabel : labels.addLabel}
                        </button>
                      ) : null}
                      <span aria-live="polite" className="sr-only">
                        {added ? labels.addedLabel : ""}
                      </span>
                      {!needsProductPage || !canUseActions ? (
                        <Link
                          className="lost-fragrance-eyebrow !mb-0 underline-offset-4 hover:underline"
                          href={`/lostinseoul/products/${product.slug}`}
                        >
                          {reading.reveal.viewObject}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="lost-fragrance-display">
                    <span aria-hidden lang={displayLocale}>
                      {display.placeholderName}
                    </span>
                    <span className="sr-only" lang={locale}>
                      {reading.placeholderName}
                    </span>
                  </h2>
                  <div className="lost-fragrance-reveal-panel">
                    <p className="lost-fragrance-reading" lang={locale}>
                      {reading.placeholderNote}
                    </p>
                    <Link
                      className="lost-fragrance-eyebrow !mb-0 underline-offset-4 hover:underline"
                      href="/lostinseoul"
                    >
                      {labels.shopLabel}
                    </Link>
                  </div>
                </>
              )}
            </m.div>
          </section>
        </div>

        {product ? (
          <m.a
            animate={
              affordanceVisible && !bagOpen
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 12 }
            }
            className="lost-fragrance-affordance"
            data-visible={affordanceVisible && !bagOpen}
            href={`#${REVEAL_ANCHOR_ID}`}
            initial={false}
            transition={{ duration: 0.4, ease: [0.6, 0, 0.3, 1] }}
          >
            <span>{product.name}</span>
            <span className="lost-fragrance-affordance-price">
              {displayedPrice}
            </span>
          </m.a>
        ) : null}

        <Footer />
      </div>
    </MotionConfig>
  );
}
