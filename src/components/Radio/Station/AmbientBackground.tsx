"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { MotionValue, animate, useMotionValue } from "motion/react";
import { useEffect } from "react";
import { useRadioStore } from "@/providers/RadioProvider";
import { useShallow } from "zustand/shallow";
import { AmbientGradientMesh } from "./AmbientGradientMesh";

// Opacity targets based on playback state
const OPACITY_PLAYING = 0.3;
const OPACITY_STOPPED = 0.85;
const OPACITY_TRANSITION_MS = 800;

type AmbientBackgroundProps = {
  fogProgress: MotionValue<number>;
  audioLevel: MotionValue<number>;
};

/**
 * Full-screen ambient gradient background for the Radio page.
 * Renders as an R3F View portaled into the shared Canvas.
 *
 * Three reactive inputs drive the shader:
 * - opacity: subdued when playing, pronounced when stopped
 * - audioLevel: frequency-driven pulse from AnalyserNode
 * - fogProgress: idle detection fog that creeps from edges
 */
export function AmbientBackground({
  fogProgress,
  audioLevel
}: AmbientBackgroundProps) {
  const playing = useRadioStore(useShallow((s) => s.playing));
  const opacity = useMotionValue(playing ? OPACITY_PLAYING : OPACITY_STOPPED);

  // Tween opacity based on playback state
  useEffect(() => {
    animate(opacity, playing ? OPACITY_PLAYING : OPACITY_STOPPED, {
      duration: OPACITY_TRANSITION_MS / 1000,
      ease: [0.4, 0, 0.2, 1]
    });
  }, [playing, opacity]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden="true"
    >
      <View className="absolute inset-0">
        <PerspectiveCamera
          near={0.01}
          far={1000}
          position={[0, 0, 0.2]}
          fov={35}
          aspect={2}
          makeDefault
        />
        <AmbientGradientMesh
          opacity={opacity}
          audioLevel={audioLevel}
          fogProgress={fogProgress}
        />
      </View>

      {/* Grain overlay */}
      <div
        className="absolute inset-0 z-[3]"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          opacity: 0.04,
          mixBlendMode: "overlay",
          pointerEvents: "none"
        }}
      />
    </div>
  );
}

/**
 * CSS-only fallback for mobile devices (no R3F).
 * Matches the ambient aesthetic with a radial gradient + grain.
 */
export function AmbientBackgroundFallback({
  playing
}: {
  fogProgress: MotionValue<number>;
  playing: boolean;
}) {
  const baseOpacity = playing ? 0.25 : 0.7;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-700"
      style={{ opacity: baseOpacity }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 120% 100% at 50% 60%, oklch(0.35 0.08 55 / 0.8) 0%, oklch(0.12 0.03 30 / 0.9) 50%, transparent 80%)"
        }}
      />
      {/* Grain */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          opacity: 0.04,
          mixBlendMode: "overlay"
        }}
      />
    </div>
  );
}
