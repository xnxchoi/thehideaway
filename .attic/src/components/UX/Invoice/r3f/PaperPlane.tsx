"use client";

import {
  OrthographicCamera,
  RenderTexture,
  useTexture
} from "@react-three/drei";
import { NoColorSpace, RepeatWrapping, type Texture } from "three";
import { PaperContent3D } from "./PaperContent3D";
import type { InvoiceDisplay } from "../types";

/**
 * Cream cotton-paper plane.
 *
 *   - `map` is a RenderTexture sub-scene containing the cream background +
 *     PaperContent3D printed text. The whole composition becomes the
 *     diffuse color of the paper surface.
 *   - `normalMap` (paper_n.png) and `roughnessMap` (paper_r.png) then apply
 *     fiber relief and matte/shiny variation UNIFORMLY across the surface,
 *     including the printed text — so ink absorbs into the paper grain
 *     instead of floating as a separate object above it.
 *   - `receiveShadow` + `castShadow` for the sleeve's drop shadow and the
 *     paper's contact penumbra.
 */
const ASSET_BASE = "/assets/three/materials/paper";

const PAPER_W = 2.0;
const PAPER_H = PAPER_W * 1.55;

type PaperPlaneProps = {
  width: number;
  height: number;
  invoice: InvoiceDisplay;
};

export function PaperPlane({ width, height, invoice }: PaperPlaneProps) {
  const normal = useTexture(ASSET_BASE + "/paper_n.png", (texture: Texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(3, 4.5);
    texture.colorSpace = NoColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  });
  const rough = useTexture(ASSET_BASE + "/paper_r.png", (texture: Texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(3, 4.5);
    texture.colorSpace = NoColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  });

  return (
    <mesh receiveShadow castShadow position={[0, 0, 0]}>
      <planeGeometry args={[width, height, 32, 48]} />
      <meshPhysicalMaterial
        color="#fbfaf6"
        normalMap={normal}
        roughnessMap={rough}
        roughness={1}
        metalness={0}
        sheen={0.22}
        sheenColor="#f3ebd9"
        sheenRoughness={0.75}
      >
        {/* Sub-scene rendered into the diffuse map. Ortho camera maps the
            paper's bounds (-1..1 × -1.55..1.55 world units) 1:1 to texture
            space, so PaperContent3D's positions translate directly. The
            paper_n + paper_r maps from the outer material then apply fiber
            relief to whatever this renders. */}
        <RenderTexture attach="map" anisotropy={16} width={1280} height={1984}>
          <OrthographicCamera
            makeDefault
            manual
            position={[0, 0, 5]}
            left={-PAPER_W / 2}
            right={PAPER_W / 2}
            top={PAPER_H / 2}
            bottom={-PAPER_H / 2}
            near={0.1}
            far={10}
          />
          <color attach="background" args={["#fbfaf6"]} />
          <PaperContent3D invoice={invoice} />
        </RenderTexture>
      </meshPhysicalMaterial>
    </mesh>
  );
}
