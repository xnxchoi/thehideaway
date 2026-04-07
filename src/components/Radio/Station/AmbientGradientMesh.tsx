"use client";

import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { Color as ThreeColor, DoubleSide, RepeatWrapping, Vector4 } from "three";
import vertexShader from "../shaders/ambient.vert.glsl";
import fragmentShader from "../shaders/ambient.frag.glsl";

// ── Theme color palettes ──────────────────────────────────────────────────
// Dark: FC Porto memorial — deep navy/blue-black, very subtle warm-blue shifts
// Grain is the star; blobs are barely-there atmospheric color
const DARK_BG = new ThreeColor().setStyle("oklch(15% 0.015 250)");    // deep navy-black
const DARK_COLOR1 = new ThreeColor().setStyle("oklch(28% 0.035 240)"); // dark steel blue
const DARK_COLOR2 = new ThreeColor().setStyle("oklch(24% 0.025 200)"); // muted slate
const DARK_COLOR3 = new ThreeColor().setStyle("oklch(20% 0.02 280)");  // deep indigo shadow

// Light: Richard Sancho-inspired — muted lavender, warm gold, soft rose on cream
const LIGHT_BG = new ThreeColor().setStyle("oklch(95% 0.005 80)");
const LIGHT_COLOR1 = new ThreeColor().setStyle("oklch(62% 0.10 290)"); // soft lavender
const LIGHT_COLOR2 = new ThreeColor().setStyle("oklch(70% 0.09 80)");  // warm gold
const LIGHT_COLOR3 = new ThreeColor().setStyle("oklch(60% 0.07 20)");  // muted rose

// Blob intensity: how visible the gradient blobs are
// When playing: very subdued. When stopped: more pronounced but still dark/moody.
const BLOB_INTENSITY_PLAYING = 0.25;
const BLOB_INTENSITY_STOPPED = 0.6;

type AmbientGradientMeshProps = {
  opacity: MotionValue<number>;
  audioLevel: MotionValue<number>;
  fogProgress: MotionValue<number>;
  isDark: boolean;
  playing: boolean;
};

export function AmbientGradientMesh({
  opacity,
  audioLevel,
  fogProgress,
  isDark,
  playing
}: AmbientGradientMeshProps) {
  useTexture.preload("/assets/seamless.png");
  const materialRef = useRef<any>(null);
  const { size } = useThree();

  const noiseTexture = useTexture(
    { map: "/assets/seamless.png" },
    (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
    }
  );

  const u_resolution = useMemo(() => new Vector4(1, 1, 1, 1), []);

  const bgColor = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_BG : LIGHT_BG),
    [isDark]
  );
  const color1 = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_COLOR1 : LIGHT_COLOR1),
    [isDark]
  );
  const color2 = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_COLOR2 : LIGHT_COLOR2),
    [isDark]
  );
  const color3 = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_COLOR3 : LIGHT_COLOR3),
    [isDark]
  );

  const uniforms = useMemo(
    () => ({
      u_time: 0,
      u_resolution,
      u_bgColor: bgColor,
      u_color1: color1,
      u_color2: color2,
      u_color3: color3,
      u_audioLevel: 0.0,
      u_fogProgress: 0.0,
      u_opacity: 1.0,
      u_grainIntensity: isDark ? 0.14 : 0.08,
      u_blobIntensity: BLOB_INTENSITY_STOPPED,
      u_noiseTexture: noiseTexture
    }),
    [u_resolution, bgColor, color1, color2, color3, noiseTexture, isDark]
  );

  const AmbientShader = shaderMaterial(uniforms, vertexShader, fragmentShader);
  extend({ AmbientShader });

  // Sync resolution
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_resolution.value.set(
      size.width,
      size.height,
      1,
      1
    );
  }, [size]);

  // Update colors when theme changes
  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current.uniforms;
    m.u_bgColor.value.copy(isDark ? DARK_BG : LIGHT_BG);
    m.u_color1.value.copy(isDark ? DARK_COLOR1 : LIGHT_COLOR1);
    m.u_color2.value.copy(isDark ? DARK_COLOR2 : LIGHT_COLOR2);
    m.u_color3.value.copy(isDark ? DARK_COLOR3 : LIGHT_COLOR3);
    m.u_grainIntensity.value = isDark ? 0.14 : 0.08;
  }, [isDark]);

  // Smoothly transition blob intensity based on playing state
  const targetBlobIntensity = useRef(BLOB_INTENSITY_STOPPED);
  useEffect(() => {
    targetBlobIntensity.current = playing
      ? BLOB_INTENSITY_PLAYING
      : BLOB_INTENSITY_STOPPED;
  }, [playing]);

  useFrame((_state, delta) => {
    if (!materialRef.current) return;
    const m = materialRef.current.uniforms;

    m.u_time.value += delta;

    // Smoothly lerp blob intensity toward target
    const current = m.u_blobIntensity.value;
    const target = targetBlobIntensity.current;
    m.u_blobIntensity.value += (target - current) * delta * 1.5;

    // Reactive uniforms
    m.u_opacity.value = opacity.get();
    m.u_fogProgress.value = fogProgress.get();
    m.u_audioLevel.value = audioLevel.get();
  });

  return (
    <mesh>
      {/* Simple quad — all complexity is in the fragment shader */}
      <planeGeometry args={[1.5, 1.5, 1, 1]} />
      {/* @ts-expect-error — dynamically extended shader material */}
      <ambientShader
        ref={materialRef}
        extensions={{
          derivatives: "#extension GL_OES_standard_derivatives: enable"
        }}
        side={DoubleSide}
        transparent
      />
    </mesh>
  );
}
