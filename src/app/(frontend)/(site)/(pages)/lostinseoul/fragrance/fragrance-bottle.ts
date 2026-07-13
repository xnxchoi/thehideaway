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
    cap: THREE.MeshStandardMaterial;
  };
  /** ember key + cap rim; `setReaction` owns their intensity, leva scales it */
  lights: {
    emberBack: THREE.PointLight;
    capRim: THREE.PointLight;
  };
  dispose: () => void;
};

function buildEmberEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
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

export function buildLostGlassBottle(deps: BottleDeps): LostGlassBottle {
  const { scene, renderer } = deps;

  const env = buildEmberEnvironment(renderer);
  scene.environment = env;

  // Tuned on the founder's GPU (workplan Level 1). A satin, high-IOR glass: roughness
  // 0.53 frosts the transmission so the flacon reads as a solid body of light rather
  // than a clear window, and clearcoat is off — no lacquer sheen over the frost.
  const glass = new THREE.MeshPhysicalMaterial({
    transmission: 1.0,
    thickness: 1.05,
    ior: 1.69,
    roughness: 0.53,
    metalness: 0.0,
    transparent: true,
    color: 0xffffff,
    attenuationColor: new THREE.Color(0xd06a2a),
    attenuationDistance: 3.1,
    envMapIntensity: 1.35,
    clearcoat: 0,
    clearcoatRoughness: 0.08
  });

  const liquidMat = new THREE.MeshPhysicalMaterial({
    transmission: 0.55,
    thickness: 1.6,
    ior: 1.4,
    roughness: 0.18,
    color: new THREE.Color(0x8f3812),
    attenuationColor: new THREE.Color(0x922c05),
    attenuationDistance: 0.5,
    transparent: true,
    envMapIntensity: 1.2
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x171310),
    roughness: 0.34,
    metalness: 0.7,
    envMapIntensity: 1.6,
    // a whisper of ember so the cap is a dark object catching firelight, never a
    // pure-black hole against the bright plume; driven up slightly with the reaction.
    emissive: new THREE.Color(0x160a04)
  });

  const meniscusMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffb066),
    transparent: true,
    opacity: 0.3
  });

  const group = new THREE.Group();

  // body — base on the water (y = 0)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH, BODY_H, DEPTH),
    glass
  );
  body.position.y = BODY_H / 2;
  group.add(body);

  // liquid — lower LIQUID_FILL of the body, inset from the glass walls
  const liqH = BODY_H * LIQUID_FILL;
  const liquid = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH * 0.9, liqH, DEPTH * 0.9),
    liquidMat
  );
  liquid.position.y = liqH / 2;
  group.add(liquid);

  const meniscus = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH * 0.9, 0.012, DEPTH * 0.9),
    meniscusMat
  );
  meniscus.position.y = liqH;
  group.add(meniscus);

  // shoulder collar — a shallow inset that joins body to cap; wide enough (NECK_INSET)
  // that the cap reads as sitting ON the body rather than floating above a thin gap
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH * NECK_INSET, NECK_H, DEPTH * NECK_INSET),
    glass
  );
  neck.position.y = BODY_H + NECK_H / 2;
  group.add(neck);

  // cap — flush width, golden-minor of the column
  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH, CAP_H, DEPTH),
    capMat
  );
  cap.position.y = BODY_H + NECK_H + CAP_H / 2;
  group.add(cap);

  // fit the frame with breathing room (base stays on the water at y = 0)
  group.scale.setScalar(0.7);
  scene.add(group);

  // Ember reveal, BACK-LIT: the key light sits behind the flacon (toward the plume),
  // so the transmission glass glows from within and the vertical edges rim-light —
  // no front-facing hot-dot punching through the body.
  const emberBack = new THREE.PointLight(0xff5f22, 0, 26, 2);
  emberBack.position.set(0.0, 1.15, -2.3);
  scene.add(emberBack);

  // a dim warm rim from high front-left so the cap catches an edge highlight and never
  // reads as a dead black slab — kept low so the cap stays mostly in shadow.
  const capRim = new THREE.PointLight(0xffd3a8, 0, 12, 2);
  capRim.position.set(1.6, 2.8, 1.4);
  scene.add(capRim);

  return {
    group,
    materials: { glass, liquid: liquidMat, cap: capMat },
    lights: { emberBack, capRim },
    setReaction: (reaction, ember) => {
      const r = Math.min(Math.max(reaction, 0), 1);
      emberBack.color.copy(ember);
      // coefficients carry the founder's baked light balance (ember ×1.11, rim ×0.84)
      emberBack.intensity = 1.554 + 16.65 * r;
      capRim.intensity = 0.336 + 1.344 * r;
      // the liquid warms as the reaction climbs
      liquidMat.emissive.copy(ember).multiplyScalar(0.06 * r);
      // the cap picks up a faint ember edge at peak — stays a shadowed object
      capMat.emissive.copy(ember).multiplyScalar(0.04 + 0.05 * r);
    },
    dispose: () => {
      body.geometry.dispose();
      liquid.geometry.dispose();
      meniscus.geometry.dispose();
      neck.geometry.dispose();
      cap.geometry.dispose();
      glass.dispose();
      liquidMat.dispose();
      capMat.dispose();
      meniscusMat.dispose();
      env.dispose();
      if (scene.environment === env) scene.environment = null;
      scene.remove(group);
      scene.remove(emberBack);
      scene.remove(capRim);
    }
  };
}
