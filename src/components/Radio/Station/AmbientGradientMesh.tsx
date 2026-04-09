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
import { useEffect, useRef } from "react";
import type { Mesh } from "three";
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
// KEY INSIGHT from leeroy.ca: blob colors are MODERATELY bright even in dark
// mode. The Kawase blur averaging is what creates subtlety — not low-luminance
// colors. If blob colors are too close to BG, blur smears them to nothing.
//
// Leeroy ref luminances: bg ~6%, bases ~15-26%, accents ~36-56%.
// Our palette follows the same structure.
//
// ─── Dark ─────────────────────────────────────────────────────────────────
const DARK_BG = new ThreeColor().setStyle("#080a0f");     // near-black ~4%
const DARK_COLOR1 = new ThreeColor().setStyle("#2a2030"); // base 1: dark plum ~14%
const DARK_COLOR2 = new ThreeColor().setStyle("#18253a"); // base 2: dark navy ~14%
const DARK_COLOR3 = new ThreeColor().setStyle("#8c3535"); // accent 1: ember red ~28%
const DARK_COLOR4 = new ThreeColor().setStyle("#1a6888"); // accent 2: teal ~32%
//
// ─── Light ────────────────────────────────────────────────────────────────
const LIGHT_BG = new ThreeColor().setStyle("#f6f2ed");    // warm parchment
const LIGHT_COLOR1 = new ThreeColor().setStyle("#e0d2c0"); // base 1: sandy cream
const LIGHT_COLOR2 = new ThreeColor().setStyle("#d5cdd8"); // base 2: mauve-cream
const LIGHT_COLOR3 = new ThreeColor().setStyle("#2d8a8c"); // accent 1: retro teal
const LIGHT_COLOR4 = new ThreeColor().setStyle("#d4652a"); // accent 2: burnt orange

// Blob intensity: how strongly colors mix against bg.
// The blur handles subtlety — don't fight it with low intensity.
const BLOB_INTENSITY_PLAYING = 0.50;
const BLOB_INTENSITY_STOPPED = 0.65;

// ── Shader material defined at MODULE SCOPE — created once, never recreated ──
// Default uniform values don't matter; everything is set in useFrame/useEffect.
const AmbientShader = shaderMaterial(
  {
    u_time: 0,
    u_resolution: new Vector4(1, 1, 1, 1),
    u_bgColor: new ThreeColor(),
    u_color1: new ThreeColor(),
    u_color2: new ThreeColor(),
    u_color3: new ThreeColor(),
    u_color4: new ThreeColor(),
    u_audioLevel: 0.0,
    u_fogProgress: 0.0,
    u_opacity: 1.0,
    u_blobIntensity: BLOB_INTENSITY_STOPPED,
    u_noiseTexture: null as unknown as Texture
  },
  vertexShader,
  fragmentShader
);

