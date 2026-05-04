"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject
} from "react";
import * as m from "motion/react-m";
import type { EngineState } from "./useTickerEngine";

/**
 * The single rouge focal accent — the "crown tooth" / surgical mark in an
 * otherwise monochrome composition. Variants exist so we can A/B different
 * placements without rewriting the host component.
 *
 * - "triangle":   Static 3×6 px filled triangle in the left gutter, vertically
 *                 aligned to the seed/center lane. Reads as "instrument index."
 *                 (Primary recommendation.)
 *
 * - "gutter-pip": Tiny 4×4 px filled circle in the left gutter, same anchor.
 *                 More discreet than the triangle. Reads less UI-cursor-ish.
 *
 * - "lane-pip":   Single static 1.5×6 px rouge tick on the seed lane (no canvas
 *                 hatch beneath it). Pulses to full opacity briefly during the
 *                 engineered breath. Reads as a planted survey marker among
 *                 drifting hatches.
 *
 * - "none":       Renders nothing — useful for the "is the rouge even needed?"
 *                 evaluation pass.
 */
export type RougeAccentVariant =
  | "triangle"
  | "gutter-pip"
  | "lane-pip"
  | "none";

export interface RougeAccentProps {
  variant: RougeAccentVariant;
  /** Top in px of the seed lane center within the host's relative wrapper. */
  seedLaneCenterPx: number;
  /** Engine ref — only consumed by variants that pulse on breath (lane-pip). */
  engineRef: RefObject<EngineState>;
  /** True when the host has revealed; controls the accent's own fade-in. */
  revealed: boolean;
}

const ROUGE_VAR = "var(--rouge-500)";

export function RougeAccent({
  variant,
  seedLaneCenterPx,
  engineRef,
  revealed
}: RougeAccentProps) {
  if (variant === "none") return null;

  if (variant === "triangle") {
    return (
      <Wrapper revealed={revealed}>
        <svg
          aria-hidden
          viewBox="0 0 3 6"
          style={{
            position: "absolute",
            left: 24,
            top: seedLaneCenterPx - 3,
            width: 3,
            height: 6,
            color: ROUGE_VAR
          }}
        >
          <path d="M 0 0 L 3 3 L 0 6 Z" fill="currentColor" />
        </svg>
      </Wrapper>
    );
  }

  if (variant === "gutter-pip") {
    return (
      <Wrapper revealed={revealed}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 24,
            top: seedLaneCenterPx - 2,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: ROUGE_VAR
          }}
        />
      </Wrapper>
    );
  }

  // lane-pip — pulses with the engineered breath.
  return (
    <LanePip
      seedLaneCenterPx={seedLaneCenterPx}
      engineRef={engineRef}
      revealed={revealed}
    />
  );
}

/**
 * Shared fade-in wrapper. The accent appears in lockstep with the seed line.
 */
function Wrapper({
  revealed,
  children
}: {
  revealed: boolean;
  children: ReactNode;
}) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {children}
    </m.div>
  );
}

/**
 * Lane-pip variant — a single static rouge tick on the seed lane row, sitting
 * quietly at low opacity. No breath-pulse anymore (engineered breath removed).
 */
function LanePip({
  seedLaneCenterPx,
  engineRef: _engineRef,
  revealed
}: {
  seedLaneCenterPx: number;
  engineRef: RefObject<EngineState>;
  revealed: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!revealed) return;
    let raf = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      // No animation — static at 0.7 once revealed. rAF retained for future
      // hooks (slow opacity breathing tied to a per-pip oscillator if wanted).
      const el = ref.current;
      if (el) el.style.opacity = "0.7";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [engineRef, revealed]);

  // Position approximates a "single static rouge hatch" at ~25% from the left
  // of the lane row. Vertical sizing uses the seed lane's height implicitly via
  // its center position — the pip is always 6px tall.
  const offsetLeftPct = 25;

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: revealed ? 0.55 : 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <span
        ref={ref}
        aria-hidden
        style={
          {
            position: "absolute",
            left: `${offsetLeftPct}%`,
            top: seedLaneCenterPx - 3,
            width: 1.5,
            height: 6,
            background: ROUGE_VAR,
            opacity: 0.55
          } as CSSProperties
        }
      />
    </m.div>
  );
}
