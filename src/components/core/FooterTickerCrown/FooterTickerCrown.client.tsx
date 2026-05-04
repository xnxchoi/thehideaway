"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as m from "motion/react-m";
import { useInView, useReducedMotion } from "motion/react";
import {
  LANE_CONFIGS,
  REVEAL_DURATION_MS,
  REVEAL_HOLD_BEFORE_DRIFT_MS,
  REVEAL_STAGGER_MS,
  ROW_GAP_PX,
  SEED_LANE_ID,
  computeLaneTops,
  computeStackHeightPx
} from "./lane-config";
import { TickerCanvas } from "./TickerCanvas";
import { useTickerEngine } from "./useTickerEngine";
import { RougeAccent, type RougeAccentVariant } from "./RougeAccent";

interface FooterTickerCrownClientProps {
  /**
   * Which rouge accent placement to use. Default "triangle". Swap props in the
   * server shell to A/B without touching internals.
   */
  rougeVariant?: RougeAccentVariant;
}

/**
 * Footer ticker-crown band — sits between page content and `<LegalFooter />`.
 *
 * Reveal model: a 1px seed line ships in the SSR markup at the band's vertical
 * center. On `useInView`, two things happen in lockstep over ~720ms:
 *   1. The seed line fades out.
 *   2. The canvas wrapper's `clip-path: inset()` opens from a center-thin
 *      slit to full height (ease-out-expo). This produces a true center-out
 *      fan: lanes near the center become visible first, outer lanes last.
 * After a 120ms hold, the engine starts driving drift.
 *
 * Reduced motion: the canvas mounts at full clip immediately, engine never
 * starts, lanes appear at their phase-0 positions. Static figure, never blank.
 */
export function FooterTickerCrownClient({
  rougeVariant = "triangle"
}: FooterTickerCrownClientProps) {
  const wrapperRef = useRef<HTMLElement>(null);
  const inView = useInView(wrapperRef, { amount: 0.25, once: true });
  const reduced = useReducedMotion();

  const [revealed, setRevealed] = useState<boolean>(false);
  const [driftEnabled, setDriftEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (reduced) {
      setRevealed(true);
      setDriftEnabled(false);
      return;
    }
    if (!inView) return;

    setRevealed(true);

    // Distance-from-center used in the clip's effective easing; longest reveal
    // path is the outermost lane (distance = 2 from center).
    const maxStaggerOffset = 2 * REVEAL_STAGGER_MS;
    const startDriftAfterMs =
      REVEAL_DURATION_MS + maxStaggerOffset + REVEAL_HOLD_BEFORE_DRIFT_MS;
    const t = setTimeout(() => setDriftEnabled(true), startDriftAfterMs);
    return () => clearTimeout(t);
  }, [inView, reduced]);

  const engineRef = useTickerEngine(driftEnabled);

  const stackHeightPx = useMemo(
    () => computeStackHeightPx(LANE_CONFIGS, ROW_GAP_PX),
    []
  );
  const laneTops = useMemo(() => computeLaneTops(LANE_CONFIGS, ROW_GAP_PX), []);

  const seedLaneCfg = LANE_CONFIGS[SEED_LANE_ID];
  const seedLaneTop = laneTops[SEED_LANE_ID];
  const seedLaneCenterPx = seedLaneTop + seedLaneCfg.heightPx / 2;

  // Total reveal time including the longest stagger path.
  const totalRevealSec = (REVEAL_DURATION_MS + 2 * REVEAL_STAGGER_MS) / 1000;

  // Initial clip = a 1px-tall band at the seed line's vertical center.
  // Final clip = inset(0 0 0 0) — fully open.
  const initialClipTop = seedLaneCenterPx - 0.5;
  const initialClipBottom = stackHeightPx - (seedLaneCenterPx + 0.5);

  return (
    <section
      ref={wrapperRef}
      role="presentation"
      aria-hidden
      className="relative z-10 mt-32 w-full overflow-hidden bg-background pt-12 pb-10 xl:pt-16 xl:pb-12"
    >
      <div className="relative mx-auto max-w-7xl px-6 xl:px-10">
        <div className="relative" style={{ height: stackHeightPx }}>
          {/* Seed line — visible from page paint, fades out as the canvas reveals. */}
          <m.div
            aria-hidden
            initial={{ opacity: 1 }}
            animate={{ opacity: revealed ? 0 : 1 }}
            transition={{
              duration: REVEAL_DURATION_MS / 1000,
              ease: "linear"
            }}
            className="bg-border/30"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: seedLaneCenterPx - 0.5,
              height: 1
            }}
          />

          {/* Canvas wrapper — clip-path opens from center. The canvas itself
              fills the whole stack and is painted by one rAF in TickerCanvas. */}
          <m.div
            initial={{
              clipPath: `inset(${initialClipTop}px 0px ${initialClipBottom}px 0px)`,
              opacity: 0
            }}
            animate={
              revealed
                ? {
                    clipPath: "inset(0px 0px 0px 0px)",
                    opacity: 1
                  }
                : {
                    clipPath: `inset(${initialClipTop}px 0px ${initialClipBottom}px 0px)`,
                    opacity: 0
                  }
            }
            transition={{
              clipPath: {
                duration: totalRevealSec,
                ease: [0.16, 1, 0.3, 1]
              },
              opacity: {
                duration: totalRevealSec * 0.7,
                ease: "easeOut"
              }
            }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none"
            }}
          >
            <TickerCanvas engineRef={engineRef} frozen={!driftEnabled} />
          </m.div>

          {/* The single rouge focal accent. */}
          <RougeAccent
            variant={rougeVariant}
            seedLaneCenterPx={seedLaneCenterPx}
            engineRef={engineRef}
            revealed={revealed}
          />
        </div>
      </div>
    </section>
  );
}
