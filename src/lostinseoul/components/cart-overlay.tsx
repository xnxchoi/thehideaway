"use client";

import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import { useLenis } from "lenis/react";
import { animate, type AnimationPlaybackControls } from "motion";
import { AnimatePresence, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import { type RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import { cn } from "@/lib/utils";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";
import type { LostCurrency } from "@/lib/lost-commerce/types";
import { useTranslations } from "next-intl";
import {
  getCartFallbackFrameMetrics,
  getCartFixedDocumentMinHeight,
  getCartFrameMetrics,
  getCartLockScrollY,
  getCartOverlayApertureState,
  getCartOverlayChromeState,
  getCartOverlayChromeTransition,
  getCartOverlayPanelState,
  getCartRootMotionTarget,
  getCartSurfaceTransition,
  CART_TIMELINE_MS,
  CartFrameMetrics,
  CartFrameSyncReason,
  cartPower2InOut,
  CartRootMotionTarget,
  cartRootRestTarget,
  runCartCloseCleanup,
  shouldPreserveCartClosingCleanup,
  shouldSyncCartFrame,
  toCartFrameStyleVars
} from "@lostinseoul/cart-frame";
import { LostCartLineImage } from "@lostinseoul/cart-line-image";
import { useCartOpen, useCommerceRef } from "@lostinseoul/page-status";
import { CartDialog } from "./cart-dialog";
import { CartMutationFeedback } from "./cart-mutation-feedback";
import { CartLineControls } from "./cart-line-controls";

type CartLine = ReturnType<typeof useStoreCart>["lines"][number];

const CLOSE_MS = CART_TIMELINE_MS;
const REVEAL_MS = CART_TIMELINE_MS;

function clearCartRootInlineStyles(root: HTMLElement | null) {
  if (!root) return;
  root.style.removeProperty("transform");
  root.style.removeProperty("filter");
}

export function CartOverlay() {
  const { open, setOpen } = useCartOpen();
  const commerceRootRef = useCommerceRef();
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null
  );
  const openFrameRef = useRef<number | null>(null);
  const openTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null
  );
  const apertureRef = useRef<HTMLButtonElement | null>(null);
  const lockedScrollYRef = useRef<number | null>(null);
  const previousBodyMinHeightRef = useRef<string | null>(null);
  const previousOverflowRef = useRef<string | null>(null);
  const rootAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const stoppedLenisRef = useRef(false);
  const { lines, total } = useStoreCart();
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const currency = lines[0]?.currency ?? "KRW";

  useEffect(() => {
    setMounted(true);
  }, []);

  useCartRootTransform(
    open,
    mounted,
    previousOverflowRef,
    closeTimerRef,
    apertureRef,
    commerceRootRef,
    lockedScrollYRef,
    previousBodyMinHeightRef,
    openFrameRef,
    openTimerRef,
    rootAnimationRef,
    stoppedLenisRef
  );

  const closeBag = () => setOpen(false);
  const overlay = (
    <AnimatePresence>
      {open ? (
        <CartSurface
          apertureRef={apertureRef}

          count={count}
          currency={currency}
          key="lost-cart-surface"
          lines={lines}
          onClose={closeBag}
          open={open}

          total={total}
        />
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <CartTransformStyles />
      <CartOpenButton count={count} onOpen={() => setOpen(true)} open={open} />
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}

function useCartRootTransform(
  open: boolean,
  mounted: boolean,
  previousOverflowRef: RefObject<string | null>,
  closeTimerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  apertureRef: RefObject<HTMLButtonElement | null>,
  commerceRootRef: RefObject<HTMLElement | null>,
  lockedScrollYRef: RefObject<number | null>,
  previousBodyMinHeightRef: RefObject<string | null>,
  openFrameRef: RefObject<number | null>,
  openTimerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  rootAnimationRef: RefObject<AnimationPlaybackControls | null>,
  stoppedLenisRef: RefObject<boolean>
) {
  const lenis = useLenis();
  const lenisRef = useRef(lenis);

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    if (!mounted) return;
    const currentLenis = lenisRef.current;

    const stopRootAnimation = () => {
      rootAnimationRef.current?.stop();
      rootAnimationRef.current = null;
    };
    const animateCartRoot = (
      target: CartRootMotionTarget,
      durationMs: number,
      onComplete?: () => void
    ) => {
      const root = commerceRootRef.current;
      if (!root) {
        onComplete?.();
        return;
      }

      stopRootAnimation();
      const controls = animate(root, target, {
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : durationMs / 1000,
        ease: cartPower2InOut
      });
      rootAnimationRef.current = controls;
      void controls.finished.then(() => {
        if (rootAnimationRef.current === controls) {
          rootAnimationRef.current = null;
          onComplete?.();
        }
      });
    };
    const syncFrameToAperture = (
      reason: CartFrameSyncReason
    ): CartFrameMetrics | null => {
      if (!shouldSyncCartFrame(document.body.dataset.lostCartState, reason)) {
        return null;
      }

      const aperture = apertureRef.current;
      const viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      };
      const metrics =
        aperture && aperture.offsetParent !== null
          ? getCartFrameMetrics({
              rect: aperture.getBoundingClientRect(),
              viewport
            })
          : getCartFallbackFrameMetrics(viewport);
      if (!metrics) return null;

      const rootStyle = document.documentElement.style;
      Object.entries(toCartFrameStyleVars(metrics)).forEach(
        ([property, value]) => {
          rootStyle.setProperty(property, value);
        }
      );
      return metrics;
    };
    const clearCloseTimer = () => {
      if (!closeTimerRef.current) return;
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    };
    const clearOpenStart = () => {
      if (openFrameRef.current !== null) {
        cancelAnimationFrame(openFrameRef.current);
        openFrameRef.current = null;
      }
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
    };

    if (!open) {
      clearOpenStart();
      document.body.dataset.lostCartOpen = "false";
      document.body.dataset.lostCartFrame = "closing";
      if (
        document.body.dataset.lostCartState === "open" ||
        document.body.dataset.lostCartState === "preopen"
      ) {
        document.body.dataset.lostCartState = "closing";
        animateCartRoot(cartRootRestTarget, CLOSE_MS);
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
          const lockedScrollY = lockedScrollYRef.current;
          runCartCloseCleanup({
            clearRootStyles: () => {
              clearCartRootInlineStyles(commerceRootRef.current);
            },
            releaseFixedFrame: () => {
              document.body.dataset.lostCartState = "idle";
              delete document.body.dataset.lostCartFrame;
              document.documentElement.style.removeProperty(
                "--lost-cart-scroll-y"
              );
            },
            restoreDocumentHeight: () => {
              document.body.style.minHeight =
                previousBodyMinHeightRef.current ?? "";
              previousBodyMinHeightRef.current = null;
            },
            restoreScrollContainer: () => {
              document.documentElement.style.overflow =
                previousOverflowRef.current ?? "";
              previousOverflowRef.current = null;
            },
            restoreScrollPosition: () => {
              if (lockedScrollY === null) return;
              window.scrollTo(0, lockedScrollY);
              currentLenis?.scrollTo(lockedScrollY, {
                force: true,
                immediate: true
              });
              lockedScrollYRef.current = null;
            },
            resumeSmoothScroll: () => {
              if (!stoppedLenisRef.current) return;
              currentLenis?.start();
              stoppedLenisRef.current = false;
            }
          });
        }, CLOSE_MS);
      }
      return;
    }

    clearCloseTimer();
    if (previousOverflowRef.current === null) {
      previousOverflowRef.current = document.documentElement.style.overflow;
    }
    const lockedScrollY = getCartLockScrollY(currentLenis, window.scrollY);
    lockedScrollYRef.current = lockedScrollY;
    if (previousBodyMinHeightRef.current === null) {
      previousBodyMinHeightRef.current = document.body.style.minHeight;
    }
    document.body.style.minHeight = `${getCartFixedDocumentMinHeight({
      rootScrollHeight: commerceRootRef.current?.scrollHeight ?? 0,
      scrollY: lockedScrollY,
      viewportHeight: window.innerHeight
    })}px`;
    currentLenis?.scrollTo(lockedScrollY, {
      force: true,
      immediate: true
    });
    if (currentLenis && !stoppedLenisRef.current) {
      currentLenis.stop();
      stoppedLenisRef.current = true;
    }
    clearCartRootInlineStyles(commerceRootRef.current);
    document.documentElement.style.setProperty(
      "--lost-cart-scroll-y",
      `${lockedScrollY}px`
    );
    document.documentElement.style.overflow = "hidden";
    document.body.dataset.lostCartOpen = "true";
    document.body.dataset.lostCartState = "preopen";
    document.body.dataset.lostCartFrame = "open";
    syncFrameToAperture("opening");
    const syncFrameOnResize = () => syncFrameToAperture("resize");
    window.addEventListener("resize", syncFrameOnResize);
    commerceRootRef.current?.getBoundingClientRect();

    const startOpenTransform = () => {
      if (document.body.dataset.lostCartState !== "preopen") return;
      const metrics = syncFrameToAperture("opening");
      document.body.dataset.lostCartState = "open";
      if (metrics) {
        animateCartRoot(getCartRootMotionTarget(metrics), REVEAL_MS);
      }
      commerceRootRef.current?.getBoundingClientRect();
      clearOpenStart();
    };

    openFrameRef.current = requestAnimationFrame(() => {
      openFrameRef.current = requestAnimationFrame(startOpenTransform);
    });
    openTimerRef.current = setTimeout(() => {
      startOpenTransform();
      openTimerRef.current = null;
    }, 80);

    return () => {
      window.removeEventListener("resize", syncFrameOnResize);
    };
  }, [
    closeTimerRef,
    apertureRef,
    commerceRootRef,
    lockedScrollYRef,
    mounted,
    open,
    openFrameRef,
    openTimerRef,
    previousOverflowRef,
    previousBodyMinHeightRef,
    rootAnimationRef,
    stoppedLenisRef
  ]);

  useEffect(() => {
    const commerceRoot = commerceRootRef.current;

    return () => {
      const currentLenis = lenisRef.current;
      if (
        shouldPreserveCartClosingCleanup(
          document.body.dataset.lostCartState,
          closeTimerRef.current !== null
        )
      ) {
        return;
      }
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (openFrameRef.current !== null)
        window.cancelAnimationFrame(openFrameRef.current);
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      rootAnimationRef.current?.stop();
      rootAnimationRef.current = null;
      document.body.dataset.lostCartOpen = "false";
      const lockedScrollY = lockedScrollYRef.current;
      runCartCloseCleanup({
        clearRootStyles: () => {
          clearCartRootInlineStyles(commerceRoot);
        },
        releaseFixedFrame: () => {
          document.body.dataset.lostCartState = "idle";
          delete document.body.dataset.lostCartFrame;
          document.documentElement.style.removeProperty("--lost-cart-scroll-y");
        },
        restoreDocumentHeight: () => {
          document.body.style.minHeight =
            previousBodyMinHeightRef.current ?? "";
          previousBodyMinHeightRef.current = null;
        },
        restoreScrollContainer: () => {
          document.documentElement.style.overflow =
            previousOverflowRef.current ?? "";
          previousOverflowRef.current = null;
        },
        restoreScrollPosition: () => {
          if (lockedScrollY === null) return;
          window.scrollTo(0, lockedScrollY);
          currentLenis?.scrollTo(lockedScrollY, {
            force: true,
            immediate: true
          });
          lockedScrollYRef.current = null;
        },
        resumeSmoothScroll: () => {
          if (!stoppedLenisRef.current) return;
          currentLenis?.start();
          stoppedLenisRef.current = false;
        }
      });
    };
  }, [
    closeTimerRef,
    commerceRootRef,
    lockedScrollYRef,
    openFrameRef,
    openTimerRef,
    previousOverflowRef,
    previousBodyMinHeightRef,
    rootAnimationRef,
    stoppedLenisRef
  ]);
}

