"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useMotionValue, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useDayNNightScene, useDayNNightStore } from "../store";
import { Link } from "@/components/core/Link/Link";
import { TITLE_HERO, KICKER_MONO, LEDE } from "./Act";

// Sticky-window X anchors. Title slides from +22vw (Closing's right
// slot) to -22vw (Opening's left slot) across the window. The sticky
// effect is what keeps the title from continuing past the left anchor
// as scroll proceeds — once the title would naturally be far past
// viewport-left, this overlay holds it at the +22→-22 range instead.
const CLOSING_X = 15; // vw — overlay's anchor offset at sticky start
const OPENING_X = -15; // vw — overlay's anchor offset at sticky end

// Sticky window. The bookend title is pinned at viewport-left only
// during this narrow scroll range:
//
//   STICKY_ACTIVATE  — Closing's title left edge has reached viewport
//                      left. Title pins to fixed left edge.
//   STICKY_RELEASE   — Opening's left edge (the first section's left)
//                      has entered the viewport. Title unpins and
//                      Opening's natural ActSet title takes over.
//
// Outside this window the overlay is HIDDEN and the per-Act bookend
// titles move with the GSAP track as normal scroll content (reveals
// fire, alignment respects their grid placement).
// The bookend overlap zone — primary's Closing title and duplicate's
// Opening title are BOTH partially in viewport across roughly
// progress=0.85 → 1.0 → 0.13. Activate the sticky window across that
// full range so the two natural titles fade together (via
// useStickyZone in Timeline) and the overlay is the only visible
// bookend element through the wrap.
const STICKY_ACTIVATE = 0.85;
const STICKY_RELEASE = 0.13;

/**
 * Returns true during the narrow sticky window. Consumed by Timeline
 * to opacity-toggle the bookend ActSet title blocks so the sticky
 * overlay reads as the single visible element while pinned.
 *
 * Includes a `hasCrossedMidpoint` latch so initial paint at progress=0
 * doesn't trip the opening-side threshold.
 */
export function useStickyZone(): boolean {
  const store = useDayNNightStore();
  const [crossed, setCrossed] = useState(false);
  const inProgressWindow = useDayNNightScene(
    (s) => s.progress >= STICKY_ACTIVATE || s.progress <= STICKY_RELEASE
  );
  useEffect(() => {
    if (store.getState().progress > 0.3 && store.getState().progress < 0.7) {
      setCrossed(true);
      return;
    }
    return store.subscribe((s) => {
      if (s.progress > 0.3 && s.progress < 0.7) setCrossed(true);
    });
  }, [store]);
  return crossed && inProgressWindow;
}

/**
 * Sticky-pin overlay — visible only during the narrow window where
 * Closing's title has reached viewport-left and is "pinned" there
 * until Opening's left edge enters viewport.
 *
 * Outside this window:
 *   - Overlay opacity = 0 (renders nothing visible)
 *   - Per-Act bookend titles in Opening + Closing render normally,
 *     including their reveal cascade
 *
 * Inside this window:
 *   - Per-Act bookend titles opacity-faded to 0 (via useStickyZone in
 *     Timeline)
 *   - Overlay pinned at viewport-left, bottom-anchored to match the
 *     bookend block's natural Y
 *   - Kicker text + supporting copy (lede/CTA) swap from closing →
 *     opening via AnimatePresence as the user crosses the wrap
 */
