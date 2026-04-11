"use client";

import { useAudioAnalyser } from "@/components/Radio/hooks/useAudioAnalyser";
import { useIdleDetection } from "@/components/Radio/hooks/useIdleDetection";
import { SPRING_EASE, TE } from "@/constants/animations";
import { useRadioStore } from "@/providers/RadioProvider";
import { useTheme } from "@/providers/Theme";
import { useWindowResize } from "@/utilities/use_window_resize";
import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { animate, AnimationSequence } from "motion";
import {
  MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform
} from "motion/react";
import {
  BlendFunction,
  Effect,
  EffectComposer,
  EffectPass,
  KawaseBlurPass,
  RenderPass
} from "postprocessing";
import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import { FrontSide, Mesh, Vector2, Vector3 } from "three";
import {
  Color as ThreeColor,
  DoubleSide,
  RepeatWrapping,
  Texture,
  Uniform,
  Vector4
} from "three";
import { useShallow } from "zustand/shallow";
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
const DARK_BG = new ThreeColor().set("#080a0f"); // near-black ~4%
const DARK_COLOR1 = new ThreeColor().set("#2a2030"); // base 1: dark plum ~14%
const DARK_COLOR2 = new ThreeColor().set("#18253a"); // base 2: dark navy ~14%
const DARK_COLOR3 = new ThreeColor().set("#8c3535"); // accent 1: ember red ~28%
const DARK_COLOR4 = new ThreeColor().set("#1a6888"); // accent 2: teal ~32%
//
// ─── Light ────────────────────────────────────────────────────────────────
const LIGHT_BG = new ThreeColor().set("#f6f2ed"); // warm parchment
const LIGHT_COLOR1 = new ThreeColor().set("#e0d2c0"); // base 1: sandy cream
const LIGHT_COLOR2 = new ThreeColor().set("#d5cdd8"); // base 2: mauve-cream
const LIGHT_COLOR3 = new ThreeColor().set("#2d8a8c"); // accent 1: retro teal
const LIGHT_COLOR4 = new ThreeColor().set("#d4652a"); // accent 2: burnt orange

// Blob intensity: how strongly colors mix against bg.
// The blur handles subtlety — don't fight it with low intensity.
const BLOB_INTENSITY_PLAYING = 0.5;
const BLOB_INTENSITY_STOPPED = 0.65;

// ── Shader material defined at MODULE SCOPE — created once, never recreated ──
// Default uniform values don't matter; everything is set in useFrame/useEffect.

type AmbientGradientMeshProps = {};
const OPACITY_PLAYING = 0.7;
const OPACITY_STOPPED = 1.0;