function CartOpenButton({
  count,
  onOpen,
  open
}: {
  count: number;
  onOpen: () => void;
  open: boolean;
}) {
  const t = useTranslations("LOSTINSEOUL.cart");
  return (
    <Button
      aria-expanded={open}
      className="inline-flex min-h-16 items-center gap-3 rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] px-4 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] hover:bg-[var(--lost-hero-glass-hover)]"
      onClick={onOpen}
      type="button"
    >
      <ShoppingBagIcon aria-hidden className="size-7" weight="regular" />
      <span>
        {t("title")} / {count}
      </span>
    </Button>
  );
}

function CartSurface({
  apertureRef,

  count,
  currency,

  lines,
  onClose,
  open,

  total
}: {
  apertureRef: RefObject<HTMLButtonElement | null>;

  count: number;
  currency: LostCurrency;

  lines: CartLine[];
  onClose: () => void;
  open: boolean;

  total: number;
}) {
  const isPresent = useIsPresent();
  const t = useTranslations("LOSTINSEOUL.cart");
  return (
    <CartDialog
      active={open && isPresent}
      onClose={onClose}
      animate={{ opacity: 1 }}
      data-open={open ? "true" : "false"}
      data-lost-cursor-theme="light"
      exit={{
        opacity: 1,
        transition: getCartSurfaceTransition(false)
      }}
      initial={{ opacity: 1 }}
      className={cn(
        "lost-cart-surface fixed inset-0 z-(--lost-cart-surface-z) grid grid-rows-[11.5rem_calc(100svh_-_17.1rem)_5.6rem] gap-5 overflow-hidden px-4 text-[var(--lost-cart-ink)] [--lost-cart-bg:var(--n-s-bg)] [--lost-cart-fg:var(--n-s-fg)] [--lost-cart-ink:var(--n-s-fg)] [--lost-cart-line:oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] [--lost-cart-muted:oklch(from_var(--n-s-fg)_l_c_h_/_0.62)] [--lost-cart-soft:oklch(from_var(--n-s-fg)_l_c_h_/_0.08)] [--lost-cart-strong-ink:var(--n-s-bg)] [--lost-cart-strong:var(--n-s-fg)] lg:grid-cols-12 lg:grid-rows-[18.9rem_auto_7rem] lg:px-28",
        open && isPresent ? "pointer-events-auto" : "pointer-events-none"
      )}
      transition={getCartSurfaceTransition(true)}
    >
      <CartHeader count={count} onClose={onClose} />
      <CartAperture apertureRef={apertureRef} onClose={onClose} />
      <CartPanel
        currency={currency}
        lines={lines}
        onClose={onClose}
        total={total}
      />
      <p className="relative z-10 col-span-full row-start-3 hidden self-center justify-self-center overflow-hidden text-[1.2rem] leading-none text-[var(--lost-cart-muted)] lg:block">
        <m.span
          animate={getCartOverlayChromeState(true)}
          className="inline-block"
          exit={getCartOverlayChromeState(false)}
          initial={getCartOverlayChromeState(false)}
          transition={getCartOverlayChromeTransition()}
        >
          {t("total")} {formatLostMoney(total, currency)}
        </m.span>
      </p>
    </CartDialog>
  );
}

