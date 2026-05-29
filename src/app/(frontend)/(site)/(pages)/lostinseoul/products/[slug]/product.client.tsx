"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowElbowDownRightIcon,
  PlusIcon,
  XIcon
} from "@phosphor-icons/react";
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
import { LostProductSection } from "../../components";
import {
  getLostProductPanelFigureState,
  getLostProductPanelState,
  lostProductPanelTransition
} from "../../product-panel-motion";
import "../../index.css";

type Labels = {
  allProducts: string;
  back: string;
  cart: string;
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
  selected: string;
  status: string;
  stockInStock: string;
  stockOutOfStock: string;
  stockOnRequest: string;
  stockPreOrder: string;
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

function stockLabel(state: string | null | undefined, labels: Labels) {
  switch (state) {
    case "in_stock":
      return labels.stockInStock;
    case "out_of_stock":
      return labels.stockOutOfStock;
    case "on_request":
      return labels.stockOnRequest;
    case "pre_order":
      return labels.stockPreOrder;
    default:
      return state ?? null;
  }
}

export function LostProductDetailClient({
  product,
  relatedProducts,
  labels
}: {
  product: LostProductDetail;
  relatedProducts: LostProductCard[];
  labels: Labels;
}) {
  const { add, count } = useLostCart();
  const [mode, setMode] = useState<LostOrderMode>(
    product.modes[0] ?? "standard_purchase"
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? ""
  );
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const imageRefs = useRef<Array<HTMLElement | null>>([]);
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
  const pushMediaUrl =
    product.heroVideoUrl ?? images[images.length - 1]?.url ?? product.imageUrl;

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

  const isQuoteOnly =
    mode === "private_order" && !product.privatePresetPriceEnabled;
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    product.variants[0] ??
    null;
  const selectedStockState = selectedVariant?.stockState ?? product.stockState;
  const selectedStockLabel = stockLabel(selectedStockState, labels);
  const selectedUnitAmount =
    mode === "private_order" && product.privateUnitAmount
      ? product.privateUnitAmount
      : (selectedVariant?.amount ?? product.unitAmount);
  const selectedPrice = formatLostMoney(selectedUnitAmount, product.currency);
  const selectedIsUnavailable = selectedStockState === "out_of_stock";
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

  const addToCart = () => {
    if (selectedIsUnavailable) return;

    add({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
      mode,
      campaignId:
        mode === "request_to_order" ? product.campaign?.id : undefined,
      quantity: 1,
      price: selectedPrice,
      unitAmount: selectedUnitAmount,
      currency: product.currency,
      imageUrl: product.imageUrl
    });
    setAdded(true);
  };

  useEffect(() => {
    document.body.dataset.lostProductPanel =
      activePanel === null ? "closed" : "open";

    return () => {
      delete document.body.dataset.lostProductPanel;
    };
  }, [activePanel]);

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

  useEffect(() => {
    const nodes = imageRefs.current.filter(
      (node): node is HTMLElement => node !== null
    );
    if (nodes.length <= 1) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        const index = nodes.findIndex((node) => node === visible.target);
        if (index >= 0) setActiveImage(index);
      },
      { threshold: [0.45, 0.6, 0.75] }
    );

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [images.length]);

  return (
    <main className="lost-commerce-root lost-product-page relative z-[1001] min-h-screen bg-[var(--n-s-bg)] text-[var(--n-s-fg)] selection:bg-[var(--n-s-fg)] selection:text-[var(--n-s-bg)]">
      <div className="lost-product-chrome sticky top-0 z-[40] grid gap-y-4 px-4 pt-4 backdrop-blur-md md:px-14 md:pt-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <Link
            className="lost-product-chrome-button justify-self-start"
            href="/lostinseoul"
          >
            <ArrowElbowDownRightIcon
              aria-hidden
              className="size-6 rotate-90"
              weight="regular"
            />
            <span>{labels.back}</span>
          </Link>
          <Link
            aria-label="LOSTINSEOUL"
            className="font-mono text-[1.4rem] leading-none font-bold tracking-[0.28em] text-[var(--n-s-fg)] uppercase"
            href="/lostinseoul"
          >
            LOSTINSEOUL
          </Link>
          <Link
            className="lost-product-chrome-button justify-self-end"
            href="/lostinseoul/cart"
          >
            <span>
              {labels.cart} / {count.toString().padStart(2, "0")}
            </span>
          </Link>
        </div>
        <div aria-hidden className="lost-top-bar lost-top-bar--pale" />
      </div>

      <section
        className="grid bg-[var(--n-s-bg)] pt-24 lg:min-h-screen lg:grid-cols-2 lg:pt-0"
        data-section-product-id={product.id}
      >
        <section
          aria-label={product.name}
          className="lost-product-media relative aspect-[375/500] w-full overflow-hidden lg:aspect-auto lg:min-h-screen"
        >
          <div className="hidden lg:grid">
            {images.length > 0 ? (
              images.map((image, index) => (
                <figure
                  className="lost-product-media-frame sticky top-0 col-start-1 row-start-1 h-screen max-h-screen overflow-hidden"
                  data-slider-image-desktop={index}
                  key={`${image.url}-${index}`}
                  ref={(node) => {
                    imageRefs.current[index] = node;
                  }}
                >
                  <img
                    alt={image.alt ?? product.name}
                    className="h-full w-full object-cover"
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
            <div className="pointer-events-none sticky top-0 z-[9] col-start-1 row-start-1 grid h-screen w-full">
              <div className="grid h-fit w-fit gap-2 self-end justify-self-start pb-8 pl-8">
                {images.map((image, index) => (
                  <button
                    aria-label={`${product.name} ${index + 1}`}
                    className={cn(
                      "lost-product-thumb pointer-events-auto",
                      activeImage === index && "is-active"
                    )}
                    data-slider-desktop-thumb
                    key={`${image.url}-thumb-${index}`}
                    onClick={() => {
                      setActiveImage(index);
                      imageRefs.current[index]?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                    }}
                    type="button"
                  >
                    <img
                      alt=""
                      aria-hidden
                      className="h-full w-full object-cover"
                      src={image.url}
                    />
                  </button>
                ))}
              </div>
              <div className="flex h-fit w-fit gap-2 self-end justify-self-end pr-8 pb-8">
                {selectedStockLabel ? (
                  <span className="lost-product-tag">
                    <span>{selectedStockLabel}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="scroll-bar flex w-full snap-x snap-mandatory overflow-x-auto lg:hidden"
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
              <button
                aria-label={`${product.name} ${index + 1}`}
                className={cn(
                  "lost-product-thumb lost-product-thumb--mobile",
                  activeImage === index && "is-active"
                )}
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
                  className="h-full w-full object-cover"
                  src={image.url}
                />
              </button>
            ))}
          </div>
        </section>

        <section
          aria-label={product.name}
          className="grid content-start items-start px-4 lg:px-28 lg:pt-48 lg:pb-16"
        >
          <div className="grid lg:sticky lg:top-48">
            <div className="flex items-center justify-between gap-6 pt-8 pb-5 lg:pt-0">
              <div className="grid overflow-hidden">
                <h1
                  className="tracking-0 col-span-full row-span-full font-sans text-[2.8rem] leading-none font-medium text-[var(--n-s-fg)] lg:text-[4.8rem]"
                  data-product-title-current
                >
                  {product.name}
                </h1>
                <span
                  aria-hidden
                  className="col-span-full row-span-full translate-y-3/4 font-sans text-[2.8rem] leading-none font-medium opacity-0 lg:text-[4.8rem]"
                  data-product-title-next
                >
                  {product.name}
                </span>
              </div>
              <span
                className="grid justify-end overflow-hidden font-sans text-[2.4rem] leading-none font-medium text-[var(--n-s-fg)] tabular-nums lg:text-[3.8rem]"
                data-product-price
              >
                <span className="col-span-full row-span-full min-w-24 text-right">
                  {isQuoteOnly ? product.price : selectedPrice}
                </span>
              </span>
            </div>
            <div aria-hidden className="lost-top-bar lost-top-bar--pale" />

            {product.summary ? (
              <p className="max-w-[58rem] py-8 text-[1.6rem] leading-[1.42] font-medium text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.66)] lg:py-10 lg:text-[1.8rem]">
                {product.summary}
              </p>
            ) : null}

            <div
              className="grid gap-y-8 pt-4 pb-8 lg:gap-y-10 lg:pt-10 lg:pb-14"
              data-change-color
            >
              <ul aria-label={product.name} className="flex flex-wrap gap-4">
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
                <div className="grid gap-y-3">
                  <p className="font-mono text-[1.1rem] leading-none tracking-[0.2em] uppercase">
                    {labels.variants}
                  </p>
                  <ul className="flex flex-wrap gap-3">
                    {product.variants.map((variant) => {
                      const unavailable = variant.stockState === "out_of_stock";
                      const isSelected = selectedVariant?.id === variant.id;

                      return (
                        <li key={variant.id}>
                          <Button
                            aria-pressed={isSelected}
                            className={cn(
                              "lost-product-mode-button",
                              isSelected && "is-active"
                            )}
                            disabled={unavailable}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setAdded(false);
                            }}
                            type="button"
                          >
                            <span aria-hidden className="opacity-30">
                              [&nbsp;
                            </span>
                            <span>{variant.label}</span>
                            <span aria-hidden className="opacity-30">
                              &nbsp;]
                            </span>
                            <span className="lost-product-mode-bullet" />
                            <span className="sr-only">
                              {isSelected ? ` ${labels.selected}` : ""}
                            </span>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  {selectedStockLabel ? (
                    <p className="font-mono text-[1.1rem] leading-none tracking-[0.16em] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.62)] uppercase">
                      {labels.status} / {selectedStockLabel}
                    </p>
                  ) : null}
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
                      variantId: selectedVariant?.id,
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
              <div className="grid grid-cols-2 gap-x-2 pb-8 lg:gap-x-4 lg:pb-10">
                <Link
                  className="lost-source-button lost-source-button--white justify-center"
                  disabled={selectedIsUnavailable}
                  href="/lostinseoul/checkout"
                  onClick={addToCart}
                >
                  <span>{labels.directPurchase}</span>
                </Link>
                <Button
                  className="lost-source-button justify-center"
                  disabled={selectedIsUnavailable}
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
                <div aria-hidden className="lost-top-bar lost-top-bar--pale" />
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
          </div>
        </section>
      </section>

      <ProductCollectionPush
        imageUrl={images[0]?.url ?? product.imageUrl ?? null}
        label={labels.collectionPush}
        mediaUrl={pushMediaUrl ?? null}
      />

      {relatedProducts.length > 0 ? (
        <LostProductSection
          cartLabel={labels.cart}
          emptyLabel=""
          incomingLabel={labels.related}
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
    </main>
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
