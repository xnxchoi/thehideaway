"use client";

import { MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTempus } from "tempus/react";
import {
  BlendFunction,
  BloomEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  VignetteEffect
} from "postprocessing";
import * as THREE from "three";
import { evaluateLostFragranceCamera, stageProgress } from "./fragrance-camera";
import { getLostProductViewCamera } from "./fragrance-product-view";
import { evaluateLostFragranceReaction } from "./fragrance-light";
import {
  buildLostEmberMotes,
  buildLostReactionField
} from "./fragrance-scene-objects";
import { buildLostCatalystBottle } from "./fragrance-catalyst-bottle";
import { buildLostWater } from "./fragrance-water";
import {
  shouldPauseLostFragranceScene,
  shouldRenderLostFragranceFrame
} from "./fragrance-scene-state";
import {
  applyLostFragranceTuning,
  isLostFragranceTuningEnabled,
  LOST_FRAGRANCE_TUNING_DEFAULTS,
  type LostFragranceTuning
} from "./fragrance-tuning";
import { useInView } from "react-intersection-observer";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";

// leva is a dev instrument — reached only through this gated dynamic import so it never
// lands in the production bundle.
const FragranceTunerPanel = dynamic(
  () => import("./FragranceTunerPanel").then((mod) => mod.FragranceTunerPanel),
  { ssr: false }
);

const MAX_PIXEL_RATIO = 1.5;
const MAX_MOBILE_PIXEL_RATIO = 1.25;
const MOBILE_MAX_WIDTH = 767;
const DAMP_RATE = 0.006;

// Kinetic camera drive — a velocity spring chases the STAGED scroll target (which
// dwells near each anchor and rushes between them) so crossing a beat launches the
// frame with momentum and a slight settle, instead of tracking scroll 1:1.
// Underdamped by design: CAM_DAMP < 2*sqrt(CAM_STIFFNESS) (≈18.97) gives light overshoot.
const CAM_STIFFNESS = 90;
const CAM_DAMP = 16;
const CAM_MAX_STEP = 1 / 30; // clamp the spring's dt so a paused tab can't fling it

// Product mode — the held studio shot the journey settles into, and the standalone PDP
// visual. No scroll, no water, no plume: a clean near-black void where the flacon idles.
const PRODUCT_SPIN_RATE = 0.00018; // rad/ms → one slow revolution ≈ 35s
const PRODUCT_TILT_RATE = 0.00007; // a gentle nod so the cap catches light off-axis
// Studio glass needs a real environment to read as glass — transmission with nothing
// behind it renders as an opaque slab. We load a proper studio env (reflections) AND
// put a very dark, blurred copy behind the flacon so the transmission samples soft
// gradient light instead of dead black. The ember back-light drops right down so the
// bottle isn't a glowing amber block — the studio env does the modelling now.
const PRODUCT_REACTION = 0.14; // faint warmth in the juice, not a lit ember
const PRODUCT_EMBER_SAMPLE = 0.6; // where on the reaction ramp to sample the ember colour
const PRODUCT_ENV_URL = "/assets/env_hdr1.webp"; // equirect studio panorama (LDR base)
const PRODUCT_ENV_BG_INTENSITY = 0.12; // keep the backdrop a near-black void…
const PRODUCT_ENV_BG_BLUR = 1.0; // …and fully soft, so it reads as atmosphere not a scene
const PRODUCT_EXPOSURE = 2.0; // the founder's baked stop, held (product mode never scrolls)
const PRODUCT_BLOOM = 0.86; // the at-rest bloom, matching the reaction curve's dormant key

type SceneMode = "showcase" | "product";

type Props = {
  bagOpen: boolean;
  progress: MotionValue<number>;
  mode?: SceneMode;
  onReady?: () => void;
};

type SceneRuntime = { render: (time: number, deltaTime: number) => void };

function toColor(
  target: THREE.Color,
  rgb: [number, number, number]
): THREE.Color {
  return target.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
}

