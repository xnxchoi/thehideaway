/**
 * Stage layout for the CATALYST chapter — Seoul abstracted, not rebuilt.
 * The relationship is Celine "Dancing Kid" → TikTok youth: the source
 * contributes its silhouette, its (desaturated) colors and its theme; the
 * staging is entirely the house's own. So: a flat skyline cutout against a
 * graded horizon, a black mirror floor, and choreographed followspot beams —
 * no literal city geometry.
 *
 * Pure data — the scene module turns these into three.js objects.
 * All randomness is seeded so the stage never re-rolls between mounts.
 */

export const LOST_FRAGRANCE_BEAM_COUNT = 5;

export type LostFragranceSkylinePoint = {
  x: number;
  height: number;
};

export type LostFragranceBeamSlot = {
  x: number;
  z: number;
  /** shaft radius at the floor */
  radius: number;
  /** shaft height */
  height: number;
};

/** Same seeded PRNG family as the scene module. */
function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

const SKYLINE_SPAN = 76;
const SKYLINE_STEPS = 26;

/**
 * The Seoul silhouette — a continuous roofline profile, left to right.
 * Rendered as a single black cutout in front of the horizon field; the only
 * literal element that survives, kept because it is the "silhouette" the
 * direction asks us to take from the source.
 */
export function getLostFragranceSkyline(): LostFragranceSkylinePoint[] {
  const points: LostFragranceSkylinePoint[] = [];
  for (let i = 0; i <= SKYLINE_STEPS; i += 1) {
    const t = i / SKYLINE_STEPS;
    const x = -SKYLINE_SPAN / 2 + t * SKYLINE_SPAN;
    // towers cluster mid-left and far-right; the centre dips so the
    // horizon glow reads through the middle of the frame
    const cluster =
      Math.exp(-Math.pow((t - 0.3) / 0.16, 2)) * 10 +
      Math.exp(-Math.pow((t - 0.86) / 0.1, 2)) * 7.5;
    const jitter = seeded(i, 51) * 3.4;
    const base = 2.2 + seeded(i, 52) * 1.8;
    points.push({ height: base + cluster + jitter, x });
  }
  return points;
}

/**
 * Followspot shafts — fixed stage positions; each beat's light state owns
 * their intensities. Centre stage (the plinth slot) is deliberately empty.
 */
export const LOST_FRAGRANCE_BEAM_SLOTS: LostFragranceBeamSlot[] = [
  { height: 15, radius: 0.62, x: -8.5, z: -11 },
  { height: 14, radius: 0.5, x: -4.2, z: -7.5 },
  { height: 16, radius: 0.72, x: 2.6, z: -13 },
  { height: 14, radius: 0.48, x: 5.8, z: -8 },
  { height: 15, radius: 0.58, x: 9.4, z: -12.5 }
];
