"use client";

/**
 * The Catalyst fragrance scene — the single canonical react-three-fiber scene.
 *
 * A faithful port of the legacy imperative `fragrance-scene.tsx` (its RENDERED
 * OUTPUT is the spec; its monolithic-useEffect implementation is not). Behaviour
 * is preserved part-for-part; the implementation is idiomatic r3f:
 *   • <Canvas> owns the renderer, DPR, resize and disposal.
 *   • One live reaction frame (a single useRef) is mutated in ONE useFrame and
 *     read by children through refs — zero per-frame React renders/allocations.
 *   • The founder-tuned GLSL water and the velocity-spring camera are reused as
 *     legacy authored them (NOT drei MeshReflectorMaterial / CameraControls).
 *   • The bottle is a SLOT: same reaction input → same in-scene output as the
 *     old glass bottle, but backed by the catalyst-10 GLB + baked textures.
 *
 * `mode="showcase"` drives the scroll choreography; `mode="product"` is the PDP
 * held studio shot (fixed camera, constant grade, idle tumble, no water/plume).
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MotionValue } from "motion/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect } from "postprocessing";
import * as THREE from "three";
import {
  evaluateLostFragranceReaction,
  type LostFragranceRGB
} from "./fragrance-light";
import { evaluateLostFragranceCamera, stageProgress } from "./fragrance-camera";
import { getLostProductViewCamera } from "./fragrance-product-view";
import { buildNeutralEnvironment } from "./fragrance-bottle";
import { CatalystModel } from "./fragrance-catalyst";
import {
  REACTION_FIELD_FRAG,
  REACTION_FIELD_VERT
} from "./fragrance-scene-objects";
import { FragranceWater } from "./fragrance-water-r3f";
import { shouldPauseLostFragranceScene } from "./fragrance-scene-state";
import { useFragranceR3fTuning } from "./fragrance-r3f-tuning";

// Dev-only tuning panel (leva + localStorage variants). Behind a dynamic import
// gated on NODE_ENV so leva is tree-shaken out of the production bundle.
const FragranceR3fPanel =
  process.env.NODE_ENV === "production"
    ? null
    : dynamic(
        () =>
          import("./fragrance-r3f-panel").then((m) => m.FragranceR3fPanel),
        { ssr: false }
      );

type SceneMode = "showcase" | "product";

const DAMP_RATE = 0.006;
// Velocity spring chasing the staged scroll target. Critically UNDER-damped
// (CAM_DAMP < 2·√CAM_STIFFNESS ≈ 18.97) so each beat overshoots and settles —
// the kinetic push legacy authored.
const CAM_STIFFNESS = 90;
const CAM_DAMP = 16;
const CAM_MAX_STEP = 1 / 30;

const MAX_PIXEL_RATIO = 1.5;
const MAX_MOBILE_PIXEL_RATIO = 1.25;
const MOBILE_MAX_WIDTH = 767;

const BOTTLE_SCALE = 0.7;
// founder-baked ember back-light balance (mirrors the old bottle's setReaction)
const EMBER_BACK_BASE = 1.554;
const EMBER_BACK_SWING = 16.65;

// product-mode grade — held constant, never scroll-driven
const PRODUCT_SPIN_RATE = 0.00018; // rad/ms → one slow revolution ≈ 35s
const PRODUCT_TILT_RATE = 0.00007; // gentle nod so the cap catches light off-axis
const PRODUCT_REACTION = 0.14; // faint warmth in the juice, not a lit ember
const PRODUCT_EMBER_SAMPLE = 0.6; // where on the ramp to sample the ember colour
const PRODUCT_ENV_URL = "/assets/env_hdr1.webp"; // equirect studio panorama
const PRODUCT_ENV_BG_INTENSITY = 0.12; // keep the backdrop a near-black void…
const PRODUCT_ENV_BG_BLUR = 1; // …and fully soft — reads as atmosphere, not scene
const PRODUCT_EXPOSURE = 2; // founder's baked stop (product mode never scrolls)
const PRODUCT_BLOOM = 0.86; // at-rest bloom, matching the curve's dormant key

const FIELD_LAYERS = [
  { depth: 0, h: 10.5, w: 15, z: -3.6 },
  { depth: 0.5, h: 12, w: 17, z: -5 },
  { depth: 1, h: 13.5, w: 19, z: -6.4 }
];

const MOTE_COUNT = 220;
const MOTE_SPAN = { x: 8, y: 8, z: 5 };
const MOTE_COLOR: LostFragranceRGB = [0.95, 0.5, 0.24];

/* ---------- live reaction frame: mutated by the rig, read by children ---------- */