export const AmbientGradientMesh = ({}: AmbientGradientMeshProps) => {
  useTexture.preload("/assets/seamless.png");
  const playing = useRadioStore(useShallow((s) => s.playing));
  const playState = useMotionValue(playing);
  useEffect(() => {
    playState.set(playing);
  }, [playState, playing]);
  const theme = useTheme((s) => s.theme);
  const isDark = theme === "dark";
  const opacit = useTransform(() =>
    playState.get() ? OPACITY_PLAYING : OPACITY_STOPPED + 0.01
  );
  const opacity = useSpring(opacit, {
    ...SPRING_EASE.power3.out,
    duration: 1.2
  });
  // Single instances of hooks — passed to both desktop and mobile backgrounds
  const { fogProgress } = useIdleDetection({
    timeout: 8000,
    maxFogTime: 15000,
    clearDuration: 650
  });
  const colore = useMemo(() => new ThreeColor("rgb(122,122,122)"), []);
  const vecc = useMemo(() => new Vector3(0, 0, 0.46), []);
  const { audioLevel } = useAudioAnalyser({
    fftSize: 256,
    smoothing: 0.85
  });
  const uniforms = useMemo(
    () => ({
      u_time: 0.1,
      u_resolution: new Vector2(1, 1),
      u_bgColor: new ThreeColor(),
      u_color1: new ThreeColor(),
      u_color2: new ThreeColor(),
      u_color3: new ThreeColor(),
      u_color4: new ThreeColor(),
      u_audioLevel: 0.0,
      u_fogProgress: 0.0,
      u_opacity: 1.0,
      u_speed: 0.02,
      u_size: 0.2,
      u_offset: new Vector2(0.42, 0.6),
      u_blobIntensity: BLOB_INTENSITY_STOPPED,
      u_noiseTexture: null as unknown as Texture
    }),
    []
  );
  const AmbientShader = shaderMaterial(uniforms, vertexShader, fragmentShader);

  // Register once at module level
  extend({ AmbientShader });
  const materialRef = useRef<InstanceType<typeof AmbientShader>>(null);
  const meshRef = useRef<Mesh>(null);
  const { gl, scene, camera } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const blurPassRef = useRef<KawaseBlurPass | null>(null);
  const grainUniforms = useMemo(() => {
    const uXCount = new Uniform(window.innerWidth / window.devicePixelRatio);
    const uYCount = new Uniform(window.innerHeight / window.devicePixelRatio);
    const uIntensity = new Uniform(1.29);
    return new Map<string, Uniform>([
      ["uXCount", uXCount],
      ["uYCount", uYCount],
      ["uIntensity", uIntensity]
    ]);
  }, []);
  const grainEffectsRef = useRef<Effect>(null);
  const noiseTexture = useTexture(
    "/assets/seamless.png",
    (texture: Texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
    }
  );
  const initSequence = useEffectEvent(() => {
    // Passes
    const renderPass = new RenderPass(scene, camera);

    // Start with moderate blur — kernelSize MEDIUM (2), scale 2.
    // Can increase later once gradient colors are confirmed visible.
    const blurPass = new KawaseBlurPass({ kernelSize: 2 });
    blurPass.scale = 2;
    blurPassRef.current = blurPass;

    const grainEffect = new Effect("grain", grainShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: grainUniforms
    });
    grainEffectsRef.current = grainEffect;
    const effectPass = new EffectPass(camera, grainEffect);

    const composer = new EffectComposer(gl);
    composer.multisampling = Math.min(4, 20);
    composer.removeAllPasses();
    composer.addPass(renderPass);
    composer.addPass(blurPass);
    composer.addPass(effectPass);
    composer.setSize(gl.domElement.offsetWidth, gl.domElement.offsetHeight);
    composerRef.current = composer;

    // Disable R3F auto-clear so our EffectComposer has full control
    gl.autoClear = false;

    return () => {
      composer.dispose();
      composerRef.current = null;
      gl.autoClear = true;
    };
  });
  const unmountCallback = useRef<() => void>(null);
  // ── Build postprocessing pipeline ONCE via useEffect ────────────────────
  useEffect(() => {
    if (!unmountCallback.current) {
      unmountCallback.current = initSequence();
    }
    return () => {
      unmountCallback.current?.();
    };
  }, []);
  const onResize = useEffectEvent(() => {
    if (!composerRef.current || !materialRef.current) return;
    gl.setSize(window.innerWidth, window.innerHeight);
    composerRef.current.setSize(
      gl.domElement.offsetWidth,
      gl.domElement.offsetHeight
    );

    const devicePixelRatio = window.devicePixelRatio || 2;

    gl.setPixelRatio(devicePixelRatio);
    materialRef.current.u_resolution.set(
      gl.domElement.offsetWidth,
      gl.domElement.offsetHeight
    );
    const gu = grainEffectsRef.current?.uniforms;
    if (gu) {
      const uxc = gu.get("uXCount");
      uxc && (uxc.value = window.innerWidth / devicePixelRatio);
      const uyc = gu.get("uYCount");
      uyc && (uyc.value = window.innerHeight / devicePixelRatio);
    }
  });
  const resizeTimestamp = useWindowResize({ debounce: 100 });
  // ── Sync sizes on resize ───────────────────────────────────────────────
  useEffect(() => {
    onResize();
  }, [resizeTimestamp]);
  useEffect(() => {
    onResize();
  }, []);
  // ── Set initial colors + texture on material (runs once after mount) ───
  const initializeShaderMaterial = useEffectEvent(() => {
    if (!materialRef.current) return;
    const m = materialRef.current;
    m.u_noiseTexture = noiseTexture;

    // Set initial theme colors
    const bg = isDark ? DARK_BG : LIGHT_BG;
    const c1 = isDark ? DARK_COLOR1 : LIGHT_COLOR1;
    const c2 = isDark ? DARK_COLOR2 : LIGHT_COLOR2;
    const c3 = isDark ? DARK_COLOR3 : LIGHT_COLOR3;
    const c4 = isDark ? DARK_COLOR4 : LIGHT_COLOR4;
    const seq: AnimationSequence = [
      [
        m.u_bgColor,
        bg.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color1,
        c1.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color2,
        c2.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color3,
        c3.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color4,
        c4.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ]
    ];
    animate(seq);
  });
  useEffect(() => {
    initializeShaderMaterial();
  }, []);

  // ── Update colors when theme changes ───────────────────────────────────
  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current;
    // Set initial theme colors
    const bg = isDark ? DARK_BG : LIGHT_BG;
    const c1 = isDark ? DARK_COLOR1 : LIGHT_COLOR1;
    const c2 = isDark ? DARK_COLOR2 : LIGHT_COLOR2;
    const c3 = isDark ? DARK_COLOR3 : LIGHT_COLOR3;
    const c4 = isDark ? DARK_COLOR4 : LIGHT_COLOR4;
    const seq: AnimationSequence = [
      [
        m.u_bgColor,
        bg.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color1,
        c1.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color2,
        c2.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color3,
        c3.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color4,
        c4.getRGB({ r: 1, g: 1, b: 1 }),
        {
          ease: TE.power3.inOut,
          duration: 0.3,
          type: "tween",
          at: 0
        }
      ]
    ];
    animate(seq);
  }, [isDark]);

  // ── Update resolution on resize ────────────────────────────────────────

  // Smoothly transition blob intensity
  const targetBlobIntensity = useRef(BLOB_INTENSITY_STOPPED);
  useEffect(() => {
    targetBlobIntensity.current = playing
      ? BLOB_INTENSITY_PLAYING
      : BLOB_INTENSITY_STOPPED;
  }, [playing]);
  useMotionValueEvent(opacity, "change", (latestValue) => {
    const m = materialRef.current;
    if (!m) return;
    m.u_opacity = latestValue;
  });
  useMotionValueEvent(fogProgress, "change", (latestValue) => {
    const m = materialRef.current;
    if (!m) return;
    m.u_fogProgress = latestValue;
  });
  useMotionValueEvent(audioLevel, "change", (latestValue) => {
    const m = materialRef.current;
    if (!m) return;
    m.u_audioLevel = latestValue;
  });
  // ── Render loop ─────────────────────────────────────────────────────────
  // R3F calls gl.render(scene, camera) AFTER all useFrame callbacks.
  // To prevent it from overwriting EffectComposer output, we:
  //   1. Make mesh visible for our EffectComposer render
  //   2. Render through EffectComposer (blur + grain → screen)
  //   3. Hide mesh so R3F's auto-render has nothing to draw
  useFrame((_state, delta) => {
    if (!materialRef.current || !composerRef.current || !meshRef.current) {
      console.log("something is not right...");
      return;
    }
    const m = materialRef.current;
    !didit.current && (console.log(delta), (didit.current = true));
    // Accumulate time (delta is in seconds at ~60fps → ~0.016)
    m.u_time += delta * 0.1;

    // Smoothly lerp blob intensity
    const current = m.u_blobIntensity;
    const target = targetBlobIntensity.current;
    m.u_blobIntensity += (target - current) * Math.min(delta * 0.2 * 1.5, 0.1);
    meshRef.current.visible = true;
    _state.gl.render(_state.scene, _state.camera);
  }, 1);
  const didit = useRef(false);
  useFrame((_state, delta) => {
    if (!materialRef.current || !composerRef.current || !meshRef.current) {
      console.log("something is not right...");
      return;
    }

    // Show mesh → render through postprocessing → hide mesh
    composerRef.current.render(delta);
    meshRef.current.visible = false;
  }, 2);

  return (
    <>
      <ambientLight args={[colore]} intensity={1} />
      <directionalLight color={colore} intensity={1} position={vecc} />
      <mesh ref={meshRef}>
        <planeGeometry args={[6.5, 6.5]} />
        {/* @ts-expect-error — dynamically extended shader material */}
        <ambientShader
          extensions={{
            derivatives: "#extension GL_OES_standard_derivatives: enable"
          }}
          side={DoubleSide}
          ref={materialRef}
        />
      </mesh>
    </>
  );
};
