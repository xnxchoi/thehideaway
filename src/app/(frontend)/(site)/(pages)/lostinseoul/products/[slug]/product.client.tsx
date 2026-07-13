"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import type {
  LostProductCard,
  LostProductDetail
} from "@/lib/lost-commerce/queries";
import type { LostOrderMode } from "@/lib/lost-commerce/types";
import { useLostCart } from "@/lib/lost-commerce/useLostCart";
import { cn } from "@/lib/utils";
import {
  LostAnnouncementBar,
  LostCursorBridge,
  LostGlobalFooterOverride,
  LostHeader,
  LostProductSection
} from "../../components";
import {
  getLostProductPanelFigureState,
  getLostProductPanelState,
  lostProductPanelTransition
} from "../../product-panel-motion";
import { LostProductStage } from "../../fragrance/product-stage/LostProductStage";
import {
  getLostProductDesktopSlideClassName,
  getLostProductDesktopThumbStyle,
  getLostProductThumbClassName
} from "./product-gallery-state";
import { getLostProductMobileBuybarClassName } from "./product-mobile-buybar-state";
import "../../index.css";

type Labels = {
  announcement: string;
  allProducts: string;
  archiveLabel: string;
  back: string;
  cart: string;
  checkoutLabel: string;
  clearSearchLabel: string;
  emptyLabel: string;
  standard: string;
  request: string;
  private: string;
  add: string;
  requestQuote: string;
  added: string;
  campaign: string;
  progress: string;
  details: string;
  care: string;
  shipping: string;
  directPurchase: string;
  privateQuote: string;
  related: string;
  collectionPush: string;
  viewProduct: string;
  variants: string;
  origin: string;
  madeInSeoul: string;
  selected: string;
  status: string;
  stockInStock: string;
  stockOutOfStock: string;
  stockOnRequest: string;
  stockPreOrder: string;
  removeLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  shopLabel: string;
  totalLabel: string;
};

const MODE_LABEL: Record<LostOrderMode, keyof Labels> = {
  standard_purchase: "standard",
  request_to_order: "request",
  private_order: "private"
};

type DetailItem = {
  body: string;
  image?: { url: string; alt?: string | null };
  label: string;
};

function stockLabel(stockState: string | null | undefined, labels: Labels) {
  if (stockState === "in_stock") return labels.stockInStock;
  if (stockState === "out_of_stock") return labels.stockOutOfStock;
  if (stockState === "on_request") return labels.stockOnRequest;
  if (stockState === "pre_order") return labels.stockPreOrder;
  return stockState ?? "";
}

type CommerceInfo = {
  eyebrow: string;
  refundTitle: string;
  refundBody: string;
  deliveryTitle: string;
  deliveryBody: string;
  link: string;
};

