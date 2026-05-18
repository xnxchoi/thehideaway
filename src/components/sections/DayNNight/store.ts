"use client";

import { create } from "zustand";

/**
 * Day n Night — page-local scene store.
 *
 * Shared between the HTML content (horizontal-scroll timeline) and the R3F
 * scene (sky + sun + moon). All time-of-day visuals are driven by a single
 * `progress` value in [0, 1] that maps to the story arc:
 *
 *   0.00 — pre-dawn (loader resting state)
 *   0.05 — sun at horizon (loader → scene handoff)
 *   0.25 — morning
 *   0.50 — golden hour
 *   0.70 — sunset (sun dips below)
 *   0.85 — twilight (moon rises)
 *   1.00 — full night
 *
 * The loader writes 0 → 0.05; the scroll-driven timeline writes 0.05 → 1.0.
 */

type Phase = "loading" | "loaded" | "playing";

interface SceneStore {
  progress: number;
  phase: Phase;
  setProgress: (p: number) => void;
  setPhase: (p: Phase) => void;
}

export const useDayNNightScene = create<SceneStore>((set) => ({
  progress: 0,
  phase: "loading",
  setProgress: (progress) => set({ progress }),
  setPhase: (phase) => set({ phase })
}));

/**
 * Sample the sky palette at a given progress. Returns OKLCH-ish RGB tuples in
 * [0,1] space (linear). The R3F shader and any CSS gradient consumers read
 * from the same source of truth.
 */
export interface SkyStop {
  at: number;
  top: [number, number, number];
  mid: [number, number, number];
  bottom: [number, number, number];
}

// Palette samples across one full day→night→back-to-pre-dawn cycle. The last
// stop at progress 1.0 matches the first stop at 0.0 so the seamless scroll
// loop also loops visually — no color jump at the boundary.
export const SKY_STOPS: SkyStop[] = [
  // pre-dawn — deep purple-blue, the room before anyone arrives
  {
    at: 0.0,
    top: [0.04, 0.03, 0.14],
    mid: [0.12, 0.05, 0.23],
    bottom: [0.22, 0.08, 0.28]
  },
  // dawn handoff — sun touches horizon, sky breaks open
  {
    at: 0.06,
    top: [0.19, 0.09, 0.32],
    mid: [0.51, 0.14, 0.34],
    bottom: [0.9, 0.56, 0.29]
  },
  // morning — daylight settling in
  {
    at: 0.22,
    top: [0.36, 0.56, 0.81],
    mid: [0.61, 0.77, 0.9],
    bottom: [0.94, 0.9, 0.82]
  },
  // golden hour — the cookout window
  {
    at: 0.42,
    top: [0.48, 0.69, 0.84],
    mid: [1.0, 0.82, 0.48],
    bottom: [1.0, 0.71, 0.42]
  },
  // sunset — sun on the way out, sky warms
  {
    at: 0.6,
    top: [0.23, 0.21, 0.31],
    mid: [0.85, 0.38, 0.17],
    bottom: [0.94, 0.66, 0.35]
  },
  // twilight — moon rising
  {
    at: 0.75,
    top: [0.05, 0.05, 0.18],
    mid: [0.1, 0.12, 0.29],
    bottom: [0.29, 0.21, 0.45]
  },
  // deep night
  {
    at: 0.88,
    top: [0.008, 0.012, 0.08],
    mid: [0.04, 0.04, 0.15],
    bottom: [0.1, 0.09, 0.22]
  },
  // late night — fading back toward pre-dawn
  {
    at: 0.95,
    top: [0.025, 0.02, 0.11],
    mid: [0.08, 0.04, 0.19],
    bottom: [0.16, 0.06, 0.25]
  },
  // pre-dawn again — identical to 0.0 so the loop has no seam
  {
    at: 1.0,
    top: [0.04, 0.03, 0.14],
    mid: [0.12, 0.05, 0.23],
    bottom: [0.22, 0.08, 0.28]
  }
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export interface SkySample {
  top: [number, number, number];
  mid: [number, number, number];
  bottom: [number, number, number];
}

export function sampleSky(progress: number): SkySample {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = b.at === a.at ? 0 : (p - a.at) / (b.at - a.at);
      return {
        top: lerp3(a.top, b.top, t),
        mid: lerp3(a.mid, b.mid, t),
        bottom: lerp3(a.bottom, b.bottom, t)
      };
    }
  }
  const last = SKY_STOPS[SKY_STOPS.length - 1];
  return { top: last.top, mid: last.mid, bottom: last.bottom };
}