function CartHeader({
  count,
  onClose
}: {
  count: number;
  onClose: () => void;
}) {
  const chromeTransition = getCartOverlayChromeTransition();
  const t = useTranslations("LOSTINSEOUL");
  return (
    <header className="relative z-10 col-span-full row-start-1 flex h-28 items-center justify-between overflow-hidden pt-6 lg:h-32 lg:pt-16">
      <m.div
        animate={getCartOverlayChromeState(true)}
        exit={getCartOverlayChromeState(false)}
        initial={getCartOverlayChromeState(false)}
        transition={chromeTransition}
      >
        <Link aria-label={t("cart.home")} href="/lostinseoul" onClick={onClose}>
          <span className="font-sans text-[1.6rem] leading-none font-bold tracking-[0.24em] uppercase lg:text-[2rem]">
            LOSTINSEOUL
          </span>
        </Link>
      </m.div>
      <m.p
        animate={getCartOverlayChromeState(true)}
        className="hidden font-sans text-[1.4rem] leading-none font-bold tracking-[0.18em] uppercase lg:block"
        exit={getCartOverlayChromeState(false)}
        initial={getCartOverlayChromeState(false)}
        transition={chromeTransition}
      >
        {t("cart.title")} [{count.toString().padStart(2, "0")}]
      </m.p>
      <m.div
        animate={getCartOverlayChromeState(true)}
        exit={getCartOverlayChromeState(false)}
        initial={getCartOverlayChromeState(false)}
        transition={chromeTransition}
      >
        <Button
          className="inline-flex min-h-16 items-center gap-2 rounded-[4px] bg-[var(--lost-cart-strong)] px-4 text-[1.2rem] leading-none font-medium text-[var(--lost-cart-strong-ink)]"
          onClick={onClose}
          type="button"
        >
          <XIcon aria-hidden className="size-6" weight="regular" />
          {t("order.back")}
        </Button>
      </m.div>
    </header>
  );
}

