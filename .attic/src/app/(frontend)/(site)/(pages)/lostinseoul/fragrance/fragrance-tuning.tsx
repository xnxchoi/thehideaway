"use client";

/**
 * Dev tuning panel for the r3f showcase candidate — mounted ONLY behind
 * `?tune=1` via React.lazy, so leva never enters the default bundle. Every
 * control writes transiently (onChange, no re-render) into the scene's
 * tuning ref; the render loop reads it per frame.
 *
 * The knob set is the founder's known taste dials from the parity review:
 * water tone, bloom weight, glass frost, camera damping, ring presence.
 */

import type { RefObject } from "react";
import { useControls } from "leva";
import type { LostFragranceTuning } from "./fragrance-tuning-schema";

type Props = {
  target: RefObject<LostFragranceTuning>;
};

export function LostFragranceTuningPanel({ target }: Props) {
  useControls("catalyst", {
    bloomScale: {
      max: 3,
      min: 0,
      onChange: (value: number) => {
        target.current.bloomScale = value;
      },
      value: 1
    },
    camSmoothTime: {
      max: 1.5,
      min: 0.1,
      onChange: (value: number) => {
        target.current.camSmoothTime = value;
      },
      value: 0.55
    },
    glassRoughness: {
      max: 1,
      min: 0,
      onChange: (value: number) => {
        target.current.glassRoughness = value;
      },
      value: 0.32
    },
    ringMaxRadius: {
      max: 3,
      min: 0.2,
      onChange: (value: number) => {
        target.current.ringMaxRadius = value;
      },
      value: 1.1
    },
    ringOpacity: {
      max: 0.6,
      min: 0,
      onChange: (value: number) => {
        target.current.ringOpacity = value;
      },
      value: 0.12
    },
    waterMirror: {
      max: 1,
      min: 0,
      onChange: (value: number) => {
        target.current.waterMirror = value;
      },
      value: 0.85
    },
    waterMixBlur: {
      max: 2,
      min: 0,
      onChange: (value: number) => {
        target.current.waterMixBlur = value;
      },
      value: 0.9
    },
    waterMixStrength: {
      max: 4,
      min: 0,
      onChange: (value: number) => {
        target.current.waterMixStrength = value;
      },
      value: 1.35
    }
  });
  return null;
}