export function LostProductDetailClient({
  drops,
  product,
  relatedProducts,
  commerce,
  labels,
  enableProductStage = false
}: {
  drops: Array<{ title: string; slug: string }>;
  product: LostProductDetail;
  relatedProducts: LostProductCard[];
  commerce: CommerceInfo;
  labels: Labels;
  /** Fragrance product only — swaps the left image gallery for the WebGL flacon stage. */
  enableProductStage?: boolean;
}) {
  const { add } = useLostCart();
  const [mode, setMode] = useState<LostOrderMode>(
    product.modes[0] ?? "standard_purchase"
  );
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const commerceRootRef = useRef<HTMLElement>(null);
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? ""
  );
  const desktopSlideRefs = useRef<Array<HTMLElement | null>>([]);
  const mobileScrollerRef = useRef<HTMLDivElement | null>(null);

  const images = useMemo(
    () =>
      product.gallery.length > 0
        ? product.gallery
        : product.imageUrl
          ? [{ url: product.imageUrl, alt: product.imageAlt }]
          : [],
    [product.gallery, product.imageAlt, product.imageUrl]
  );
  const campaignPercent =
    product.campaign && product.campaign.minimumCommitments > 0
      ? Math.min(
          100,
          Math.round(
            (product.campaign.paidCommitments /
              product.campaign.minimumCommitments) *
              100
          )
        )
      : 0;

  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    product.variants[0] ??
    null;
  const selectedStockLabel = stockLabel(
    selectedVariant?.stockState ?? product.stockState,
    labels
  );
  const selectedUnitAmount =
    mode === "private_order" &&
    product.privatePresetPriceEnabled &&
    product.privateUnitAmount
      ? product.privateUnitAmount
      : (selectedVariant?.amount ?? product.unitAmount);
  const selectedPrice = formatLostMoney(selectedUnitAmount, product.currency);

  const isQuoteOnly =
    mode === "private_order" && !product.privatePresetPriceEnabled;
  const details: DetailItem[] = [
    { label: labels.details, body: product.details, image: images[0] },
    {
      label: labels.care,
      body: product.care,
      image: images[images.length - 1]
    },
    {
      label: labels.shipping,
      body: product.shippingReturns,
      image: images[1] ?? images[0]
    }
  ].flatMap((item) => (item.body ? [{ ...item, body: item.body }] : []));

  const buildCartLine = () => ({
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    mode,
    variantId: selectedVariant?.id,
    variantLabel: selectedVariant?.label,
    campaignId: mode === "request_to_order" ? product.campaign?.id : undefined,
    quantity: 1,
    price: selectedPrice,
    unitAmount: selectedUnitAmount,
    currency: product.currency,
    imageUrl: product.imageUrl
  });

  const addToCart = () => {
    add(buildCartLine());
    setAdded(true);
  };

  const buyNow = () => {
    add(buildCartLine());
    setAdded(true);
  };

  useEffect(() => {
    if (activeImage <= images.length - 1) return;
    setActiveImage(Math.max(0, images.length - 1));
  }, [activeImage, images.length]);

  useEffect(() => {
    const nodes = desktopSlideRefs.current.filter(
      (node): node is HTMLElement => node !== null
    );
    if (nodes.length <= 1) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(
            (entry.target as HTMLElement).dataset.sliderImageDesktop ?? 0
          );
          setActiveImage(index);
        });
      },
      { root: null, rootMargin: "-40% 0px -40% 0px", threshold: 0.1 }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return undefined;

    let frame = 0;
    const scaleTriggerOffset = 1.1;
    const slides = desktopSlideRefs.current.filter(
      (node): node is HTMLElement => node !== null
    );
    const imagesToReset = new Set<HTMLImageElement>();

    const updateScale = () => {
      frame = 0;
      slides.forEach((slide) => {
        const slideIndex = Number(slide.dataset.sliderImageDesktop ?? 0);
        const previousSlide = slides[slideIndex - 1];
        const previousImage = previousSlide?.querySelector("img");
        if (!previousImage) return;

        const rect = slide.getBoundingClientRect();
        const triggerY = rect.top + rect.height / scaleTriggerOffset;
        const distance = Math.abs(window.innerHeight - triggerY);
        const range = window.innerHeight / scaleTriggerOffset;
        const scale = 1 + (1 - Math.min(distance / range, 1)) * 0.2;

        previousImage.style.transform = `scale(${scale})`;
        previousImage.style.transition = "transform 0.1s linear";
        imagesToReset.add(previousImage);
      });
    };

    const requestUpdate = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(updateScale);
    };

    updateScale();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      imagesToReset.forEach((image) => {
        image.style.transform = "";
        image.style.transition = "";
      });
    };
  }, [images.length]);

  useEffect(() => {
    document.body.dataset.lostProductPanel =
      activePanel === null ? "closed" : "open";

    return () => {
      delete document.body.dataset.lostProductPanel;
    };
  }, [activePanel]);

  useEffect(() => {
    document.body.dataset.lostProductRoute = "true";

    return () => {
      delete document.body.dataset.lostProductRoute;
    };
  }, []);

  useEffect(() => {
    if (activePanel === null) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePanel(null);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activePanel]);

  return (
    <>
      <LostGlobalFooterOverride />
      <LostCursorBridge />
      <div className="lost-commerce-chrome fixed inset-x-0 top-0 z-[1002]">
        <LostAnnouncementBar bagOpen={bagOpen}>
          {labels.announcement}
        </LostAnnouncementBar>
        <LostHeader
          archiveLabel={labels.archiveLabel}
          backLabel={labels.back}
          bagOpen={bagOpen}
          cartLabel={labels.cart}
          checkoutLabel={labels.checkoutLabel}
          clearSearchLabel={labels.clearSearchLabel}
          commerceRootRef={commerceRootRef}
          drops={drops}
          emptyLabel={labels.emptyLabel}
          removeLabel={labels.removeLabel}
          searchLabel={labels.searchLabel}
          searchPlaceholder={labels.searchPlaceholder}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          shopLabel={labels.shopLabel}
          totalLabel={labels.totalLabel}
          onBagOpenChange={setBagOpen}
        />
      </div>
      <main
        className="lost-commerce-root lost-product-page relative z-[1001] min-h-screen bg-[var(--n-s-bg)] pb-32 text-[var(--n-s-fg)] selection:bg-[var(--n-s-fg)] selection:text-[var(--n-s-bg)] lg:pb-0"
        ref={commerceRootRef}
      >
        <section
          className="grid bg-[var(--n-s-bg)] pt-[12.3rem] lg:min-h-screen lg:grid-cols-2 lg:pt-0"
          data-section-product-id={product.id}
        >
          {enableProductStage ? (
            <LostProductStage
              media={images[0] ?? null}
              productName={product.name}
            />
          ) : (
            <section
              aria-label="Product Slider"
              className="lost-product-media relative aspect-[375/500] w-full lg:aspect-auto lg:min-h-screen"
              data-slider-product
            >
              <div className="hidden lg:grid" data-slider-desktop>
                {images.length > 0 ? (
                  images.map((image, index) => (
                    <figure
                      className={getLostProductDesktopSlideClassName({
                        activeImage,
                        index
                      })}
                      data-slider-image-desktop={index}
                      key={`${image.url}-${index}`}
                      ref={(node) => {
                        desktopSlideRefs.current[index] = node;
                      }}
                    >
                      <img
                        alt={image.alt ?? product.name}
                        className="aspect-[980/1080] h-full w-full object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                        src={image.url}
                      />
                    </figure>
                  ))
                ) : (
                  <div className="lost-product-media-fallback sticky top-0 col-start-1 row-start-1 grid h-screen place-items-end p-10 font-serif text-[16rem] leading-none font-bold">
                    {product.name.slice(0, 1)}
                  </div>
                )}
                <div className="pointer-events-none z-[9] col-start-1 row-start-1 hidden lg:sticky lg:top-0 lg:grid lg:h-full lg:w-full">
                  <div className="grid h-fit w-fit gap-5 self-end justify-self-start pb-12 pl-12 xl:pb-16 xl:pl-16">
                    {images.map((image, index) => (
                      <div
                        aria-label={`${product.name} ${index + 1}`}
                        className={cn(
                          getLostProductThumbClassName({ activeImage, index }),
                          "pointer-events-auto"
                        )}
                        data-slider-desktop-thumb
                        key={`${image.url}-desktop-thumb-${index}`}
                        role="presentation"
                        style={getLostProductDesktopThumbStyle({
                          activeImage,
                          index
                        })}
                      >
                        <img
                          alt=""
                          aria-hidden
                          className="aspect-[60/80] w-full object-cover"
                          src={image.url}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="z-[9] col-start-1 row-start-1 hidden lg:sticky lg:top-0 lg:grid lg:h-full lg:w-full">
                  <div className="flex h-fit w-fit gap-x-3 self-end justify-self-end pr-12 pb-12 xl:pr-16 xl:pb-16">
                    {selectedStockLabel ? (
                      <span className="lost-product-tag self-end">
                        <span>{selectedStockLabel}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div
                className="scroll-bar flex w-full snap-x snap-mandatory overflow-x-auto lg:hidden"
                data-slider-product-mobile
                onScroll={(event) => {
                  const width = event.currentTarget.clientWidth || 1;
                  setActiveImage(
                    Math.min(
                      images.length - 1,
                      Math.max(
                        0,
                        Math.round(event.currentTarget.scrollLeft / width)
                      )
                    )
                  );
                }}
                ref={mobileScrollerRef}
              >
                <div className="relative flex w-max">
                  {images.length > 0 ? (
                    images.map((image, index) => (
                      <figure
                        className="relative w-screen snap-start"
                        data-load-img
                        key={`${image.url}-mobile-${index}`}
                      >
                        <img
                          alt={image.alt ?? product.name}
                          className="aspect-[375/500] h-full w-full object-cover"
                          loading={index === 0 ? "eager" : "lazy"}
                          src={image.url}
                        />
                      </figure>
                    ))
                  ) : (
                    <div className="grid aspect-[375/500] w-screen place-items-end p-6 font-serif text-[9rem] leading-none font-bold text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.18)]">
                      {product.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-4 left-4 flex items-end gap-x-2 lg:hidden">
                {images.map((image, index) => (
                  <Button
                    aria-label={`${product.name} ${index + 1}`}
                    className={getLostProductThumbClassName({
                      activeImage,
                      index,
                      mobile: true
                    })}
                    data-slider-mobile-thumb
                    key={`${image.url}-mobile-thumb-${index}`}
                    onClick={() => {
                      setActiveImage(index);
                      mobileScrollerRef.current?.scrollTo({
                        behavior: "smooth",
                        left: index * mobileScrollerRef.current.clientWidth
                      });
                    }}
                    type="button"
                  >
                    <img
                      alt=""
                      aria-hidden
                      className="aspect-[60/80] w-full object-cover"
                      src={image.url}
                    />
                  </Button>
                ))}
              </div>
              <div className="absolute top-4 left-4 grid gap-2 lg:hidden">
                <div className="flex gap-x-2 self-start justify-self-start">
                  {selectedStockLabel ? (
                    <span className="lost-product-tag z-10 self-start">
                      <span>{selectedStockLabel}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </section>
          )}

          <section
            aria-label={product.name}
            className="grid content-start items-start px-4 lg:px-28 lg:pt-48 lg:pb-16"
          >
            <div className="grid lg:sticky lg:top-48">
              <div className="flex items-center justify-between gap-6 pt-8 pb-5 lg:pt-0">
                <div className="grid overflow-hidden">
                  <h1
                    className="col-span-full row-span-full font-sans text-[2.8rem] leading-none font-medium text-[var(--n-s-fg)] lg:text-[4.8rem]"
                    data-product-title-current
                  >
                    {product.name}
                  </h1>
                </div>
                <span
                  className="grid justify-end overflow-hidden font-sans text-[2.4rem] leading-none font-medium text-[var(--n-s-fg)] tabular-nums lg:text-[3.8rem]"
                  data-product-price
                >
                  <span className="col-span-full row-span-full min-w-24 text-right lg:min-w-32">
                    {isQuoteOnly ? product.price : selectedPrice}
                  </span>
                </span>
              </div>
              <div aria-hidden className="lost-top-bar lost-top-bar--pale" />

              <div
                className="grid gap-y-8 pt-6 pb-8 lg:gap-y-10 lg:pt-12 lg:pb-14"
                data-change-color
              >
                {product.modes.length > 1 ? (
                  <div className="grid gap-y-4">
                    <ul
                      aria-label={product.name}
                      className="flex flex-wrap gap-4"
                    >
                      {product.modes.map((item) => (
                        <li aria-label={labels[MODE_LABEL[item]]} key={item}>
                          <Button
                            className={cn(
                              "lost-product-mode-button",
                              mode === item && "is-active"
                            )}
                            onClick={() => {
                              setMode(item);
                              setAdded(false);
                            }}
                            type="button"
                          >
                            <span aria-hidden className="opacity-30">
                              [&nbsp;
                            </span>
                            <span className="grid overflow-hidden">
                              <span className="col-span-full row-span-full">
                                {labels[MODE_LABEL[item]]}
                              </span>
                            </span>
                            <span aria-hidden className="opacity-30">
                              &nbsp;]
                            </span>
                            <span className="lost-product-mode-bullet" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {mode === "request_to_order" && product.campaign ? (
                  <div className="lost-product-campaign">
                    <p className="font-mono text-[1.1rem] leading-none tracking-[0.2em] uppercase">
                      {labels.campaign}
                    </p>
                    <p className="mt-3 text-[1.8rem] leading-tight font-medium">
                      {product.campaign.title}
                    </p>
                    {product.campaign.progressVisibility !== "hidden" ? (
                      <div className="mt-5">
                        <div className="h-[2px] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.16)]">
                          <div
                            className="h-full bg-[var(--n-s-fg)]"
                            style={{ width: `${campaignPercent}%` }}
                          />
                        </div>
                        <p className="mt-3 font-mono text-[1.1rem] leading-none text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.62)]">
                          {labels.progress} {campaignPercent}%
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {product.variants.length > 1 ? (
                  <div className="grid gap-y-4">
                    <p className="font-mono text-[1.1rem] leading-none tracking-[0.12em] text-[var(--n-s-fg)] uppercase lg:text-[1.3rem]">
                      {labels.variants}
                    </p>
                    <ul
                      aria-label={labels.variants}
                      className="flex w-full flex-wrap gap-x-4 gap-y-8"
                    >
                      {product.variants.map((variant) => {
                        const disabled = variant.stockState === "out_of_stock";

                        return (
                          <li key={variant.id}>
                            <Button
                              aria-pressed={selectedVariant?.id === variant.id}
                              className={cn(
                                "lost-product-mode-button",
                                selectedVariant?.id === variant.id &&
                                  "is-active"
                              )}
                              disabled={disabled}
                              onClick={() => {
                                setSelectedVariantId(variant.id);
                                setAdded(false);
                              }}
                              type="button"
                            >
                              <span aria-hidden className="opacity-30">
                                [&nbsp;
                              </span>
                              <span className="grid overflow-hidden">
                                <span className="col-span-full row-span-full">
                                  {variant.label}
                                </span>
                              </span>
                              <span aria-hidden className="opacity-30">
                                &nbsp;]
                              </span>
                              <span className="lost-product-mode-bullet" />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </div>

              {isQuoteOnly ? (
                <form
                  className="grid gap-3 pb-8 lg:pb-10"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await fetch("/api/lost/private-quotes", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        productId: product.id,
                        quantity: 1,
                        note: new FormData(event.currentTarget).get("note")
                      })
                    });
                    setAdded(true);
                  }}
                >
                  <textarea
                    className="lost-product-note"
                    name="note"
                    placeholder={labels.privateQuote}
                  />
                  <Button className="lost-source-button lost-source-button--white justify-center">
                    <span>{added ? labels.added : labels.requestQuote}</span>
                  </Button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-x-2 pb-7 lg:gap-x-4 lg:pb-8">
                  <Link
                    className="lost-source-button lost-source-button--white justify-center"
                    href="/lostinseoul/checkout"
                    onClick={buyNow}
                  >
                    <span>{labels.directPurchase}</span>
                  </Link>
                  <Button
                    className="lost-source-button justify-center"
                    onClick={addToCart}
                    type="button"
                  >
                    <span>{added ? labels.added : labels.add}</span>
                  </Button>
                </div>
              )}

              {details.length > 0 ? (
                <article
                  aria-label={labels.details}
                  className="grid gap-y-4 pb-8 lg:gap-y-3 lg:pb-0"
                >
                  <div
                    aria-hidden
                    className="lost-top-bar lost-top-bar--pale"
                  />
                  {details.map((item) => (
                    <div className="grid gap-y-4" key={item.label}>
                      <Button
                        aria-expanded={activePanel === item.label}
                        className="lost-product-panel-trigger"
                        onClick={() => setActivePanel(item.label)}
                        type="button"
                      >
                        <span>{item.label}</span>
                        <span className="lost-source-button lost-source-button--icon">
                          <PlusIcon
                            aria-hidden
                            className="size-6"
                            weight="regular"
                          />
                        </span>
                      </Button>
                    </div>
                  ))}
                  <div
                    aria-hidden
                    className="lost-top-bar lost-top-bar--pale lost-top-bar--reverse"
                  />
                </article>
              ) : null}

              <section
                aria-label={commerce.eyebrow}
                className="grid gap-y-5 border-t border-[oklch(from_var(--white)_l_c_h_/_0.14)] pt-8"
              >
                <p className="font-mono text-[1.1rem] tracking-[0.18em] text-[oklch(from_var(--white)_l_c_h_/_0.5)] uppercase">
                  {commerce.eyebrow}
                </p>
                <div className="grid gap-y-2">
                  <h3 className="text-[1.5rem] font-medium">
                    {commerce.refundTitle}
                  </h3>
                  <p className="text-[1.4rem] leading-relaxed text-[oklch(from_var(--white)_l_c_h_/_0.7)]">
                    {commerce.refundBody}
                  </p>
                </div>
                <div className="grid gap-y-2">
                  <h3 className="text-[1.5rem] font-medium">
                    {commerce.deliveryTitle}
                  </h3>
                  <p className="text-[1.4rem] leading-relaxed text-[oklch(from_var(--white)_l_c_h_/_0.7)]">
                    {commerce.deliveryBody}
                  </p>
                </div>
                <Link
                  className="justify-self-start font-mono text-[1.2rem] tracking-[0.1em] text-[oklch(from_var(--white)_l_c_h_/_0.85)] underline underline-offset-[0.3em] transition-opacity hover:opacity-70"
                  href="/refund"
                >
                  {commerce.link}
                </Link>
              </section>
            </div>
          </section>
        </section>

        <ProductCollectionPush
          imageUrl={images[0]?.url ?? product.imageUrl ?? null}
          label={labels.collectionPush}
          mediaUrl={
            product.heroVideoUrl ?? images[images.length - 1]?.url ?? null
          }
        />

        {relatedProducts.length > 0 ? (
          <LostProductSection
            cartLabel={labels.cart}
            emptyLabel=""
            incomingLabel={labels.related}
            layout="recommendations"
            privateModeLabel={labels.private}
            products={relatedProducts}
            productsLabel={labels.related}
            requestModeLabel={labels.request}
            searchLabel={labels.related}
            searchNoResultsLabel=""
            searchQuery=""
            searchResultsLabel={labels.related}
            standardModeLabel={labels.standard}
            viewProductLabel={labels.viewProduct}
          />
        ) : null}

        {details.map((item) => (
          <ProductDetailPanel
            body={item.body}
            image={item.image}
            key={`${item.label}-panel`}
            label={item.label}
            onClose={() => setActivePanel(null)}
            open={activePanel === item.label}
          />
        ))}

        <div className={getLostProductMobileBuybarClassName()}>
          <p className="font-sans text-[1.8rem] leading-none font-light tabular-nums">
            {isQuoteOnly ? product.price : selectedPrice}
          </p>
          {isQuoteOnly ? (
            <Button
              className="lost-source-button lost-source-button--white justify-center"
              onClick={() => {
                document
                  .querySelector<HTMLTextAreaElement>(".lost-product-note")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              type="button"
            >
              <span>{added ? labels.added : labels.requestQuote}</span>
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                className="lost-source-button lost-source-button--white justify-center"
                href="/lostinseoul/checkout"
                onClick={buyNow}
              >
                <span>{labels.directPurchase}</span>
              </Link>
              <Button
                className="lost-source-button justify-center"
                onClick={addToCart}
                type="button"
              >
                <span>{added ? labels.added : labels.add}</span>
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function ProductCollectionPush({
  imageUrl,
  label,
  mediaUrl
}: {
  imageUrl?: string | null;
  label: string;
  mediaUrl?: string | null;
}) {
  const isVideo = /\.(m4v|mov|mp4|webm)$/i.test(mediaUrl ?? "");
  const tickerItems = Array.from({ length: 4 });

  return (
    <section
      aria-hidden
      className="lost-product-collection-push grid h-screen max-h-screen w-full overflow-hidden"
    >
      <div className="col-span-full row-span-full grid h-full w-full">
        {isVideo && mediaUrl ? (
          <video
            autoPlay
            className="h-full w-full object-cover"
            loop
            muted
            playsInline
            poster={imageUrl ?? undefined}
            preload="metadata"
          >
            <source src={mediaUrl} type="video/mp4" />
          </video>
        ) : imageUrl || mediaUrl ? (
          <img
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            src={mediaUrl ?? imageUrl ?? ""}
          />
        ) : null}
      </div>
      <div className="z-[2] col-span-full row-span-full grid items-center overflow-hidden">
        <div className="lost-product-marquee flex w-max flex-nowrap">
          {[0, 1].map((track) => (
            <div
              className="flex w-max gap-x-32 md:gap-x-80"
              data-list
              key={track}
            >
              {tickerItems.map((_, index) => (
                <span
                  className="font-sans text-[3.6rem] leading-none font-medium text-[var(--white)] md:text-[8rem]"
                  key={`${track}-${index}`}
                >
                  {label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductDetailPanel({
  body,
  image,
  label,
  onClose,
  open
}: {
  body: string;
  image?: { url: string; alt?: string | null };
  label: string;
  onClose: () => void;
  open: boolean;
}) {
  return (
    <m.aside
      animate={getLostProductPanelState(open)}
      aria-hidden={!open}
      aria-label={label}
      className="lost-product-detail-panel"
      data-panel-detail-container
      initial={false}
      transition={lostProductPanelTransition}
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        <m.figure
          animate={getLostProductPanelFigureState(open)}
          className="min-h-[42svh] overflow-hidden bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.06)] lg:min-h-screen"
          initial={false}
          transition={lostProductPanelTransition}
        >
          {image ? (
            <img
              alt={image.alt ?? ""}
              className="h-full w-full object-cover"
              loading="lazy"
              src={image.url}
            />
          ) : null}
        </m.figure>
        <div className="grid items-center justify-items-center bg-[var(--n-s-bg)]">
          <div className="grid w-full gap-y-10 px-4 py-20 lg:gap-y-28 lg:px-28 lg:py-0">
            <Button
              className="c-button-group flex w-full items-center justify-between text-[3.2rem] leading-none font-medium text-[var(--n-s-fg)] lg:text-[3.8rem]"
              onClick={onClose}
              type="button"
            >
              <span>{label}</span>
              <span className="lost-source-button lost-source-button--icon">
                <XIcon aria-hidden className="size-7" weight="regular" />
              </span>
            </Button>
            <p className="max-w-[58rem] text-[1.7rem] leading-[1.42] whitespace-pre-line text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.72)]">
              {body}
            </p>
          </div>
        </div>
      </div>
    </m.aside>
  );
}
