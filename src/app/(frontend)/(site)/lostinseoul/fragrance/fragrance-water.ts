/**
 * Real planar-reflection water floor for the Catalyst chapter.
 *
 * The reflection math (mirror camera → render target) is ported from the D&G Velvet
 * `CustomWater` reflector (itself the three.js `Reflector`/`Water` lineage), adapted to
 * take renderer/scene/camera explicitly instead of Vue singletons. The water SHADER is
 * ours — a near-black surface that mirrors the scene (bottle + plume), broken by procedural
 * ripple and Fresnel-tinted with the ember, so the bottle reads as sitting ON the water.
 *
 * Not a D&G copy: no brand assets, our own shader, our ember palette.
 */

import * as THREE from "three";

type WaterDeps = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
};

type WaterOptions = {
  size?: [number, number];
  resolution?: number;
  y?: number;
  clipBias?: number;
};

export type LostWater = {
  mesh: THREE.Mesh;
  /** objects hidden while the reflection is captured (the water itself is always hidden) */
  ignoreObjects: THREE.Object3D[];
  uniforms: {
    uEmber: { value: THREE.Color };
    uReaction: { value: number };
    uTime: { value: number };
    /** how far the ripple normal bends the reflection (0 = mirror) */
    uDistortion: { value: number };
    uReflStrength: { value: number };
    /** ripple height scale — the surface's agitation. Low = still water. */
    uRippleAmp: { value: number };
    /** how fast the ripple field scrolls. Low = slow, heavy water. */
    uRippleSpeed: { value: number };
  };
  onTick: (timeMs: number) => void;
  dispose: () => void;
};

