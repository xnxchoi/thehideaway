/**
 * three.js object builders for the Catalyst chapter — the bottle is the hero,
 * the ember reaction is the backdrop. No React in here; the scene component
 * wires these together and drives their per-frame state from the reaction
 * field (fragrance-light.ts, evaluateLostFragranceReaction).
 *
 * What exists:
 *   - the BOTTLE: a lathed clear-glass cylinder with ember juice + chrome cap
 *   - the BACKDROP: an ember bloom that reacts and throws outward behind/through it
 *   - MOTES: ember particulate suspended in the reaction
 *
 * Geometry proportions match the founder-approved study (~3.4 slenderness,
 * 0.35 body radius). See readmes/LOSTINSEOUL_FRAGRANCE.md §8.
 */

import * as THREE from "three";

/* ---------- bottle profile (bottom -> top), surface of revolution ---------- */
const GLASS_TOP = 2.64;
const BOTTLE_PROFILE: Array<[number, number]> = [
  [0.0, 0.0],
  [0.18, 0.0],
  [0.29, 0.006],
  [0.335, 0.02],
  [0.35, 0.05],
  [0.35, 0.09],
  [0.35, 1.85],
  [0.35, 2.1],
  [0.35, 2.2],
  [0.345, 2.3],
  [0.335, 2.38],
  [0.315, 2.45],
  [0.285, 2.51],
  [0.245, 2.55],
  [0.2, 2.585],
  [0.165, 2.61],
  [0.15, 2.625],
  [0.15, 2.64],
  [0.19, 2.65],
  [0.19, 2.74],
  [0.245, 2.75],
  [0.245, 2.815],
  [0.205, 2.822],
  [0.205, 2.85],
  [0.245, 2.858],
  [0.245, 2.918],
  [0.205, 2.925],
  [0.205, 2.952],
  [0.232, 2.96],
  [0.232, 3.03],
  [0.205, 3.045],
  [0.12, 3.065],
  [0.0, 3.072]
];
export const LOST_BOTTLE_HEIGHT = 3.072;

export type LostCatalystBottle = {
  group: THREE.Group;
  uniforms: {
    uEmber: { value: THREE.Color };
    uJuice: { value: number };
    uKey: { value: number };
    uReaction: { value: number };
    uTotalH: { value: number };
  };
  dispose: () => void;
};

export function buildLostCatalystBottle(
  scene: THREE.Scene
): LostCatalystBottle {
  const pts = BOTTLE_PROFILE.map(([r, y]) => ({
    r,
    y,
    cap: y >= GLASS_TOP - 1e-4 ? 1 : 0
  }));
  const n2 = pts.map((_p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b.r - a.r;
    const ty = b.y - a.y;
    const L = Math.hypot(tx, ty) || 1;
    return [ty / L, -tx / L];
  });

  const seg = 150;
  const position: number[] = [];
  const normal: number[] = [];
  const cap: number[] = [];
  const index: number[] = [];
  for (let i = 0; i < pts.length; i += 1) {
    for (let j = 0; j <= seg; j += 1) {
      const th = (j / seg) * Math.PI * 2;
      const c = Math.cos(th);
      const sn = Math.sin(th);
      position.push(pts[i].r * c, pts[i].y, pts[i].r * sn);
      const nl = Math.hypot(n2[i][0], n2[i][1]) || 1;
      normal.push((n2[i][0] / nl) * c, n2[i][1] / nl, (n2[i][0] / nl) * sn);
      cap.push(pts[i].cap);
    }
  }
  const stride = seg + 1;
  for (let i = 0; i < pts.length - 1; i += 1) {
    for (let j = 0; j < seg; j += 1) {
      const a = i * stride + j;
      const b = a + 1;
      const d = (i + 1) * stride + j;
      const e = d + 1;
      index.push(a, d, b, b, d, e);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(position, 3)
  );
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  geometry.setAttribute("aCap", new THREE.Float32BufferAttribute(cap, 1));
  geometry.setIndex(index);

  const uniforms = {
    uEmber: { value: new THREE.Color(0.81, 0.35, 0.16) },
    uJuice: { value: 0.05 },
    uKey: { value: 0.24 },
    uReaction: { value: 0.04 },
    uTotalH: { value: LOST_BOTTLE_HEIGHT }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aCap;
      uniform float uTotalH;
      varying vec3 vN, vW;
      varying float vCap, vYn;
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vCap = aCap; vYn = position.y / uTotalH;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vN, vW; varying float vCap, vYn;
      uniform vec3 uEmber; uniform float uJuice, uKey, uReaction;
      const vec3 cool = vec3(0.24, 0.28, 0.36);
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        vec3 Lk = normalize(vec3(0.55, 0.7, 0.65));
        vec3 Lf = normalize(vec3(-0.75, 0.15, 0.3));
        float dk = max(dot(N, Lk), 0.0), df = max(dot(N, Lf), 0.0);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 R = reflect(-V, N);
        float envY = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 emberHot = mix(uEmber, vec3(1.0, 0.82, 0.5), 0.5);
        vec3 env = mix(uEmber * 0.95, cool, envY) + emberHot * pow(1.0 - envY, 3.0) * 0.7;
        vec3 H = normalize(Lk + V);
        if (vCap > 0.5) {
          // polished chrome / silver cap — bright, metallic, reflective
          float sp = pow(max(dot(N, H), 0.0), 200.0);
          vec3 col = env * 1.05 + vec3(0.2)
            + sp * vec3(1.6, 1.42, 1.14)
            + fres * vec3(0.72, 0.7, 0.66);
          gl_FragColor = vec4(col, 1.0);
        } else {
          // clear glass: dark body (the dark shows through it), a bright thin
          // rim, a sharp highlight, and ember juice glowing from within the
          // lower half. Nothing milky.
          float rim = pow(1.0 - max(dot(N, V), 0.0), 4.5);
          float sp = pow(max(dot(N, H), 0.0), 90.0);
          float juice = smoothstep(0.7, 0.6, vYn) * uJuice;
          vec3 body = vec3(0.02, 0.018, 0.022);
          vec3 juiceGlow = uEmber * juice * (0.55 + 0.85 * uReaction);
          vec3 rimCol = mix(uEmber, vec3(1.0, 0.86, 0.6), 0.4);
          vec3 col = body
            + juiceGlow
            + rim * rimCol * (0.5 + uKey)
            + sp * vec3(1.0, 0.95, 0.85) * 0.8
            + env * 0.1;
          gl_FragColor = vec4(col, 1.0);
        }
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);

  return {
    group,
    uniforms,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      scene.remove(group);
    }
  };
}

