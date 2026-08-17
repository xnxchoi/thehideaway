/**
 * Founder taste dials for the r3f showcase candidate — shared between the
 * scene (reads per frame) and the leva panel (writes on change). Lives in
 * its own module so the scene ↔ panel imports never form a cycle and leva
 * stays out of the scene chunk.
 */

export type LostFragranceTuning = {
  bloomScale: number;
  camSmoothTime: number;
  glassRoughness: number;
  ringMaxRadius: number;
  ringOpacity: number;
  waterMirror: number;
  waterMixBlur: number;
  waterMixStrength: number;
};

/** Single source for the shipped values — the scene's JSX reads these too. */
export const LOST_FRAGRANCE_TUNING_DEFAULTS: LostFragranceTuning = {
  bloomScale: 1,
  camSmoothTime: 0.55,
  glassRoughness: 0.32,
  ringMaxRadius: 1.1,
  ringOpacity: 0.12,
  waterMirror: 0.85,
  waterMixBlur: 0.9,
  waterMixStrength: 1.35
};