export function buildLostWater(
  deps: WaterDeps,
  options: WaterOptions = {}
): LostWater {
  const { renderer, scene, camera } = deps;
  const [w, h] = options.size ?? [60, 60];
  const resolution = options.resolution ?? 512;
  const clipBias = options.clipBias ?? 0.003;

  // ---- reflection render target + mirror-camera scratch (ported reflector math) ----
  const rt = new THREE.WebGLRenderTarget(resolution, resolution, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType
  });
  const mirrorPlane = new THREE.Plane();
  const normal = new THREE.Vector3();
  const mirrorWorldPosition = new THREE.Vector3();
  const cameraWorldPosition = new THREE.Vector3();
  const rotationMatrix = new THREE.Matrix4();
  const lookAtPosition = new THREE.Vector3(0, 0, -1);
  const clipPlane = new THREE.Vector4();
  const view = new THREE.Vector3();
  const target = new THREE.Vector3();
  const q = new THREE.Vector4();
  const textureMatrix = new THREE.Matrix4();
  const mirrorCamera = new THREE.PerspectiveCamera();
  const eye = new THREE.Vector3();

  const uniforms = {
    tReflect: { value: rt.texture },
    uTextureMatrix: { value: textureMatrix },
    uTime: { value: 0 },
    uEmber: { value: new THREE.Color(0.82, 0.36, 0.14) },
    uBaseColor: { value: new THREE.Color(0.012, 0.009, 0.011) },
    uReaction: { value: 0 },
    // Tuned on the founder's GPU (workplan Level 1). Stillness comes from SPEED, not
    // amplitude: a detailed ripple field crawling slowly reads as heavy, near-motionless
    // water, where a shallow field scrolling fast reads as chop.
    uDistortion: { value: 1.17 },
    uReflStrength: { value: 0.98 },
    uRippleAmp: { value: 0.71 },
    uRippleSpeed: { value: 0.15 },
    uEye: { value: eye }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform mat4 uTextureMatrix;
      varying vec4 vReflectCoord;
      varying vec3 vWorld;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vReflectCoord = uTextureMatrix * world;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec4 vReflectCoord;
      varying vec3 vWorld;
      varying vec2 vUv;
      uniform sampler2D tReflect;
      uniform float uTime, uDistortion, uReflStrength, uReaction;
      uniform float uRippleAmp, uRippleSpeed;
      uniform vec3 uEmber, uBaseColor, uEye;

      float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p);
        float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
        vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
      float fbm(vec2 p){ float v=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
        for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p+0.03; a*=0.5; } return v; }

      // height field for the ripples (two scrolling fbm layers, crossed directions)
      float waterH(vec2 p, float t){
        return fbm(p + vec2(0.0, t*0.32))
             + 0.5 * fbm(p*2.1 + vec2(t*0.21, -t*0.27));
      }

      // quiet, occasional "water drop" rings: three slow emitters, each firing an
      // expanding circular wavefront with long gaps between drops. Runs on REAL time
      // (rt), not the uRippleSpeed-slowed field time — a drop is an event, not chop.
      float dropRings(vec2 p, float rt){
        float hsum = 0.0;
        for (int i = 0; i < 3; i++){
          float fi = float(i);
          float period = 7.0 + fi * 4.0;   // 7s / 11s / 15s cycles → sparse
          float life = 4.5;
          float phase = fi * 0.37;
          float cyc = floor(rt / period + phase);
          float age = fract(rt / period + phase) * period;
          // spawn near the flacon's reflection — a ring only reads where there is
          // light in the mirror to bend; far corners are sub-pixel at grazing angle
          vec2 o = vec2(6.5) + (vec2(hash(vec2(cyc*1.7 + 3.0, fi*3.1)),
                                     hash(vec2(fi*2.3, cyc*1.1 + 1.0))) - 0.5) * 4.5;
          float d = length(p - o);
          // SCALE: 1 p-unit ≈ 6 world-metres (vUv*13 over an 80m plane). A drop
          // ring stays INTIMATE: ~0.35 p-units (≈2m radius) at full spread, a
          // thin 1–2 crest train — a raindrop event, not a wave.
          float radius = age * 0.1;
          float front = exp(-pow((d - radius) * 9.0, 2.0));   // ~0.6m wavefront band
          float fade = smoothstep(0.0, 0.35, age) * (1.0 - smoothstep(life*0.5, life, age));
          hsum += sin((d - radius) * 40.0) * front * fade;
        }
        return hsum;
      }

      // full surface height: slow chop + occasional drop rings (rings perturb the
      // same normal, so they bend the reflection like real rings on still water)
      float surfH(vec2 p, float t, float rt){
        return waterH(p, t) + dropRings(p, rt) * 0.3;
      }

      void main(){
        // uRippleSpeed slows the whole scrolling height field — heavy, slow water.
        float t = uTime * 0.001 * uRippleSpeed;
        float rt = uTime * 0.001;

        // ripple NORMAL from finite differences of the height field — this is what makes
        // it read as water: the normal drives both the reflection distortion and Fresnel.
        vec2 p = vUv * 13.0;
        float e = 0.015;
        float h  = surfH(p, t, rt);
        float hx = surfH(p + vec2(e, 0.0), t, rt);
        float hy = surfH(p + vec2(0.0, e), t, rt);
        // uRippleAmp flattens the height gradient, which drives BOTH the reflection
        // offset and the Fresnel normal — so lowering it stills the whole surface.
        vec2 grad = (vec2(hx - h, hy - h) / e) * uRippleAmp;
        vec3 N = normalize(vec3(-grad.x, 9.0, -grad.y));
        vec2 ripple = grad * uDistortion * 0.010;

        // projective reflection of the real scene (fire curtain + flacon), rippled
        vec2 rUv = vReflectCoord.xy / max(vReflectCoord.w, 0.0001);
        vec3 reflCol = texture2D(tReflect, rUv + ripple).rgb;

        // Fresnel from the perturbed normal — grazing water mirrors, steep water goes dark
        vec3 viewDir = normalize(uEye - vWorld);
        float ndv = clamp(dot(N, viewDir), 0.0, 1.0);
        float fres = pow(1.0 - ndv, 4.0);
        float refl = clamp((0.22 + 0.9 * fres) * uReflStrength, 0.0, 1.0);

        // depth grade: near water is darker/clearer, distance carries a touch more light
        float depth = clamp(length(vWorld.xz - uEye.xz) / 34.0, 0.0, 1.0);
        vec3 deep = uBaseColor * (0.5 + 1.1 * depth);

        vec3 col = mix(deep, reflCol, refl);
        // ember glints on the ripple crests — wet warmth, lifted by the reaction
        float crest = smoothstep(0.95, 1.65, h);
        col += uEmber * crest * (0.04 + 0.14 * uReaction) * (0.3 + fres);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const geometry = new THREE.PlaneGeometry(w, h);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI * 0.5;
  mesh.position.y = options.y ?? 0;
  scene.add(mesh);

  const ignoreObjects: THREE.Object3D[] = [];

  function setIgnoreVisibility(visible: boolean): void {
    mesh.visible = visible;
    for (const obj of ignoreObjects) obj.visible = visible;
  }

  function beforeRender(): void {
    mirrorWorldPosition.setFromMatrixPosition(mesh.matrixWorld);
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);
    rotationMatrix.extractRotation(mesh.matrixWorld);
    normal.set(0, 0, 1).applyMatrix4(rotationMatrix);
    view.subVectors(mirrorWorldPosition, cameraWorldPosition);
    if (view.dot(normal) > 0) return; // behind the water — skip
    view.reflect(normal).negate().add(mirrorWorldPosition);
    rotationMatrix.extractRotation(camera.matrixWorld);
    lookAtPosition
      .set(0, 0, -1)
      .applyMatrix4(rotationMatrix)
      .add(cameraWorldPosition);
    target.subVectors(mirrorWorldPosition, lookAtPosition);
    target.reflect(normal).negate().add(mirrorWorldPosition);
    mirrorCamera.position.copy(view);
    mirrorCamera.up.set(0, 1, 0).applyMatrix4(rotationMatrix).reflect(normal);
    mirrorCamera.lookAt(target);
    mirrorCamera.far = camera.far;
    mirrorCamera.updateMatrixWorld();
    mirrorCamera.projectionMatrix.copy(camera.projectionMatrix);

    textureMatrix.set(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      0.0,
      0.0,
      0.0,
      1.0
    );
    textureMatrix.multiply(mirrorCamera.projectionMatrix);
    textureMatrix.multiply(mirrorCamera.matrixWorldInverse);

    mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition);
    mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);
    clipPlane.set(
      mirrorPlane.normal.x,
      mirrorPlane.normal.y,
      mirrorPlane.normal.z,
      mirrorPlane.constant
    );
    const pm = mirrorCamera.projectionMatrix;
    q.x = (Math.sign(clipPlane.x) + pm.elements[8]) / pm.elements[0];
    q.y = (Math.sign(clipPlane.y) + pm.elements[9]) / pm.elements[5];
    q.z = -1.0;
    q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
    pm.elements[2] = clipPlane.x;
    pm.elements[6] = clipPlane.y;
    pm.elements[10] = clipPlane.z + 1.0 - clipBias;
    pm.elements[14] = clipPlane.w;

    eye.setFromMatrixPosition(camera.matrixWorld);
  }

  function onTick(timeMs: number): void {
    uniforms.uTime.value = timeMs;
    beforeRender();
    setIgnoreVisibility(false);
    const prevTarget = renderer.getRenderTarget();
    const prevAutoUpdate = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(rt);
    renderer.state.buffers.depth.setMask(true);
    if (!renderer.autoClear) renderer.clear();
    renderer.render(scene, mirrorCamera);
    setIgnoreVisibility(true);
    renderer.shadowMap.autoUpdate = prevAutoUpdate;
    renderer.setRenderTarget(prevTarget);
  }

  return {
    mesh,
    ignoreObjects,
    uniforms: {
      uEmber: uniforms.uEmber,
      uReaction: uniforms.uReaction,
      uTime: uniforms.uTime,
      uDistortion: uniforms.uDistortion,
      uReflStrength: uniforms.uReflStrength,
      uRippleAmp: uniforms.uRippleAmp,
      uRippleSpeed: uniforms.uRippleSpeed
    },
    onTick,
    dispose: () => {
      rt.dispose();
      geometry.dispose();
      material.dispose();
      scene.remove(mesh);
    }
  };
}
