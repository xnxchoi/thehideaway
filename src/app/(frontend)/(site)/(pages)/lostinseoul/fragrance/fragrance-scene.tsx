"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { useTempus } from "tempus/react";
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  VignetteEffect
} from "postprocessing";
import * as THREE from "three";
import {
  getLostFragranceActiveBeat,
  LOST_FRAGRANCE_BEATS
} from "./fragrance-beats";
import { LOST_FRAGRANCE_LIGHTS } from "./fragrance-light";
import {
  shouldPauseLostFragranceScene,
  shouldRenderLostFragranceFrame
} from "./fragrance-scene-state";

const MAX_PIXEL_RATIO = 1.5;
const MAX_MOBILE_PIXEL_RATIO = 1.25;
const MOBILE_MAX_WIDTH = 767;
const RAIN_COUNT = 1400;
const MOTE_COUNT = 260;
const RAIN_BOX = { x: 36, yMin: 0, yMax: 26, z: 36 };
const DAMP_RATE = 0.0035;

type Props = {
  bagOpen: boolean;
  progress: MotionValue<number>;
  onReady?: () => void;
};

type SceneRuntime = {
  render: (time: number, deltaTime: number) => void;
};

/** Deterministic pseudo-random so the skyline never re-rolls between mounts. */
function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function buildSkyline(scene: THREE.Scene, disposables: THREE.BufferGeometry[]) {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0a0b0d"),
    metalness: 0.1,
    roughness: 0.85
  });
  const group = new THREE.Group();
  for (let i = 0; i < 16; i += 1) {
    const width = 1.6 + seeded(i, 1) * 3.4;
    const height = 4 + seeded(i, 2) * 14;
    const depth = 1.6 + seeded(i, 3) * 3;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    const side = i % 2 === 0 ? -1 : 1;
    mesh.position.set(
      side * (7 + seeded(i, 4) * 14),
      height / 2,
      -6 - seeded(i, 5) * 26
    );
    group.add(mesh);
  }
  scene.add(group);
  return { group, material };
}

function buildRain(scene: THREE.Scene) {
  const positions = new Float32Array(RAIN_COUNT * 3);
  const speeds = new Float32Array(RAIN_COUNT);
  for (let i = 0; i < RAIN_COUNT; i += 1) {
    positions[i * 3] = (seeded(i, 6) - 0.5) * RAIN_BOX.x;
    positions[i * 3 + 1] =
      RAIN_BOX.yMin + seeded(i, 7) * (RAIN_BOX.yMax - RAIN_BOX.yMin);
    positions[i * 3 + 2] = (seeded(i, 8) - 0.5) * RAIN_BOX.z;
    speeds[i] = 9 + seeded(i, 9) * 9;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color("#9fb4cc"),
    depthWrite: false,
    opacity: 0,
    size: 0.05,
    transparent: true
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return { geometry, material, points, positions, speeds };
}

function buildMotes(scene: THREE.Scene) {
  const positions = new Float32Array(MOTE_COUNT * 3);
  const drift = new Float32Array(MOTE_COUNT * 3);
  for (let i = 0; i < MOTE_COUNT; i += 1) {
    positions[i * 3] = (seeded(i, 10) - 0.5) * 24;
    positions[i * 3 + 1] = 0.2 + seeded(i, 11) * 8;
    positions[i * 3 + 2] = (seeded(i, 12) - 0.5) * 20;
    drift[i * 3] = (seeded(i, 13) - 0.5) * 0.3;
    drift[i * 3 + 1] = (seeded(i, 14) - 0.5) * 0.12;
    drift[i * 3 + 2] = (seeded(i, 15) - 0.5) * 0.3;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    blending: THREE.AdditiveBlending,
    color: new THREE.Color("#9aa3ad"),
    depthWrite: false,
    opacity: 0,
    size: 0.14,
    transparent: true
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return { drift, geometry, material, points, positions };
}

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
    scene.fog = new THREE.FogExp2(fogColor, 0.05);
    scene.background = fogColor;

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 120);
    camera.position.set(0, 2.4, 14);
    camera.lookAt(0, 2, 0);
    scene.add(camera);

    const disposableGeometries: THREE.BufferGeometry[] = [];

    const groundGeometry = new THREE.PlaneGeometry(160, 160);
    disposableGeometries.push(groundGeometry);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#050506"),
      metalness: 0.35,
      roughness: 0.4
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const skyline = buildSkyline(scene, disposableGeometries);
    const rain = buildRain(scene);
    const motes = buildMotes(scene);

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

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({
      intensity: 0.9,
      luminanceSmoothing: 0.25,
      luminanceThreshold: 0.18
    });
    const vignette = new VignetteEffect({ darkness: 0.62, offset: 0.28 });
    composer.addPass(new EffectPass(camera, bloom, vignette));

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
      exposure: LOST_FRAGRANCE_LIGHTS.arrival.exposure,
      fog: fogColor,
      haze: LOST_FRAGRANCE_LIGHTS.arrival.haze,
      key: new THREE.Color(LOST_FRAGRANCE_LIGHTS.arrival.key),
      keyIntensity: LOST_FRAGRANCE_LIGHTS.arrival.keyIntensity,
      rain: LOST_FRAGRANCE_LIGHTS.arrival.rain,
      rim: new THREE.Color(LOST_FRAGRANCE_LIGHTS.arrival.rim),
      rimIntensity: LOST_FRAGRANCE_LIGHTS.arrival.rimIntensity
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

        const beat = getLostFragranceActiveBeat(
          progress.get(),
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

        // camera: slow authored dolly with progress, gentle sway with time
        const scrollProgress = Math.min(Math.max(progress.get(), 0), 1);
        camera.position.z = 14 - scrollProgress * 5;
        camera.position.y = 2.4 - scrollProgress * 0.7;
        camera.position.x = Math.sin(time * 0.00008) * 0.4;
        camera.lookAt(0, 1.9 - scrollProgress * 0.4, 0);

        // rain fall
        rain.material.opacity = live.rain * 0.55;
        if (live.rain > 0.01) {
          const dtSeconds = deltaTime / 1000;
          for (let i = 0; i < RAIN_COUNT; i += 1) {
            let y = rain.positions[i * 3 + 1] - rain.speeds[i] * dtSeconds;
            if (y < RAIN_BOX.yMin) y = RAIN_BOX.yMax;
            rain.positions[i * 3 + 1] = y;
          }
          rain.geometry.attributes.position.needsUpdate = true;
        }

        // motes drift
        motes.material.opacity = live.haze * 0.5;
        motes.material.color.copy(live.accent);
        if (live.haze > 0.01) {
          const dtSeconds = deltaTime / 1000;
          for (let i = 0; i < MOTE_COUNT; i += 1) {
            motes.positions[i * 3] += motes.drift[i * 3] * dtSeconds;
            motes.positions[i * 3 + 1] += motes.drift[i * 3 + 1] * dtSeconds;
            motes.positions[i * 3 + 2] += motes.drift[i * 3 + 2] * dtSeconds;
          }
          motes.geometry.attributes.position.needsUpdate = true;
        }

        composer.render(deltaTime / 1000);

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
      groundMaterial.dispose();
      skyline.material.dispose();
      rain.geometry.dispose();
      rain.material.dispose();
      motes.geometry.dispose();
      motes.material.dispose();
      disposableGeometries.forEach((geometry) => geometry.dispose());
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