/**
 * Celestial-body state at a given progress.
 *
 * Single-direction motion: the sun rises vertically and only vertically,
 * passing fully through the viewport once per loop. Position is given as
 * an x/y pair where y is a viewport-y fraction (0 = bottom edge, 1 = top
 * edge). The sun starts below the horizon at the loop start and exits
 * above the viewport at the loop end — both off-screen states. The loop
 * wrap from y ≈ 1.15 back to y ≈ -0.15 happens entirely outside the
 * visible viewport, so the user never sees the seam.
 */
export interface CelestialState {
  sun: {
    x: number;
    y: number;
    opacity: number;
    color: [number, number, number];
    size: number;
  };
  moon: {
    x: number;
    y: number;
    opacity: number;
    color: [number, number, number];
    size: number;
  };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Sun-y at horizon, in viewport-y fraction. The loader hands the sun to
 * the scene at exactly this position so the handoff has no visual jump.
 * Also where the horizon glow band sits.
 */
export const HORIZON_Y = 0.5;

export function sampleCelestial(progress: number): CelestialState {
  const p = Math.min(1, Math.max(0, progress));

  // Map scene progress to in-loop progress (0..1). Scene progress 0.05 is
  // the loader-end / scene-start point, which corresponds to mid-loop so
  // the sun is at the horizon (single-direction rise: from horizon all
  // the way up across the rest of the loop).
  //
  // We never compute sun position for progress < 0.05 here — that lane is
  // owned by the SunLoader-driven path in SceneView.

  // After the loader handoff at progress=0.05, treat the remaining scene
  // progress as a full vertical loop. The sun enters from just below the
  // horizon, hits the horizon line at loopProgress=HORIZON_LOOP (which is
  // also the Cookout act start and the initial scroll position), then
  // continues rising and exits well above the top of the viewport before
  // wrapping back to "below the bottom" — both endpoints off-screen.
  //
  // Two-segment piecewise-linear so the horizon hit is calibrated to the
  // reload-landing position. The slope changes at HORIZON_LOOP, but the
  // curve is continuous (no jump).
  const HORIZON_LOOP = 0.2;
  const loopProgress = Math.max(0, (p - 0.05) / 0.95);
  const sunY =
    loopProgress < HORIZON_LOOP
      ? -0.15 + (loopProgress / HORIZON_LOOP) * (HORIZON_Y + 0.15)
      : HORIZON_Y +
        ((loopProgress - HORIZON_LOOP) / (1 - HORIZON_LOOP)) *
          (1.15 - HORIZON_Y);

  // Sun stays horizontally centered. No lateral motion — the user's one
  // direction rule.
  const sunX = 0;

  // Visibility envelope — invisible while off-screen so the wrap is clean.
  const sunFadeIn = smoothstep(-0.08, 0.05, sunY);
  const sunFadeOut = 1 - smoothstep(0.98, 1.1, sunY);
  const sunOpacity = Math.min(sunFadeIn, sunFadeOut);

  // Warm at the horizon, paler higher up.
  const heatT = smoothstep(0.5, 1.0, sunY);
  const sunColor: [number, number, number] = [
    1,
    lerp(0.78, 0.95, heatT),
    lerp(0.42, 0.85, heatT)
  ];

  // Moon removed — single-direction rule means we only show the sun.
  return {
    sun: {
      x: sunX,
      y: sunY,
      opacity: sunOpacity,
      color: sunColor,
      size: lerp(0.115, 0.085, heatT)
    },
    moon: {
      x: 0,
      y: -10,
      opacity: 0,
      color: [0.91, 0.94, 1.0],
      size: 0.075
    }
  };
}