export function SeamBridge() {
  const t = useTranslations("Event.DayNNight");

  const side = useDayNNightScene((state) => {
    const p = state.progress;
    if (p >= STICKY_ACTIVATE) return "closing";
    if (p <= STICKY_RELEASE) return "opening";
    return null;
  });

  const opacityMV = useMotionValue(0);
  const xVwMV = useMotionValue(CLOSING_X);
  const xTransform = useTransform(xVwMV, (v) => `calc(-50% + ${v}vw)`);

  const store = useDayNNightStore();
  const [ready, setReady] = useState(false);
  const [hasCrossedMidpoint, setHasCrossedMidpoint] = useState(false);

  useEffect(() => {
    seed(store.getState().progress);
    setReady(true);
    return store.subscribe((s) => seed(s.progress));

    function seed(p: number) {
      if (p > 0.3 && p < 0.7) setHasCrossedMidpoint(true);

      // Compute `t` in [0, 1] across the sticky window (with seam wrap).
      //   p = STICKY_ACTIVATE   → t = 0    (Closing right anchor)
      //   p = wrap (1.0 / 0.0)  → t = mid  (centered)
      //   p = STICKY_RELEASE    → t = 1    (Opening left anchor)
      const windowSize = 1 - STICKY_ACTIVATE + STICKY_RELEASE;
      let t: number;
      let opacity: number;
      if (p >= STICKY_ACTIVATE) {
        t = (p - STICKY_ACTIVATE) / windowSize;
        opacity = p > STICKY_ACTIVATE + 0.02 ? 1 : (p - STICKY_ACTIVATE) / 0.02;
      } else if (p <= STICKY_RELEASE) {
        t = (1 - STICKY_ACTIVATE + p) / windowSize;
        opacity = p < STICKY_RELEASE - 0.02 ? 1 : (STICKY_RELEASE - p) / 0.02;
      } else {
        opacityMV.set(0);
        return;
      }
      opacityMV.set(Math.max(0, Math.min(1, opacity)));
      // X morph — right anchor → left anchor across the window.
      xVwMV.set(CLOSING_X + (OPENING_X - CLOSING_X) * t);
    }
  }, [opacityMV, xVwMV, store]);

  if (!ready || !hasCrossedMidpoint || side === null) return null;

  const isClosing = side === "closing";

  // Alignment flips at the wrap moment (when `side` toggles). Closing
  // side renders right-aligned (matches Closing's natural text-right
  // grid placement); Opening side renders left-aligned (matches
  // Opening's natural text-left). The physical X motion-value handles
  // the slide; this just swaps the per-side typography orientation.
  const alignClass = isClosing
    ? "items-end text-right"
    : "items-start text-left";

  return (
    <m.div
      className="pointer-events-none fixed top-1/2 left-1/2 z-[40] max-lg:hidden"
      style={{
        // Top offset isn't used; we lift the overlay to its natural Y
        // via translateY in the style transform composition. The
        // `left: 50%` + `x: calc(-50% + ${vw}vw)` is what drives the
        // right→left slide across the sticky window.
        top: "auto",
        bottom: "clamp(140px, 22vh, 260px)",
        opacity: opacityMV,
        x: xTransform
      }}
    >
      <AnimatePresence mode="popLayout">
        <m.div
          key={side}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.32 }}
          className={`pointer-events-auto flex flex-col gap-7 xl:gap-9 ${alignClass}`}
        >
          <p
            className={`${KICKER_MONO} ${isClosing ? "justify-self-end" : "justify-self-start"}`}
          >
            {isClosing ? t("closing.kicker") : t("opening.kicker")}
          </p>
          <h2 className={TITLE_HERO}>{t("title")}</h2>
          {isClosing ? (
            <Link
              href="/tickets/day-n-night"
              className="ease mt-3 inline-flex cursor-pointer items-baseline gap-[18px] border-0 border-b border-[var(--dn-fg)] bg-transparent py-[18px] pb-4 font-mono text-[13px] tracking-[0.32em] text-[var(--dn-fg)] uppercase no-underline transition-[gap,padding] duration-300 hover:gap-7 hover:pr-3 md:text-sm"
            >
              <span>{t("rsvpCta.primary")}</span>
              <span aria-hidden className="text-[1.2em] leading-none">
                →
              </span>
            </Link>
          ) : (
            <p className={`${LEDE} max-w-[38ch]`}>{t("opening.lede")}</p>
          )}
        </m.div>
      </AnimatePresence>
    </m.div>
  );
}
