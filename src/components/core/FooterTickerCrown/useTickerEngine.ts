"use client";

import { useEffect, useRef, type RefObject } from "react";
import { LANE_CONFIGS, type LaneConfig } from "./lane-config";

/**
 * Per-lane runtime state, written each rAF frame. Read by the canvas through
 * a shared ref — never via React state.
 */
export interface LaneRuntimeState {
  /**
   * Accumulated travel offset, expressed as a *fraction of hatch-spacing*.
   * Grows monotonically across cycles; the canvas wraps it modulo spacing.
   * Signed by lane direction.
   */
  offsetFraction: number;
  /** Multiplier on opacityBand for the slow micro-tremor. ~0.85..0.92 */
  opacityScale: number;
}

export interface EngineState {
  lanes: LaneRuntimeState[];
  /** Current frame's `performance.now()`. */
  nowMs: number;
}

/**
 * easeInOutSine — perfectly smooth, no jerks at start/end. The right curve
 * for "tape gliding to rest" — visually identical to cubic-bezier(0.45, 0, 0.55, 1).
 */
function easeInOutSine(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 0.5 * (1 - Math.cos(Math.PI * t));
}

/**
 * Drives all five lanes from a single rAF.
 *
 * Motion model: each lane accumulates fractional travel `(cycleIndex + eased) *
 * travelPerCycle * direction`. Eased ramps 0→1 over `slideMs`, then holds at 1
 * until the next cycle starts. The result is continuous: at the cycle boundary
 * `(cycleIndex+1, eased=0)` equals `(cycleIndex, eased=1)`, so motion never
 * jumps. During the long pause (periodMs - slideMs), eased stays at 1 and the
 * lane sits perfectly still. No engineered alignment. No breath.
 */
export function useTickerEngine(enabled: boolean): RefObject<EngineState> {
  const stateRef = useRef<EngineState>({
    lanes: LANE_CONFIGS.map(() => ({
      offsetFraction: 0,
      opacityScale: 1
    })),
    nowMs: 0
  });

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;
    let cancelled = false;
    const startMs = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;

      const elapsed = now - startMs;
      stateRef.current.nowMs = now;

      for (let i = 0; i < LANE_CONFIGS.length; i++) {
        const cfg: LaneConfig = LANE_CONFIGS[i];
        const lane = stateRef.current.lanes[i];

        const cycleIndex = Math.floor(elapsed / cfg.periodMs);
        const intoCycle = elapsed - cycleIndex * cfg.periodMs;
        const slideProgress = Math.min(intoCycle / cfg.slideMs, 1);
        const eased = easeInOutSine(slideProgress);

        // Continuous accumulation: at cycle boundary cycleIndex jumps by 1
        // and eased resets from 1 to 0, so the sum (cycleIndex + eased) is
        // continuous. Multiplying by travelPerCycle gives sub-hatch travel
        // per cycle, which the canvas wraps via modulo.
        lane.offsetFraction =
          (cycleIndex + eased) * cfg.travelPerCycle * cfg.direction;

        // Slow micro-tremor on opacity — keeps the system from reading frozen
        // during the long pause without ever being noticed as motion.
        lane.opacityScale =
          0.885 +
          0.035 * Math.sin((2 * Math.PI * (now / 1000)) / cfg.tremorPeriodSec);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  return stateRef;
}
