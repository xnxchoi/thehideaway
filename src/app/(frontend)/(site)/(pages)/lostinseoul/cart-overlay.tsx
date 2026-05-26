"use client";

import { ShoppingBagIcon, XIcon } from "@phosphor-icons/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { getLostLenis, getLostScrollY } from "@/lib/lenis/runtime";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import { cn } from "@/lib/utils";
import { useLostCart } from "@/lib/lost-commerce/useLostCart";
import { LostCurrency } from "@/lib/lost-commerce/types";

type Props = {
  cartLabel: string;
  backLabel: string;
  emptyLabel: string;
  checkoutLabel: string;
  removeLabel: string;
  totalLabel: string;
};

type CartLine = ReturnType<typeof useLostCart>["lines"][number];

const CLOSE_MS = 760;
const REVEAL_MS = 680;

export function LostCartOverlay({
  backLabel,
  cartLabel,
  checkoutLabel,
  emptyLabel,
  removeLabel,
  totalLabel
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null
  );
  const openFrameRef = useRef<number | null>(null);
  const openTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(
    null
  );
  const previousOverflowRef = useRef<string | null>(null);
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
    openFrameRef,
    openTimerRef,
    stoppedLenisRef
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const closeBag = () => setOpen(false);
  const overlay = open ? (
    <LostBagSurface
      backLabel={backLabel}
      cartLabel={cartLabel}
      checkoutLabel={checkoutLabel}
      count={count}
      currency={currency}
      emptyLabel={emptyLabel}
      lines={lines}
      onClose={closeBag}
      onRemove={remove}
      open={open}
      removeLabel={removeLabel}
      total={total}
      totalLabel={totalLabel}
    />
  ) : null;

  return (
    <>
      <LostBagTransformStyles />
      <LostBagOpenButton
        cartLabel={cartLabel}
        count={count}
        onOpen={() => setOpen(true)}
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
  openFrameRef: RefObject<number | null>,
  openTimerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  stoppedLenisRef: RefObject<boolean>
) {
  useEffect(() => {
    if (!mounted) return;

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
      if (
        document.body.dataset.lostBagState === "open" ||
        document.body.dataset.lostBagState === "preopen"
      ) {
        document.body.dataset.lostBagState = "closing";
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
          document.body.dataset.lostBagState = "idle";
          document.documentElement.style.removeProperty("--lost-bag-scroll-y");
          document.documentElement.style.overflow =
            previousOverflowRef.current ?? "";
          previousOverflowRef.current = null;
          if (stoppedLenisRef.current) {
            getLostLenis()?.start();
            stoppedLenisRef.current = false;
          }
        }, CLOSE_MS);
      }
      return;
    }

    clearCloseTimer();
    if (previousOverflowRef.current === null) {
      previousOverflowRef.current = document.documentElement.style.overflow;
    }
    if (!stoppedLenisRef.current) {
      getLostLenis()?.stop();
      stoppedLenisRef.current = true;
    }
    document.documentElement.style.setProperty(
      "--lost-bag-scroll-y",
      `${getLostScrollY()}px`
    );
    document.documentElement.style.overflow = "hidden";
    document.body.dataset.lostBagOpen = "true";
    document.body.dataset.lostBagState = "preopen";
    document.querySelector(".lost-commerce-root")?.getBoundingClientRect();

    const startOpenTransform = () => {
      if (document.body.dataset.lostBagState !== "preopen") return;
      document.body.dataset.lostBagState = "open";
      document.querySelector(".lost-commerce-root")?.getBoundingClientRect();
      clearOpenStart();
    };

    openFrameRef.current = requestAnimationFrame(() => {
      openFrameRef.current = requestAnimationFrame(startOpenTransform);
    });
    openTimerRef.current = setTimeout(() => {
      startOpenTransform();
      openTimerRef.current = null;
    }, 80);

    return undefined;
  }, [
    closeTimerRef,
    mounted,
    open,
    openFrameRef,
    openTimerRef,
    previousOverflowRef,
    stoppedLenisRef
  ]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (openFrameRef.current !== null)
        window.cancelAnimationFrame(openFrameRef.current);
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      document.body.dataset.lostBagOpen = "false";
      document.body.dataset.lostBagState = "idle";
      document.documentElement.style.removeProperty("--lost-bag-scroll-y");
      document.documentElement.style.overflow =
        previousOverflowRef.current ?? "";
      if (stoppedLenisRef.current) {
        getLostLenis()?.start();
        stoppedLenisRef.current = false;
      }
    };
  }, [
    closeTimerRef,
    openFrameRef,
    openTimerRef,
    previousOverflowRef,
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
  return (
    <article
      aria-hidden={!open}
      data-open={open ? "true" : "false"}
      className={cn(
        "lost-bag-surface fixed inset-0 z-[1200] grid grid-rows-[11.5rem_calc(100svh_-_17.1rem)_5.6rem] gap-5 overflow-hidden px-4 text-[var(--lost-bag-ink)] [--lost-bag-bg:#080806] [--lost-bag-fg:#e7e7e3] [--lost-bag-ink:#e7e7e3] [--lost-bag-line:rgba(231,231,227,0.15)] [--lost-bag-muted:rgba(231,231,227,0.62)] [--lost-bag-soft:rgba(231,231,227,0.08)] [--lost-bag-strong-ink:#080806] [--lost-bag-strong:#f2f1ea] lg:grid-cols-12 lg:grid-rows-[18.9rem_auto_7rem] lg:px-28",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {open ? <LostBagBackdrop /> : null}
      <LostBagHeader
        backLabel={backLabel}
        cartLabel={cartLabel}
        count={count}
        onClose={onClose}
      />
      <LostBagAperture onClose={onClose} />
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
      <p className="relative z-10 hidden self-center justify-self-center overflow-hidden text-[1.2rem] leading-none text-[var(--lost-bag-muted)] lg:block">
        {totalLabel} {formatLostMoney(total, currency)}
      </p>
    </article>
  );
}

function LostBagBackdrop() {
  const transition = {
    duration: REVEAL_MS / 1000,
    ease: [0.6, 0, 0.3, 1]
  } as const;

  return (
    <>
      <m.div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[15svh]"
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        style={{ backgroundColor: "var(--lost-bag-bg)" }}
        transition={transition}
      />
      <m.div
        aria-hidden
        className="absolute inset-x-0 top-[80svh] bottom-0"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        style={{ backgroundColor: "var(--lost-bag-bg)" }}
        transition={transition}
      />
      <m.div
        aria-hidden
        className="absolute top-[15svh] bottom-[20svh] left-0 w-[3.5vw]"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        style={{ backgroundColor: "var(--lost-bag-bg)" }}
        transition={transition}
      />
      <m.div
        aria-hidden
        className="absolute top-[15svh] right-0 bottom-[20svh] w-[33vw]"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        style={{ backgroundColor: "var(--lost-bag-bg)" }}
        transition={transition}
      />
    </>
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
  return (
    <header className="relative z-10 col-span-full row-start-1 flex h-28 items-center justify-between pt-6 lg:h-32 lg:pt-16">
      <Link aria-label="LOSTINSEOUL home" href="/lostinseoul" onClick={onClose}>
        <span className="font-mono text-[1.6rem] leading-none font-bold tracking-[0.24em] uppercase lg:text-[2rem]">
          LOSTINSEOUL
        </span>
      </Link>
      <p className="hidden font-mono text-[1.4rem] leading-none font-bold tracking-[0.18em] uppercase lg:block">
        {cartLabel} [{count.toString().padStart(2, "0")}]
      </p>
      <Button
        className="inline-flex min-h-16 items-center gap-2 rounded-[4px] bg-[var(--lost-bag-strong)] px-4 text-[1.2rem] leading-none font-medium text-[var(--lost-bag-strong-ink)]"
        onClick={onClose}
        type="button"
      >
        <XIcon aria-hidden className="size-6" weight="regular" />
        {backLabel}
      </Button>
    </header>
  );
}

function LostBagAperture({ onClose }: { onClose: () => void }) {
  return (
    <section
      aria-label="cart preview"
      className="relative z-10 hidden grid-rows-[1.5rem_1fr] gap-10 self-end overflow-hidden lg:col-span-8 lg:row-start-2 lg:grid lg:h-full"
    >
      <div
        aria-hidden
        className="h-[1.5rem] border-x border-t border-[var(--lost-bag-line)]"
      />
      <Button
        aria-label="Close cart preview"
        className="cursor-pointer rounded-[4px] border border-[var(--lost-bag-line)] bg-transparent"
        data-lost-bag-aperture
        onClick={onClose}
        type="button"
      />
    </section>
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
      animate={{ opacity: 1, x: 0 }}
      className="relative z-10 col-span-full row-start-2 grid gap-8 self-end lg:col-span-4 lg:col-start-9 lg:h-[calc(var(--lost-bag-panel-scale,64rem)_+_5.5rem)] lg:gap-10 lg:pl-28"
      data-lost-bag-panel
      initial={{ opacity: 0, x: "2.4rem" }}
      transition={{ delay: 0.26, duration: 0.5, ease: [0.6, 0, 0.3, 1] }}
    >
      <div
        aria-hidden
        className="h-[1.5rem] border-x border-t border-[var(--lost-bag-line)]"
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
                  key={`${line.productId}:${line.mode}:${line.campaignId ?? ""}`}
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
          <img
            alt={line.productName}
            className="h-full w-full object-cover grayscale"
            src={line.imageUrl}
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
        .lost-commerce-root {
          filter: brightness(1) contrast(1);
          transform: translate3d(0, 0, 0) scale(1);
          transform-origin: top left;
          transition: transform ${CLOSE_MS}ms cubic-bezier(0.6, 0, 0.3, 1), filter ${CLOSE_MS}ms cubic-bezier(0.6, 0, 0.3, 1);
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
          top: calc(var(--lost-bag-scroll-y, 0px) * -1);
          width: 100vw;
          min-height: 100svh;
          overflow: hidden;
          will-change: transform, filter;
        }
        body[data-lost-bag-state="open"] .lost-commerce-root {
          transform: translate3d(3.5vw, 15svh, 0) scale(0.62);
          filter: brightness(0.8) contrast(1.08);
        }
        body[data-lost-bag-state="preopen"] .lost-commerce-root,
        body[data-lost-bag-state="closing"] .lost-commerce-root {
          transform: translate3d(0, 0, 0) scale(1);
          filter: none;
        }
        @media (max-width: 767px) {
          body[data-lost-bag-state="open"] .lost-commerce-root {
            transform: translate3d(4vw, 17svh, 0) scale(0.92);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          body[data-lost-bag-state="open"] .lost-commerce-root,
          body[data-lost-bag-state="closing"] .lost-commerce-root {
            transition: none;
          }
        }
      `}
    </style>
  );
}
