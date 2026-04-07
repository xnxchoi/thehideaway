"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
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
 * The shader renders the page background with:
 * - Very heavy film grain (FC Porto memorial level — the defining texture)
 * - Subtle organic blobs barely visible against the bg, more pronounced when idle
 * - Audio drives halation spread, not color brightness
 * - Multiple CSS grain passes for extra tactile texture
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
          isDark={isDark}
          playing={playing}
        />
      </View>

      {/* ── Heavy grain overlay — triple-pass for FC Porto level texture ─── */}
      {/* Pass 1: coarse grain, overlay blend */}
      <div
        className="absolute inset-0 z-[3]"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
          opacity: isDark ? 0.28 : 0.15,
          mixBlendMode: "overlay",
          pointerEvents: "none"
        }}
      />
      {/* Pass 2: fine grain, soft-light for depth */}
      <div
        className="absolute inset-0 z-[4]"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "120px",
          opacity: isDark ? 0.15 : 0.08,
          mixBlendMode: "soft-light",
          pointerEvents: "none"
        }}
      />
      {/* Pass 3: multiply pass for dark grain in shadows */}
      <div
        className="absolute inset-0 z-[5]"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "300px",
          opacity: isDark ? 0.10 : 0.04,
          mixBlendMode: "multiply",
          pointerEvents: "none"
        }}
      />
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
