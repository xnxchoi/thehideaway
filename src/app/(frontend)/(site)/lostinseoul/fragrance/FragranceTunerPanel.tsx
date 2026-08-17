"use client";

import { useEffect } from "react";
import type { MutableRefObject } from "react";
import { folder, Leva, useControls } from "leva";
import {
  LOST_FRAGRANCE_TUNING_DEFAULTS,
  type LostFragranceTuning
} from "./fragrance-tuning";

/**
 * The dev tuning panel (workplan Level 0). Mounted ONLY when `?tune=1` outside production,
 * and reached through a dynamic import, so leva stays out of the shipped bundle entirely.
 *
 * It writes into a ref the render loop reads each frame rather than re-rendering the scene:
 * the WebGL context lives in an effect closure and must never be torn down by a slider move.
 *
 * Workflow: founder turns knobs on real hardware → we read the final numbers off the panel
 * and bake them into `fragrance-water.ts` / `fragrance-bottle.ts` / the composer, then
 * update `LOST_FRAGRANCE_TUNING_DEFAULTS` so the panel keeps opening on the current look.
 */
export function FragranceTunerPanel({
  defaults = LOST_FRAGRANCE_TUNING_DEFAULTS,
  valueRef
}: {
  /** Scene-specific opening values — the r3f candidate bakes different glass
   *  (clear 0.32 vs the live frost 0.53), and the panel must open on the look
   *  it is tuning or its first apply repaints the flacon. */
  defaults?: LostFragranceTuning;
  valueRef: MutableRefObject<LostFragranceTuning>;
}) {
  const d = defaults;

  const values = useControls({
    water: folder({
      rippleAmp: { value: d.rippleAmp, min: 0, max: 1.5, step: 0.01 },
      rippleSpeed: { value: d.rippleSpeed, min: 0, max: 2, step: 0.01 },
      distortion: { value: d.distortion, min: 0, max: 2, step: 0.01 },
      reflStrength: { value: d.reflStrength, min: 0, max: 1.5, step: 0.01 }
    }),
    glass: folder({
      ior: { value: d.ior, min: 1, max: 2.4, step: 0.01 },
      thickness: { value: d.thickness, min: 0, max: 5, step: 0.05 },
      roughness: { value: d.roughness, min: 0, max: 1, step: 0.01 },
      envMapIntensity: { value: d.envMapIntensity, min: 0, max: 5, step: 0.05 },
      clearcoat: { value: d.clearcoat, min: 0, max: 1, step: 0.01 },
      attenuationDistance: {
        value: d.attenuationDistance,
        min: 0.1,
        max: 12,
        step: 0.1
      }
    }),
    light: folder({
      emberScale: { value: d.emberScale, min: 0, max: 3, step: 0.01 },
      capRimScale: { value: d.capRimScale, min: 0, max: 3, step: 0.01 }
    }),
    // `grade` and `light` are MULTIPLIERS over curves the render loop re-establishes each
    // frame (see fragrance-light.ts) — 1 means "as authored". They scale the swell into the
    // impact rather than flattening it, so scrub the page while turning these.
    grade: folder({
      exposure: { value: d.exposure, min: 0.2, max: 2.5, step: 0.01 },
      bloomIntensity: { value: d.bloomIntensity, min: 0, max: 2, step: 0.01 }
    })
  });

  useEffect(() => {
    valueRef.current = values as unknown as LostFragranceTuning;
  }, [values, valueRef]);

  return <Leva collapsed={false} />;
}
