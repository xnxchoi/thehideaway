/**
 * Lane configuration for the FooterTickerCrown component.
 *
 * Source of truth for all rhythm/geometry constants. Tuning here propagates
 * to every other module in this directory. See:
 *   .claude/PRPs/research/footer-ticker-crown-research.md
 *   .claude/PRPs/plans/footer-ticker-crown.plan.md
 */

/**
 * Hatches per viewport width — chronograph 60-second scale (D1).
 * 60 ticks reads as "instrument," not arbitrary.
 */
export const HATCHES_PER_VIEWPORT_WIDTH = 60;

export interface LaneConfig {
  readonly id: 0 | 1 | 2 | 3 | 4;
  /** Lane row height in CSS pixels. Palindromic, peak at center seed lane (id=2). */
  readonly heightPx: number;
  /** Base alpha for this lane. Palindromic, peak at center. */
  readonly opacityBand: number;
  /** Coprime semi-prime period in ms. The polymeter breath-spacing. */
  readonly periodMs: number;
  /** How long the slide phase lasts within one period. ≤10% of period. (D2) */
  readonly slideMs: number;
  /** Drift direction. Alternates +/-/+/-/+ across lanes. */
  readonly direction: 1 | -1;
  /** Coprime opacity-tremor period in seconds. (D4) */
  readonly tremorPeriodSec: number;
}

/**
 * Five lanes, palindromic in height/opacity, coprime semi-prime periods (D2).
 * Slide ≈ 6.5–6.0% of period across all lanes (well under the 10% cap).
 */
export const LANE_CONFIGS: ReadonlyArray<LaneConfig> = [
  {
    id: 0,
    heightPx: 14,
    opacityBand: 0.55,
    periodMs: 2300,
    slideMs: 150,
    direction: 1,
    tremorPeriodSec: 4.7
  },
  {
    id: 1,
    heightPx: 18,
    opacityBand: 0.65,
    periodMs: 2900,
    slideMs: 150,
    direction: -1,
    tremorPeriodSec: 5.3
  },
  {
    id: 2,
    heightPx: 22,
    opacityBand: 0.78,
    periodMs: 3700,
    slideMs: 150,
    direction: 1,
    tremorPeriodSec: 6.1
  },
  {
    id: 3,
    heightPx: 18,
    opacityBand: 0.65,
    periodMs: 4300,
    slideMs: 150,
    direction: -1,
    tremorPeriodSec: 5.7
  },
  {
    id: 4,
    heightPx: 14,
    opacityBand: 0.55,
    periodMs: 4900,
    slideMs: 150,
    direction: 1,
    tremorPeriodSec: 4.9
  }
];

/** Index of the center "seed" lane that the seed line reveals into. */
export const SEED_LANE_ID = 2 as const;

/**
 * Mobile (<sm) renders only the center 3 lanes. Still palindromic.
 * Desktop renders all 5.
 */
export const MOBILE_LANE_IDS: ReadonlyArray<LaneConfig["id"]> = [1, 2, 3];

/** Engineered breath cadence (D3). Every ~18 s, all lanes pause + brighten. */
export const BREATH_INTERVAL_MS = 18000;
/** Breath envelope duration. Half-sine 0→1→0 over this window. */
export const BREATH_DURATION_MS = 220;

/** Reveal animation timings (D7). */
export const REVEAL_DURATION_MS = 480;
/** Stagger from center outward; lane id distance × this delay. */
export const REVEAL_STAGGER_MS = 60;
/** Hold after reveal completes before the engine starts driving drift. */
export const REVEAL_HOLD_BEFORE_DRIFT_MS = 120;

/** Inter-lane gap. Tailwind gap-1.5 = 6px, gap-2 = 8px. */
export const ROW_GAP_PX = 6;
export const ROW_GAP_XL_PX = 8;

/** Render setting: every 5th hatch is a "major" tick (1.5px wide vs 1px). */
export const MAJOR_TICK_EVERY = 5;
export const MINOR_TICK_WIDTH_PX = 1;
export const MAJOR_TICK_WIDTH_PX = 1.5;
/** Minor ticks are inset vertically from the lane band by this fraction. */
export const MINOR_TICK_VERTICAL_INSET = 0.15;

/** Cap DPR — diminishing returns above 2× and bundle gets heavy. */
export const DPR_CAP = 2;

/** Compute total stack height in CSS px (excluding outer padding). */
export function computeStackHeightPx(
  configs: ReadonlyArray<LaneConfig>,
  gapPx: number
): number {
  const heights = configs.reduce((sum, c) => sum + c.heightPx, 0);
  const gaps = (configs.length - 1) * gapPx;
  return heights + gaps;
}

/**
 * Compute the y-offset (top, in CSS px) of a lane within the stack.
 * Returns one entry per lane in the input order.
 */
export function computeLaneTops(
  configs: ReadonlyArray<LaneConfig>,
  gapPx: number
): ReadonlyArray<number> {
  const tops: number[] = [];
  let cursor = 0;
  for (let i = 0; i < configs.length; i++) {
    tops.push(cursor);
    cursor += configs[i].heightPx + gapPx;
  }
  return tops;
}
