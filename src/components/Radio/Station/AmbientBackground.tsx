"use client";

import { SPRING_EASE, TE } from "@/constants/animations";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  MotionValue,
  animate,
  useMotionValue,
  useTransform,
  useSpring
} from "motion/react";
import { useEffect } from "react";
import { useRadioStore } from "@/providers/RadioProvider";
import { useShallow } from "zustand/shallow";
import { useTheme } from "@/providers/Theme";
import { AmbientGradientMesh } from "./AmbientGradientMesh";

// Nearly opaque always — shader itself renders the bg color, not a color overlay

type AmbientBackgroundProps = {};

/**
 * Full-screen ambient background for the Radio page.
 *
 * Standalone Canvas (not shared View) to enable full postprocessing pipeline:
 *   RenderPass → KawaseBlur (folds) → EffectPass (saccadé soft-light grain)
 *
 * Uses orthographic camera + 2×2 plane so UVs map 1:1 to screen pixels.
 */
export function AmbientBackground({}: AmbientBackgroundProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] min-h-svh"
      aria-hidden="true"
    >
      <Canvas
        className="absolute inset-0"
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          stencil: true,
          depth: false,
          alpha: true
        }}
        orthographic={true}
        camera={{
          position: [0, 0, 1],

          near: 0,
          far: 1,
          left: -1,
          right: 1,
          top: 1,
          bottom: -1
        }}
        frameloop="always"
        dpr={[1, 2]}
      >
        <AmbientGradientMesh />
      </Canvas>
    </div>
  );
}

/**
 * CSS-only fallback for mobile (no R3F).
 * Heavy grain + barely-there vignette on page background.
 */
export function AmbientBackgroundFallback({}: {}) {
  const playing = useRadioStore(useShallow((s) => s.playing));

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden="true"
    >
      {/* Subtle warm vignette — barely perceptible */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: playing ? 0.15 : 0.3,
          background:
            "radial-gradient(ellipse 90% 80% at 45% 40%, oklch(30% 0.04 60 / 0.12) 0%, transparent 60%)"
        }}
      />
      {/* Heavy grain — triple pass */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
          opacity: 0.28,
          mixBlendMode: "overlay"
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "120px",
          opacity: 0.12,
          mixBlendMode: "soft-light"
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "300px",
          opacity: 0.08,
          mixBlendMode: "multiply"
        }}
      />
    </div>
  );
}
