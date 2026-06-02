"use client";

import { useEffect, useMemo, useRef } from "react";
import { extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import { ScreenQuad, shaderMaterial, useTexture } from "@react-three/drei";
import {
  EquirectangularReflectionMapping,
  FrontSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  type IUniform,
  type ShaderMaterial,
  type Texture,
  Vector2
} from "three";
import { RGBELoader } from "three-stdlib";
import fragmentShader from "./shaders/marble.frag.glsl";
import vertexShader from "./shaders/marble.vert.glsl";

/**
 * Marble scene contents — domain-warped fBM stone pattern with analytical
 * lighting and an HDR envMap reflection on the veins.
 *
 * This module exports the SCENE only (no <Canvas>); the host turntable
 * mounts a single shared <Canvas> with Drei <View>s so the marble and
 * the vinyl record share one WebGL context. Putting the Canvas here
 * (as we used to) means two contexts, two render loops, and two sets
 * of DPR-rounding quirks to coordinate.
 */

const HDR_URL = "/assets/three/tape/urban_alley_01_1k.hdr";
const GRAIN_URL = "/assets/papier.png";

const _marbleUniforms = {
  u_cursor: new Vector2(0.5, 0.5),
  u_resolution: new Vector2(1, 1),
  u_intensity: 0.6,
  u_scale: 2.0,
  u_envMap: null as Texture | null,
  u_envIntensity: 0.55,
  u_grainMap: null as Texture | null,
  u_grainTile: 6.0
};

const MarbleShaderMaterial = shaderMaterial(
  _marbleUniforms,
  vertexShader,
  fragmentShader
);
extend({ MarbleShaderMaterial });

type MarbleMaterialRef =
  | (Omit<ShaderMaterial, "uniforms"> & {
      uniforms: {
        [K in keyof typeof _marbleUniforms]: IUniform<
          (typeof _marbleUniforms)[K]
        >;
      };
    })
  | null;

interface MarbleSceneProps {
  /** Base feature scale. Smaller = larger blotches, bigger = finer veining. */
  scale?: number;
  /** HDR envMap reflection strength on metallic veins. */
  envIntensity?: number;
  /** Tile multiplier for the paper-grain micro-texture. */
  grainTile?: number;
}

export function MarbleScene({
  scale = 2.0,
  envIntensity = 0.55,
  grainTile = 6.0
}: MarbleSceneProps) {
  const matRef = useRef<MarbleMaterialRef>(null);
  const { size, pointer, invalidate } = useThree();

  // HDR for the metallic-vein reflection (loaded once, shared by all uses).
  const envMap = useLoader(RGBELoader, HDR_URL);
  useMemo(() => {
    if (!envMap) return;
    envMap.mapping = EquirectangularReflectionMapping;
    envMap.minFilter = LinearFilter;
    envMap.magFilter = LinearFilter;
    envMap.generateMipmaps = false;
    envMap.needsUpdate = true;
  }, [envMap]);

  const grainMap = useTexture(GRAIN_URL, (t) => {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.colorSpace = NoColorSpace;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.anisotropy = 4;
    t.needsUpdate = true;
  }) as Texture;

  useEffect(() => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.u_resolution.value.set(size.width, size.height);
    m.uniforms.u_scale.value = scale;
    m.uniforms.u_envIntensity.value = envIntensity;
    m.uniforms.u_grainTile.value = grainTile;
    if (envMap) m.uniforms.u_envMap.value = envMap;
    if (grainMap) m.uniforms.u_grainMap.value = grainMap;
    invalidate();
  }, [
    size.width,
    size.height,
    scale,
    envIntensity,
    grainTile,
    envMap,
    grainMap,
    invalidate
  ]);

  useFrame((_state, delta) => {
    const m = matRef.current;
    if (!m) return;
    // Drei <View> normalizes pointer to [-1, 1] over the view's region;
    // remap to [0, 1] for the shader and lerp toward the target so the
    // highlight glides instead of snapping.
    const targetX = (pointer.x + 1) * 0.5;
    const targetY = (pointer.y + 1) * 0.5;
    const c = m.uniforms.u_cursor.value;
    const alpha = 1 - Math.exp(-delta * 9);
    c.x = c.x + (targetX - c.x) * alpha;
    c.y = c.y + (targetY - c.y) * alpha;
    // A steady intensity reads as "lit object on a table" without the
    // hover-toggle that previously bounced this value around.
    m.uniforms.u_intensity.value = 0.75;
  });

  return (
    // renderOrder=-1 + depthWrite=false makes the marble paint first,
    // without claiming any depth. The vinyl disc (and anything else in
    // the same View's scene) then renders on top via normal depth test.
    // Without this, the ScreenQuad's clip-space z=0 wins the depth test
    // against the disc's projected depth (~0.92), and the marble would
    // occlude the disc — which is exactly the bug we hit with two
    // separate Views sharing the canvas's depth buffer.
    <ScreenQuad frustumCulled={false} renderOrder={-1}>
      {/** @ts-expect-error Drei shaderMaterial JSX intrinsic from extend() **/}
      <marbleShaderMaterial ref={matRef} side={FrontSide} depthWrite={false} />
    </ScreenQuad>
  );
}
