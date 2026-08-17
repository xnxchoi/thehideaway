"use client";

/**
 * Legacy GLSL water, mounted the r3f way.
 *
 * `buildLostWater` (fragrance-water.ts) is the founder-tuned planar reflector —
 * a real mirror render target + custom ripple/reflection shader, NOT drei's
 * MeshReflectorMaterial (which diverged from the blessed look). It ADDS its own
 * mesh to the scene and removes it on dispose, so this wrapper renders nothing:
 * it owns only the React lifecycle — build against the live <Canvas> renderer/
 * scene/camera in an effect (StrictMode-safe: cleanup disposes), drive the
 * reaction uniforms + reflection tick in one useFrame, dispose on unmount.
 * No shader logic lives here.
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";
import { buildLostWater, type LostWater } from "./fragrance-water";

/** Minimal structural view of the rig's live reaction frame — the water only
 *  reads the current reaction level and ember colour. */
type WaterDrive = {
  reaction: number;
  ember: THREE.Color;
};

type Props = {
  live: React.RefObject<WaterDrive>;
  /** an object hidden while the reflection is captured (the ember motes — they
   *  would double up as bright specks in the mirror). Registered once. */
  ignore?: React.RefObject<THREE.Object3D | null>;
  /** reflection render-target resolution. The mirror re-renders the whole scene
   *  every frame, so this squares into cost. 256 reads the same as 512 here —
   *  the reflection is rippled and Fresnel-mixed, never a sharp mirror. */
  resolution?: number;
};

export function FragranceWater({ live, ignore, resolution = 256 }: Props) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const water = useRef<LostWater | null>(null);
  const registered = useRef(false);

  // buildLostWater self-adds its mesh to the scene; the effect cleanup removes
  // and disposes it (so a StrictMode double-invoke nets exactly one mesh + RT).
  useEffect(() => {
    const built = buildLostWater(
      { camera, renderer: gl, scene },
      { resolution, size: [80, 80], y: 0 }
    );
    water.current = built;
    registered.current = false;
    return () => {
      built.dispose();
      water.current = null;
    };
  }, [gl, scene, camera, resolution]);

  useFrame(({ clock }) => {
    const w = water.current;
    if (!w) return;
    const frame = live.current;
    w.uniforms.uReaction.value = frame.reaction;
    w.uniforms.uEmber.value.copy(frame.ember);
    if (!registered.current && ignore?.current) {
      w.ignoreObjects.push(ignore.current);
      registered.current = true;
    }
    w.onTick(clock.elapsedTime * 1000);
  });

  return null;
}
