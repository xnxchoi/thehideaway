"use client";

import { Canvas } from "@react-three/fiber";
import { MotionValue, animate, useMotionValue } from "motion/react";
import { useEffect } from "react";
import { useRadioStore } from "@/providers/RadioProvider";
import { useShallow } from "zustand/shallow";
import { useTheme } from "@/providers/Theme";
import { AmbientGradientMesh } from "./AmbientGradientMesh";

// Nearly opaque always — shader itself renders the bg color, not a color overlay
const OPACITY_PLAYING = 0.95;
const OPACITY_STOPPED = 1.0;

type AmbientBackgroundProps = {
  fogProgress: MotionValue<number>;
  audioLevel: MotionValue<number>;
};

/**
 * Full-screen ambient background for the Radio page.
 *
 * Standalone Canvas (not shared View) to enable full postprocessing pipeline:
 *   RenderPass → KawaseBlur (folds) → EffectPass (saccadé soft-light grain)
 *
 * Visual layers:
 * - Organic gradient blobs driven by noise texture (seamless.png)
 * - Kawase blur creates thick, fabric-like "folds" (à la leeroy.ca)
 * - Grid-based stepped grain with soft-light blending (filmic, not digital)
 * - Audio drives halation spread, not color brightness
 */
export function AmbientBackground({
  fogProgress,
  audioLevel
}: AmbientBackgroundProps) {
  const playing = useRadioStore(useShallow((s) => s.playing));
  const theme = useTheme((s) => s.theme);
  const isDark = theme === "dark";
  const opacity = useMotionValue(playing ? OPACITY_PLAYING : OPACITY_STOPPED);

  useEffect(() => {
    animate(opacity, playing ? OPACITY_PLAYING : OPACITY_STOPPED, {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1]
    });
  }, [playing, opacity]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden="true"
    >
      <Canvas
        className="absolute inset-0"
        gl={{ antialias: false, alpha: false, premultipliedAlpha: false }}
        camera={{ position: [0, 0, 0.2], fov: 35, near: 0.01, far: 1000 }}
        frameloop="always"
        dpr={[1, 2]}
      >
        <AmbientGradientMesh
          opacity={opacity}
          audioLevel={audioLevel}
          fogProgress={fogProgress}
          isDark={isDark}
          playing={playing}
        />
      </Canvas>
    </div>
  );
}

/**
 * CSS-only fallback for mobile (no R3F).
 * Heavy grain + barely-there vignette on page background.
 */
export function AmbientBackgroundFallback({
  playing
}: {
  fogProgress: MotionValue<number>;
  playing: boolean;
}) {
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
