"use client";

import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { MotionValue } from "motion/react";
import {
  BlendFunction,
  Effect,
  EffectComposer,
  EffectPass,
  KawaseBlurPass,
  RenderPass
} from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import {
  Color as ThreeColor,
  DoubleSide,
  RepeatWrapping,
  Texture,
  Uniform,
  Vector4
} from "three";
import fragmentShader from "../shaders/ambient.frag.glsl";
import vertexShader from "../shaders/ambient.vert.glsl";
import grainShader from "../shaders/grain.glsl";

// ── Theme color palettes (4-color: 2 base + 2 accent per leeroy system) ──
// Dark: FC Porto memorial — deep navy/blue-black, very subtle warm-blue shifts
// Grain is the star; blobs are barely-there atmospheric color
const DARK_BG = new ThreeColor().setStyle("#070c11"); // deep navy-black
const DARK_COLOR1 = new ThreeColor().setStyle("#182b38"); // base 1: dark steel blue
const DARK_COLOR2 = new ThreeColor().setStyle("#14151f"); // base 2: deep indigo shadow
const DARK_COLOR3 = new ThreeColor().setStyle("#154751"); // accent 1: muted teal-slate
const DARK_COLOR4 = new ThreeColor().setStyle("#1f3a5c"); // accent 2: deep sapphire

// Light: Richard Sancho-inspired — warm cream with teal and gold atmospheric accents
const LIGHT_BG = new ThreeColor().setStyle("#f8f6f5");
const LIGHT_COLOR1 = new ThreeColor().setStyle("#e8ddd0"); // base 1: warm parchment
const LIGHT_COLOR2 = new ThreeColor().setStyle("#ddd6e0"); // base 2: cool lavender-cream
const LIGHT_COLOR3 = new ThreeColor().setStyle("#31a6bd"); // accent 1: soft teal
const LIGHT_COLOR4 = new ThreeColor().setStyle("#ff922c"); // accent 2: warm gold

// Blob intensity: how visible the gradient blobs are
// When playing: very subdued. When stopped: more pronounced but still dark/moody.
const BLOB_INTENSITY_PLAYING = 0.25;
const BLOB_INTENSITY_STOPPED = 0.36;

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
  const { gl, scene, camera, size } = useThree();

  const noiseTexture = useTexture(
    "/assets/seamless.png",
    (texture: Texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
    }
  );

  // ── Postprocessing pipeline ─────────────────────────────────────────────
  // RenderPass → KawaseBlur (thick folds) → EffectPass (saccadé grain)
  const composerRef = useRef<EffectComposer>(null!);
  const grainUniformsRef = useRef<{
    uXCount: Uniform;
    uYCount: Uniform;
    uIntensity: Uniform;
  }>(null!);

  useMemo(() => {
    // Dispose previous composer if it exists (theme change, etc.)
    if (composerRef.current) {
      composerRef.current.dispose();
    }

    const pixelRatio = gl.getPixelRatio();

    // Grain uniforms — grid-based saccadé grain from leeroy.ca
    const uXCount = new Uniform(size.width / pixelRatio);
    const uYCount = new Uniform(size.height / pixelRatio);
    const uIntensity = new Uniform(1.29);
    grainUniformsRef.current = { uXCount, uYCount, uIntensity };

    // Passes
    const renderPass = new RenderPass(scene, camera);

    const blurPass = new KawaseBlurPass({ kernelSize: 2 });
    blurPass.scale = 2;

    const grainEffect = new Effect("grain", grainShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["uXCount", uXCount],
        ["uYCount", uYCount],
        ["uIntensity", uIntensity]
      ])
    });
    const effectPass = new EffectPass(camera, grainEffect);

    const composer = new EffectComposer(gl);
    composer.addPass(renderPass);
    composer.addPass(blurPass);
    composer.addPass(effectPass);

    composerRef.current = composer;
  }, [gl, scene, camera]);

  // Sync composer + grain uniforms on resize
  useEffect(() => {
    if (!composerRef.current) return;
    composerRef.current.setSize(size.width, size.height);

    const pixelRatio = gl.getPixelRatio();
    const gu = grainUniformsRef.current;
    if (gu) {
      gu.uXCount.value = size.width / pixelRatio;
      gu.uYCount.value = size.height / pixelRatio;
    }
  }, [size, gl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      composerRef.current?.dispose();
    };
  }, []);

  // ── Shader material ─────────────────────────────────────────────────────
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
  const color4 = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_COLOR4 : LIGHT_COLOR4),
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
      u_color4: color4,
      u_audioLevel: 0.0,
      u_fogProgress: 0.0,
      u_opacity: 1.0,
      u_blobIntensity: BLOB_INTENSITY_STOPPED,
      u_noiseTexture: noiseTexture
    }),
    [u_resolution, bgColor, color1, color2, color3, color4, noiseTexture]
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
    m.u_color4.value.copy(isDark ? DARK_COLOR4 : LIGHT_COLOR4);
  }, [isDark]);

  // Smoothly transition blob intensity based on playing state
  const targetBlobIntensity = useRef(BLOB_INTENSITY_STOPPED);
  useEffect(() => {
    targetBlobIntensity.current = playing
      ? BLOB_INTENSITY_PLAYING
      : BLOB_INTENSITY_STOPPED;
  }, [playing]);

  // ── Render loop — priority >= 1 disables R3F auto-render ────────────────
  useFrame((_state, delta) => {
    if (!materialRef.current) return;
    const m = materialRef.current.uniforms;

    m.u_time.value += delta;

    // Smoothly lerp blob intensity toward target
    const current = m.u_blobIntensity.value;
    const target = targetBlobIntensity.current;
    m.u_blobIntensity.value += (target - current) * delta * 1.5;

    // Reactive uniforms from MotionValues
    m.u_opacity.value = opacity.get();
    m.u_fogProgress.value = fogProgress.get();
    m.u_audioLevel.value = audioLevel.get();

    // Render through postprocessing pipeline
    composerRef.current?.render(delta);
  }, 1);

  return (
    <mesh>
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
