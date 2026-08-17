/**
 * Catalyst flacon — the rendered GLB, wired for the LEGACY imperative showcase
 * scene. Drop-in for buildLostGlassBottle: it returns the exact same
 * LostGlassBottle contract (group / setReaction / materials.glass / lights /
 * dispose), so fragrance-scene.tsx only swaps the import.
 *
 * The GLB exports geometry + baked PNG texture sets (a manifest maps them).
 * Baked maps drive cap / cap_neck / pump / label. Glass and liquid are NOT
 * baked here — glass is a real MeshPhysicalMaterial transmission (the baked
 * glass map is unusable, and transmission is what makes the flacon read as
 * glass in the water reflection); liquid is the founder juice recipe.
 *
 * Loading is async (GLTF + textures); the group, lights and material handles
 * exist synchronously so the reaction rig and tuner bind immediately, and the
 * model populates the group when it arrives.
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  _prepTexture, type BakedMapKey, type BakeManifest, buildBakedMaterial, findObjectEntry
} from "@/components/three/r3f-baked";
import { buildEmberEnvironment, type LostGlassBottle } from "./fragrance-bottle";

const GLB_URL = "/assets/three/catalyst-10/catalyst-10.glb";
const TEXTURE_BASE = "/assets/three/catalyst-10/textures/";

// GLB authored ~95.7 units tall, base at y=0; normalise to the flacon
// silhouette height (~2.72) so the group's 0.7 fit-scale matches the legacy box
// bottle exactly.
const MODEL_SCALE = 2.72 / 95.7;

// founder-baked light balance (mirrors fragrance-bottle.ts setReaction)
const EMBER_BACK_BASE = 1.554;
const EMBER_BACK_SWING = 16.65;
const CAP_RIM_BASE = 0.336;
const CAP_RIM_SWING = 1.344;

type BottleDeps = { scene: THREE.Scene; renderer: THREE.WebGLRenderer };

/** Load every baked map for one object and build its material (glass skipped —
 *  it's hand-made transmission). Pure Three, no React. */
async function loadBakedMaterials(manifest: BakeManifest, loader: THREE.TextureLoader): Promise<Record<string, THREE.MeshStandardMaterial|THREE.MeshPhysicalMaterial>> {
  const flipY = manifest.flipY ?? false;
  const out: Record<string, THREE.MeshStandardMaterial> = {};
  for (const [object, entry] of Object.entries(manifest.objects)) {
    if (object === "glass") continue;
    const keys = Object.keys(entry.maps) as BakedMapKey[];
    const loaded = await Promise.all(keys.map(async (key) => {
      const texture = await loader.loadAsync(TEXTURE_BASE + entry.maps[key]!.file);
      return [key, _prepTexture(texture, entry.maps[key]!, flipY)] as const;
    }));
    const tex: Partial<Record<BakedMapKey, THREE.Texture>> = Object.fromEntries(loaded);
    out[object] = buildBakedMaterial(entry.maps, tex);
  }
  return out;
}

export function buildLostCatalystBottle(deps: BottleDeps): LostGlassBottle {
  const { scene, renderer } = deps;
  const env = buildEmberEnvironment(renderer);
  scene.environment = env;

  // real transmission glass — same recipe as the procedural flacon, so the
  // water reflection and the ?tune=1 glass knobs read identically
  const glass = new THREE.MeshPhysicalMaterial({
    transmission: 1.0,
    thickness: .25,
    ior: 1.69,
    roughness: 0,
    clearcoat: 0,
    color: new THREE.Color(0xffffff),
    metalness: 0
  });
  const liquid = new THREE.MeshPhysicalMaterial({
    transmission: 0.55,
    thickness: 1.6,
    ior: 1.4,
    roughness: 0.18,
    color: new THREE.Color(0x8f3812),
    attenuationColor: new THREE.Color(0x922c05),
    attenuationDistance: 0.5,
    envMapIntensity: 1.2,
    transparent: true
  });
  // cap material arrives from the bake; placeholder keeps the handle stable so
  // setReaction can drive its emissive from frame 0
  const materials: LostGlassBottle["materials"] = {
    glass, liquid, cap: new THREE.MeshPhysicalMaterial({}), label:new THREE.MeshPhysicalMaterial({}),
    capNeck:new THREE.MeshPhysicalMaterial({}),tube:new THREE.MeshPhysicalMaterial({}),
  };

  const group = new THREE.Group();
  group.scale.setScalar(0.7);
  scene.add(group);

  // ember key behind the flacon (toward the plume) + a dim warm cap rim —
  // setReaction owns intensity, the tuner scales it
  const emberBack = new THREE.PointLight(0xff5f22, 0, 26, 2);
  emberBack.position.set(0.0, 1.15, -2.3);
  scene.add(emberBack);
  const capRim = new THREE.PointLight(0xffd3a8, 0, 12, 2);
  capRim.position.set(1.6, 2.8, 1.4);
  scene.add(capRim);

  let disposed = false;
  let bakedMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  const loader = new THREE.TextureLoader();

  void Promise.all([new GLTFLoader().loadAsync(GLB_URL),
    fetch(`${TEXTURE_BASE}manifest.json`).then((r) => r.json() as Promise<BakeManifest>)]).
    then(async ([gltf, manifest]) => {
      const baked = await loadBakedMaterials(manifest, loader);
      const model = gltf.scene;
      model.scale.setScalar(MODEL_SCALE);
      model.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return; else if (mesh.name.startsWith("glass")) {
          mesh.material = glass;
          return;
        } else if (mesh.name.startsWith("liquid")) {
          mesh.material = liquid;
          return;
        }

        else {
          console.log(mesh.name);
          const hit = findObjectEntry(manifest, mesh.name);
          if (hit && baked[hit.key]) {
            mesh.material = baked[hit.key];
            if(materials[hit.key]) {
            }
          }
        }
      });
      if (disposed) {
        for (const material of Object.values(baked)) material.dispose();
        return;
      }
      bakedMaterials = baked;
      group.add(model);
    }).catch((error: unknown) => {
      // load failure leaves the group empty — the scene (water, plume, lights)
      // still renders; surface it in dev so a bad export/path is obvious
      if (process.env.NODE_ENV !== "production") {
        console.error("[catalyst-bottle] failed to load GLB/textures", error);
      }
    });

  return {
    group, materials, lights: { emberBack }, setReaction(reaction: number, ember: THREE.Color): void {
      const r = Math.min(Math.max(reaction, 0), 1);
      emberBack.color.copy(ember);
      emberBack.intensity = EMBER_BACK_BASE + EMBER_BACK_SWING * r;
    }, dispose(): void {
      disposed = true;
      scene.remove(group);
      scene.remove(emberBack);
      scene.remove(capRim);
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry?.dispose();
      });
      glass.dispose();
      liquid.dispose();
      materials.cap.dispose();
      for (const material of Object.values(bakedMaterials)) material.dispose();
      if (scene.environment === env) scene.environment = null;
      env.dispose();
    }
  };
}
