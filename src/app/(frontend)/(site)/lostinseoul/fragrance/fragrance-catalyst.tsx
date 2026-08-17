"use client";

/**
 * The catalyst-10 flacon — the rendered GLB that fills the bottle SLOT in the
 * scene, replacing the old procedural box-bottle.
 *
 * The GLB exports geometry only; materials are separate baked PNGs + a manifest,
 * wired by the repo's baked pipeline (`useBakedGLTF`) via name match — this
 * covers cap / cap_neck / label / pump.
 *
 * Glass and liquid are NOT baked: the baked glass map is unusable, and real
 * transmission is what makes the flacon read as glass in the water reflection.
 * They get the founder's hand-made physical materials here — the exact recipe
 * legacy's `buildLostCatalystBottle` used. (A bare `useBakedGLTF` drops these,
 * leaving glass opaque and the juice unlit — which is why the glass wasn't
 * frosted and the bottle never took ember colour.)
 */

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import * as THREE from "three";
import { useBakedGLTF, useBakedManifest } from "@/components/three/r3f-baked";
import { useFragranceR3fTuning } from "./fragrance-r3f-tuning";

const GLB_URL = "/assets/three/catalyst-10/catalyst-10.glb";
const TEXTURE_BASE = "/assets/three/catalyst-10/textures/";

// The GLB is authored ~95.7 units tall with its base at y=0; the procedural
// flacon it replaces is ~2.72 units (BODY_H + NECK_H + CAP_H), also base at 0.
const MODEL_SCALE = 2.72 / 95.7;

/** Match a mesh to a material slot by its own name or its parent node's name
 *  (glTF may name the Mesh after the mesh `*_geo` or after the node). */
function named(mesh: THREE.Mesh): string {
  return mesh.name || mesh.parent?.name || "";
}

export function CatalystModel() {
  const manifest = useBakedManifest(`${TEXTURE_BASE}manifest.json`);
  const { scene } = useBakedGLTF(GLB_URL, manifest, { basePath: TEXTURE_BASE });

  // Live material feel from the dev tuning store. In production the store never
  // changes (the panel never mounts), so this stays at the baked DEFAULTS — which
  // MIRROR the constructors below — and the apply effects run exactly once with
  // no-op writes. useShallow so a single value change doesn't churn identity.
  const tuning = useFragranceR3fTuning(
    useShallow((s) => ({
      glassIor: s.glassIor,
      glassRoughness: s.glassRoughness,
      glassThickness: s.glassThickness,
      glassClearcoat: s.glassClearcoat,
      glassEnvMap: s.glassEnvMap,
      juiceHue: s.juiceHue,
      juiceRoughness: s.juiceRoughness,
      juiceClearcoat: s.juiceClearcoat,
      juiceThickness: s.juiceThickness,
      juiceEnvMap: s.juiceEnvMap
    }))
  );

  // real transmission glass — same recipe as the procedural flacon, so the
  // water reflection and the glass read identically
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        clearcoat: 0,
        metalness: 0,
        roughness: 0,
        transmission: 1,
        thickness: 0.3
      }),
    []
  );
  // Pale champagne-gold juice (matches the Blender reference — a light warm
  // gold, NOT orange). OPAQUE by design: the glass is a transmission material and
  // three.js transmission only samples the OPAQUE scene behind it, so a
  // transmissive liquid inside transmissive glass would be invisible. A wet
  // clearcoat sheen keeps it reading as liquid; the glass refracts it into view.
  const liquid = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        clearcoat: 0.6,
        color: new THREE.Color("#cdb079"),
        envMapIntensity: 1,
        metalness: 0,
        roughness: 0.2,
        transmission: 1,
        blendColor: new THREE.Color("#cdb079"),
        specularColor: new THREE.Color("#cdb079"),
        specularIntensity: 1,
        thickness: 0.8
      }),
    []
  );

  // apply glass/liquid after the baked pipeline (which only touches
  // cap/cap_neck/label/pump; glass & liquid aren't in the manifest, so they'd
  // otherwise keep the GLB's default materials)
  useMemo(() => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = named(mesh);
      if (name.startsWith("glass")) mesh.material = glass;
      else if (name.startsWith("liquid")) mesh.material = liquid;
    });
  }, [scene, glass, liquid]);

  // Apply the uniform-backed material props live. These are all uniform-driven on
  // MeshPhysicalMaterial and update WITHOUT a shader recompile — safe to write on
  // every tuning change so continuous drags (ior/roughness/thickness/hue) stay
  // smooth. juiceHue drives all three gold slots (color/specular/blend) together.
  useEffect(() => {
    glass.ior = tuning.glassIor;
    glass.roughness = tuning.glassRoughness;
    glass.thickness = tuning.glassThickness;
    glass.envMapIntensity = tuning.glassEnvMap;

    liquid.color.set(tuning.juiceHue);
    liquid.specularColor.set(tuning.juiceHue);
    liquid.blendColor.set(tuning.juiceHue);
    liquid.roughness = tuning.juiceRoughness;
    liquid.thickness = tuning.juiceThickness;
    liquid.envMapIntensity = tuning.juiceEnvMap;
  }, [
    glass,
    liquid,
    tuning.glassIor,
    tuning.glassRoughness,
    tuning.glassThickness,
    tuning.glassEnvMap,
    tuning.juiceHue,
    tuning.juiceRoughness,
    tuning.juiceThickness,
    tuning.juiceEnvMap
  ]);

  // Clearcoat flips the USE_CLEARCOAT shader define when it crosses 0, so it needs
  // a recompile — scoped to its own effect so ONLY the clearcoat sliders trigger
  // one, not the smooth-drag knobs above.
  useEffect(() => {
    glass.clearcoat = tuning.glassClearcoat;
    glass.needsUpdate = true;
  }, [glass, tuning.glassClearcoat]);

  useEffect(() => {
    liquid.clearcoat = tuning.juiceClearcoat;
    liquid.needsUpdate = true;
  }, [liquid, tuning.juiceClearcoat]);

  useEffect(
    () => () => {
      glass.dispose();
      liquid.dispose();
    },
    [glass, liquid]
  );

  return <primitive object={scene} scale={MODEL_SCALE} />;
}
