/**
 * Dev-only tuning bus for the fragrance scene (workplan Level 0, §11 increment #4).
 *
 * The scene's look — water stillness, glass, ember light, grade — was previously tuned by
 * screenshot round-trips against the founder's GPU, which is slow, expensive, and can't
 * judge transmission glass headlessly at all. Instead: a leva panel writes into a live
 * tuning object, the render loop applies it every frame, the founder turns knobs on real
 * hardware, and we bake the resulting numbers back into the constants.
 *
 * This module is the pure half — a gate, the defaults (which MIRROR the baked constants,
 * so the panel opens on exactly the current look), and the apply step. The leva UI lives
 * in `FragranceTunerPanel.tsx` and is only ever loaded when the gate opens, so leva never
 * reaches the production bundle.
 */

export type LostFragranceTuning = {
  // water
  rippleAmp: number;
  rippleSpeed: number;
  distortion: number;
  reflStrength: number;
  // glass
  ior: number;
  thickness: number;
  roughness: number;
  envMapIntensity: number;
  clearcoat: number;
  attenuationDistance: number;
  // light (multipliers over the reaction-driven intensities)
  emberScale: number;
  capRimScale: number;
  // grade (multipliers over the reaction-driven exposure/bloom curve)
  exposure: number;
  bloomIntensity: number;
};

/**
 * Structural, not Three-typed, so the render loop can hand over real
 * `MeshPhysicalMaterial` / `PointLight` / uniform objects while tests hand over plain
 * doubles. `null` where a mode doesn't build that object (product mode has no water).
 */
export type LostFragranceTuningTargets = {
  water: {
    uDistortion: { value: number };
    uReflStrength: { value: number };
    uRippleAmp: { value: number };
    uRippleSpeed: { value: number };
  } | null;
  glass: {
    ior: number;
    thickness: number;
    roughness: number;
    envMapIntensity: number;
    clearcoat: number;
    attenuationDistance: number;
  } | null;
  lights: {
    emberBack: { intensity: number };
  } | null;
  setExposure: (value: number) => void;
};

/**
 * Mirrors the values baked into fragrance-water.ts / fragrance-bottle.ts / fragrance-light.ts,
 * so the panel always opens on exactly the current look.
 *
 * Two kinds of knob live here, and they default differently:
 *  - ABSOLUTE (water uniforms, glass props) — the default IS the baked value.
 *  - MULTIPLIER (emberScale, capRimScale, exposure, bloomIntensity) — these scale a base the
 *    render loop re-establishes each frame, so once their tuned value is folded into that base
 *    they must default back to the identity 1. Leave a baked multiplier here and the panel
 *    re-applies it on top of itself.
 */
export const LOST_FRAGRANCE_TUNING_DEFAULTS: LostFragranceTuning = {
  rippleAmp: 0.71,
  rippleSpeed: 0.15,
  distortion: 1.17,
  reflStrength: 0.98,
  ior: 1.69,
  thickness: 1.05,
  roughness: 0.53,
  envMapIntensity: 1.35,
  clearcoat: 0,
  attenuationDistance: 3.1,
  emberScale: 1,
  capRimScale: 1,
  exposure: 1,
  bloomIntensity: 1
};

/**
 * The panel opens only on `?tune=1`, and never in production — leva is a dev instrument,
 * not a shipped surface. A malformed query string simply fails closed.
 */
export function isLostFragranceTuningEnabled(input: {
  search: string;
  nodeEnv: string | undefined;
}): boolean {
  if (input.nodeEnv === "production") return false;
  try {
    return new URLSearchParams(input.search).get("tune") === "1";
  } catch {
    return false;
  }
}

/**
 * Push the live tuning values onto the scene's GPU objects. Mutation is the point here —
 * these are Three.js handles, not domain state.
 *
 * MUST run AFTER `bottle.setReaction(...)` in the frame: the light values are *scales* over
 * the reaction-driven intensity, and setReaction re-establishes that base each frame. Run it
 * before, and the scale compounds itself into darkness (or a blowout) over successive frames.
 */
export function applyLostFragranceTuning(
  targets: LostFragranceTuningTargets,
  tuning: LostFragranceTuning
): void {
  const { water, glass, lights } = targets;

  if (water) {
    water.uRippleAmp.value = tuning.rippleAmp;
    water.uRippleSpeed.value = tuning.rippleSpeed;
    water.uDistortion.value = tuning.distortion;
    water.uReflStrength.value = tuning.reflStrength;
  }

  if (glass) {
    glass.ior = tuning.ior;
    glass.thickness = tuning.thickness;
    glass.roughness = tuning.roughness;
    glass.envMapIntensity = tuning.envMapIntensity;
    glass.clearcoat = tuning.clearcoat;
    glass.attenuationDistance = tuning.attenuationDistance;
  }

  if (lights) {
    lights.emberBack.intensity *= tuning.emberScale;
  }

  targets.setExposure(tuning.exposure);
}
