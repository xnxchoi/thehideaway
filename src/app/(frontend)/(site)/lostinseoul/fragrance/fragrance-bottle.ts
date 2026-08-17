/**
 * The Catalyst flacon — a REAL material glass bottle (PBR transmission), replacing the
 * old fake-glass lathe. Tall, slim, rectangular; cap:body proportioned at the golden
 * ratio (body ≈ φ·cap), flush width so the neck reveal marks the golden seam. Coloured
 * liquid with a real fill line. Ember-lit and mostly in shadow — revealed by the reaction,
 * and reflected in the water floor (it is NOT in the water's ignoreObjects).
 *
 * Glass = MeshPhysicalMaterial transmission (validated on this stack). A warm PMREM env
 * gives the glass something to reflect/refract; the plume behind refracts through it.
 */

import * as THREE from "three";

const PHI = 1.618;

// --- silhouette (units ~ the scene's; base sits on the water at y = 0) ---
const CAP_H = 1.0;
const BODY_H = CAP_H * PHI; // ≈ 1.62 — golden ratio body : cap
const NECK_H = 0.1;
const NECK_INSET = 0.72; // collar width vs body — wide enough to read as a shoulder, not a gap
const WIDTH = 0.58; // slim, but with enough mass to read as a flacon (not a pencil)
const DEPTH = 0.52;
const LIQUID_FILL = 0.82; // high fill — minimises the clear-glass span that reads as a "gap"

/** The flacon's blessed silhouette — single source for any renderer (r3f scene included). */
export const LOST_FLACON_SILHOUETTE = {
  BODY_H,
  CAP_H,
  DEPTH,
  LIQUID_FILL,
  NECK_H,
  NECK_INSET,
  WIDTH
} as const;

type BottleDeps = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
};

export type LostGlassBottle = {
  group: THREE.Group;
  /** drive the ember reveal: reaction 0..1, current ember colour */
  setReaction: (reaction: number, ember: THREE.Color) => void;
  /** live handles for the dev tuning panel — never mutated by the render loop */
  materials: {
    glass: THREE.MeshPhysicalMaterial;
    liquid: THREE.MeshPhysicalMaterial;
    cap: THREE.MeshPhysicalMaterial;
    label: THREE.MeshPhysicalMaterial;
    tube: THREE.MeshStandardMaterial;
    capNeck: THREE.MeshPhysicalMaterial;
  };
  /** ember key + cap rim; `setReaction` owns their intensity, leva scales it */
  lights: {
    emberBack: THREE.PointLight;
  };
  dispose: () => void;
};

export function buildEmberEnvironment(
  renderer: THREE.WebGLRenderer
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const cx = canvas.getContext("2d");
  if (!cx) throw new Error("no 2d context for ember env");
  cx.fillStyle = "#0e0a08";
  cx.fillRect(0, 0, 512, 128);
  const grad = cx.createLinearGradient(0, 64, 0, 128);
  grad.addColorStop(0, "rgba(120,45,15,0)");
  grad.addColorStop(1, "rgba(226,96,28,0.95)");
  cx.fillStyle = grad;
  cx.fillRect(0, 64, 512, 64);
  const bar = (x: number, w: number, a: number, h: number): void => {
    const g = cx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, "rgba(255,205,160,0)");
    g.addColorStop(0.5, `rgba(255,214,176,${a})`);
    g.addColorStop(1, "rgba(255,205,160,0)");
    cx.fillStyle = g;
    cx.fillRect(x - w, 0, 2 * w, h);
  };
  bar(120, 26, 0.85, 96);
  bar(300, 16, 0.55, 78);
  bar(420, 34, 0.4, 104);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}

/**
 * Neutral studio environment for the SHOWCASE bottle. The bottle must stay a
 * neutral, near-colourless glass object — the ember belongs to the surroundings
 * (plume, water reflection), not to the bottle's surface. So its reflections
 * come from a dark, desaturated map with soft cool highlights the glass edges
 * can catch, NOT the orange ember map (which washed the whole flacon amber).
 */
export function buildNeutralEnvironment(
  renderer: THREE.WebGLRenderer
): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const cx = canvas.getContext("2d");
  if (!cx) throw new Error("no 2d context for neutral env");
  // near-black base
  cx.fillStyle = "#0a0a0c";
  cx.fillRect(0, 0, 512, 128);
  // a dim cool key from "above" so the glass reads as glass, not a black slab
  const grad = cx.createLinearGradient(0, 0, 0, 70);
  grad.addColorStop(0, "rgba(122,128,140,0.5)");
  grad.addColorStop(1, "rgba(18,18,22,0)");
  cx.fillStyle = grad;
  cx.fillRect(0, 0, 512, 70);
  // a couple of soft neutral highlights for the glass edges to pick up
  const bar = (x: number, w: number, a: number): void => {
    const g = cx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, "rgba(205,210,220,0)");
    g.addColorStop(0.5, `rgba(208,213,222,${a})`);
    g.addColorStop(1, "rgba(205,210,220,0)");
    cx.fillStyle = g;
    cx.fillRect(x - w, 0, 2 * w, 128);
  };
  bar(150, 10, 0.5);
  bar(384, 14, 0.32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}
