"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Text, useTexture } from "@react-three/drei";
import {
  type Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace
} from "three";
import s from "./Demimonde.module.scss";
import { cn } from "@/lib/utils";

/**
 * DemimondeRecord — the YM.FM vinyl record, rendered as a real PBR
 * mesh in R3F instead of stacked CSS PNG layers.
 *
 * The LP texture set under /public/assets/textures/lp/ — originally
 * authored as a Photoshop layer stack — becomes a proper Three.js
 * material:
 *
 *   base@2x.png         → map           (albedo: dark vinyl + center area)
 *   lp_grooves@2x.png   → bumpMap       (grayscale → derived normal,
 *                                        so real specular highlights
 *                                        sweep across actual ridges as
 *                                        the record spins under the HDR
 *                                        lighting from urban_alley)
 *   lp_grooves_op75@2x  → roughnessMap  (grooves are rougher than
 *                                        smooth vinyl gaps — lighter
 *                                        in this map = matte, darker =
 *                                        more reflective)
 *
 * Lit by the same urban_alley HDR the marble uses, plus a soft
 * directional fill so the disc has a clear "top-right is brighter"
 * cue regardless of cursor.
 *
 * Center label, text, and spindle live inside the same rotating group,
 * so they spin with the disc — the visually correct behavior (real
 * vinyl labels are glued to the record).
 *
 * Performance: own Canvas (separate from DemimondeMarble) so the two
 * concerns stay isolated. Both are small (~380px), DPR-capped at 2,
 * and the LP one barely costs anything because there's only one mesh
 * with one material.
 */

const HDR_URL = "/assets/three/tape/urban_alley_01_1k.hdr";

const LP_BASE_URL = "/assets/textures/lp/lp_grooves@2x.png";
const LP_BUMP_URL = "/assets/textures/lp/lp_effects@2x.png";
const LP_ROUGH_URL = "/assets/textures/lp/lp_grooves_op75@2x.png";

interface RecordSceneProps {
  spinning: boolean;
}

function RecordScene({ spinning }: RecordSceneProps) {
  const groupRef = useRef<Group>(null);
  const angle = useRef(0);

  // useTexture supports an array → returns parallel array of Textures.
  // useTexture suspends until ALL load, so the Suspense fallback below
  // shows nothing until the record is fully ready (no half-loaded look).
  const [baseMap, bumpMap, roughnessMap] = useTexture(
    [LP_BASE_URL, LP_BUMP_URL, LP_ROUGH_URL],
    () => {
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

  // Configure once after textures land. colorSpace matters: the base
  // map is the visible color (sRGB), the bump and roughness maps are
  // data (NoColorSpace) — applying sRGB→linear to them would skew the
  // normals and roughness curves.

  useFrame((_state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    // 4-second period when spinning, exact zero when not. Doing it as
    // a delta-multiplied integration keeps the angle smooth across
    // frame-rate variance.
    if (spinning) {
      angle.current -= ((2 * Math.PI) / 4) * delta;
      g.rotation.z = angle.current;
    }
  });

  return (
    <>
      {/* HDR-based image-based lighting. background=false keeps the env
          for reflections only (no skybox showing through the alpha). */}
      <Environment files={HDR_URL} background={false} />
      {/* Soft ambient + a directional key + a small point sun for a
          tighter clearcoat glint than the env reflection alone gives.
          Two-light setup reads as "lit object on a table" rather than
          "object floating in a uniform room." */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={1.6} />
      <pointLight
        position={[-1.2, 1.8, 2.0]}
        intensity={1.5}
        distance={5}
        decay={2}
      />

      <group ref={groupRef}>
        {/* The vinyl disc.
            MeshPhysicalMaterial (not Standard) for clearcoat — real
            pressed vinyl has a glossy plastic shell over the dark base
            that gives it the rotating sheen. Without clearcoat the
            surface reads as matte black acrylic, not vinyl.
            bumpScale 0.03 (not 0.004) because lp_grooves was painted
            for visual stacking, not as a tight grayscale heightfield —
            needs more amplitude to register as real surface relief. */}
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

        {/* Center label — slightly lifted in Z. Tomato-red with mild
            clearcoat so the print surface picks up a subtle glossy
            highlight (real labels are slightly glossier than the
            surrounding vinyl). */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.3, 64]} />
          <meshPhysicalMaterial
            color="#cd2818"
            roughness={0.62}
            metalness={0.0}
            envMapIntensity={0.7}
            clearcoat={0.6}
            clearcoatRoughness={0.3}
          ></meshPhysicalMaterial>
        </mesh>

        {/* YM / FM text — Drei's Text is Troika under the hood. No
            font specified → uses Troika's default sans (Roboto). Italic
            via custom font would be nicer but adds a font fetch; the
            default reads well enough at this scale. */}
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

interface DemimondeRecordProps {
  spinning: boolean;
  className?: string;
}

export function DemimondeRecord({ spinning, className }: DemimondeRecordProps) {
  return (
    <div className={cn("inset-0 absolute",className )} aria-hidden>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        camera={{ position: [0, 0, 2.5], fov: 35 }}
        flat
      >
        <Suspense fallback={null}>
          <RecordScene spinning={spinning} />
        </Suspense>
      </Canvas>
    </div>
  );
}
