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
//
// Brand DNA: rosso corsa red / orange / teal
// Target: 70s/80s magazine — faded, pop-art, luscious
//
// Bases (color1-2): near-bg tones, barely perceptible shift — atmospheric mood
// Accents (color3-4): recognizable hue that reads through Kawase blur
//
// ─── Dark ─────────────────────────────────────────────────────────────────
// FC Porto mourning + brand red/teal as deep atmospheric tint
// Like a dark room lit by a distant fire, with teal moonlight at the edges
const DARK_BG = new ThreeColor().setStyle("#080a0f"); // near-black, cold undertone
const DARK_COLOR1 = new ThreeColor().setStyle("#1a1318"); // base 1: dark burgundy-coal
const DARK_COLOR2 = new ThreeColor().setStyle("#0f1520"); // base 2: deep blue-black
const DARK_COLOR3 = new ThreeColor().setStyle("#3d1a1a"); // accent 1: deep ember red
const DARK_COLOR4 = new ThreeColor().setStyle("#0f3040"); // accent 2: deep ocean teal
//
// ─── Light ────────────────────────────────────────────────────────────────
// 70s sun-faded magazine: warm cream paper, watercolor washes of teal + orange
// Bases are tinted cream, accents are the "ink" colors
const LIGHT_BG = new ThreeColor().setStyle("#f6f2ed"); // warm parchment
const LIGHT_COLOR1 = new ThreeColor().setStyle("#ece2d4"); // base 1: sandy cream
const LIGHT_COLOR2 = new ThreeColor().setStyle("#e2dbe2"); // base 2: cool mauve-cream
const LIGHT_COLOR3 = new ThreeColor().setStyle("#2d8a8c"); // accent 1: retro teal
const LIGHT_COLOR4 = new ThreeColor().setStyle("#d4652a"); // accent 2: burnt orange

// Blob intensity: how visible the gradient blobs are
// Tuned for larger blobs + wider noise modulation + Kawase blur at scale 3
// Playing: subdued background. Stopped: blobs are atmospheric but noticeable.
const BLOB_INTENSITY_PLAYING = 0.30;
const BLOB_INTENSITY_STOPPED = 0.42;

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

    // Kawase blur — higher scale = thicker fold compression at blob edges
    // Leeroy uses scale 2 for normal, 5 for menu. We use 3 for pronounced folds.
    const blurPass = new KawaseBlurPass({ kernelSize: 3 });
    blurPass.scale = 3;

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
