/**
 * three.js object builders for the fragrance scene. No React in here —
 * the scene component wires these together and drives their per-frame state.
 */

import * as THREE from "three";
import {
  getLostFragranceBuildings,
  getLostFragranceSigns,
  getLostFragranceWindows,
  type LostFragranceSign
} from "./fragrance-city";
import {
  LOST_FRAGRANCE_GROUND_FRAGMENT,
  LOST_FRAGRANCE_GROUND_VERTEX,
  LOST_FRAGRANCE_STREAK_COUNT
} from "./fragrance-ground";

const RAIN_COUNT = 1200;
const RAIN_BOX = { x: 34, yMin: 0, yMax: 24, z: 30 };
const MOTE_COUNT = 240;
const WINDOW_WIDTH = 0.3;
const WINDOW_HEIGHT = 0.4;
export const LOST_FRAGRANCE_COLUMN_POSITION = { x: 0, z: -2 };

/** Deterministic pseudo-random shared with the layout module. */
function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** Soft round sprite so particles never render as hard squares. */
function createRoundSpriteTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildLostFragranceCity(scene: THREE.Scene) {
  const disposables: Array<{ dispose: () => void }> = [];
  const buildings = getLostFragranceBuildings();

  const buildingMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0a0b0d"),
    metalness: 0.1,
    roughness: 0.85
  });
  disposables.push(buildingMaterial);
  const group = new THREE.Group();
  for (const building of buildings) {
    const geometry = new THREE.BoxGeometry(
      building.width,
      building.height,
      building.depth
    );
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, buildingMaterial);
    mesh.position.set(building.x, building.height / 2, building.z);
    group.add(mesh);
  }

  // lit windows — instanced, per-instance warm/cool color
  const windows = getLostFragranceWindows(buildings);
  const windowGeometry = new THREE.PlaneGeometry(WINDOW_WIDTH, WINDOW_HEIGHT);
  const windowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#ffffff"),
    toneMapped: true
  });
  disposables.push(windowGeometry, windowMaterial);
  const windowMesh = new THREE.InstancedMesh(
    windowGeometry,
    windowMaterial,
    windows.length
  );
  const matrix = new THREE.Matrix4();
  const warm = new THREE.Color("#ffb87a");
  const cool = new THREE.Color("#a9c6e4");
  const instanceColor = new THREE.Color();
  windows.forEach((win, index) => {
    matrix.setPosition(win.x, win.y, win.z);
    windowMesh.setMatrixAt(index, matrix);
    const brightness = 0.35 + seeded(index, 31) * 0.65;
    instanceColor.copy(win.warm ? warm : cool).multiplyScalar(brightness);
    windowMesh.setColorAt(index, instanceColor);
  });
  windowMesh.instanceMatrix.needsUpdate = true;
  if (windowMesh.instanceColor) windowMesh.instanceColor.needsUpdate = true;
  group.add(windowMesh);

  // neon signage — the bloom + reflection events
  const signs = getLostFragranceSigns(buildings);
  const signMeshes: Array<{
    mesh: THREE.Mesh;
    material: THREE.MeshBasicMaterial;
    baseColor: THREE.Color;
    sign: LostFragranceSign;
    phase: number;
  }> = [];
  signs.forEach((sign, index) => {
    const geometry = new THREE.PlaneGeometry(sign.width, sign.height);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(sign.color),
      toneMapped: false
    });
    disposables.push(geometry, material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(sign.x, sign.y, sign.z);
    group.add(mesh);
    signMeshes.push({
      baseColor: new THREE.Color(sign.color),
      material,
      mesh,
      phase: seeded(index, 41) * Math.PI * 2,
      sign
    });
  });

  scene.add(group);
  return {
    dispose: () => {
      scene.remove(group);
      windowMesh.dispose();
      disposables.forEach((item) => item.dispose());
    },
    group,
    signMeshes,
    windowMaterial
  };
}

