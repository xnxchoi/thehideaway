/**
 * Shared dev-tuning state for the r3f fragrance scene.
 *
 * Replaces the old `?param=` URL knobs: the scene reads its grade + perf values
 * from this store, and the dev leva panel (`fragrance-r3f-panel.tsx`, dev-only,
 * dynamically imported) writes to it. In production the panel never mounts, so
 * the store stays at BAKED defaults and never changes — subscribers get stable
 * values with zero re-renders.
 *
 * Workflow: founder dials on real hardware, saves named variants to
 * localStorage, then we bake the chosen numbers into DEFAULTS below (and the
 * corresponding scene/material/composer constants) and delete the panel.
 */

import { create } from "zustand";

export type FragranceR3fTuning = {
  /** toneMappingExposure multiplier (1 = as authored) */
  exp: number;
  /** studio key-light intensity (absolute) */
  key: number;
  /** bloom intensity multiplier (1 = as authored) */
  bloom: number;
  /** devicePixelRatio multiplier before the desktop/mobile cap (1 = native) */
  dpr: number;
  /** renderer.transmissionResolutionScale (1 = full-res glass transmission) */
  trs: number;
  /** water reflection render-target resolution in px */
  refl: number;
  /** EffectComposer MSAA samples (0 matches legacy's imperative composer) */
  msaa: number;

  // --- material feel (CatalystModel's hand-made glass + juice) ---
  // All ABSOLUTE — the default IS the constructor value in fragrance-catalyst.tsx,
  // so the panel opens on exactly the current flacon (no repaint on mount).
  /** glass index of refraction */
  glassIor: number;
  /** glass surface roughness (0 = perfectly clear) */
  glassRoughness: number;
  /** glass wall thickness fed to transmission */
  glassThickness: number;
  /** glass clearcoat layer (0 = off; flips a shader define, see panel/effect) */
  glassClearcoat: number;
  /** glass envMap reflection/refraction intensity */
  glassEnvMap: number;
  /** juice hue as hex — drives color + specularColor + blendColor together */
  juiceHue: string;
  /** juice surface roughness */
  juiceRoughness: number;
  /** juice wet-sheen clearcoat */
  juiceClearcoat: number;
  /** juice thickness */
  juiceThickness: number;
  /** juice envMap intensity */
  juiceEnvMap: number;
};

/** Baked look — must match the legacy scene so default output is identical. */
export const FRAGRANCE_R3F_TUNING_DEFAULTS: FragranceR3fTuning = {
  exp: 1,
  key: 0.8,
  bloom: 1,
  dpr: 1,
  trs: 1,
  refl: 512,
  msaa: 0,
  // MIRROR fragrance-catalyst.tsx constructors exactly (glass:44-52, juice:58-73).
  // glassIor / glassEnvMap are three.js defaults the material never sets — pinned here.
  glassIor: 1.5,
  glassRoughness: 0,
  glassThickness: 0.3,
  glassClearcoat: 0,
  glassEnvMap: 1,
  juiceHue: "#cdb079",
  juiceRoughness: 0.2,
  juiceClearcoat: 0.6,
  juiceThickness: 0.8,
  juiceEnvMap: 1
};

/** Strip the store's actions, leaving a plain snapshot (for saving variants). */
export function pickTuning(state: FragranceR3fTuning): FragranceR3fTuning {
  return {
    exp: state.exp,
    key: state.key,
    bloom: state.bloom,
    dpr: state.dpr,
    trs: state.trs,
    refl: state.refl,
    msaa: state.msaa,
    glassIor: state.glassIor,
    glassRoughness: state.glassRoughness,
    glassThickness: state.glassThickness,
    glassClearcoat: state.glassClearcoat,
    glassEnvMap: state.glassEnvMap,
    juiceHue: state.juiceHue,
    juiceRoughness: state.juiceRoughness,
    juiceClearcoat: state.juiceClearcoat,
    juiceThickness: state.juiceThickness,
    juiceEnvMap: state.juiceEnvMap
  };
}

type TuningStore = FragranceR3fTuning & {
  setTuning: (patch: Partial<FragranceR3fTuning>) => void;
  reset: () => void;
};

export const useFragranceR3fTuning = create<TuningStore>((set) => ({
  ...FRAGRANCE_R3F_TUNING_DEFAULTS,
  setTuning: (patch) => set(patch),
  reset: () => set(FRAGRANCE_R3F_TUNING_DEFAULTS)
}));
