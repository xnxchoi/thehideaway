"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
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
import {
  getLostFragranceActiveBeat,
  getLostFragranceBeatProgress,
  LOST_FRAGRANCE_BEATS
} from "./fragrance-beats";
import { evaluateLostFragranceCamera } from "./fragrance-camera";
import { LOST_FRAGRANCE_LIGHTS } from "./fragrance-light";
import {
  buildLostFragranceCity,
  buildLostFragranceColumn,
  buildLostFragranceGround,
  buildLostFragranceMotes,
  buildLostFragranceRain,
  LOST_FRAGRANCE_COLUMN_POSITION
} from "./fragrance-scene-objects";
import {
  shouldPauseLostFragranceScene,
  shouldRenderLostFragranceFrame
} from "./fragrance-scene-state";

const MAX_PIXEL_RATIO = 1.5;
const MAX_MOBILE_PIXEL_RATIO = 1.25;
const MOBILE_MAX_WIDTH = 767;
const DAMP_RATE = 0.0035;
const FOG_DENSITY = 0.034;
const REVEAL_BEAT = LOST_FRAGRANCE_BEATS[LOST_FRAGRANCE_BEATS.length - 1];

type Props = {
  bagOpen: boolean;
  progress: MotionValue<number>;
  onReady?: () => void;
};

type SceneRuntime = {
  render: (time: number, deltaTime: number) => void;
};

