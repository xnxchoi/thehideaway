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
const ASSET_BASE = "/assets/three/materials/paper";
export function PaperPlane({ width, height }: PaperPlaneProps) {
  const rough = useTexture(ASSET_BASE + "/paper_r.png", (texture: Texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(3, 4.5); // tiles to cover paper aspect with fine grain
    texture.colorSpace = NoColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  });
  const normal = useTexture(ASSET_BASE + "/paper_n.png", (texture: Texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(3, 4.5); // tiles to cover paper aspect with fine grain
    texture.colorSpace = NoColorSpace;
    texture.needsUpdate = true;
  });
  const diffuse = useTexture(
    ASSET_BASE + "/paper_d.png",
    (texture: Texture) => {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(3, 4.5); // tiles to cover paper aspect with fine grain
      texture.needsUpdate = true;
    }
  );


  return (
    <mesh receiveShadow castShadow position={[0, 0, 0]}>
      <planeGeometry args={[width, height, 32, 48]} />
      <meshPhysicalMaterial
        color="#fbfaf6"
        normalMap={normal}
        map={diffuse}
        roughnessMap={rough}
        roughness={1}
        metalness={0}
        sheen={0.22}
        sheenColor="#f3ebd9"
        sheenRoughness={0.75}
      />
    </mesh>
  );
}
