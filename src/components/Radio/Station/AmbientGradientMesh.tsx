"use client";

import { useIdleDetection } from "@/components/Radio/hooks/useIdleDetection";
import { SPRING_EASE, TE } from "@/constants/animations";
import { useAudioLevel, usePlayState } from "@/providers/HideawayFM/hooks";
import { useTheme } from "@/providers/Theme";
import { rp_lerp } from "@/utilities/rp_utils";
import { useWindowResize } from "@/utilities/use_window_resize";
import { wait } from "@/utilities/wait";
import {
  OrthographicCamera,
  ScreenQuad,
  shaderMaterial,
  useTexture
} from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { GPUComputationRenderer, Variable } from "three-stdlib";
import { animate, AnimationSequence, cancelFrame, frame } from "motion";
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
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  FrontSide,
  IUniform,
  Mesh,
  ShaderMaterial,
  Vector2,
  Vector3
} from "three";
import {
  Color as ThreeColor,
  DoubleSide,
  RepeatWrapping,
  Texture,
  Uniform,
  Vector4
} from "three";
import { number } from "zod";
import { useShallow } from "zustand/shallow";
import fragmentShader from "../shaders/ambient.frag.glsl";
import vertexShader from "../shaders/ambient.vert.glsl";
import grainShader from "../shaders/grain.glsl";
import simulFragShader from "../shaders/simul.frag.glsl";

const displacementShader = `
uniform sampler2D uSimulationTexture;
uniform vec2 uDisplacementStrength;
uniform float uCursorColoring;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 gpgpuColor = texture2D(uSimulationTexture, vUv);
    vec2 dUv = vec2(
        uv.x - (-0.5 + gpgpuColor.r) * uDisplacementStrength.x * gpgpuColor.b,
        uv.y - (-0.5 + gpgpuColor.g) * uDisplacementStrength.y * gpgpuColor.b
    );
    vec4 color = texture2D(inputBuffer, dUv);
    color.rgb += color.rgb * gpgpuColor.b * uCursorColoring;
    outputColor = vec4(color.rgb, 1.0);
}`;

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
const DARK_BG = new ThreeColor().setHex(0x2d2d30); // near-black ~4%
const DARK_COLOR1 = new ThreeColor().setHex(0x2a2030); // base 1: dark plum ~14%
const DARK_COLOR2 = new ThreeColor().setHex(0x18253a); // base 2: dark navy ~14%
const DARK_COLOR3 = new ThreeColor().setHex(0x35588c); // accent 1: ember red ~28%
const DARK_COLOR4 = new ThreeColor().setHex(0x1a6888); // accent 2: teal ~32%
//
// ─── Light ────────────────────────────────────────────────────────────────
const LIGHT_BG = new ThreeColor().setHex(0xf6f2ed); // warm parchment
const LIGHT_COLOR1 = new ThreeColor().setHex(0xd5923b); // base 1: sandy cream
const LIGHT_COLOR2 = new ThreeColor().setHex(0xd5cdd8); // base 2: mauve-cream
const LIGHT_COLOR3 = new ThreeColor().setHex(0x2d8a8c); // accent 1: retro teal
const LIGHT_COLOR4 = new ThreeColor().setHex(0xd4652a); // accent 2: burnt orange

// Blob intensity: how strongly colors mix against bg.
// The blur handles subtlety — don't fight it with low intensity.
const BLOB_INTENSITY_PLAYING = 0.5;
const BLOB_INTENSITY_STOPPED = 0.65;

// ── Shader material defined at MODULE SCOPE — created once, never recreated ──
// Default uniform values don't matter; everything is set in useFrame/useEffect.

type AmbientGradientMeshProps = {};
const OPACITY_PLAYING = 0.8;
const OPACITY_STOPPED = 0.9;

