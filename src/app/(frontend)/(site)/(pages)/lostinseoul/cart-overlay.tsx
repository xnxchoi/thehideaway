"use client";

import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import { useLenis } from "lenis/react";
import { animate, type AnimationPlaybackControls } from "motion";
import { AnimatePresence, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import { cn } from "@/lib/utils";
import { useLostCart } from "@/lib/lost-commerce/useLostCart";
import { LostCurrency } from "@/lib/lost-commerce/types";
import { LostCartLineImage } from "./cart-line-image";
import {
  getLostBagFallbackFrameMetrics,
  getLostBagFixedDocumentMinHeight,
  getLostBagFrameMetrics,
  getLostBagLockScrollY,
  getLostBagOverlayApertureState,
  getLostBagOverlayChromeState,
  getLostBagOverlayChromeTransition,
  getLostBagOverlayPanelState,
  getLostBagRootMotionTarget,
  getLostBagSurfaceTransition,
  LOST_BAG_CLOSING_ROOT_Z_INDEX,
  LOST_BAG_SURFACE_Z_INDEX,
  LOST_BAG_TIMELINE_MS,
  lostBagRootRestTarget,
  lostBagPower2InOut,
  shouldPreserveLostBagClosingCleanup,
  shouldSyncLostBagFrame,
  type LostBagFrameMetrics,
  type LostBagFrameSyncReason,
  type LostBagRootMotionTarget,
  toLostBagFrameStyleVars
} from "./cart-frame";

type Props = {
  cartLabel: string;
  backLabel: string;
  commerceRootRef: RefObject<HTMLElement | null>;
  emptyLabel: string;
  checkoutLabel: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  removeLabel: string;
  totalLabel: string;
};

type CartLine = ReturnType<typeof useLostCart>["lines"][number];

const CLOSE_MS = LOST_BAG_TIMELINE_MS;
const REVEAL_MS = LOST_BAG_TIMELINE_MS;

function clearLostBagRootInlineStyles(root: HTMLElement | null) {
  if (!root) return;
  root.style.removeProperty("transform");
  root.style.removeProperty("filter");
}

export function LostCartOverlay({
  backLabel,
  cartLabel,
  checkoutLabel,
  commerceRootRef,
  emptyLabel,
  onOpenChange,
  open,
  removeLabel,
  totalLabel
}: Props) {
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
  const { lines, remove, total } = useLostCart();
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

  useLayoutEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  const closeBag = () => onOpenChange(false);
  const overlay = (
    <AnimatePresence>
      {open ? (
        <LostBagSurface
          apertureRef={apertureRef}
          backLabel={backLabel}
          cartLabel={cartLabel}
          checkoutLabel={checkoutLabel}
          count={count}
          currency={currency}
          emptyLabel={emptyLabel}
          key="lost-bag-surface"
          lines={lines}
          onClose={closeBag}
          onRemove={remove}
          open={open}
          removeLabel={removeLabel}
          total={total}
          totalLabel={totalLabel}
        />
      ) : null}
    </AnimatePresence>
  );

  return (
    <>
      <LostBagTransformStyles />
      <LostBagOpenButton
        cartLabel={cartLabel}
        count={count}
        onOpen={() => onOpenChange(true)}
        open={open}
      />
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
      target: LostBagRootMotionTarget,
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
        ease: lostBagPower2InOut
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
      reason: LostBagFrameSyncReason
    ): LostBagFrameMetrics | null => {
      if (!shouldSyncLostBagFrame(document.body.dataset.lostBagState, reason)) {
        return null;
      }

      const aperture = apertureRef.current;
      const viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      };
      const metrics =
        aperture && aperture.offsetParent !== null
          ? getLostBagFrameMetrics({
              rect: aperture.getBoundingClientRect(),
              viewport
            })
          : getLostBagFallbackFrameMetrics(viewport);
      if (!metrics) return null;

      const rootStyle = document.documentElement.style;
      Object.entries(toLostBagFrameStyleVars(metrics)).forEach(
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
      document.body.dataset.lostBagOpen = "false";
      document.dispatchEvent(
        new CustomEvent("lost:bag-frame", {
          detail: { closeMs: CLOSE_MS, open: false }
        })
      );
      if (
        document.body.dataset.lostBagState === "open" ||
        document.body.dataset.lostBagState === "preopen"
      ) {
        document.body.dataset.lostBagState = "closing";
        animateCartRoot(lostBagRootRestTarget, CLOSE_MS);
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
          document.body.dataset.lostBagState = "idle";
          const lockedScrollY = lockedScrollYRef.current;
          document.documentElement.style.removeProperty("--lost-bag-scroll-y");
          document.documentElement.style.overflow =
            previousOverflowRef.current ?? "";
          previousOverflowRef.current = null;
          document.body.style.minHeight =
            previousBodyMinHeightRef.current ?? "";
          previousBodyMinHeightRef.current = null;
          if (lockedScrollY !== null) {
            window.scrollTo(0, lockedScrollY);
            currentLenis?.scrollTo(lockedScrollY, {
              force: true,
              immediate: true
            });
            lockedScrollYRef.current = null;
          }
          if (stoppedLenisRef.current) {
            currentLenis?.start();
            stoppedLenisRef.current = false;
          }
          clearLostBagRootInlineStyles(commerceRootRef.current);
        }, CLOSE_MS);
      }
      return;
    }

    clearCloseTimer();
    if (previousOverflowRef.current === null) {
      previousOverflowRef.current = document.documentElement.style.overflow;
    }
    const lockedScrollY = getLostBagLockScrollY(currentLenis, window.scrollY);
    lockedScrollYRef.current = lockedScrollY;
    if (previousBodyMinHeightRef.current === null) {
      previousBodyMinHeightRef.current = document.body.style.minHeight;
    }
    document.body.style.minHeight = `${getLostBagFixedDocumentMinHeight({
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
    clearLostBagRootInlineStyles(commerceRootRef.current);
    document.documentElement.style.setProperty(
      "--lost-bag-scroll-y",
      `${lockedScrollY}px`
    );
    document.documentElement.style.overflow = "hidden";
    document.body.dataset.lostBagOpen = "true";
    document.body.dataset.lostBagState = "preopen";
    syncFrameToAperture("opening");
    const syncFrameOnResize = () => syncFrameToAperture("resize");
    window.addEventListener("resize", syncFrameOnResize);
    document.dispatchEvent(
      new CustomEvent("lost:bag-frame", {
        detail: { open: true, revealMs: REVEAL_MS }
      })
    );
    commerceRootRef.current?.getBoundingClientRect();

    const startOpenTransform = () => {
      if (document.body.dataset.lostBagState !== "preopen") return;
      const metrics = syncFrameToAperture("opening");
      document.body.dataset.lostBagState = "open";
      if (metrics) {
        animateCartRoot(getLostBagRootMotionTarget(metrics), REVEAL_MS);
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
        shouldPreserveLostBagClosingCleanup(
          document.body.dataset.lostBagState,
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
      document.body.dataset.lostBagOpen = "false";
      document.body.dataset.lostBagState = "idle";
      document.dispatchEvent(
        new CustomEvent("lost:bag-frame", {
          detail: { closeMs: CLOSE_MS, open: false }
        })
      );
      const lockedScrollY = lockedScrollYRef.current;
      document.documentElement.style.removeProperty("--lost-bag-scroll-y");
      document.documentElement.style.overflow =
        previousOverflowRef.current ?? "";
      document.body.style.minHeight = previousBodyMinHeightRef.current ?? "";
      previousBodyMinHeightRef.current = null;
      if (lockedScrollY !== null) {
        window.scrollTo(0, lockedScrollY);
        currentLenis?.scrollTo(lockedScrollY, {
          force: true,
          immediate: true
        });
        lockedScrollYRef.current = null;
      }
      if (stoppedLenisRef.current) {
        currentLenis?.start();
        stoppedLenisRef.current = false;
      }
      clearLostBagRootInlineStyles(commerceRoot);
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

function LostBagOpenButton({
  cartLabel,
  count,
  onOpen,
  open
}: {
  cartLabel: string;
  count: number;
  onOpen: () => void;
  open: boolean;
}) {
  return (
    <Button
      aria-expanded={open}
      className="inline-flex min-h-16 items-center gap-3 rounded-[4px] border border-[var(--lost-hero-line)] bg-[var(--lost-hero-glass)] px-4 text-[1.2rem] leading-none font-medium text-[var(--lost-hero-ink)] backdrop-blur-md transition-colors duration-500 ease-[cubic-bezier(0.6,0,0.3,1)] hover:bg-[var(--lost-hero-glass-hover)]"
      onClick={onOpen}
      type="button"
    >
      <ShoppingBagIcon aria-hidden className="size-7" weight="regular" />
      <span>
        {cartLabel} / {count}
      </span>
    </Button>
  );
}

function LostBagSurface({
  apertureRef,
  backLabel,
  cartLabel,
  checkoutLabel,
  count,
  currency,
  emptyLabel,
  lines,
  onClose,
  onRemove,
  open,
  removeLabel,
  total,
  totalLabel
}: {
  apertureRef: RefObject<HTMLButtonElement | null>;
  backLabel: string;
  cartLabel: string;
  checkoutLabel: string;
  count: number;
  currency: LostCurrency;
  emptyLabel: string;
  lines: CartLine[];
  onClose: () => void;
  onRemove: (line: CartLine) => void;
  open: boolean;
  removeLabel: string;
  total: number;
  totalLabel: string;
}) {
  const isPresent = useIsPresent();

  return (
    <m.div
      role="dialog"
      aria-modal="true"
      aria-hidden={!open || !isPresent}
      animate={{ opacity: 1 }}
      data-open={open ? "true" : "false"}
      data-lost-cursor-theme="light"
      exit={{
        opacity: 1,
        transition: getLostBagSurfaceTransition(false)
      }}
      initial={{ opacity: 1 }}
      className={cn(
        "lost-bag-surface fixed inset-0 z-[var(--lost-bag-surface-z)] grid grid-rows-[11.5rem_calc(100svh_-_17.1rem)_5.6rem] gap-5 overflow-hidden px-4 text-[var(--lost-bag-ink)] [--lost-bag-bg:var(--n-s-bg)] [--lost-bag-fg:var(--n-s-fg)] [--lost-bag-ink:var(--n-s-fg)] [--lost-bag-line:oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] [--lost-bag-muted:oklch(from_var(--n-s-fg)_l_c_h_/_0.62)] [--lost-bag-soft:oklch(from_var(--n-s-fg)_l_c_h_/_0.08)] [--lost-bag-strong-ink:var(--n-s-bg)] [--lost-bag-strong:var(--n-s-fg)] lg:grid-cols-12 lg:grid-rows-[18.9rem_auto_7rem] lg:px-28",
        open && isPresent ? "pointer-events-auto" : "pointer-events-none"
      )}
      transition={getLostBagSurfaceTransition(true)}
    >
      <LostBagHeader
        backLabel={backLabel}
        cartLabel={cartLabel}
        count={count}
        onClose={onClose}
      />
      <LostBagAperture apertureRef={apertureRef} onClose={onClose} />
      <LostBagPanel
        backLabel={backLabel}
        checkoutLabel={checkoutLabel}
        currency={currency}
        emptyLabel={emptyLabel}
        lines={lines}
        onClose={onClose}
        onRemove={onRemove}
        removeLabel={removeLabel}
        total={total}
        totalLabel={totalLabel}
      />
      <p className="relative z-10 col-span-full row-start-3 hidden self-center justify-self-center overflow-hidden text-[1.2rem] leading-none text-[var(--lost-bag-muted)] lg:block">
        <m.span
          animate={getLostBagOverlayChromeState(true)}
          className="inline-block"
          exit={getLostBagOverlayChromeState(false)}
          initial={getLostBagOverlayChromeState(false)}
          transition={getLostBagOverlayChromeTransition()}
        >
          {totalLabel} {formatLostMoney(total, currency)}
        </m.span>
      </p>
    </m.div>
  );
}

function LostBagHeader({
  backLabel,
  cartLabel,
  count,
  onClose
}: {
  backLabel: string;
  cartLabel: string;
  count: number;
  onClose: () => void;
}) {
  const chromeTransition = getLostBagOverlayChromeTransition();

  return (
    <header className="relative z-10 col-span-full row-start-1 flex h-28 items-center justify-between overflow-hidden pt-6 lg:h-32 lg:pt-16">
      <m.div
        animate={getLostBagOverlayChromeState(true)}
        exit={getLostBagOverlayChromeState(false)}
        initial={getLostBagOverlayChromeState(false)}
        transition={chromeTransition}
      >
        <Link
          aria-label="LOSTINSEOUL home"
          href="/lostinseoul"
          onClick={onClose}
        >
          <span className="font-mono text-[1.6rem] leading-none font-bold tracking-[0.24em] uppercase lg:text-[2rem]">
            LOSTINSEOUL
          </span>
        </Link>
      </m.div>
      <m.p
        animate={getLostBagOverlayChromeState(true)}
        className="hidden font-mono text-[1.4rem] leading-none font-bold tracking-[0.18em] uppercase lg:block"
        exit={getLostBagOverlayChromeState(false)}
        initial={getLostBagOverlayChromeState(false)}
        transition={chromeTransition}
      >
        {cartLabel} [{count.toString().padStart(2, "0")}]
      </m.p>
      <m.div
        animate={getLostBagOverlayChromeState(true)}
        exit={getLostBagOverlayChromeState(false)}
        initial={getLostBagOverlayChromeState(false)}
        transition={chromeTransition}
      >
        <Button
          className="inline-flex min-h-16 items-center gap-2 rounded-[4px] bg-[var(--lost-bag-strong)] px-4 text-[1.2rem] leading-none font-medium text-[var(--lost-bag-strong-ink)]"
          onClick={onClose}
          type="button"
        >
          <XIcon aria-hidden className="size-6" weight="regular" />
          {backLabel}
        </Button>
      </m.div>
    </header>
  );
}

function LostBagAperture({
  apertureRef,
  onClose
}: {
  apertureRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  return (
    <m.section
      aria-label="cart preview"
      animate={getLostBagOverlayApertureState(true)}
      className="relative z-10 hidden grid-rows-[1.5rem_calc(100svh*var(--lost-bag-frame-scale,0.62))] gap-10 overflow-hidden lg:col-span-8 lg:row-start-2 lg:grid"
      exit={getLostBagOverlayApertureState(false)}
      initial={false}
      transition={getLostBagOverlayChromeTransition()}
    >
      <m.div
        aria-hidden
        animate={getLostBagOverlayPanelState(true)}
        className="h-[1.5rem] border-x border-t border-[var(--lost-bag-line)]"
        exit={{ opacity: 0, x: 0 }}
        initial={getLostBagOverlayPanelState(false)}
        transition={getLostBagOverlayChromeTransition()}
      />
      <Button
        aria-label="Close cart preview"
        className="cursor-pointer rounded-[4px] border border-[var(--lost-bag-line)] bg-transparent"
        data-lost-bag-aperture
        onClick={onClose}
        ref={apertureRef}
        type="button"
      />
    </m.section>
  );
}

function LostBagPanel({
  backLabel,
  checkoutLabel,
  currency,
  emptyLabel,
  lines,
  onClose,
  onRemove,
  removeLabel,
  total,
  totalLabel
}: {
  backLabel: string;
  checkoutLabel: string;
  currency: LostCurrency;
  emptyLabel: string;
  lines: CartLine[];
  onClose: () => void;
  onRemove: (line: CartLine) => void;
  removeLabel: string;
  total: number;
  totalLabel: string;
}) {
  return (
    <m.aside
      animate={getLostBagOverlayPanelState(true)}
      className="relative z-10 col-span-full row-start-2 grid gap-8 self-end lg:col-span-4 lg:col-start-9 lg:h-[calc(var(--lost-bag-panel-scale,64rem)_+_5.5rem)] lg:gap-10 lg:pl-28"
      data-lost-bag-panel
      exit={getLostBagOverlayPanelState(false)}
      initial={getLostBagOverlayPanelState(false)}
      transition={getLostBagOverlayChromeTransition()}
    >
      <m.div
        aria-hidden
        animate={getLostBagOverlayPanelState(true)}
        className="h-[1.5rem] border-x border-t border-[var(--lost-bag-line)]"
        exit={{ opacity: 0, x: 0 }}
        initial={getLostBagOverlayPanelState(false)}
        transition={getLostBagOverlayChromeTransition()}
      />
      <div className="grid min-h-[calc(100svh-24rem)] grid-rows-[1fr_auto] border border-[var(--lost-bag-line)] bg-[var(--lost-bag-bg)] p-5 lg:min-h-0 lg:p-8">
        {lines.length === 0 ? (
          <LostBagEmpty
            backLabel={backLabel}
            emptyLabel={emptyLabel}
            onClose={onClose}
          />
        ) : (
          <>
            <div className="grid max-h-[48svh] gap-6 overflow-y-auto pr-2">
              {lines.map((line) => (
                <LostBagLine
                  key={`${line.productId}:${line.variantId ?? ""}:${line.mode}:${line.campaignId ?? ""}`}
                  line={line}
                  onRemove={onRemove}
                  removeLabel={removeLabel}
                />
              ))}
            </div>
            <div className="mt-8 grid gap-4 border-t border-[var(--lost-bag-line)] pt-5">
              <div className="flex items-center justify-between font-mono text-[1.1rem] leading-none tracking-[0.16em] text-[var(--lost-bag-muted)] uppercase">
                <span>{totalLabel}</span>
                <span>{formatLostMoney(total, currency)}</span>
              </div>
              <Link
                className="inline-flex min-h-18 items-center justify-center rounded-[4px] bg-[var(--lost-bag-strong)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-bag-strong-ink)]"
                href="/lostinseoul/checkout"
              >
                {checkoutLabel}
              </Link>
            </div>
          </>
        )}
      </div>
    </m.aside>
  );
}

function LostBagEmpty({
  backLabel,
  emptyLabel,
  onClose
}: {
  backLabel: string;
  emptyLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="grid content-center justify-items-center gap-5 self-center text-center">
      <p className="font-mono text-[1.4rem] leading-none font-bold tracking-[0.18em] uppercase">
        {emptyLabel}
      </p>
      <Button
        className="inline-flex min-h-16 items-center rounded-[4px] bg-[var(--lost-bag-strong)] px-5 text-[1.2rem] leading-none font-medium text-[var(--lost-bag-strong-ink)]"
        onClick={onClose}
        type="button"
      >
        {backLabel}
      </Button>
    </div>
  );
}

function LostBagLine({
  line,
  onRemove,
  removeLabel
}: {
  line: CartLine;
  onRemove: (line: CartLine) => void;
  removeLabel: string;
}) {
  return (
    <div className="grid grid-cols-[7.2rem_1fr] gap-4 border-b border-[var(--lost-bag-line)] pb-5 last:border-b-0">
      <Link
        className="aspect-square overflow-hidden bg-[var(--lost-bag-soft)]"
        href={`/lostinseoul/products/${line.productSlug}`}
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
          >
            {line.productName}
          </Link>
          <p className="shrink-0 font-mono text-[1.1rem] leading-tight text-[var(--lost-bag-muted)] tabular-nums">
            {formatLostMoney(line.unitAmount * line.quantity, line.currency)}
          </p>
        </div>
        <p className="mt-1 font-mono text-[1.1rem] leading-tight tracking-[0.16em] text-[var(--lost-bag-muted)] uppercase">
          {line.variantLabel ? `${line.variantLabel} / ` : ""}
          {line.mode.replaceAll("_", " ")} / x {line.quantity}
        </p>
        <Button
          className="mt-4 rounded-[4px] border border-[var(--lost-bag-line)] px-3 py-2 text-[1.2rem] leading-none text-[var(--lost-bag-muted)] transition-colors hover:bg-[var(--lost-bag-strong)] hover:text-[var(--lost-bag-strong-ink)]"
          onClick={() => onRemove(line)}
          type="button"
        >
          {removeLabel}
        </Button>
      </div>
    </div>
  );
}

function LostBagTransformStyles() {
  return (
    <style>
      {`
        :root {
          --lost-bag-closing-root-z: ${LOST_BAG_CLOSING_ROOT_Z_INDEX};
          --lost-bag-frame-x: 3.5vw;
          --lost-bag-frame-y: 15svh;
          --lost-bag-frame-width: 62vw;
          --lost-bag-frame-height: 62svh;
          --lost-bag-frame-right: 34.5vw;
          --lost-bag-frame-bottom: 23svh;
          --lost-bag-frame-scale: 0.62;
          --lost-bag-surface-z: ${LOST_BAG_SURFACE_Z_INDEX};
        }
        .lost-commerce-root {
          transform-origin: top left;
        }
        body[data-lost-bag-open="true"] .lost-commerce-root {
          pointer-events: none;
        }
        body[data-lost-bag-state="preopen"] .lost-commerce-root,
        body[data-lost-bag-state="open"] .lost-commerce-root,
        body[data-lost-bag-state="closing"] .lost-commerce-root {
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
        body[data-lost-bag-state="closing"] .lost-commerce-root {
          z-index: var(--lost-bag-closing-root-z);
        }
        body[data-lost-bag-state="preopen"] .lost-commerce-inner,
        body[data-lost-bag-state="open"] .lost-commerce-inner,
        body[data-lost-bag-state="closing"] .lost-commerce-inner {
          position: fixed;
          left: 0;
          right: 0;
          top: calc(var(--lost-bag-scroll-y, 0px) * -1);
          width: 100%;
        }
        @media (max-width: 767px) {
          :root {
            --lost-bag-frame-x: 4vw;
            --lost-bag-frame-y: 17svh;
            --lost-bag-frame-width: 92vw;
            --lost-bag-frame-height: 92svh;
            --lost-bag-frame-right: 4vw;
            --lost-bag-frame-bottom: -9svh;
            --lost-bag-frame-scale: 0.92;
          }
        }
      `}
    </style>
  );
}
