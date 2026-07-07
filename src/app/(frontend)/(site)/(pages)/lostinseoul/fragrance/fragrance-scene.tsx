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
import { evaluateLostFragranceCamera } from "./fragrance-camera";
import { evaluateLostFragranceReaction } from "./fragrance-light";
import {
  buildLostCatalystBottle,
  buildLostEmberBackdrop,
  buildLostEmberMotes
} from "./fragrance-scene-objects";
import {
  shouldPauseLostFragranceScene,
  shouldRenderLostFragranceFrame
} from "./fragrance-scene-state";

const MAX_PIXEL_RATIO = 1.5;
const MAX_MOBILE_PIXEL_RATIO = 1.25;
const MOBILE_MAX_WIDTH = 767;
const DAMP_RATE = 0.006;

type Props = {
  bagOpen: boolean;
  progress: MotionValue<number>;
  onReady?: () => void;
};

type SceneRuntime = { render: (time: number, deltaTime: number) => void };

function toColor(
  target: THREE.Color,
  rgb: [number, number, number]
): THREE.Color {
  return target.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
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
      antialias: true,
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

    const opening = evaluateLostFragranceReaction(0);
    const scene = new THREE.Scene();
    const bgColor = toColor(new THREE.Color(), opening.background);
    scene.background = bgColor;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
    camera.position.set(0, 1.7, 8.6);
    camera.lookAt(0, 1.5, 0);
    scene.add(camera);

    const backdrop = buildLostEmberBackdrop(scene);
    const bottle = buildLostCatalystBottle(scene);
    const motes = buildLostEmberMotes(scene);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({
      intensity: 0.62,
      luminanceThreshold: 0.5,
      luminanceSmoothing: 0.32
    });
    const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY });
    (
      grain as unknown as { blendMode: { opacity: { value: number } } }
    ).blendMode.opacity.value = 0.07;
    const vignette = new VignetteEffect({ darkness: 0.6, offset: 0.3 });
    composer.addPass(new EffectPass(camera, bloom, vignette, grain));

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    const live = {
      background: toColor(new THREE.Color(), opening.background),
      ember: toColor(new THREE.Color(), opening.ember),
      reaction: opening.reaction,
      juice: opening.juice,
      key: opening.key,
      projection: opening.projection,
      particulate: opening.particulate,
      exposure: opening.exposure
    };
    const targetBg = new THREE.Color();
    const targetEmber = new THREE.Color();

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

        const dt = Math.min(deltaTime, 1000) / 1000;
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

        scene.background = live.background;
        renderer.toneMappingExposure = live.exposure;

        backdrop.uniforms.uReaction.value = live.reaction;
        backdrop.uniforms.uProjection.value = live.projection;
        backdrop.uniforms.uTime.value = time;
        backdrop.uniforms.uEmber.value.copy(live.ember);
        backdrop.uniforms.uBg.value.copy(live.background);

        bottle.uniforms.uEmber.value.copy(live.ember);
        bottle.uniforms.uJuice.value = live.juice;
        bottle.uniforms.uKey.value = live.key;
        bottle.uniforms.uReaction.value = live.reaction;
        // slow turntable so the cylinder + tiered cap read
        bottle.group.rotation.y = time * 0.00016;

        motes.material.color.copy(live.ember);
        motes.material.opacity = live.particulate * 0.32;
        motes.update(dt);

        const shot = evaluateLostFragranceCamera(p);
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
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      visibilityObserver?.disconnect();
      composer.dispose();
      backdrop.dispose();
      bottle.dispose();
      motes.dispose();
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