export function buildLostFragranceGround(scene: THREE.Scene) {
  const geometry = new THREE.PlaneGeometry(160, 160);
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uBase: { value: new THREE.Color("#050506") },
    uKeyColor: { value: new THREE.Color("#aab4c4") },
    uKeyIntensity: { value: 0 },
    uKeyPos: { value: new THREE.Vector3(-4, 6, 2) },
    uStreakColor: {
      value: Array.from(
        { length: LOST_FRAGRANCE_STREAK_COUNT },
        () => new THREE.Color(0, 0, 0)
      )
    },
    uStreakIntensity: {
      value: new Array(LOST_FRAGRANCE_STREAK_COUNT).fill(0)
    },
    uStreakPos: {
      value: Array.from(
        { length: LOST_FRAGRANCE_STREAK_COUNT },
        () => new THREE.Vector3()
      )
    },
    uWet: { value: 0.5 }
  };
  const material = new THREE.ShaderMaterial({
    fog: true,
    fragmentShader: LOST_FRAGRANCE_GROUND_FRAGMENT,
    uniforms,
    vertexShader: LOST_FRAGRANCE_GROUND_VERTEX
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
  return {
    dispose: () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
    material,
    uniforms
  };
}

export function buildLostFragranceRain(scene: THREE.Scene) {
  const positions = new Float32Array(RAIN_COUNT * 6);
  const speeds = new Float32Array(RAIN_COUNT);
  for (let i = 0; i < RAIN_COUNT; i += 1) {
    const x = (seeded(i, 6) - 0.5) * RAIN_BOX.x;
    const y =
      RAIN_BOX.yMin + seeded(i, 7) * (RAIN_BOX.yMax - RAIN_BOX.yMin);
    const z = (seeded(i, 8) - 0.5) * RAIN_BOX.z;
    const speed = 9 + seeded(i, 9) * 9;
    const length = speed * 0.028;
    positions[i * 6] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    positions[i * 6 + 3] = x;
    positions[i * 6 + 4] = y + length;
    positions[i * 6 + 5] = z;
    speeds[i] = speed;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color("#8fa5c0"),
    depthWrite: false,
    opacity: 0,
    transparent: true
  });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
  return {
    dispose: () => {
      scene.remove(lines);
      geometry.dispose();
      material.dispose();
    },
    geometry,
    material,
    positions,
    speeds,
    update: (dtSeconds: number) => {
      for (let i = 0; i < RAIN_COUNT; i += 1) {
        const fall = speeds[i] * dtSeconds;
        let y = positions[i * 6 + 1] - fall;
        if (y < RAIN_BOX.yMin) y = RAIN_BOX.yMax;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 4] = y + speeds[i] * 0.028;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  };
}

export function buildLostFragranceMotes(scene: THREE.Scene) {
  const positions = new Float32Array(MOTE_COUNT * 3);
  const drift = new Float32Array(MOTE_COUNT * 3);
  for (let i = 0; i < MOTE_COUNT; i += 1) {
    positions[i * 3] = (seeded(i, 10) - 0.5) * 24;
    positions[i * 3 + 1] = 0.2 + seeded(i, 11) * 8;
    // keep motes ahead of the camera path so none balloon at the lens
    positions[i * 3 + 2] = -16 + seeded(i, 12) * 18;
    drift[i * 3] = (seeded(i, 13) - 0.5) * 0.3;
    drift[i * 3 + 1] = (seeded(i, 14) - 0.5) * 0.12;
    drift[i * 3 + 2] = (seeded(i, 15) - 0.5) * 0.3;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const texture = createRoundSpriteTexture();
  const material = new THREE.PointsMaterial({
    blending: THREE.AdditiveBlending,
    color: new THREE.Color("#9aa3ad"),
    depthWrite: false,
    map: texture,
    opacity: 0,
    size: 0.13,
    sizeAttenuation: true,
    transparent: true
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return {
    dispose: () => {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
    material,
    update: (dtSeconds: number) => {
      for (let i = 0; i < MOTE_COUNT; i += 1) {
        positions[i * 3] += drift[i * 3] * dtSeconds;
        positions[i * 3 + 1] += drift[i * 3 + 1] * dtSeconds;
        positions[i * 3 + 2] += drift[i * 3 + 2] * dtSeconds;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  };
}

const COLUMN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const COLUMN_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float vertical = pow(1.0 - vUv.y, 1.35);
    float facing = pow(max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.6);
    float alpha = vertical * facing * uIntensity * 0.34;
    gl_FragColor = vec4(uColor * (1.0 + uIntensity * 0.6), alpha);
  }
`;

/**
 * The reveal object: a quiet column of light on a plinth. The bottle slot
 * stays empty until original assets exist — this stands in as pure light.
 */
export function buildLostFragranceColumn(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.set(
    LOST_FRAGRANCE_COLUMN_POSITION.x,
    0,
    LOST_FRAGRANCE_COLUMN_POSITION.z
  );

  const beamGeometry = new THREE.CylinderGeometry(0.16, 0.24, 4.4, 24, 1, true);
  const beamUniforms = {
    uColor: { value: new THREE.Color("#d29a5a") },
    uIntensity: { value: 0 }
  };
  const beamMaterial = new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fragmentShader: COLUMN_FRAGMENT,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: beamUniforms,
    vertexShader: COLUMN_VERTEX
  });
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.y = 4.4 / 2 + 0.18;
  group.add(beam);

  const plinthGeometry = new THREE.BoxGeometry(1.15, 0.18, 1.15);
  const plinthMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#101114"),
    metalness: 0.6,
    roughness: 0.35
  });
  const plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
  plinth.position.y = 0.09;
  group.add(plinth);

  const glow = new THREE.PointLight("#d29a5a", 0, 26, 1.8);
  glow.position.set(0, 1.4, 0.6);
  group.add(glow);

  scene.add(group);
  return {
    beamUniforms,
    dispose: () => {
      scene.remove(group);
      beamGeometry.dispose();
      beamMaterial.dispose();
      plinthGeometry.dispose();
      plinthMaterial.dispose();
    },
    glow,
    group
  };
}