function CartAperture({
  apertureRef,
  onClose
}: {
  apertureRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const t = useTranslations("LOSTINSEOUL.cart");
  return (
    <m.section
      aria-label={t("preview")}
      animate={getCartOverlayApertureState(true)}
      className="relative z-10 hidden grid-rows-[1.5rem_calc(100svh*var(--lost-cart-frame-scale,0.62))] gap-10 overflow-hidden lg:col-span-8 lg:row-start-2 lg:grid"
      exit={getCartOverlayApertureState(false)}
      initial={false}
      transition={getCartOverlayChromeTransition()}
    >
      <m.div
        aria-hidden
        animate={getCartOverlayPanelState(true)}
        className="h-[1.5rem] border-x border-t border-[var(--lost-cart-line)]"
        exit={{ opacity: 0, x: 0 }}
        initial={getCartOverlayPanelState(false)}
        transition={getCartOverlayChromeTransition()}
      />
      <Button
        aria-label={t("closePreview")}
        className="cursor-pointer rounded-[4px] border border-[var(--lost-cart-line)] bg-transparent"
        data-lost-cart-aperture
        onClick={onClose}
        ref={apertureRef}
        type="button"
      />
    </m.section>
  );
}

function CartPanel({
  currency,
  lines,
  onClose,
  total
}: {
  currency: LostCurrency;
  lines: CartLine[];
  onClose: () => void;
  total: number;
}) {
  const t = useTranslations("LOSTINSEOUL");
  const { isLoading, unconfirmed, isBlocked } = useStoreCart();
  return (
    <m.aside
      animate={getCartOverlayPanelState(true)}
      className="relative z-10 col-span-full row-start-2 grid gap-8 self-end lg:col-span-4 lg:col-start-9 lg:h-[calc(var(--lost-cart-panel-scale,64rem)_+_5.5rem)] lg:gap-10 lg:pl-28"
      data-lost-cart-panel
      exit={getCartOverlayPanelState(false)}
      initial={getCartOverlayPanelState(false)}
      transition={getCartOverlayChromeTransition()}
    >
      <m.div
        aria-hidden
        animate={getCartOverlayPanelState(true)}
        className="h-[1.5rem] border-x border-t border-[var(--lost-cart-line)]"
        exit={{ opacity: 0, x: 0 }}
        initial={getCartOverlayPanelState(false)}
        transition={getCartOverlayChromeTransition()}
      />
      <div className="grid min-h-[calc(100svh-24rem)] grid-rows-[1fr_auto] border border-[var(--lost-cart-line)] bg-[var(--lost-cart-bg)] p-5 lg:min-h-0 lg:p-8">
        {lines.length === 0 ? (
          <div className="grid gap-4">
            <CartMutationFeedback unconfirmed={unconfirmed} />
            <CartEmpty onClose={onClose} />
          </div>
        ) : (
          <>
            <div className="grid max-h-[48svh] gap-6 overflow-y-auto pr-2">
              {lines.map((line) => (
                <CartLineItem
                  key={
                    line.itemId ??
                    `${line.productId}:${line.skuId}:${line.mode}:${line.campaignId ?? ""}`
                  }
                  line={line}
                  onClose={onClose}
                />
              ))}
            </div>
            <div className="mt-8 grid gap-4 border-t border-[var(--lost-cart-line)] pt-5">
              <div className="flex items-center justify-between font-sans text-[1.1rem] leading-none tracking-[0.16em] text-[var(--lost-cart-muted)] uppercase">
                <span>{t("cart.total")}</span>
                <span>{formatLostMoney(total, currency)}</span>
              </div>
              {isLoading ? (
                <Button type="button" disabled className="min-h-18 opacity-60">
                  {t("checkout.title")}
                </Button>
              ) : (
                <Link
                  className="inline-flex min-h-18 items-center justify-center rounded-[4px] bg-[var(--lost-cart-strong)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-cart-strong-ink)]"
                  href="/lostinseoul/checkout"
                  onClick={(event) => {
                    if (isBlocked()) {
                      event.preventDefault();
                      return;
                    }
                    onClose();
                  }}
                >
                  {t("checkout.title")}
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </m.aside>
  );
}

function CartEmpty({ onClose }: { onClose: () => void }) {
  const t = useTranslations("LOSTINSEOUL");
  return (
    <div className="grid content-center justify-items-center gap-5 self-center text-center">
      <p className="font-sans text-[1.4rem] leading-none font-bold tracking-[0.18em] uppercase">
        {t("cart.empty")}
      </p>
      <Button
        className="inline-flex min-h-16 items-center rounded-[4px] bg-[var(--lost-cart-strong)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-cart-strong-ink)]"
        onClick={onClose}
        type="button"
      >
        {t("order.back")}
      </Button>
    </div>
  );
}

function CartLineItem({
  line,
  onClose
}: {
  line: CartLine;
  onClose: () => void;
}) {
  const tModes = useTranslations("LOSTINSEOUL.cart.modes");

  return (
    <div className="grid grid-cols-[7.2rem_1fr] gap-4 border-b border-[var(--lost-cart-line)] pb-5 last:border-b-0">
      <Link
        aria-label={line.productName}
        className="aspect-square overflow-hidden bg-[var(--lost-cart-soft)]"
        href={`/lostinseoul/products/${line.productSlug}`}
        onClick={onClose}
      >
        {line.imageUrl ? (
          <LostCartLineImage
            alt={line.productName}
            src={line.imageUrl}
            surface="overlay"
          />
        ) : null}
      </Link>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <Link
            className="text-[1.4rem] leading-tight font-medium tracking-tight"
            href={`/lostinseoul/products/${line.productSlug}`}
            onClick={onClose}
          >
            {line.productName}
          </Link>
          <p className="shrink-0 font-sans text-[1.1rem] leading-tight text-[var(--lost-cart-muted)] tabular-nums">
            {formatLostMoney(line.unitAmount * line.quantity, line.currency)}
          </p>
        </div>
        <p className="mt-1 font-sans text-[1.1rem] leading-tight tracking-[0.16em] text-[var(--lost-cart-muted)] uppercase">
          {line.variantLabel ? `${line.variantLabel} / ` : ""}
          {tModes(line.mode)} / x {line.quantity}
        </p>
        <CartLineControls line={line} />
      </div>
    </div>
  );
}

function CartTransformStyles() {
  return (
    <style>
      {`
        :root {
          --lost-cart-closing-root-z: 1201;
          --lost-cart-frame-x: 3.5vw;
          --lost-cart-frame-y: 15svh;
          --lost-cart-frame-width: 62vw;
          --lost-cart-frame-height: 62svh;
          --lost-cart-frame-right: 34.5vw;
          --lost-cart-frame-bottom: 23svh;
          --lost-cart-frame-scale: 0.62;
          --lost-cart-surface-z:1200;
        }
        .lost-commerce-root {
          transform-origin: top left;
        }
        body[data-lost-cart-open="true"] .lost-commerce-root {
          pointer-events: none;
        }
        body[data-lost-cart-state="preopen"] .lost-commerce-root,
        body[data-lost-cart-state="open"] .lost-commerce-root,
        body[data-lost-cart-state="closing"] .lost-commerce-root {
          position: fixed;
          left: 0;
          right: 0;
          top: 0;
          width: 100vw;
          height: 100svh;
          min-height: 100svh;
          overflow: hidden;
          will-change: transform, filter;
        }
        body[data-lost-cart-state="closing"] .lost-commerce-root {
          z-index: var(--lost-cart-closing-root-z);
        }
        body[data-lost-cart-state="preopen"] .lost-commerce-inner,
        body[data-lost-cart-state="open"] .lost-commerce-inner,
        body[data-lost-cart-state="closing"] .lost-commerce-inner {
          position: fixed;
          left: 0;
          right: 0;
          top: calc(var(--lost-cart-scroll-y, 0px) * -1);
          width: 100%;
        }
        @media (max-width: 767px) {
          :root {
            --lost-cart-frame-x: 4vw;
            --lost-cart-frame-y: 17svh;
            --lost-cart-frame-width: 92vw;
            --lost-cart-frame-height: 92svh;
            --lost-cart-frame-right: 4vw;
            --lost-cart-frame-bottom: -9svh;
            --lost-cart-frame-scale: 0.92;
          }
        }
      `}
    </style>
  );
}