export function LostFragranceScene({
  bagOpen,
  progress,
  mode = "showcase",
  onReady
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const bagOpenRef = useRef(bagOpen);
  const { inView, ref } = useInView({ threshold: 0.1 });
  const documentHiddenRef = useRef(false);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  // Dev tuning: the panel writes into this ref; the render loop reads it each frame. A ref,
  // not state — a slider move must never re-run the effect that owns the WebGL context.
  const tuningRef = useRef<LostFragranceTuning>(LOST_FRAGRANCE_TUNING_DEFAULTS);
  const tuningEnabledRef = useRef(false);
  const [tuningEnabled, setTuningEnabled] = useState(false);

  useEffect(() => {
    const enabled = isLostFragranceTuningEnabled({
      search: window.location.search,
      nodeEnv: process.env.NODE_ENV
    });
    tuningEnabledRef.current = enabled;
    setTuningEnabled(enabled);
  }, []);

  useEffect(() => {
    bagOpenRef.current = bagOpen;
  }, [bagOpen]);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useTempus(
    ({ time, deltaTime }) => {
      runtimeRef.current?.render(time, deltaTime);
    },
    { label: "lost-fragrance-scene", priority: 1 }
  );

  useEffect(() => {
    const isProduct = mode === "product";

    // const canvas = document.createElement("canvas");
    // canvas.className = "lost-fragrance-canvas-surface";
    //
    // const renderer = new THREE.WebGLRenderer({
    //   alpha: false,
    //   antialias: true,
    //   canvas,
    //   powerPreference: "high-performance"
    // });
    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth <= MOBILE_MAX_WIDTH
          ? MAX_MOBILE_PIXEL_RATIO
          : MAX_PIXEL_RATIO
      )
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const opening = evaluateLostFragranceReaction(0);
    const scene = new THREE.Scene();
    const bgColor = toColor(new THREE.Color(), opening.background);
    scene.background = bgColor;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
    camera.position.set(0, 1.7, 8.6);
    camera.lookAt(0, 1.5, 0);
    scene.add(camera);

    // In product mode the flacon stands alone in a studio void — skip the world-space
    // fire curtain, the planar-reflection water floor, and the additive ember motes.
    const field = isProduct ? null : buildLostReactionField(scene);
    const bottle = buildLostCatalystBottle({ scene, renderer });
    const motes = isProduct ? null : buildLostEmberMotes(scene);
    // real planar-reflection water floor — the bottle + the world-space fire curtain
    // both sit in the scene and reflect in it. Only the additive motes are hidden from
    // the reflection (they'd double up as bright specks).
    const water = isProduct
      ? null
      : buildLostWater(
          { renderer, scene, camera },
          { size: [80, 80], y: 0, resolution: 512 }
        );
    if (water && motes) water.ignoreObjects.push(motes.points);

    // Studio key + soft fill: the ember env + reaction lights read dramatic and
    // back-lit; a neutral key from front-upper-right and a low hemisphere fill lift the
    // flacon into a clean product read without crushing it to a silhouette.
    const studioKey = isProduct
      ? new THREE.DirectionalLight(0xfff1e4, 1.15)
      : null;
    if (studioKey) {
      studioKey.position.set(2.6, 4.2, 3.4);
      scene.add(studioKey);
    }
    const studioFill = isProduct
      ? new THREE.HemisphereLight(0x2b2420, 0x080606, 0.55)
      : null;
    if (studioFill) scene.add(studioFill);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Intensity is seeded here and then driven every frame from the reaction curve
    // (showcase) or held at the product constant — the grade is choreography, not a
    // constant. See LOST_FRAGRANCE_REACTION_KEYS.bloom.
    const bloom = new BloomEffect({
      intensity: PRODUCT_BLOOM,
      luminanceThreshold: 0.5,
      luminanceSmoothing: 0.32
    });
    const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY });
    (
      grain as unknown as { blendMode: { opacity: { value: number } } }
    ).blendMode.opacity.value = 0.015;
    const vignette = new VignetteEffect({ darkness: 0.6, offset: 0.3 });
    composer.addPass(new EffectPass(camera, bloom, vignette, grain));

    // Container-sized: derive the frame from the mount's own box (a full-bleed fixed
    // element in showcase, a grid cell on the PDP) rather than the window, so the same
    // canvas frames correctly wherever it's placed.

    // studio environment texture (product mode) — held for disposal on unmount
    let studioEnv: THREE.Texture | null = null;
    // held so the product render loop can re-seed the light base each frame before the
    // tuning panel's light SCALE is applied (otherwise the scale compounds every frame)
    let productEmber: THREE.Color | null = null;
    if (isProduct) {
      // A held studio shot — set once, never driven by scroll. Centre the flacon in the
      // canvas (the ProductStage grid already places the canvas as the left column; the
      // setViewOffset left-bias is a Phase-3 full-bleed concern, not needed here).
      const shot = getLostProductViewCamera();
      camera.fov = shot.fov;
      camera.position.set(shot.position[0], shot.position[1], shot.position[2]);
      camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);
      camera.updateProjectionMatrix();
      renderer.toneMappingExposure = PRODUCT_EXPOSURE;
      productEmber = toColor(
        new THREE.Color(),
        evaluateLostFragranceReaction(PRODUCT_EMBER_SAMPLE).ember
      );
      bottle.setReaction(PRODUCT_REACTION, productEmber);

      // Real studio environment — the glass needs something to reflect AND refract.
      // Loaded async; the render loop reads scene.environment/background each frame, so
      // the flacon comes alive the moment it lands. This overrides the bottle's built-in
      // dark ember env. The background is the SAME map, heavily blurred and dimmed, so the
      // transmission samples soft studio gradient instead of dead black — glass, not slab.
      new THREE.TextureLoader().load(PRODUCT_ENV_URL, (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        const pmrem = new THREE.PMREMGenerator(renderer);
        studioEnv = pmrem.fromEquirectangular(tex).texture;
        scene.environment = studioEnv;
        scene.background = studioEnv;
        scene.backgroundBlurriness = PRODUCT_ENV_BG_BLUR;
        scene.backgroundIntensity = PRODUCT_ENV_BG_INTENSITY;
        tex.dispose();
        pmrem.dispose();
      });
    }

    const live = {
      background: toColor(new THREE.Color(), opening.background),
      ember: toColor(new THREE.Color(), opening.ember),
      reaction: opening.reaction,
      juice: opening.juice,
      key: opening.key,
      projection: opening.projection,
      particulate: opening.particulate,
      exposure: opening.exposure,
      bloom: opening.bloom
    };
    const targetBg = new THREE.Color();
    const targetEmber = new THREE.Color();

    // kinetic camera drive state (spring position + velocity in progress space)
    let camDrive = stageProgress(Math.min(Math.max(progress.get(), 0), 1));
    let camVel = 0;

    runtimeRef.current = {
      render: (time, deltaTime) => {
        const dt = Math.min(deltaTime, 1000) / 1000;

        // Product mode: a still studio frame with an idly tumbling flacon. No scroll
        // eval, no spring, no water/plume — fork early so the showcase path below can
        // assume its atmosphere objects exist.
        if (isProduct) {
          bottle.group.rotation.y = time * PRODUCT_SPIN_RATE;
          bottle.group.rotation.x = Math.sin(time * PRODUCT_TILT_RATE) * 0.04;
          if (tuningEnabledRef.current && productEmber) {
            // re-seed the reaction-driven light base, THEN scale it — never the reverse
            bottle.setReaction(PRODUCT_REACTION, productEmber);
            bloom.intensity = PRODUCT_BLOOM * tuningRef.current.bloomIntensity;
            applyLostFragranceTuning(
              {
                water: null,
                glass: bottle.materials.glass,
                lights: bottle.lights,
                setExposure: (v) => {
                  renderer.toneMappingExposure = PRODUCT_EXPOSURE * v;
                }
              },
              tuningRef.current
            );
          }
          composer.render(dt);
          if (!readyRef.current) {
            readyRef.current = true;
            onReadyRef.current?.();
          }
          return;
        }

        // ── showcase path ── atmosphere objects are guaranteed built here.
        const activeField = field as NonNullable<typeof field>;
        const activeWater = water as NonNullable<typeof water>;
        const activeMotes = motes as NonNullable<typeof motes>;

        const p = Math.min(Math.max(progress.get(), 0), 1);
        const s = evaluateLostFragranceReaction(p);
        const damp = 1 - Math.exp(-deltaTime * DAMP_RATE);

        toColor(targetBg, s.background);
        toColor(targetEmber, s.ember);
        live.background.lerp(targetBg, damp);
        live.ember.lerp(targetEmber, damp);
        live.reaction += (s.reaction - live.reaction) * damp;
        live.juice += (s.juice - live.juice) * damp;
        live.key += (s.key - live.key) * damp;
        live.projection += (s.projection - live.projection) * damp;
        live.particulate += (s.particulate - live.particulate) * damp;
        live.exposure += (s.exposure - live.exposure) * damp;
        live.bloom += (s.bloom - live.bloom) * damp;

        scene.background = live.background;
        renderer.toneMappingExposure = live.exposure;
        bloom.intensity = live.bloom;

        activeField.uniforms.uTime.value = time;
        activeField.uniforms.uProg.value = p;

        bottle.setReaction(live.reaction, live.ember);
        // a subtle sway (not a product spin) so the slim glass faces catch the ember
        bottle.group.rotation.y = Math.sin(time * 0.0002) * 0.18;

        // dev tuning — applied AFTER setReaction so light scales sit on a fresh base
        if (tuningEnabledRef.current) {
          // grade knobs SCALE the curve rather than flatten it, so the founder can dial the
          // overall stop while the choreographed swell into the impact still plays.
          bloom.intensity = live.bloom * tuningRef.current.bloomIntensity;
          applyLostFragranceTuning(
            {
              water: activeWater.uniforms,
              glass: bottle.materials.glass,
              lights: bottle.lights,
              setExposure: (v) => {
                renderer.toneMappingExposure = live.exposure * v;
              }
            },
            tuningRef.current
          );
        }

        activeMotes.material.color.copy(live.ember);
        activeMotes.material.opacity = live.particulate * 0.32;
        activeMotes.update(dt);

        // velocity spring toward the staged scroll target → kinetic beats
        const stage = stageProgress(p);
        const sdt = Math.min(dt, CAM_MAX_STEP);
        camVel += (stage - camDrive) * CAM_STIFFNESS * sdt;
        camVel -= camVel * CAM_DAMP * sdt;
        camDrive = Math.min(Math.max(camDrive + camVel * sdt, 0), 1);

        const shot = evaluateLostFragranceCamera(camDrive);
        camera.position.set(
          shot.position[0] + Math.sin(time * 0.00009) * 0.12,
          shot.position[1] + Math.sin(time * 0.00014) * 0.04,
          shot.position[2]
        );
        camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);
        if (Math.abs(camera.fov - shot.fov) > 0.01) {
          camera.fov = shot.fov;
          camera.updateProjectionMatrix();
        }

        activeWater.uniforms.uReaction.value = live.reaction;
        activeWater.uniforms.uEmber.value.copy(live.ember);
        activeWater.onTick(time);

        composer.render(dt);

        if (!readyRef.current) {
          readyRef.current = true;
          onReadyRef.current?.();
        }
      }
    };

    // Compose one frame + signal readiness immediately, independent of tab
    // visibility (the loop pauses while hidden; readiness must not).
    composer.render(0);
    readyRef.current = true;
    onReadyRef.current?.();

    return () => {
      runtimeRef.current = null;
      composer.dispose();
      field?.dispose();
      water?.dispose();
      bottle.dispose();
      motes?.dispose();
      studioEnv?.dispose();
      if (studioKey) scene.remove(studioKey);
      if (studioFill) scene.remove(studioFill);
      // renderer.dispose();
      // renderer.forceContextLoss();
      // canvas.remove();
    };
  }, [progress, mode]);

  return (
    <>
      <Canvas
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping
        }}
        className={
          mode === "product" ? "lost-product-canvas" : "lost-fragrance-canvas"
        }
      ></Canvas>
      {tuningEnabled ? <FragranceTunerPanel valueRef={tuningRef} /> : null}
    </>
  );
}
