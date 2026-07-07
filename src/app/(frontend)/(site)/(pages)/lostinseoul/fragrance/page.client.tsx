"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { Link } from "@/components/core/Link/Link";
import type { LostProductDetail } from "@/lib/lost-commerce/queries";
import type { LostOrderMode } from "@/lib/lost-commerce/types";
import { useLostCart } from "@/lib/lost-commerce/useLostCart";
import {
  LostAnnouncementBar,
  LostCursorBridge,
  LostFooter,
  LostGlobalFooterOverride,
  LostHeader
} from "../components";
import type {
  LostBusinessDisclosureIdentifiers,
  LostBusinessDisclosureLabels
} from "../business-footer";
import { type LostFragrancePhaseId } from "./fragrance-phases";
import {
  getLostFragranceRenderTier,
  readLostFragranceTierInput,
  type LostFragranceRenderTier
} from "./fragrance-tier";
import "../index.css";
import "./fragrance.css";

const LostFragranceScene = dynamic(
  () => import("./fragrance-scene").then((mod) => mod.LostFragranceScene),
  { ssr: false }
);

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
  phases: Record<
    Exclude<LostFragrancePhaseId, "resolve">,
    LostFragrancePhaseCopy
  >;
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
  footerMediaLabel: string;
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

const PHASE_ORDER: Array<Exclude<LostFragrancePhaseId, "resolve">> = [
  "open",
  "bloom",
  "suspend"
];

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
  drops,
  labels,
  locale,
  product
}: {
  copy: { en: LostFragranceCopy; ko: LostFragranceCopy };
  drops: Array<{ title: string; slug: string }>;
  labels: ChromeLabels;
  locale: "en" | "ko";
  product: LostProductDetail | null;
}) {
  const reading = copy[locale];
  const displayLocale = locale === "ko" ? "en" : "ko";
  const display = copy[displayLocale];

  const chapterRef = useRef<HTMLDivElement>(null);
  const commerceRootRef = useRef<HTMLElement>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tier, setTier] = useState<LostFragranceRenderTier>("editorial");
  const [sceneReady, setSceneReady] = useState(false);
  const [added, setAdded] = useState(false);
  const [hintFaded, setHintFaded] = useState(false);
  const [affordanceVisible, setAffordanceVisible] = useState(false);
  const { add } = useLostCart();
  const [mode, setMode] = useState<LostOrderMode>(
    product?.modes[0] ?? "standard_purchase"
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
  }, []);

  // Quote-only private orders and multi-variant selection belong to the
  // product page's full flow — the chapter CTA defers to it in those cases.
  const isQuoteOnly =
    mode === "private_order" && !product?.privatePresetPriceEnabled;
  const needsProductPage = isQuoteOnly || (product?.variants.length ?? 0) > 1;
  const primaryVariant = product?.variants[0] ?? null;
  const unitAmount =
    mode === "private_order" &&
    product?.privatePresetPriceEnabled &&
    product.privateUnitAmount
      ? product.privateUnitAmount
      : (primaryVariant?.amount ?? product?.unitAmount ?? 0);

  const addToBag = () => {
    if (!product || needsProductPage) return;
    add({
      campaignId:
        mode === "request_to_order" ? product.campaign?.id : undefined,
      currency: product.currency,
      imageUrl: product.imageUrl,
      mode,
      price: product.price,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      quantity: 1,
      unitAmount,
      variantId: primaryVariant?.id,
      variantLabel: primaryVariant?.label
    });
    setAdded(true);
  };

  return (
    <MotionConfig reducedMotion="user">
      <LostGlobalFooterOverride />
      <LostCursorBridge />
      <div className="lost-commerce-chrome fixed inset-x-0 top-0 z-[1002]">
        <LostAnnouncementBar bagOpen={bagOpen}>
          {labels.announcement}
        </LostAnnouncementBar>
        <LostHeader
          archiveLabel={labels.archiveLabel}
          backLabel={labels.backLabel}
          bagOpen={bagOpen}
          cartLabel={labels.cartLabel}
          checkoutLabel={labels.checkoutLabel}
          clearSearchLabel={labels.clearSearchLabel}
          commerceRootRef={commerceRootRef}
          drops={drops}
          emptyLabel={labels.emptyLabel}
          onBagOpenChange={setBagOpen}
          removeLabel={labels.removeLabel}
          searchLabel={labels.searchLabel}
          searchPlaceholder={labels.searchPlaceholder}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          shopLabel={labels.shopLabel}
          totalLabel={labels.totalLabel}
        />
      </div>
      <main
        className="lost-commerce-root lost-fragrance-root relative z-[1001] min-h-screen"
        data-lost-cursor-theme="dark"
        data-lost-fragrance-scene-ready={sceneReady}
        data-lost-fragrance-tier={tier}
        ref={commerceRootRef}
      >
        <div ref={chapterRef}>
          {tier === "webgl" ? (
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
                    <p className="lost-fragrance-price">
                      {isQuoteOnly ? labels.requestQuoteLabel : product.price}
                    </p>
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
                      {needsProductPage ? (
                        <Link
                          className="lost-fragrance-cta"
                          href={`/lostinseoul/products/${product.slug}`}
                        >
                          {isQuoteOnly
                            ? labels.requestQuoteLabel
                            : reading.reveal.viewObject}
                        </Link>
                      ) : (
                        <button
                          className="lost-fragrance-cta"
                          disabled={added}
                          onClick={addToBag}
                          type="button"
                        >
                          {added ? labels.addedLabel : labels.addLabel}
                        </button>
                      )}
                      <span aria-live="polite" className="sr-only">
                        {added ? labels.addedLabel : ""}
                      </span>
                      {!needsProductPage ? (
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
              {product.price}
            </span>
          </m.a>
        ) : null}

        <LostFooter
          archiveLabel={labels.archiveLabel}
          footerBusinessIdentifiers={labels.footerBusinessIdentifiers}
          footerBusinessLabels={labels.footerBusinessLabels}
          footerContactLabel={labels.footerContactLabel}
          footerCopyrightLabel={labels.footerCopyrightLabel}
          footerInfoLabel={labels.footerInfoLabel}
          footerMediaLabel={labels.footerMediaLabel}
          footerPrivacyLabel={labels.footerPrivacyLabel}
          footerReturnsLabel={labels.footerReturnsLabel}
          footerTermsLabel={labels.footerTermsLabel}
          shopLabel={labels.shopLabel}
        />
      </main>
    </MotionConfig>
  );
}