export const AmbientGradientMesh = ({}: AmbientGradientMeshProps) => {
  useTexture.preload("/assets/seamless.png");
  const { optimistic } = usePlayState();
  const playing = optimistic === "playing";
  const playState = useMotionValue(playing);
  const cam = useRef<typeof OrthographicCamera>(null);
  useEffect(() => {
    playState.set(playing);
  }, [playState, playing]);
  const theme = useTheme((s) => s.theme);
  const [isDark, setIsDark] = useState(theme === "dark");
  useEffect(
    () =>
      theme === "dark"
        ? setIsDark(true)
        : theme === "light"
          ? setIsDark(false)
          : setIsDark(
              window.matchMedia("(prefers-color-scheme: dark)").matches
            ),
    [theme]
  );
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
  const radioAudio = useAudioLevel();

  const noiseTexture = useTexture("/assets/seamless.png", (texture) => {
    texture.wrapS = texture.wrapT = RepeatWrapping;
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
      u_opacity: 0.1,
      u_speed: 0.02,
      u_size: 0.2,
      u_offset: new Vector2(0.42, 0.6),
      u_blobIntensity: BLOB_INTENSITY_STOPPED,
      u_noiseTexture: noiseTexture as Texture
    }),
    []
  );
  const AmbientShader = shaderMaterial(uniforms, vertexShader, fragmentShader);
  extend({ AmbientShader });

  const materialRef = useRef<
    Omit<ShaderMaterial, "uniforms"> & {
      uniforms: {
        [X in keyof typeof uniforms]: IUniform<(typeof uniforms)[X]>;
      };
    }
  >(null);
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

  // ── GPGPU mouse-trail simulation ───────────────────────────────────────
  const mouseUv = useMemo(() => new Vector2(0.5, 0.5), []);
  const prevMouseUv = useMemo(() => new Vector2(0.5, 0.5), []);
  const uMouseFactor = useMemo(() => new Uniform(0), []);
  const uSimulationTexture = useMemo(
    () => new Uniform<Texture | null>(null),
    []
  );
  const gpgpuRef = useRef<GPUComputationRenderer | null>(null);
  const tPositionVarRef = useRef<Variable | null>(null);

  const initializeShaderMaterial = useEffectEvent(() => {
    if (!materialRef.current) return;
    if (!meshRef.current || !noiseTexture) return;
    const m = materialRef.current;
    // m.u_noiseTexture = noiseTexture;
    m.uniforms.u_resolution.value = new Vector2(
      window.innerWidth,
      window.innerHeight
    );
  });
  const setColors = useEffectEvent((duration = 0.3) => {
    const me = materialRef.current;
    if (!me) return;
    const m = me.uniforms;
    // Set initial theme colors
    const bg = isDark ? DARK_BG : LIGHT_BG;
    const c1 = isDark ? DARK_COLOR1 : LIGHT_COLOR1;
    const c2 = isDark ? DARK_COLOR2 : LIGHT_COLOR2;
    const c3 = isDark ? DARK_COLOR3 : LIGHT_COLOR3;
    const c4 = isDark ? DARK_COLOR4 : LIGHT_COLOR4;

    const seq: AnimationSequence = [
      [
        m.u_bgColor.value,
        {
          r: bg.r,
          g: bg.g,
          b: bg.b
        },
        {
          ease: TE.power2.inOut,
          duration,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color1.value,
        {
          r: c1.r,
          g: c1.g,
          b: c1.b
        },
        {
          ease: TE.power2.inOut,

          duration,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color2.value,
        {
          r: c2.r,
          g: c2.g,
          b: c2.b
        },
        {
          ease: TE.power2.inOut,

          duration,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color3.value,
        {
          r: c3.r,
          g: c3.g,
          b: c3.b
        },
        {
          ease: TE.power2.inOut,

          duration,
          type: "tween",
          at: 0
        }
      ],
      [
        m.u_color4.value,
        {
          r: c4.r,
          g: c4.g,
          b: c4.b
        },
        {
          ease: TE.power2.inOut,
          duration,
          type: "tween",
          at: 0
        }
      ]
    ];
    animate(seq);
  });
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
    composer.setSize(gl.domElement.offsetWidth, gl.domElement.offsetHeight);
    composer.addPass(renderPass);
    composer.addPass(blurPass);
    composer.addPass(effectPass);
    composerRef.current = composer;

    // Disable R3F auto-clear so our EffectComposer has full control
    gl.autoClear = false;

    return () => {
      composer.dispose();
      composerRef.current = null;
      gl.autoClear = true;
    };
  });
  const onResize = useEffectEvent(() => {
    gl.setSize(window.innerWidth, window.innerHeight);
    const devicePixelRatio = window.devicePixelRatio || 2;

    composerRef.current &&
      composerRef.current.setSize(window.innerWidth, window.innerHeight);

    gl.setPixelRatio(devicePixelRatio);
    materialRef.current &&
      (materialRef.current.uniforms.u_resolution.value = new Vector2(
        window.innerWidth,
        window.innerHeight
      ));
    const gu = grainEffectsRef.current?.uniforms;
    if (gu) {
      const uxc = gu.get("uXCount");
      uxc && (uxc.value = window.innerWidth / devicePixelRatio);
      const uyc = gu.get("uYCount");
      uyc && (uyc.value = window.innerHeight / devicePixelRatio);
    }
  });
  const unmountCallback = useRef<() => void>(null);
  // ── Build postprocessing pipeline ONCE via useEffect ────────────────────
  useEffect(() => {
    if (!unmountCallback.current) {
      initializeShaderMaterial();
      setColors(1);
      unmountCallback.current = initSequence();

      onResize();
    }
    return () => {
      unmountCallback.current?.();
      unmountCallback.current = null;
    };
  }, []);
  //
  // // ── Pointer tracking → mouseUv / prevMouseUv / uMouseFactor ───────────
  // useEffect(() => {
  //   let factorTimeout: ReturnType<typeof setTimeout> | null = null;
  //   const onPointerMove = (e: PointerEvent) => {
  //     prevMouseUv.copy(mouseUv);
  //     mouseUv.x = e.clientX / window.innerWidth;
  //     mouseUv.y = 1 - e.clientY / window.innerHeight;
  //     uMouseFactor.value = 1;
  //     if (factorTimeout) clearTimeout(factorTimeout);
  //     factorTimeout = setTimeout(() => {
  //       uMouseFactor.value = 0;
  //     }, 50);
  //   };
  //   window.addEventListener("pointermove", onPointerMove);
  //   return () => {
  //     window.removeEventListener("pointermove", onPointerMove);
  //     if (factorTimeout) clearTimeout(factorTimeout);
  //   };
  // }, [mouseUv, prevMouseUv, uMouseFactor]);

  const resizeTimestamp = useWindowResize({ debounce: 100 });
  // ── Sync sizes on resize ───────────────────────────────────────────────
  useEffect(() => {
    onResize();
  }, [resizeTimestamp]);
  // ── Set initial colors + texture on material (runs once after mount) ───

  // ── Update colors when theme changes ───────────────────────────────────
  useEffect(() => {
    setColors();
  }, [isDark]);

  // ── Update resolution on resize ────────────────────────────────────────

  // Smoothly transition blob intensity
  const _targetBlobIntensity = useMotionValue(BLOB_INTENSITY_STOPPED);
  const targetBlobIntensity = useSpring(_targetBlobIntensity, {
    ...SPRING_EASE.power3.inOut,
    duration: 0.3
  });
  useEffect(() => {
    const target = playing ? BLOB_INTENSITY_PLAYING : BLOB_INTENSITY_STOPPED;
    _targetBlobIntensity.set(target);
  }, [playing, _targetBlobIntensity]);
  useMotionValueEvent(opacity, "change", (latestValue) => {
    const m = materialRef.current;
    if (!m) return;
    m.uniforms.u_opacity.value = latestValue;
  });
  useMotionValueEvent(fogProgress, "change", (latestValue) => {
    const m = materialRef.current;
    if (!m) return;
    m.uniforms.u_fogProgress.value = latestValue;
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
    m.uniforms.u_time.value += delta * 0.1;
    const aud = radioAudio.get();
    m.uniforms.u_audioLevel.value = aud;
    // Smoothly lerp blob intensity
    const current = m.uniforms.u_blobIntensity.value;
    const target = targetBlobIntensity.get();
    const lerpedValue = rp_lerp(current, target, 0.16);
    m.uniforms.u_blobIntensity.value = lerpedValue;

    // Tick GPGPU mouse-trail simulation
    const gpgpu = gpgpuRef.current;
    const tPos = tPositionVarRef.current;
    if (gpgpu && tPos) {
      const u = tPos.material.uniforms;
      u.uTime.value += delta;
      u.uDelta.value = delta * 1000;
      u.uMouseFactor.value = uMouseFactor.value;
      gpgpu.compute();
      uSimulationTexture.value = gpgpu.getCurrentRenderTarget(tPos).texture;
    }
    meshRef.current.visible = true;
    _state.gl.render(_state.scene, _state.camera);
  }, 1);
  const didit = useRef(false);
  useFrame((_state, delta) => {
    if (!materialRef.current || !composerRef.current || !meshRef.current) {
      return;
    }
    // Show mesh → render through postprocessing → hide mesh
    composerRef.current.render(delta);
    meshRef.current.visible = false;
  }, 2);

  return (
    <ScreenQuad ref={meshRef} frustumCulled={false}>
      {/*<ambientShader*/}
      {/*  */}
      {/*  side={FrontSide}*/}
      {/*  ref={materialRef}*/}
      {/*/>*/}

      {/** @ts-expect-error this fucking thing won't reconcile **/}
      <ambientShader ref={materialRef} side={DoubleSide} />
    </ScreenQuad>
  );
};
