"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Environment,
  PerspectiveCamera,
  Text,
  useTexture
} from "@react-three/drei";
import {
  type Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace
} from "three";

/**
 * RecordScene — the YM.FM vinyl record as a real PBR mesh.
 *
 * Exports the SCENE only (no <Canvas>) so the host turntable can
 * share one Canvas with the marble via Drei <View>. The LP texture
 * set under /public/assets/textures/lp/ becomes the PBR material:
 *
 *   lp_grooves@2x.png      → map           (albedo)
 *   lp_effects@2x.png      → bumpMap       (surface relief for the
 *                                           sweeping highlight)
 *   lp_grooves_op75@2x.png → roughnessMap
 *
 * Lit by the urban_alley HDR (reused from /assets/three/tape/), with
 * a soft directional fill so the disc has a clear top-right brighter
 * cue regardless of cursor position.
 *
 * The center label, text, and spindle live inside the same rotating
 * group, so they spin with the disc — real vinyl labels are glued to
 * the record, not floating in front of it.
 */

const HDR_URL = "/assets/three/tape/urban_alley_01_1k.hdr";

const LP_BASE_URL = "/assets/textures/lp/lp_grooves@2x.png";
const LP_BUMP_URL = "/assets/textures/lp/lp_effects@2x.png";
const LP_ROUGH_URL = "/assets/textures/lp/lp_grooves_op75@2x.png";

interface RecordSceneProps {
  /** Whether the disc is currently rotating. */
  spinning: boolean;
  /**
   * Rotation rate in revolutions per second. Defaults to a slow
   * ambient drift — a real 33⅓ RPM record is 0.555 rps; this is
   * deliberately calmer than that for a non-distracting idle.
   */
  rps?: number;
}

export function RecordScene({ spinning, rps = 1 / 16 }: RecordSceneProps) {
  const groupRef = useRef<Group>(null);
  const angle = useRef(0);

  // useTexture supports an array → returns parallel array of Textures.
  // useTexture suspends until ALL load, so the Suspense fallback shows
  // nothing until the record is fully ready (no half-loaded look).
  const [baseMap, bumpMap, roughnessMap] = useTexture(
    [LP_BASE_URL, LP_BUMP_URL, LP_ROUGH_URL],
    () => {
      // colorSpace matters: the base map is the visible color (sRGB),
      // the bump and roughness maps are data (NoColorSpace) — applying
      // sRGB→linear to them would skew the normals and roughness curves.
      baseMap.colorSpace = SRGBColorSpace;
      bumpMap.colorSpace = NoColorSpace;
      roughnessMap.colorSpace = NoColorSpace;
      [baseMap, bumpMap, roughnessMap].forEach((t) => {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.minFilter = LinearMipmapLinearFilter;
        t.magFilter = LinearFilter;
        t.anisotropy = 8;
        t.needsUpdate = true;
      });
    }
  );

  useFrame((_state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    if (spinning) {
      angle.current -= 2 * Math.PI * rps * delta;
      g.rotation.z = angle.current;
    }
  });

  return (
    <>
      {/* Drei <View> defaults to the parent Canvas's camera, which is
          R3F's default (position z=5, fov 75). That places the disc
          far enough back that a 0.92-radius circle is barely visible.
          Anchor a per-view camera at the same position/fov the legacy
          standalone canvas used so the disc fills the view properly. */}
      <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={35} />

      {/* HDR-based image-based lighting. background=false keeps the env
          for reflections only (no skybox showing through the alpha). */}
      <Environment files={HDR_URL} background={false} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={1.6} />
      <pointLight
        position={[-1.2, 1.8, 2.0]}
        intensity={1.5}
        distance={5}
        decay={2}
      />

      <group ref={groupRef}>
        {/* The vinyl disc. MeshPhysicalMaterial (not Standard) for the
            clearcoat — real pressed vinyl has a glossy plastic shell
            over the dark base that produces the rotating sheen. */}
        <mesh>
          <circleGeometry args={[0.92, 128]} />
          <meshPhysicalMaterial
            map={baseMap}
            bumpMap={bumpMap}
            bumpScale={0.1}
            roughnessMap={roughnessMap}
            roughness={0.1}
            metalness={0.0}
            envMapIntensity={1.4}
            clearcoat={1.0}
            clearcoatRoughness={0.12}
            reflectivity={0.5}
          />
        </mesh>

        {/* Center label — slightly lifted in Z so it doesn't z-fight the
            disc. Tomato-red with a mild clearcoat so the print picks up
            a subtle glossy highlight (real labels are slightly glossier
            than the surrounding vinyl). */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.3, 64]} />
          <meshPhysicalMaterial
            color="#cd2818"
            roughness={0.62}
            metalness={0.0}
            envMapIntensity={0.7}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
          />
        </mesh>

        {/* YM / FM text — Drei's <Text> uses Troika under the hood.
            No font specified → Troika's default sans (Roboto). */}
        <Text
          position={[0, 0, 0.002]}
          fontSize={0.11}
          color="#f5e9d6"
          anchorX="center"
          anchorY="middle"
          lineHeight={1.05}
          letterSpacing={0.02}
        >
          {"YM\nFM"}
        </Text>

        {/* Spindle hole — small dark disc with a hint of metal so it
            picks up a tiny env reflection. */}
        <mesh position={[0, 0, 0.003]}>
          <circleGeometry args={[0.013, 32]} />
          <meshStandardMaterial
            color="#0a0807"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </group>
    </>
  );
}