/* ---------- ember reaction backdrop ---------- */
export type LostEmberBackdrop = {
  mesh: THREE.Mesh;
  uniforms: {
    uEmber: { value: THREE.Color };
    uReaction: { value: number };
    uProjection: { value: number };
    uTime: { value: number };
    uBg: { value: THREE.Color };
  };
  dispose: () => void;
};

/** A large plane behind the bottle: a warm-black field with an ember bloom that
 *  grows and throws outward as the reaction climbs. */
export function buildLostEmberBackdrop(scene: THREE.Scene): LostEmberBackdrop {
  const uniforms = {
    uEmber: { value: new THREE.Color(0.81, 0.35, 0.16) },
    uReaction: { value: 0.04 },
    uProjection: { value: 0 },
    uTime: { value: 0 },
    uBg: { value: new THREE.Color(0.043, 0.032, 0.036) }
  };
  const geometry = new THREE.PlaneGeometry(19, 12);
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vUv;
      uniform vec3 uEmber, uBg; uniform float uReaction, uProjection, uTime;
      void main(){
        vec2 p = vUv - vec2(0.5, 0.5);
        // bloom ISSUES FROM ONE ORIGIN behind the bottle and grows only with
        // projection. Deck rule: the frame stays ~95% black; the ember is a
        // single contained event born from the dark, never a full-frame flood.
        // Narrow horizontally (a tall pool matching the bottle), tight falloff,
        // high exponent so black dominates and the edges never warm.
        float d = length(p * vec2(1.4, 1.02));
        float rad = 0.012 + uProjection * 0.12;
        float bloom = smoothstep(rad + 0.13, 0.0, d);
        float pulse = 0.92 + 0.08 * sin(uTime * 0.0007);
        float r = clamp(uReaction, 0.0, 1.2);
        vec3 col = uBg + uEmber * pow(bloom, 3.4) * r * 0.72 * pulse;
        // a single incandescent core, only near the peak
        col += mix(uEmber, vec3(1.0, 0.8, 0.5), 0.5) * pow(bloom, 8.0) * uProjection * 0.4;
        float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.99, 78.23))) * 43758.55);
        col += (g - 0.5) * 0.014;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 1.5, -6);
  scene.add(mesh);
  return {
    mesh,
    uniforms,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      scene.remove(mesh);
    }
  };
}

/* ---------- ember particulate ---------- */
export type LostEmberMotes = {
  points: THREE.Points;
  material: THREE.PointsMaterial;
  update: (dtSeconds: number) => void;
  dispose: () => void;
};

function seeded(index: number, salt: number): number {
  const v = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function buildLostEmberMotes(
  scene: THREE.Scene,
  count = 220
): LostEmberMotes {
  const positions = new Float32Array(count * 3);
  const drift = new Float32Array(count * 3);
  const spanX = 8;
  const spanY = 8;
  const spanZ = 5;
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (seeded(i, 1) - 0.5) * spanX;
    positions[i * 3 + 1] = (seeded(i, 2) - 0.5) * spanY + 1.6;
    positions[i * 3 + 2] = (seeded(i, 3) - 0.5) * spanZ - 3;
    drift[i * 3] = (seeded(i, 4) - 0.5) * 0.16;
    drift[i * 3 + 1] = 0.08 + seeded(i, 5) * 0.14;
    drift[i * 3 + 2] = (seeded(i, 6) - 0.5) * 0.1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(0.95, 0.5, 0.24),
    size: 0.045,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.0
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  const topY = spanY / 2 + 1.6;
  const update = (dt: number) => {
    const arr = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] += drift[i * 3] * dt;
      arr[i * 3 + 1] += drift[i * 3 + 1] * dt;
      arr[i * 3 + 2] += drift[i * 3 + 2] * dt;
      if (arr[i * 3 + 1] > topY + 2) arr[i * 3 + 1] = -topY + 1.6;
    }
    geometry.attributes.position.needsUpdate = true;
  };
  return {
    points,
    material,
    update,
    dispose: () => {
      geometry.dispose();
      material.dispose();
      scene.remove(points);
    }
  };
}