type ReactionFrame = {
  background: THREE.Color;
  ember: THREE.Color;
  reaction: number;
  juice: number;
  key: number;
  projection: number;
  particulate: number;
  exposure: number;
  bloom: number;
};

function toColor(target: THREE.Color, rgb: LostFragranceRGB): THREE.Color {
  return target.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
}

function seeded(index: number, salt: number): number {
  const v = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function createReactionFrame(): ReactionFrame {
  const opening = evaluateLostFragranceReaction(0);
  return {
    background: toColor(new THREE.Color(), opening.background),
    bloom: opening.bloom,
    ember: toColor(new THREE.Color(), opening.ember),
    exposure: opening.exposure,
    juice: opening.juice,
    key: opening.key,
    particulate: opening.particulate,
    projection: opening.projection,
    reaction: opening.reaction
  };
}

/** Pause the frame loop while the tab is hidden (reactively), as legacy did. */
function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(
    () => typeof document !== "undefined" && document.hidden
  );
  useEffect(() => {
    const onChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return hidden;
}

/* ---------- ember backdrop: the blessed plume as layered world-space planes ---------- */

function EmberBackdrop({
  uProg,
  uTime
}: {
  uProg: { value: number };
  uTime: { value: number };
}) {
  return (
    <>
      {FIELD_LAYERS.map((layer) => (
        <mesh
          key={layer.z}
          position={[0, layer.h * 0.5, layer.z]}
          renderOrder={-1}
        >
          <planeGeometry args={[layer.w, layer.h]} />
          <shaderMaterial
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fragmentShader={REACTION_FIELD_FRAG}
            transparent
            uniforms={{ uDepth: { value: layer.depth }, uProg, uTime }}
            vertexShader={REACTION_FIELD_VERT}
          />
        </mesh>
      ))}
    </>
  );
}

/* ---------- bottle: the SLOT — catalyst-10 GLB, driven like the old glass bottle.
 * Same input (reaction → ember back-light) and same in-scene output; only the
 * internals swap to the baked-texture GLB (fragrance-catalyst.tsx). ---------- */

function Bottle({
  live,
  mode
}: {
  live: React.RefObject<ReactionFrame>;
  mode: SceneMode;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const group = useRef<THREE.Group>(null);
  const emberBack = useRef<THREE.PointLight>(null);

  // warm PMREM ember env so the transmission glass has something to
  // reflect/refract — showcase only; product mode's studio HDR owns the env.
  useEffect(() => {
    if (mode !== "showcase") return;
    const env = buildNeutralEnvironment(gl);
    const previous = scene.environment;
    scene.environment = env;
    return () => {
      if (scene.environment === env) scene.environment = previous;
      env.dispose();
    };
  }, [gl, scene, mode]);

  useFrame(({ clock }, delta) => {
    const frame = live.current;
    const r = THREE.MathUtils.clamp(frame.reaction, 0, 1);
    if (group.current) {
      if (mode === "product") {
        group.current.rotation.y += PRODUCT_SPIN_RATE * delta * 1000;
        group.current.rotation.x =
          Math.sin(clock.elapsedTime * 1000 * PRODUCT_TILT_RATE) * 0.04;
      } else {
        // a subtle sway (not a spin) so the glass faces catch the ember
        group.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.18;
      }
    }
    if (emberBack.current) {
      emberBack.current.color.copy(frame.ember);
      emberBack.current.intensity = EMBER_BACK_BASE + EMBER_BACK_SWING * r;
    }
  });

  return (
    <>
      {/* ember key behind the flacon, in scene space (NOT inside the scaled
          group — legacy added it to the scene at world coords) */}
      <pointLight
        color={0xff5f22}
        decay={2}
        distance={26}
        intensity={0}
        position={[0, 1.15, -2.3]}
        ref={emberBack}
      />
      <group ref={group} scale={BOTTLE_SCALE}>
        <Suspense fallback={null}>
          <CatalystModel />
        </Suspense>
      </group>
    </>
  );
}

/* ---------- ember particulate ---------- */

function EmberParticles({
  live,
  pointsRef
}: {
  live: React.RefObject<ReactionFrame>;
  pointsRef: React.RefObject<THREE.Points | null>;
}) {
  const material = useRef<THREE.PointsMaterial>(null);
  const geometry = useRef<THREE.BufferGeometry>(null);
  const initialColor = useMemo(
    () => new THREE.Color(MOTE_COLOR[0], MOTE_COLOR[1], MOTE_COLOR[2]),
    []
  );
  const { drift, positions } = useMemo(() => {
    const pos = new Float32Array(MOTE_COUNT * 3);
    const drf = new Float32Array(MOTE_COUNT * 3);
    for (let i = 0; i < MOTE_COUNT; i += 1) {
      pos[i * 3] = (seeded(i, 1) - 0.5) * MOTE_SPAN.x;
      pos[i * 3 + 1] = (seeded(i, 2) - 0.5) * MOTE_SPAN.y + 1.6;
      pos[i * 3 + 2] = (seeded(i, 3) - 0.5) * MOTE_SPAN.z - 3;
      drf[i * 3] = (seeded(i, 4) - 0.5) * 0.16;
      drf[i * 3 + 1] = 0.08 + seeded(i, 5) * 0.14;
      drf[i * 3 + 2] = (seeded(i, 6) - 0.5) * 0.1;
    }
    return { drift: drf, positions: pos };
  }, []);
  useFrame((_, delta) => {
    const frame = live.current;
    if (material.current) {
      material.current.opacity = frame.particulate * 0.32;
      material.current.color.copy(frame.ember);
    }
    const attribute = geometry.current?.attributes.position;
    if (!attribute) return;
    const arr = attribute.array as Float32Array;
    const topY = MOTE_SPAN.y / 2 + 1.6;
    for (let i = 0; i < MOTE_COUNT; i += 1) {
      arr[i * 3] += drift[i * 3] * delta;
      arr[i * 3 + 1] += drift[i * 3 + 1] * delta;
      arr[i * 3 + 2] += drift[i * 3 + 2] * delta;
      if (arr[i * 3 + 1] > topY + 2) arr[i * 3 + 1] = -topY + 1.6;
    }
    attribute.needsUpdate = true;
  });
  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
      </bufferGeometry>
      <pointsMaterial
        blending={THREE.AdditiveBlending}
        color={initialColor}
        depthWrite={false}
        opacity={0}
        ref={material}
        size={0.045}
        sizeAttenuation
        transparent
      />
    </points>
  );
}

/* ---------- bloom: raw BloomEffect via <primitive> so the rig owns per-frame
 * intensity directly (a ref on the wrapped <Bloom> is circular under R19). ---------- */

function ReactiveBloom({ live }: { live: React.RefObject<ReactionFrame> }) {
  const bloomMul = useFragranceR3fTuning((s) => s.bloom);
  const effect = useMemo(
    () =>
      new BloomEffect({
        intensity: PRODUCT_BLOOM,
        luminanceSmoothing: 0.32,
        luminanceThreshold: 0.5,
        mipmapBlur: true
      }),
    []
  );
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame(() => {
    effect.intensity = live.current.bloom * bloomMul;
  });
  return <primitive dispose={null} object={effect} />;
}

/* ---------- showcase rig: one useFrame drives curve → scene + camera spring ---------- */

function SceneContents({ progress }: { progress: MotionValue<number> }) {
  const expMul = useFragranceR3fTuning((s) => s.exp);
  const keyInt = useFragranceR3fTuning((s) => s.key);
  const reflRes = useFragranceR3fTuning((s) => s.refl);
  const trs = useFragranceR3fTuning((s) => s.trs);
  // THE r3f-only perf regression: <EffectComposer> from @react-three/postprocessing
  // defaults multisampling to 8 (8× MSAA on a HalfFloat HDR target, every frame).
  // Legacy built the composer imperatively (`new EffectComposer`), whose default
  // is 0 — so it never paid this. Match legacy: 0.
  const msaa = useFragranceR3fTuning((s) => s.msaa);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const live = useRef<ReactionFrame>(createReactionFrame());
  const scratch = useRef({
    targetBg: new THREE.Color(),
    targetEmber: new THREE.Color()
  });
  const cam = useRef({ drive: 0, vel: 0 });
  // eased scroll progress driving the plume: raw `p` jumps with the scrollbar,
  // so the field would pop in/out. Damped on the same time-constant as the
  // colour/ember lerps below, it eases like the rest of the scene. Kept in
  // scroll-space (not swapped for l.reaction) so the shader's
  // smoothstep(0.30, 0.72, uProg) ignition band stays aligned.
  const progSmooth = useRef(0);
  const fieldUniforms = useRef({
    uProg: { value: 0 },
    uTime: { value: 0 }
  });
  const emberPoints = useRef<THREE.Points>(null);

  // seed the background so the first painted frame is the dormant near-black,
  // not the renderer's default clear colour
  useEffect(() => {
    scene.background = live.current.background;
  }, [scene]);

  // glass transmission sub-pass runs on every render() (main AND water mirror);
  // this renderer-global scales its target. Applied in an effect so it stays
  // live-tunable from the dev panel.
  useEffect(() => {
    gl.transmissionResolutionScale = trs;
  }, [gl, trs]);

  useFrame((state, delta) => {
    const s = scratch.current;
    const l = live.current;
    const p = THREE.MathUtils.clamp(progress.get(), 0, 1);
    const target = evaluateLostFragranceReaction(p);
    const damp = 1 - Math.exp(-delta * 1000 * DAMP_RATE);

    toColor(s.targetBg, target.background);
    toColor(s.targetEmber, target.ember);
    l.background.lerp(s.targetBg, damp);
    l.ember.lerp(s.targetEmber, damp);
    l.reaction += (target.reaction - l.reaction) * damp;
    l.juice += (target.juice - l.juice) * damp;
    l.key += (target.key - l.key) * damp;
    l.projection += (target.projection - l.projection) * damp;
    l.particulate += (target.particulate - l.particulate) * damp;
    l.exposure += (target.exposure - l.exposure) * damp;
    l.bloom += (target.bloom - l.bloom) * damp;

    scene.background = l.background;
    gl.toneMappingExposure = l.exposure * expMul;
    fieldUniforms.current.uTime.value = state.clock.elapsedTime * 1000;
    progSmooth.current += (p - progSmooth.current) * damp;
    fieldUniforms.current.uProg.value = progSmooth.current;

    // velocity spring toward the staged scroll target → kinetic beats
    const stage = stageProgress(p);
    const step = Math.min(delta, CAM_MAX_STEP);
    const c = cam.current;
    c.vel += (stage - c.drive) * CAM_STIFFNESS * step;
    c.vel -= c.vel * CAM_DAMP * step;
    c.drive = THREE.MathUtils.clamp(c.drive + c.vel * step, 0, 1);

    const shot = evaluateLostFragranceCamera(c.drive);
    const camera = state.camera as THREE.PerspectiveCamera;
    const t = state.clock.elapsedTime * 1000;
    camera.position.set(
      shot.position[0] + Math.sin(t * 0.00009) * 0.12,
      shot.position[1] + Math.sin(t * 0.00014) * 0.04,
      shot.position[2]
    );
    camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);
    if (Math.abs(camera.fov - shot.fov) > 0.01) {
      camera.fov = shot.fov;
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <EmberBackdrop
        uProg={fieldUniforms.current.uProg}
        uTime={fieldUniforms.current.uTime}
      />
      <FragranceWater ignore={emberPoints} live={live} resolution={reflRes} />
      {/* neutral studio key + cool fill so the charcoal cap / fabric label /
          clear glass read as materials (the ember stays in the surroundings) */}
      <directionalLight
        color={0xfff4ea}
        intensity={keyInt}
        position={[2.4, 3.6, 3.2]}
      />
      <hemisphereLight args={[0x3a3b45, 0x0b0b0f, 0.3]} />
      <Bottle live={live} mode="showcase" />
      <EmberParticles live={live} pointsRef={emberPoints} />
      <EffectComposer multisampling={msaa}>
        <ReactiveBloom live={live} />
        <Vignette darkness={0.6} offset={0.3} />
        <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.015} />
      </EffectComposer>
    </>
  );
}

/* ---------- product rig: held studio shot, no water/plume/spring ---------- */

function ProductContents() {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const msaa = useFragranceR3fTuning((s) => s.msaa); // 0 matches legacy composer
  const trs = useFragranceR3fTuning((s) => s.trs);
  const live = useRef<ReactionFrame>(createReactionFrame());
  const productEmber = useMemo(
    () =>
      toColor(
        new THREE.Color(),
        evaluateLostFragranceReaction(PRODUCT_EMBER_SAMPLE).ember
      ),
    []
  );

  // held grade: constant reaction / ember / bloom / exposure (never scrolls)
  useEffect(() => {
    const l = live.current;
    l.reaction = PRODUCT_REACTION;
    l.ember.copy(productEmber);
    l.bloom = PRODUCT_BLOOM;
    gl.toneMappingExposure = PRODUCT_EXPOSURE;
  }, [gl, productEmber]);

  // live-tunable glass transmission target scale (see SceneContents)
  useEffect(() => {
    gl.transmissionResolutionScale = trs;
  }, [gl, trs]);

  // fixed studio framing
  useEffect(() => {
    const shot = getLostProductViewCamera();
    camera.fov = shot.fov;
    camera.position.set(shot.position[0], shot.position[1], shot.position[2]);
    camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);
    camera.updateProjectionMatrix();
  }, [camera]);

  return (
    <>
      {/* real studio environment — glass needs something to reflect AND refract;
          the same map, blurred + dimmed, keeps transmission off dead black */}
      <Environment
        background
        backgroundBlurriness={PRODUCT_ENV_BG_BLUR}
        backgroundIntensity={PRODUCT_ENV_BG_INTENSITY}
        files={PRODUCT_ENV_URL}
      />
      <directionalLight
        color={0xfff1e4}
        intensity={1.15}
        position={[2.6, 4.2, 3.4]}
      />
      <hemisphereLight args={[0x2b2420, 0x080606, 0.55]} />
      <Bottle live={live} mode="product" />
      <EffectComposer multisampling={msaa}>
        <ReactiveBloom live={live} />
        <Vignette darkness={0.6} offset={0.3} />
        <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.015} />
      </EffectComposer>
    </>
  );
}

