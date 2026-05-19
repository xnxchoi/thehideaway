"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  useDayNNightScene,
  SECTION_KEYS,
  sectionAtLoop,
  type SectionKey
} from "../store";

/**
 * Bottom timeline scrubber.
 *
 * Construction (after the compsych methodology, not its design):
 *
 *   - A continuous fine sub-tick row across the full width (1px ticks
 *     every 9px) at low alpha — the "body".
 *   - Five tall section-start ticks at each act's measured START
 *     position sit on top of the row at higher alpha — the "head". The
 *     eye finds section boundaries without reading the labels.
 *   - One short solid indicator bar floats above the ticks, anchored to
 *     the current loop position (continuous slide, not snap).
 *   - Labels sit BELOW the ticks at each act's measured CENTER position.
 *     Active label is full color; surrounding labels fade by ring
 *     distance from the active one, clamped at a legibility floor.
 *
 * Positions come from the live-measured ActLayout in the scene store —
 * Timeline writes it on mount and on resize. With variable-width acts,
 * head ticks and labels naturally bunch / spread per the editorial
 * pacing declared in SCSS (--act-w on .actOpening / .actCookout / ...).
 */

// Opacity ramp by ring distance from the active label, in label slots:
//   0 (active)         → 1.0
//   1 (adjacent)       → 0.55
//   2 (two away)       → 0.32
//   ≥3 (max wraps to 2 in a 5-section loop, so this is the floor)
//                      → 0.22 — legibility clamp
const RING_OPACITY = [1.0, 0.55, 0.32, 0.22] as const;

function ringDistance(i: number, active: number, length: number): number {
  const d = Math.abs(i - active);
  // Loop wraps — shortest path around the ring is min(d, length - d).
  return Math.min(d, length - d);
}

export function Scrubber() {
  const t = useTranslations("Event.DayNNight.scrubber");
  const phase = useDayNNightScene((r) => r.phase);
  // Subscribing to `layout` re-renders the Scrubber when Timeline writes
  // a fresh measurement — so the head-tick / label CSS `left:` props
  // recompute on resize without manual ResizeObservers here.
  const progress = useDayNNightScene((r) => r.progress);
  const layout = useDayNNightScene((r) => r.layout);

  const initialLoopPosition = useDayNNightScene((r) => r.initialLoopPosition);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Array<HTMLButtonElement | null>>(
    SECTION_KEYS.map(() => null)
  );

  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let lastActive = -1;

    const apply = () => {
      // scene-progress IS loopProgress now — see store.ts JSDoc.
      const loopProgress = Math.max(0, Math.min(0.99999, progress));

      // Active section: which act contains the viewport center (mod 1).
      // sectionAtLoop falls back to 0 when layout isn't measured yet —
      // the initial paint before Timeline writes layout to the store.
      const currentSection = sectionAtLoop(loopProgress, layout);

      if (indicatorRef.current && trackRef.current) {
        const trackWidth = trackRef.current.clientWidth;
        const x = loopProgress * trackWidth;
        indicatorRef.current.style.transform = `translateX(${x}px)`;
      }

      // Re-apply label opacity only when the active section changes —
      // per-frame mutation would defeat the CSS transition on opacity.
      if (currentSection !== lastActive) {
        lastActive = currentSection;
        labelRefs.current.forEach((label, i) => {
          if (!label) return;
          const dist = ringDistance(i, currentSection, SECTION_KEYS.length);
          const clamped = Math.min(dist, RING_OPACITY.length - 1);
          label.style.opacity = String(RING_OPACITY[clamped]);
          label.setAttribute("data-active", String(i === currentSection));
        });
      }

      raf = requestAnimationFrame(apply);
    };

    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Section-start positions, as fractions of the scrubber-track width.
  // Both head ticks AND labels anchor to these same starts: labels
  // left-align at their section's head tick directly below them (the
  // compsych pattern), so each section reads as a horizontal band
  // anchored at its boundary. Falls back to uniform spacing if the
  // store hasn't been hydrated yet (pre-measurement SSR / first paint).
  const fallbackStarts = SECTION_KEYS.map((_, i) => i / SECTION_KEYS.length);
  const headPositions = layout?.startsFrac ?? fallbackStarts;
  const labelPositions = headPositions;

  const handleJump = (targetLoopPos: number): void => {
    const wrap = document.querySelector("[data-dn-wrap]");
    const trackEl = document.querySelector("[data-dn-track]");
    if (!wrap || !trackEl) return;
    const wrapRect = wrap.getBoundingClientRect();
    const pinStart = window.scrollY + wrapRect.top;
    const setWidth =
      layout?.setWidth ?? (trackEl as HTMLElement).scrollWidth / 2;
    const totalScrolled = window.scrollY - pinStart;
    if (totalScrolled < 0) {
      window.scrollTo({
        top: pinStart + (targetLoopPos - initialLoopPosition) * setWidth,
        behavior: "smooth"
      });
      return;
    }
    const currentLoopPos =
      (initialLoopPosition * setWidth + totalScrolled) % setWidth;
    const targetPx = targetLoopPos * setWidth;
    const delta = (targetPx - currentLoopPos + setWidth) % setWidth;
    // If the target is the current section, advance a full loop so the
    // click still moves — keeps the forward-only rule.
    const forwardDelta = delta < 1 ? setWidth : delta;
    window.scrollTo({
      top: window.scrollY + forwardDelta,
      behavior: "smooth"
    });
  };

  if (phase !== "playing") return null;

  return (
    <nav
      className="pointer-events-none fixed right-0 bottom-7 left-0 z-[45] px-14 max-lg:hidden xl:bottom-9 xl:px-20 2xl:px-28"
      aria-label={t("navLabel")}
    >
      <div
        ref={trackRef}
        data-dn-scrubber-track
        className="relative h-[22px]"
        aria-hidden
      >
        {/* Section-start tall ticks — one per act, at each act's measured
            START position. With variable widths, ticks bunch / spread to
            reflect editorial pacing. */}
        {SECTION_KEYS.map((key, i) => (
          <span
            key={`head-${key}`}
            className="pointer-events-none absolute top-0 h-[22px] w-px -translate-x-[0.5px] bg-[color-mix(in_srgb,var(--dn-fg)_60%,transparent)]"
            style={{ left: `${headPositions[i] * 100}%` }}
            aria-hidden
          />
        ))}
        <div
          ref={indicatorRef}
          className="absolute top-0 left-0 -ml-7 h-1.5 w-14 bg-[var(--dn-fg)] will-change-transform"
          aria-hidden
        />
      </div>
      <div className="pointer-events-auto relative mt-[14px] h-[18px]">
        {SECTION_KEYS.map((key: SectionKey, i) => (
          <button
            key={key}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            type="button"
            className="ease absolute top-0 translate-x-0 cursor-pointer appearance-none border-0 bg-transparent py-0.5 pr-1.5 pl-0 text-left font-sans text-[13px] font-normal tracking-[0.005em] whitespace-nowrap text-[var(--dn-fg)] transition-[opacity,font-weight] duration-[320ms] hover:!opacity-100 data-[active=true]:font-semibold"
            style={{ left: `${labelPositions[i] * 100}%` }}
            onClick={() => handleJump(headPositions[i])}
          >
            {t(key)}
          </button>
        ))}
      </div>
    </nav>
  );
}
