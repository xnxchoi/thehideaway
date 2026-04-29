"use client";

import { useTexture } from "@react-three/drei";
import { useLayoutEffect } from "react";
import { NoColorSpace, RepeatWrapping, type Texture } from "three";

/**
 * Cream cotton-paper plane.
 *
 *   - `map`-less but tinted cream — the typography lives on a separate set
 *     of meshes (PaperContent3D), kept off the diffuse map so we can light
 *     them independently.
 *   - `bumpMap` from /assets/papier.png — RGB noise drives micro-relief
 *     from brightness, so the directional light catches unevenly across the
 *     surface, giving real paper-fiber feel under raking light.
 *   - `roughnessMap` from the same texture — varies surface matte/shiny
 *     across pixels so highlights speckle naturally instead of flat-rolling.
 *   - `receiveShadow` for the sleeve's cast shadow; `castShadow` so the
 *     paper itself drops a subtle penumbra in the close-up.
 */
type PaperPlaneProps = {
  width: number;
  height: number;
};

export function PaperPlane({ width, height }: PaperPlaneProps) {
  const papier = useTexture("/assets/papier.png") as Texture;

  // Configure the texture once on load: tile across the paper, treat as
  // linear data (not sRGB) since it's driving bump + roughness, not color.
  useLayoutEffect(() => {
    papier.wrapS = RepeatWrapping;
    papier.wrapT = RepeatWrapping;
    papier.repeat.set(3, 4.5); // tiles to cover paper aspect with fine grain
    papier.colorSpace = NoColorSpace;
    papier.anisotropy = 8;
    papier.needsUpdate = true;
  }, [papier]);

  return (
    <mesh receiveShadow castShadow position={[0, 0, 0]}>
      <planeGeometry args={[width, height, 32, 48]} />
      <meshPhysicalMaterial
        color="#fbfaf6"
        bumpMap={papier}
        bumpScale={0.018}
        roughnessMap={papier}
        roughness={0.95}
        metalness={0}
        sheen={0.22}
        sheenColor="#f3ebd9"
        sheenRoughness={0.75}
      />
    </mesh>
  );
}