/* ---------- public component: same contract as the legacy scene ---------- */

type Props = {
  bagOpen: boolean;
  mode?: SceneMode;
  onReady?: () => void;
  progress: MotionValue<number>;
};

export function LostFragranceSceneR3F({
  bagOpen,
  mode = "showcase",
  onReady,
  progress
}: Props) {
  const documentHidden = useDocumentHidden();
  const isProduct = mode === "product";

  // pixel-ratio multiplier from the dev tuning store (1 = native; defaults MATCH
  // legacy so production output is identical). The rest of the knobs are read
  // where they're used (grade in SceneContents, msaa/trs in the contents rigs).
  const dprMul = useFragranceR3fTuning((s) => s.dpr);

  // readiness must NOT depend on the frame loop (which pauses while hidden or
  // when the bag is open) — signal as soon as the scene mounts
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const dpr = useMemo<number>(() => {
    if (typeof window === "undefined") return 1;
    const cap =
      window.innerWidth <= MOBILE_MAX_WIDTH
        ? MAX_MOBILE_PIXEL_RATIO
        : MAX_PIXEL_RATIO;
    return Math.min((window.devicePixelRatio || 1) * dprMul, cap);
  }, [dprMul]);

  // Product mode idly tumbles (no scroll); showcase renders continuously while
  // visible. The loop must NOT gate on viewport intersection — the backdrop is
  // fixed + full-bleed (always on screen), and flames/sway/damping are
  // time-based, so gating on inView froze them between scrolls. Pause only when
  // the tab is hidden or the bag is open.
  const active =
    isProduct || !shouldPauseLostFragranceScene({ bagOpen, documentHidden });

  return (
    <div
      aria-hidden
      className={isProduct ? "lost-product-canvas" : "lost-fragrance-canvas"}
      data-lost-fragrance-canvas
    >
      <Canvas
        camera={{ far: 120, fov: 30, near: 0.1, position: [0, 1.7, 8.6] }}
        className="lost-fragrance-canvas-surface"
        dpr={dpr}
        frameloop={active ? "always" : "never"}
        // antialias is wasted here: the EffectComposer renders to its own RTs,
        // so the MSAA default framebuffer is never composited. Drop it (free).
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        {isProduct ? (
          <ProductContents />
        ) : (
          <SceneContents progress={progress} />
        )}
      </Canvas>
      {FragranceR3fPanel ? <FragranceR3fPanel /> : null}
    </div>
  );
}
