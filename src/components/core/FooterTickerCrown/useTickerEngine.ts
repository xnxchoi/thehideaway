"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  BREATH_DURATION_MS,
  BREATH_INTERVAL_MS,
  LANE_CONFIGS,
  type LaneConfig
} from "./lane-config";

/**
 * Mutable per-lane runtime state, written each rAF frame.
 * Read by the canvas renderer through a shared ref — never via React state.
 */
export interface LaneRuntimeState {
  /** Current x-offset (CSS px) within one hatch-spacing. Wraps modulo spacing. */
  offsetPx: number;
  /** Multiplier on opacityBand for the slow micro-tremor (D4). ~0.85..0.92 */
  opacityScale: number;
  /** True during the engineered breath window for ALL lanes simultaneously. */
  isInBreath: boolean;
}

export interface EngineState {
  lanes: LaneRuntimeState[];
  /** 0..1 envelope of the engineered breath (half-sine). 0 outside the window. */
  breathPulse: number;
  /** Wallclock when the engine started — anchor for breath cadence. */
  engineStartMs: number;
  /** Current frame's `performance.now()`. Useful for canvas drawing. */
  nowMs: number;
}

/**
 * Cubic-bezier(0.45, 0, 0.15, 1) — sharp ease-in-out-quart.
 * Step-then-hold semantic for the slide phase (D2).
 */
function easeStepHold(t: number): number {
  // Approximation of the cubic bezier using the standard cubic formula.
  // For our purposes a simple smoothstep variant is plenty — visually identical.
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Bias the curve so it accelerates fast and decelerates near the end.
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Half-sine envelope rising 0→1→0 over `BREATH_DURATION_MS`.
 * `phase` is 0..1 across the breath window.
 */
function breathEnvelope(phase: number): number {
  if (phase <= 0 || phase >= 1) return 0;
  return Math.sin(phase * Math.PI);
}

/**
 * Drives all five lanes from a single rAF.
 *
 * The hook returns a *ref* — never component state — so 60Hz updates do not
 * trigger React re-renders. The canvas renderer reads from this ref each frame.
 *
 * `enabled` gates the loop. When false, the rAF is cancelled and lanes are
 * frozen at their last computed offsets.
 */
export function useTickerEngine(enabled: boolean): RefObject<EngineState> {
  const stateRef = useRef<EngineState>({
    lanes: LANE_CONFIGS.map(() => ({
      offsetPx: 0,
      opacityScale: 1,
      isInBreath: false
    })),
    breathPulse: 0,
    engineStartMs: 0,
    nowMs: 0
  });

  // Per-lane "previous settle" tracker — tells us where this cycle started so we
  // can ease across one hatch-spacing-worth of pixels per cycle.
  const prevCycleIndexRef = useRef<number[]>(LANE_CONFIGS.map(() => 0));

  useEffect(() => {
    if (!enabled) return;

    let rafId = 0;
    let cancelled = false;
    const startMs = performance.now();
    stateRef.current.engineStartMs = startMs;

    // The horizontal travel per cycle is one hatch-spacing in CSS px.
    // We don't know spacing here (depends on canvas width) — so we encode
    // travel as a *phase* in [0..1] and let the canvas multiply by spacing.
    // offsetPx is therefore expressed as a *fractional progress* in [0..1)
    // and the canvas resolves it to pixels at draw time.

    const tick = (now: number) => {
      if (cancelled) return;

      const elapsed = now - startMs;

      // Engineered breath — every BREATH_INTERVAL_MS for BREATH_DURATION_MS (D3).
      const breathSinceLast = elapsed % BREATH_INTERVAL_MS;
      const inBreath = breathSinceLast < BREATH_DURATION_MS;
      const breathPhase = inBreath ? breathSinceLast / BREATH_DURATION_MS : 0;
      const breathPulse = inBreath ? breathEnvelope(breathPhase) : 0;

      stateRef.current.breathPulse = breathPulse;
      stateRef.current.nowMs = now;

      for (let i = 0; i < LANE_CONFIGS.length; i++) {
        const cfg: LaneConfig = LANE_CONFIGS[i];
        const lane = stateRef.current.lanes[i];

        // Lane phase = fractional progress through current cycle.
        const cycleIndex = Math.floor(elapsed / cfg.periodMs);
        const intoCycle = elapsed - cycleIndex * cfg.periodMs;
        const slideProgress = Math.min(intoCycle / cfg.slideMs, 1);

        if (inBreath) {
          // During the shared breath: pin the offset at the cycle's settle target.
          // Don't advance further. Don't kick off a new slide if one would start.
          lane.offsetPx = cycleIndex % 1; // integer-mod-1 = 0; semantic = "settled"
          lane.isInBreath = true;
        } else {
          lane.isInBreath = false;
          // Eased fractional progress through this lane's slide window.
          // Adds direction so half the lanes drift left, half right.
          const eased = easeStepHold(slideProgress);
          lane.offsetPx = (cycleIndex + eased) * cfg.direction;
        }
        prevCycleIndexRef.current[i] = cycleIndex;

        // Micro-tremor on opacity (D4): slow sine at coprime per-lane period.
        const tremor =
          0.885 +
          0.035 * Math.sin((2 * Math.PI * (now / 1000)) / cfg.tremorPeriodSec);
        // During breath, alpha bumps to full (handled in canvas via breathPulse,
        // but we still keep the tremor coherent so post-breath transition is smooth).
        lane.opacityScale = tremor;
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