// Register once at module level
extend({ AmbientShader });

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
  const meshRef = useRef<Mesh>(null);
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const blurPassRef = useRef<KawaseBlurPass | null>(null);
  const grainUniformsRef = useRef<{
    uXCount: Uniform;
    uYCount: Uniform;
    uIntensity: Uniform;
  } | null>(null);

  const noiseTexture = useTexture(
    "/assets/seamless.png",
    (texture: Texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
    }
  );

  // ── Build postprocessing pipeline ONCE via useEffect ────────────────────
  useEffect(() => {
    const pixelRatio = gl.getPixelRatio();

    // Grain uniforms
    const uXCount = new Uniform(size.width / pixelRatio);
    const uYCount = new Uniform(size.height / pixelRatio);
    const uIntensity = new Uniform(1.29);
    grainUniformsRef.current = { uXCount, uYCount, uIntensity };

    // Passes
    const renderPass = new RenderPass(scene, camera);

    // Start with moderate blur — kernelSize MEDIUM (2), scale 2.
    // Can increase later once gradient colors are confirmed visible.
    const blurPass = new KawaseBlurPass({ kernelSize: 2 });
    blurPass.scale = 2;
    blurPassRef.current = blurPass;

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
    composer.setSize(size.width, size.height);
    composerRef.current = composer;

    // Disable R3F auto-clear so our EffectComposer has full control
    gl.autoClear = false;

    return () => {
      composer.dispose();
      composerRef.current = null;
      gl.autoClear = true;
    };
    // gl, scene, camera are stable R3F refs — this runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync sizes on resize ───────────────────────────────────────────────
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

  // ── Set initial colors + texture on material (runs once after mount) ───
  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current;
    m.uniforms.u_noiseTexture.value = noiseTexture;
    m.uniforms.u_resolution.value.set(size.width, size.height, 1, 1);

    // Set initial theme colors
    const bg = isDark ? DARK_BG : LIGHT_BG;
    const c1 = isDark ? DARK_COLOR1 : LIGHT_COLOR1;
    const c2 = isDark ? DARK_COLOR2 : LIGHT_COLOR2;
    const c3 = isDark ? DARK_COLOR3 : LIGHT_COLOR3;
    const c4 = isDark ? DARK_COLOR4 : LIGHT_COLOR4;
    m.uniforms.u_bgColor.value.copy(bg);
    m.uniforms.u_color1.value.copy(c1);
    m.uniforms.u_color2.value.copy(c2);
    m.uniforms.u_color3.value.copy(c3);
    m.uniforms.u_color4.value.copy(c4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noiseTexture]);

  // ── Update colors when theme changes ───────────────────────────────────
  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current.uniforms;
    m.u_bgColor.value.copy(isDark ? DARK_BG : LIGHT_BG);
    m.u_color1.value.copy(isDark ? DARK_COLOR1 : LIGHT_COLOR1);
    m.u_color2.value.copy(isDark ? DARK_COLOR2 : LIGHT_COLOR2);
    m.u_color3.value.copy(isDark ? DARK_COLOR3 : LIGHT_COLOR3);
    m.u_color4.value.copy(isDark ? DARK_COLOR4 : LIGHT_COLOR4);
  }, [isDark]);

  // ── Update resolution on resize ────────────────────────────────────────
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_resolution.value.set(
      size.width,
      size.height,
      1,
      1
    );
  }, [size]);

  // Smoothly transition blob intensity
  const targetBlobIntensity = useRef(BLOB_INTENSITY_STOPPED);
  useEffect(() => {
    targetBlobIntensity.current = playing
      ? BLOB_INTENSITY_PLAYING
      : BLOB_INTENSITY_STOPPED;
  }, [playing]);

  // ── Render loop ─────────────────────────────────────────────────────────
  // R3F calls gl.render(scene, camera) AFTER all useFrame callbacks.
  // To prevent it from overwriting EffectComposer output, we:
  //   1. Make mesh visible for our EffectComposer render
  //   2. Render through EffectComposer (blur + grain → screen)
  //   3. Hide mesh so R3F's auto-render has nothing to draw
  useFrame((_state, delta) => {
    if (!materialRef.current || !composerRef.current || !meshRef.current)
      return;
    const m = materialRef.current.uniforms;

    // Accumulate time (delta is in seconds at ~60fps → ~0.016)
    m.u_time.value += delta;

    // Smoothly lerp blob intensity
    const current = m.u_blobIntensity.value;
    const target = targetBlobIntensity.current;
    m.u_blobIntensity.value += (target - current) * Math.min(delta * 2.0, 0.1);

    // Read reactive MotionValues
    m.u_opacity.value = opacity.get();
    m.u_fogProgress.value = fogProgress.get();
    m.u_audioLevel.value = audioLevel.get();

    // Show mesh → render through postprocessing → hide mesh
    meshRef.current.visible = true;
    composerRef.current.render(delta);
    meshRef.current.visible = false;
  }, 1);

  return (
    // Start hidden — only visible during EffectComposer render in useFrame
    <mesh ref={meshRef} visible={false} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      {/* @ts-expect-error — dynamically extended shader material */}
      <ambientShader
        ref={materialRef}
        side={DoubleSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