export function LostFragranceScene({ bagOpen, progress, onReady }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);
  const bagOpenRef = useRef(bagOpen);
  const inViewportRef = useRef(true);
  const documentHiddenRef = useRef(false);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);

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
    const mount = mountRef.current;
    if (!mount) return;

    // A fresh canvas per effect run: forceContextLoss() on cleanup kills the
    // old context permanently, so remounts (StrictMode) need a new element.
    const canvas = document.createElement("canvas");
    canvas.className = "lost-fragrance-canvas-surface";
    mount.appendChild(canvas);

    documentHiddenRef.current = document.hidden;
    const onVisibility = () => {
      documentHiddenRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const visibilityObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              inViewportRef.current = entry?.isIntersecting ?? true;
            },
            { rootMargin: "120px" }
          )
        : null;
    visibilityObserver?.observe(canvas);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      canvas,
      powerPreference: "high-performance"
    });
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

    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(LOST_FRAGRANCE_LIGHTS.arrival.fog);
    scene.fog = new THREE.FogExp2(fogColor, FOG_DENSITY);
    scene.background = fogColor;

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);
    camera.position.set(0, 2.6, 15.5);
    camera.lookAt(0, 2.1, 0);
    scene.add(camera);

    const ground = buildLostFragranceGround(scene);
    const city = buildLostFragranceCity(scene);
    const rain = buildLostFragranceRain(scene);
    const motes = buildLostFragranceMotes(scene);
    const column = buildLostFragranceColumn(scene);

    const ambient = new THREE.AmbientLight("#ffffff", 0.05);
    scene.add(ambient);
    const keyLight = new THREE.PointLight("#aab4c4", 14, 60, 1.6);
    keyLight.position.set(-4, 6, 2);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight("#39424f", 4, 70, 1.8);
    rimLight.position.set(8, 3, -12);
    scene.add(rimLight);
    const sweepLight = new THREE.PointLight("#ffffff", 0, 40, 2);
    sweepLight.position.set(0, 1.2, 4);
    scene.add(sweepLight);

    // ground streak registry: [0..5] signage, [6] passing sweep, [7] column
    const SWEEP_SLOT = 6;
    const COLUMN_SLOT = 7;
    city.signMeshes.forEach((entry, index) => {
      if (index >= SWEEP_SLOT) return;
      ground.uniforms.uStreakPos.value[index].set(
        entry.sign.x,
        entry.sign.y,
        entry.sign.z
      );
      ground.uniforms.uStreakColor.value[index].copy(entry.baseColor);
    });
    ground.uniforms.uStreakPos.value[COLUMN_SLOT].set(
      LOST_FRAGRANCE_COLUMN_POSITION.x,
      2.2,
      LOST_FRAGRANCE_COLUMN_POSITION.z
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({
      intensity: 1.05,
      luminanceSmoothing: 0.3,
      luminanceThreshold: 0.26
    });
    const grain = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
      premultiply: false
    });
    grain.blendMode.opacity.value = 0.11;
    const vignette = new VignetteEffect({ darkness: 0.58, offset: 0.26 });
    composer.addPass(new EffectPass(camera, bloom, vignette, grain));

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };
    resize();
    window.addEventListener("resize", resize);

    // damped live values, lerped toward the active beat's targets each frame
    const live = {
      accent: new THREE.Color(LOST_FRAGRANCE_LIGHTS.arrival.accent),
      ambientIntensity: LOST_FRAGRANCE_LIGHTS.arrival.ambientIntensity,
      column: 0,
      exposure: LOST_FRAGRANCE_LIGHTS.arrival.exposure,
      fog: fogColor,
      haze: LOST_FRAGRANCE_LIGHTS.arrival.haze,
      key: new THREE.Color(LOST_FRAGRANCE_LIGHTS.arrival.key),
      keyIntensity: LOST_FRAGRANCE_LIGHTS.arrival.keyIntensity,
      rain: LOST_FRAGRANCE_LIGHTS.arrival.rain,
      rim: new THREE.Color(LOST_FRAGRANCE_LIGHTS.arrival.rim),
      rimIntensity: LOST_FRAGRANCE_LIGHTS.arrival.rimIntensity,
      signs: LOST_FRAGRANCE_LIGHTS.arrival.signs,
      wet: LOST_FRAGRANCE_LIGHTS.arrival.wet,
      windows: LOST_FRAGRANCE_LIGHTS.arrival.windows
    };
    const target = {
      accent: new THREE.Color(),
      fog: new THREE.Color(),
      key: new THREE.Color(),
      rim: new THREE.Color()
    };

    runtimeRef.current = {
      render: (time, deltaTime) => {
        if (
          !shouldRenderLostFragranceFrame({
            documentHidden: documentHiddenRef.current,
            inViewport: inViewportRef.current
          }) ||
          shouldPauseLostFragranceScene({
            bagOpen: bagOpenRef.current,
            documentHidden: documentHiddenRef.current
          })
        ) {
          return;
        }

        const scrollProgress = Math.min(Math.max(progress.get(), 0), 1);
        const beat = getLostFragranceActiveBeat(
          scrollProgress,
          LOST_FRAGRANCE_BEATS
        );
        const state = LOST_FRAGRANCE_LIGHTS[beat];
        const damp = 1 - Math.exp(-deltaTime * DAMP_RATE);

        target.fog.set(state.fog);
        target.key.set(state.key);
        target.rim.set(state.rim);
        target.accent.set(state.accent);
        live.fog.lerp(target.fog, damp);
        live.key.lerp(target.key, damp);
        live.rim.lerp(target.rim, damp);
        live.accent.lerp(target.accent, damp);
        live.keyIntensity += (state.keyIntensity - live.keyIntensity) * damp;
        live.rimIntensity += (state.rimIntensity - live.rimIntensity) * damp;
        live.ambientIntensity +=
          (state.ambientIntensity - live.ambientIntensity) * damp;
        live.rain += (state.rain - live.rain) * damp;
        live.haze += (state.haze - live.haze) * damp;
        live.exposure += (state.exposure - live.exposure) * damp;
        live.wet += (state.wet - live.wet) * damp;
        live.windows += (state.windows - live.windows) * damp;
        live.signs += (state.signs - live.signs) * damp;
        const columnTarget =
          beat === "reveal"
            ? 0.35 + 0.65 * getLostFragranceBeatProgress(scrollProgress, REVEAL_BEAT)
            : 0;
        live.column += (columnTarget - live.column) * damp;

        scene.background = live.fog;
        (scene.fog as THREE.FogExp2).color.copy(live.fog);
        keyLight.color.copy(live.key);
        keyLight.intensity = live.keyIntensity;
        rimLight.color.copy(live.rim);
        rimLight.intensity = live.rimIntensity;
        ambient.intensity = live.ambientIntensity;
        renderer.toneMappingExposure = live.exposure;

        // passing light: a slow sweep across the street, brightest mid-night
        const sweepPhase = (time * 0.00012) % 1;
        sweepLight.position.x = -18 + sweepPhase * 36;
        sweepLight.intensity =
          Math.sin(sweepPhase * Math.PI) * 6 * (0.3 + live.haze * 0.7);
        sweepLight.color.copy(live.accent);

        // authored camera: the user drives the clock, the author drives
        // the shot; a slow breathing sway keeps it handheld-alive
        const shot = evaluateLostFragranceCamera(scrollProgress);
        camera.position.set(
          shot.position[0] + Math.sin(time * 0.00008) * 0.35,
          shot.position[1] + Math.sin(time * 0.00013) * 0.08,
          shot.position[2]
        );
        camera.lookAt(shot.target[0], shot.target[1], shot.target[2]);
        if (Math.abs(camera.fov - shot.fov) > 0.01) {
          camera.fov = shot.fov;
          camera.updateProjectionMatrix();
        }

        // signage: per-sign flicker, beat-scaled; feeds ground streaks
        for (let i = 0; i < city.signMeshes.length; i += 1) {
          const entry = city.signMeshes[i];
          const flicker = 0.84 + 0.16 * Math.sin(time * 0.0037 + entry.phase);
          const level = live.signs * flicker;
          entry.material.color
            .copy(entry.baseColor)
            .multiplyScalar(0.35 + level * 1.9);
          if (i < SWEEP_SLOT) {
            ground.uniforms.uStreakIntensity.value[i] = level * 2.4;
          }
        }
        city.windowMaterial.color.setScalar(0.2 + live.windows * 1.1);

        // ground: wet level, beat key pool, moving sources
        ground.uniforms.uWet.value = live.wet;
        ground.uniforms.uKeyColor.value.copy(live.key);
        ground.uniforms.uKeyIntensity.value = live.keyIntensity;
        ground.uniforms.uStreakPos.value[SWEEP_SLOT].set(
          sweepLight.position.x,
          1.4,
          sweepLight.position.z
        );
        ground.uniforms.uStreakColor.value[SWEEP_SLOT].copy(live.accent);
        ground.uniforms.uStreakIntensity.value[SWEEP_SLOT] =
          sweepLight.intensity * 0.12;
        ground.uniforms.uStreakColor.value[COLUMN_SLOT].set("#d29a5a");
        ground.uniforms.uStreakIntensity.value[COLUMN_SLOT] =
          live.column * 3.2;

        // the reveal object breathes rather than blinks
        const breath = 0.86 + 0.14 * Math.sin(time * 0.0016);
        column.group.visible = live.column > 0.004;
        column.beamUniforms.uIntensity.value = live.column * breath;
        column.glow.intensity = live.column * 7;

        const dtSeconds = deltaTime / 1000;
        rain.material.opacity = live.rain * 0.5;
        if (live.rain > 0.01) rain.update(dtSeconds);
        motes.material.opacity = live.haze * 0.45;
        motes.material.color.copy(live.accent);
        if (live.haze > 0.01) motes.update(dtSeconds);

        composer.render(dtSeconds);

        if (!readyRef.current) {
          readyRef.current = true;
          onReadyRef.current?.();
        }
      }
    };

    return () => {
      runtimeRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      visibilityObserver?.disconnect();
      composer.dispose();
      ground.dispose();
      city.dispose();
      rain.dispose();
      motes.dispose();
      column.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [progress]);

  return (
    <div
      aria-hidden
      className="lost-fragrance-canvas"
      data-lost-fragrance-canvas
      ref={mountRef}
    />
  );
}
