"use client";

import { lerp } from "@/utilities/rp_utils";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useTempus } from "tempus/react";
import {
  BlendFunction,
  BloomEffect,
  CopyPass,
  Effect,
  EffectComposer,
  EffectPass,
  RenderPass
} from "postprocessing";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  getLostHeroPostTheme,
  shouldPauseLostHeroVideo,
  shouldRenderLostHeroFrame
} from "./hero-scene-state";
import { getLostHeroTextureMediaRatio } from "./hero-media-state";
import { getLostHeroScrollProgress } from "./hero-scroll-motion";
import { useWatchVideo } from "./page-status";
import { useCoordinator } from "@/providers/CoordinatorCtx";
import { useFrameState } from "@/providers/RP_Pro";

type Props = {
  cartOpen: boolean;
  imageUrl?: string | null;
  onReady: () => void;
  videoUrl?: string | null;
};

const LOST_HOME_SCENE = "/assets/lostinseoul/retail-church/scene.glb";
const LOST_HOME_SCENE_SHADOWS =
  "/assets/lostinseoul/retail-church/textures/.png";
const LOST_HOME_SCENE_NORMAL = "/assets/lostinseoul/home-scene/normal.jpg";
const LOST_RED = 0xff2323ff;
const LOST_WALL_FALLBACK = "#f7f8f8";
const LOST_BLACK_FALLBACK = "#000000";
const LOST_WHITE_FALLBACK = "#ffffff";
const TARGET_VIDEO_RATIO = 21 / 9;
const VIDEO_ZOOM_DURATION = 1000;

const finalPassShader = `
uniform sampler2D bloomTexture;
uniform float uNoiseStrength;
uniform float uVignetteStrength;
uniform vec3 uVignetteColor;
uniform float uMaxDistort;
uniform float uBendAmount;

const int iterations = 5;

vec2 barrelDistortion(vec2 coord, float amt) {
  vec2 cc = coord - 0.5;
  float dist = dot(cc, cc);
  return coord + cc * dist * amt;
}

float sat(float t) {
  return clamp(t, 0.0, 1.0);
}

float linterp(float t) {
  return sat(1.0 - abs(2.0 * t - 1.0));
}

float remap(float t, float a, float b) {
  return sat((t - a) / (b - a));
}

vec4 spectrum_offset(float t) {
  vec4 ret;
  float lo = step(t, 0.5);
  float hi = 1.0 - lo;
  float w = linterp(remap(t, 1.0 / 6.0, 5.0 / 6.0));
  ret = vec4(lo, 1.0, hi, 1.0) * vec4(1.0 - w, w, 1.0 - w, 1.0);
  return pow(ret, vec4(1.0 / 2.2));
}

float random(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 443.8975);
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}

float blendSoftLight(float base, float blend) {
  return blend < 0.5
    ? 2.0 * base * blend + base * base * (1.0 - 2.0 * blend)
    : sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend);
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return vec3(
    blendSoftLight(base.r, blend.r),
    blendSoftLight(base.g, blend.g),
    blendSoftLight(base.b, blend.b)
  );
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
  return blendSoftLight(base, blend) * opacity + base * (1.0 - opacity);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 sumcol = vec4(0.0);
  vec4 sumw = vec4(0.0);
  float reci_num_iter_f = 1.0 / float(iterations);

  for (int i = 0; i < iterations; i++) {
    float t = float(i) * reci_num_iter_f;
    vec4 w = spectrum_offset(t);
    sumw += w;
    sumcol += w * texture2D(
      bloomTexture,
      barrelDistortion(uv, uBendAmount * uMaxDistort * t)
    );
  }

  outputColor = vec4(sumcol / sumw);

  vec2 uv2 = uv;
  uv2 *= 1.0 - vUv.yx;
  float vig = uv2.x * uv2.y * 20.0;
  vig = pow(vig, uVignetteStrength);
  outputColor = mix(vec4(uVignetteColor, 1.0), outputColor, vig);

  float noise = random(uv) - 0.5;
  outputColor.rgb = blendSoftLight(outputColor.rgb, vec3(noise), uNoiseStrength);
  outputColor.a += noise * uNoiseStrength;
}`;

const mirrorVertexShader = `
uniform mat4 textureMatrix;
varying vec4 vUv;

void main() {
  vUv = textureMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const mirrorFragmentShader = `
uniform sampler2D tDiffuse;
uniform float mirror;
varying vec4 vUv;

void main() {
  vec2 uv = vUv.xy / vUv.w;
  vec4 reflectorColor = texture2D(tDiffuse, uv);
  gl_FragColor = vec4(reflectorColor.rgb * mirror, 1.0);
}`;

const groundVertexShader = `
uniform mat4 textureMatrix;
varying vec4 vUv;
varying vec2 meshUV;

void main() {
  vec3 transformed = position * 0.5;
  meshUV = uv;
  vUv = textureMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const groundFragmentShader = `
uniform sampler2D tDiffuse;
uniform sampler2D tBlurred;
uniform sampler2D tBake;
uniform sampler2D tNormal;
uniform vec3 baseColor;
uniform float reflectionStrength;
uniform float textureStrength;
varying vec4 vUv;
varying vec2 meshUV;

void main() {
  vec3 coord = vUv.xyz / vUv.w;
  vec3 normalColor = texture2D(tNormal, meshUV * 10.0).rgb;
  vec3 normal = normalize(vec3(normalColor.r * 2.0 - 1.0, normalColor.b, normalColor.g * 2.0 - 1.0));
  vec2 normalUv = coord.xy + coord.z * normal.xz * 0.065;
  vec3 bake = texture2D(tBake, meshUV).rgb;
  vec3 blurredReflection = texture2D(tBlurred, normalUv).rgb;
  vec3 reflection = blurredReflection * bake * reflectionStrength;
  float shade = 0.925 + bake.r * textureStrength + (normalColor.r - 0.5) * 0.018;
  vec3 color = baseColor * shade + reflection;
  gl_FragColor = vec4(color, 1.0);
}`;

const surfaceVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const surfaceFragmentShader = `
uniform sampler2D tBake;
uniform sampler2D tNormal;
uniform vec3 baseColor;
varying vec2 vUv;

float random2dSurface(vec2 coord) {
  return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 bake = texture2D(tBake, vUv).rgb;
  vec3 normalColor = texture2D(tNormal, vUv * 7.0).rgb;
  float grain = random2dSurface(gl_FragCoord.xy) - 0.5;
  float shade = 0.96 + bake.r * 0.035 + (normalColor.r - 0.5) * 0.024 + grain * 0.006;
  gl_FragColor = vec4(baseColor * shade, 1.0);
}`;

function sourceDamp(
  current: number,
  target: number,
  amount: number,
  deltaMs: number
) {
  return lerp(current, target, 1 - Math.exp(-amount * 0.05 * deltaMs));
}

function lostHomeVideoEasing(progress: number) {
  let t = progress;
  for (let index = 0; index < 5; index += 1) {
    const inverse = 1 - t;
    const t2 = t * t;
    const t3 = t2 * t;
    const bezierX =
      3 * inverse * inverse * t * 0.6 + 3 * inverse * t2 * 0.3 + t3;
    const error = bezierX - progress;
    if (Math.abs(error) < 0.0001) break;
    const slope =
      3 * inverse * inverse * 0.6 +
      6 * inverse * t * (0.3 - 0.6) +
      3 * t2 * (1 - 0.3);
    t -= error / slope;
  }
  return 3 * (1 - t) * t * t + t * t * t;
}

function coverTexture(
  texture: THREE.Texture,
  mediaRatio: number,
  targetRatio: number
) {
  texture.center.set(0.5, 0.5);
  if (mediaRatio > targetRatio) {
    texture.repeat.set(targetRatio / mediaRatio, 1);
  } else {
    texture.repeat.set(1, mediaRatio / targetRatio);
  }
  texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
  texture.needsUpdate = true;
}

function fitLostHomeVideoTexture(texture: THREE.Texture, mediaRatio: number) {
  texture.center.set(0, 0);
  if (mediaRatio > TARGET_VIDEO_RATIO) {
    const scale = TARGET_VIDEO_RATIO / mediaRatio;
    const offset = (1 - scale) / 2;
    texture.repeat.set(scale, -1);
    texture.offset.set(offset, 1);
  } else {
    const scale = mediaRatio / TARGET_VIDEO_RATIO;
    const offset = (1 - scale) / 2;
    texture.repeat.set(1, -scale);
    texture.offset.set(0, 1 - offset);
  }
  texture.needsUpdate = true;
}

function createHeroVideo(videoUrl: string) {
  const video = document.createElement("video");
  video.src = videoUrl;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("disablePictureInPicture", "true");
  video.setAttribute("x-webkit-airplay", "allow");
  return video;
}

function createFallbackHeroTexture() {
  const texture = new THREE.DataTexture(
    new Uint8Array([3, 3, 3, 255]),
    1,
    1,
    THREE.RGBAFormat
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function findSceneObject(
  source: THREE.Object3D,
  name: string
): THREE.Object3D | null {
  let match: THREE.Object3D | null = null;
  source.traverse((object) => {
    if (!match && object.name.toLowerCase() === name) match = object;
  });
  return match;
}

function makeBlackStage(color: THREE.Color) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    depthWrite: true,
    side: THREE.DoubleSide
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), material);
  floor.position.y = -0.01;
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const front = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), material);
  front.position.set(0, -5, 15);
  group.add(front);

  const back = front.clone();
  back.position.z = -15;
  back.rotation.y = Math.PI;
  group.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), material);
  left.position.set(-15, -5, 0);
  left.rotation.y = Math.PI / 2;
  group.add(left);

  const right = left.clone();
  right.position.x = 15;
  right.rotation.y = -Math.PI / 2;
  group.add(right);

  return { group, material };
}

function createTexturedSurfaceMaterial({
  baseColor,
  normalTexture,
  shadowsTexture
}: {
  baseColor: THREE.ColorRepresentation;
  normalTexture: THREE.Texture;
  shadowsTexture: THREE.Texture;
}) {
  return new THREE.ShaderMaterial({
    depthWrite: true,
    fragmentShader: surfaceFragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      baseColor: { value: new THREE.Color(baseColor) },
      tBake: { value: shadowsTexture },
      tNormal: { value: normalTexture }
    },
    vertexShader: surfaceVertexShader
  });
}

const cableVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}`;

const cableFragmentShader = `
uniform float time;
uniform vec3 energyColor;
uniform float pulseSpeed;
uniform float numberOfPulses;
uniform float pulseWidth;
uniform float glowStrength;
uniform float glowSpread;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  float pulsePhase = fract(vUv.x * numberOfPulses - time * pulseSpeed);
  float pulse = smoothstep(0.0, pulseWidth, pulsePhase) *
    smoothstep(pulseWidth * 2.0, pulseWidth, pulsePhase);
  vec3 viewDirection = normalize(vViewPosition);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), glowSpread);
  float alpha = smoothstep(0.1, 1.0, max(pulse * 0.8, fresnel * 0.3));
  vec3 finalColor = energyColor * (pulse + fresnel * 0.5) * glowStrength;
  gl_FragColor = vec4(finalColor, alpha);
}`;

function createCablePulseMaterial() {
  return new THREE.ShaderMaterial({
    alphaTest: 0.2,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    fragmentShader: cableFragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      energyColor: { value: new THREE.Color(LOST_RED) },
      glowSpread: { value: 9.5 },
      glowStrength: { value: 3.8 },
      numberOfPulses: { value: 8 },
      pulseSpeed: { value: 0.3 },
      pulseWidth: { value: 0.03 },
      time: { value: 0 }
    },
    vertexShader: cableVertexShader
  });
}

const reflectorBlurVertexShader = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position;
  gl_Position = vec4(2.0 * position - 1.0, 0.0, 1.0);
}`;

const reflectorBlurFragmentShader = `
precision highp float;
uniform sampler2D inputBuffer;
uniform float blurStrength;
varying vec2 vUv;

const float PI2 = 6.28318530718;
const float BLUR_SAMPLES = 10.0;

vec4 blur(sampler2D image, vec2 uv) {
  vec4 color = texture2D(image, uv);
  for (float d = 0.0; d < PI2; d += PI2 / BLUR_SAMPLES) {
    color += texture2D(image, uv + vec2(cos(d), sin(d)) * blurStrength);
  }
  color /= BLUR_SAMPLES * 1.095;
  return color;
}

void main() {
  gl_FragColor = blur(inputBuffer, vUv);
}`;

class GroundReflectorBlurPass {
  private readonly camera = new THREE.Camera();
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material: THREE.RawShaderMaterial;
  private readonly screen: THREE.Mesh;
  private readonly targetA = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType
  });
  private readonly targetB = this.targetA.clone();
  private readonly targetC = this.targetA.clone();
  private readonly size = new THREE.Vector2();
  private strength = 60;
  private readonly strengthTarget = 60;

  constructor() {
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-2, 0, 0, -2, 2, 2]), 2)
    );
    this.material = new THREE.RawShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader: reflectorBlurFragmentShader,
      uniforms: {
        blurStrength: { value: 0.0028 },
        inputBuffer: { value: null }
      },
      vertexShader: reflectorBlurVertexShader
    });
    this.screen = new THREE.Mesh(this.geometry, this.material);
    this.screen.frustumCulled = false;
    this.screen.matrixAutoUpdate = false;
    this.screen.matrixWorldAutoUpdate = false;
    this.targetA.texture.name = "Lost.GroundReflectorBlur.A";
    this.targetB.texture.name = "Lost.GroundReflectorBlur.B";
    this.targetC.texture.name = "Lost.GroundReflectorBlur.C";
  }

  render(
    renderer: THREE.WebGLRenderer,
    input: THREE.Texture | THREE.WebGLRenderTarget
  ) {
    this.syncSize(renderer);
    const currentTarget = renderer.getRenderTarget();
    const currentSortObjects = renderer.sortObjects;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    const inputTexture =
      input instanceof THREE.WebGLRenderTarget ? input.texture : input;

    renderer.sortObjects = false;
    renderer.shadowMap.autoUpdate = false;
    this.material.uniforms.inputBuffer.value = inputTexture;
    this.strength += (this.strengthTarget - this.strength) / 6;

    const blurA = mapRange(this.strength, 30, 100, 0, 0.01);
    const blurB = mapRange(this.strength, 50, 100, 0, 0.01);
    const blurC = mapRange(this.strength, 0, 100, 0, 0.015);

    if (blurA > 0) {
      this.material.uniforms.blurStrength.value = blurA;
      renderer.setRenderTarget(this.targetA);
      renderer.clear();
      renderer.render(this.screen, this.camera);
      this.material.uniforms.inputBuffer.value = this.targetA.texture;
    }
    if (blurB > 0) {
      this.material.uniforms.blurStrength.value = blurB;
      renderer.setRenderTarget(this.targetB);
      renderer.clear();
      renderer.render(this.screen, this.camera);
      this.material.uniforms.inputBuffer.value = this.targetB.texture;
    }

    this.material.uniforms.blurStrength.value = blurC;
    renderer.setRenderTarget(this.targetC);
    renderer.clear();
    renderer.render(this.screen, this.camera);
    renderer.setRenderTarget(currentTarget);
    renderer.sortObjects = currentSortObjects;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

    return this.targetC.texture;
  }

  dispose() {
    this.targetA.dispose();
    this.targetB.dispose();
    this.targetC.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }

  private syncSize(renderer: THREE.WebGLRenderer) {
    renderer.getDrawingBufferSize(this.size);
    this.targetA.setSize(
      Math.max(1, Math.round(this.size.x * 0.15)),
      Math.max(1, Math.round(this.size.y * 0.15))
    );
    this.targetB.setSize(
      Math.max(1, Math.round(this.size.x * 0.07)),
      Math.max(1, Math.round(this.size.y * 0.07))
    );
    this.targetC.setSize(
      Math.max(1, Math.round(this.size.x * 0.3)),
      Math.max(1, Math.round(this.size.y * 0.3))
    );
  }
}

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}

class SourceReflector {
  readonly mesh: THREE.Mesh;

  private readonly clipPlane = new THREE.Vector4();
  private readonly mirrorPlane = new THREE.Plane();
  private readonly normal = new THREE.Vector3();
  private readonly q = new THREE.Vector4();
  private readonly rotationMatrix = new THREE.Matrix4();
  private readonly target = new THREE.Vector3();
  private readonly textureMatrix = new THREE.Matrix4();
  private readonly view = new THREE.Vector3();
  private readonly virtualCamera = new THREE.PerspectiveCamera();
  private readonly renderTarget: THREE.WebGLRenderTarget;
  private readonly material: THREE.ShaderMaterial;
  private readonly blurPass: GroundReflectorBlurPass | null;
  private readonly cameraWorldPosition = new THREE.Vector3();
  private readonly originalMaterial: THREE.Material | THREE.Material[] | null;
  private readonly reflectorWorldPosition = new THREE.Vector3();
  private readonly updateInterval: number;
  private lastUpdateTime = 0;

  constructor({
    ground = false,
    height,
    mesh,
    mirror,
    normalTexture,
    baseColor = new THREE.Color(LOST_WALL_FALLBACK),
    reflectionStrength = 0.035,
    resolution = 1024,
    shadowsTexture,
    textureStrength = 0.16,
    width
  }: {
    baseColor?: THREE.Color;
    ground?: boolean;
    height?: number;
    mesh?: THREE.Mesh;
    mirror: number;
    normalTexture?: THREE.Texture;
    reflectionStrength?: number;
    resolution?: number;
    shadowsTexture?: THREE.Texture;
    textureStrength?: number;
    width?: number;
  }) {
    this.mesh =
      mesh ?? new THREE.Mesh(new THREE.PlaneGeometry(width ?? 1, height ?? 1));
    this.originalMaterial = mesh?.material ?? null;
    this.renderTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
      depthBuffer: true,
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType
    });
    this.renderTarget.texture.name = "Lost.SourceReflector";
    this.material = new THREE.ShaderMaterial({
      depthWrite: true,
      fragmentShader: ground ? groundFragmentShader : mirrorFragmentShader,
      side: THREE.DoubleSide,
      uniforms: ground
        ? {
            baseColor: { value: baseColor },
            reflectionStrength: { value: reflectionStrength },
            tBake: { value: shadowsTexture ?? null },
            tBlurred: { value: this.renderTarget.texture },
            tDiffuse: { value: this.renderTarget.texture },
            tNormal: { value: normalTexture ?? null },
            textureMatrix: { value: this.textureMatrix },
            textureStrength: { value: textureStrength }
          }
        : {
            mirror: { value: mirror },
            tDiffuse: { value: this.renderTarget.texture },
            textureMatrix: { value: this.textureMatrix }
          },
      vertexShader: ground ? groundVertexShader : mirrorVertexShader
    });
    this.mesh.material = this.material;
    this.blurPass = ground ? new GroundReflectorBlurPass() : null;
    this.updateInterval = ground ? 1000 / 24 : 1000 / 30;
  }

  setBaseColor(color: THREE.Color) {
    const uniform = this.material.uniforms.baseColor;
    if (uniform?.value instanceof THREE.Color) uniform.value.copy(color);
  }

  render(
    renderer: THREE.WebGLRenderer,
    renderScene: THREE.Scene,
    mainCamera: THREE.PerspectiveCamera
  ) {
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = now;
    this.mesh.updateMatrixWorld();
    mainCamera.updateMatrixWorld();

    this.reflectorWorldPosition.setFromMatrixPosition(this.mesh.matrixWorld);
    this.cameraWorldPosition.setFromMatrixPosition(mainCamera.matrixWorld);

    this.rotationMatrix.extractRotation(this.mesh.matrixWorld);
    this.normal.set(0, 0, 1);
    this.normal.applyMatrix4(this.rotationMatrix);
    this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition);
    if (this.view.dot(this.normal) > 0) return;

    this.view.reflect(this.normal).negate();
    this.view.add(this.reflectorWorldPosition);
    this.rotationMatrix.extractRotation(mainCamera.matrixWorld);
    this.target.set(0, 0, -1);
    this.target.applyMatrix4(this.rotationMatrix);
    this.target.add(this.cameraWorldPosition);
    this.target.sub(this.reflectorWorldPosition);
    this.target.reflect(this.normal).negate();
    this.target.add(this.reflectorWorldPosition);

    this.virtualCamera.copy(mainCamera, false);
    this.virtualCamera.position.copy(this.view);
    this.virtualCamera.up.set(0, 1, 0);
    this.virtualCamera.up.applyMatrix4(this.rotationMatrix);
    this.virtualCamera.up.reflect(this.normal);
    this.virtualCamera.lookAt(this.target);
    this.virtualCamera.far = mainCamera.far;
    this.virtualCamera.updateMatrixWorld();
    this.virtualCamera.projectionMatrix.copy(mainCamera.projectionMatrix);

    this.textureMatrix.set(
      0.5,
      0,
      0,
      0.5,
      0,
      0.5,
      0,
      0.5,
      0,
      0,
      0.5,
      0.5,
      0,
      0,
      0,
      1
    );
    this.textureMatrix.multiply(this.virtualCamera.projectionMatrix);
    this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse);
    this.textureMatrix.multiply(this.mesh.matrixWorld);

    this.mirrorPlane.setFromNormalAndCoplanarPoint(
      this.normal,
      this.reflectorWorldPosition
    );
    this.mirrorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse);
    this.clipPlane.set(
      this.mirrorPlane.normal.x,
      this.mirrorPlane.normal.y,
      this.mirrorPlane.normal.z,
      this.mirrorPlane.constant
    );

    const projection = this.virtualCamera.projectionMatrix;
    this.q.x =
      (Math.sign(this.clipPlane.x) + projection.elements[8]) /
      projection.elements[0];
    this.q.y =
      (Math.sign(this.clipPlane.y) + projection.elements[9]) /
      projection.elements[5];
    this.q.z = -1;
    this.q.w = (1 + projection.elements[10]) / projection.elements[14];
    this.clipPlane.multiplyScalar(2 / this.clipPlane.dot(this.q));
    projection.elements[2] = this.clipPlane.x;
    projection.elements[6] = this.clipPlane.y;
    projection.elements[10] = this.clipPlane.z + 1;
    projection.elements[14] = this.clipPlane.w;

    const currentTarget = renderer.getRenderTarget();
    const currentXr = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
    this.mesh.visible = false;
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(renderScene, this.virtualCamera);
    if (this.blurPass) {
      this.material.uniforms.tBlurred.value = this.blurPass.render(
        renderer,
        this.renderTarget
      );
    }
    renderer.xr.enabled = currentXr;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget(currentTarget);
    this.mesh.visible = true;
  }

  dispose() {
    this.renderTarget.dispose();
    this.blurPass?.dispose();
    this.material.dispose();
    if (this.originalMaterial) this.mesh.material = this.originalMaterial;
  }
}

type LostHeroSceneRuntime = {
  render: (time: number, deltaTime: number) => void;
  setWatchOpen: (open: boolean) => void;
  syncPostTheme: () => void;
  syncVideoState: () => void;
};

export function LostHeroScene({
  cartOpen,
  imageUrl,
  onReady,
  videoUrl
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { open: watchOpen } = useWatchVideo();
  const cartOpenRef = useRef(cartOpen);
  const watchOpenRef = useRef(watchOpen);
  const runtimeRef = useRef<LostHeroSceneRuntime | null>(null);
  const sceneInViewportRef = useRef(true);
  const scrollProgressRef = useRef(0);
  const { scrollY } = useScroll();
  const pointerX = useCoordinator((store) => store.x);
  const pointerY = useCoordinator((store) => store.y);
  const { viewportWidth, viewportHeight } = useFrameState();
  const syncScrollProgress = useCallback((scrollY: number) => {
    scrollProgressRef.current = getLostHeroScrollProgress(
      scrollY,
      window.innerHeight,
      window.innerWidth
    );
  }, []);
  useMotionValueEvent(scrollY, "change", syncScrollProgress);
  useTempus(
    ({ time, deltaTime }) => {
      runtimeRef.current?.render(time, deltaTime);
    },
    { label: "lost-hero-scene", priority: 1 }
  );

  useEffect(() => {
    cartOpenRef.current = cartOpen;
    runtimeRef.current?.syncVideoState();
    runtimeRef.current?.syncPostTheme();
  }, [cartOpen]);

  useEffect(() => {
    watchOpenRef.current = watchOpen;
    runtimeRef.current?.setWatchOpen(watchOpen);
    runtimeRef.current?.syncPostTheme();
  }, [watchOpen]);

  useEffect(() => {
    const syncFromCurrentScroll = () => {
      syncScrollProgress(scrollY.get());
    };

    syncFromCurrentScroll();
    window.addEventListener("resize", syncFromCurrentScroll);

    return () => {
      window.removeEventListener("resize", syncFromCurrentScroll);
    };
  }, [scrollY, syncScrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    const visibilityObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              sceneInViewportRef.current = entry?.isIntersecting ?? true;
            },
            { rootMargin: "120px" }
          )
        : null;
    visibilityObserver?.observe(canvas);
    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const colorContext = colorCanvas.getContext("2d", {
      willReadFrequently: true
    });
    const cssColor = (property: string, fallback: string) => {
      const root = canvas.closest<HTMLElement>(".lost-commerce-root");
      const styles = getComputedStyle(root ?? document.documentElement);
      return styles.getPropertyValue(property).trim() || fallback;
    };
    const cssColorToThree = (
      color: string,
      fallback: string,
      target = new THREE.Color()
    ) => {
      if (!colorContext) return target.set(fallback);
      colorContext.clearRect(0, 0, 1, 1);
      colorContext.fillStyle = fallback;
      colorContext.fillStyle = color;
      colorContext.fillRect(0, 0, 1, 1);
      const [r, g, b] = colorContext.getImageData(0, 0, 1, 1).data;
      return target.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
    };
    const colorFromVar = (
      property: string,
      fallback: string,
      target = new THREE.Color()
    ) => cssColorToThree(cssColor(property, fallback), fallback, target);
    const sceneBgColor = colorFromVar("--bg", LOST_WALL_FALLBACK);
    const sceneBlackColor = colorFromVar("--opaque-black", LOST_BLACK_FALLBACK);
    const sceneWhiteColor = colorFromVar("--opaque-white", LOST_WHITE_FALLBACK);
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      canvas,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(sceneBlackColor, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    const scene = new THREE.Scene();
    scene.background = sceneBlackColor.clone();

    const camera = new THREE.PerspectiveCamera(66, 1, 0.1, 100);
    const initialCameraPosition = new THREE.Vector3(18.35, 2, 0.06);
    camera.position.copy(initialCameraPosition);
    camera.lookAt(0, 2.05, 0);

    const cameraRig = new THREE.Group();
    cameraRig.add(camera);
    scene.add(cameraRig);

    const root = new THREE.Group();
    scene.add(root);

    const textureLoader = new THREE.TextureLoader();
    const shadowsTexture = textureLoader.load(LOST_HOME_SCENE_SHADOWS);
    shadowsTexture.colorSpace = THREE.SRGBColorSpace;
    shadowsTexture.flipY = true;
    const normalTexture = textureLoader.load(LOST_HOME_SCENE_NORMAL);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;

    let video: HTMLVideoElement | null = videoUrl
      ? createHeroVideo(videoUrl)
      : null;
    const imageTexture = imageUrl
      ? textureLoader.load(imageUrl, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          coverTexture(
            texture,
            getLostHeroTextureMediaRatio(texture.image, TARGET_VIDEO_RATIO),
            TARGET_VIDEO_RATIO
          );
        })
      : createFallbackHeroTexture();
    imageTexture.colorSpace = THREE.SRGBColorSpace;
    let videoTexture: THREE.VideoTexture | null = null;

    const whiteMaterial = new THREE.MeshBasicMaterial({
      color: sceneWhiteColor,
      side: THREE.DoubleSide
    });
    const wallMaterial = createTexturedSurfaceMaterial({
      baseColor: sceneBgColor,
      normalTexture,
      shadowsTexture
    });
    const blackMaterial = new THREE.MeshBasicMaterial({
      color: sceneBlackColor,
      side: THREE.DoubleSide
    });
    const wallMaterials = [wallMaterial];
    const whiteMaterials = [whiteMaterial];
    const blackMaterials = [blackMaterial];
    const cableMaterial = createCablePulseMaterial();
    const mediaMaterial = new THREE.MeshBasicMaterial({
      map: imageTexture,
      side: THREE.DoubleSide,
      transparent: true
    });

    const reflectors: SourceReflector[] = [];
    let modelGroup: THREE.Group | null = new THREE.Group();
    let stageMaterial: THREE.MeshBasicMaterial | null = null;
    let videoPlane: THREE.Mesh | null = null;
    const zoom = {
      active: false,
      open: false,
      progress: 0,
      startedAt: 0,
      startPosition: new THREE.Vector3(),
      targetPosition: new THREE.Vector3(),
      originalPosition: new THREE.Vector3()
    };
    root.add(modelGroup);

    new GLTFLoader()
      .loadAsync(LOST_HOME_SCENE)
      .then((gltf) => {
        if (disposed || !modelGroup) return;
        const loadedScene = gltf.scene;

        const sourceCamera = findSceneObject(loadedScene, "camera");
        if (sourceCamera instanceof THREE.PerspectiveCamera) {
          camera.fov = sourceCamera.fov * 1.2;
          camera.position.copy(sourceCamera.position);
          camera.position.y = 2;
          initialCameraPosition.copy(camera.position);
          camera.lookAt(0, 2.05, 0);
          camera.updateProjectionMatrix();
        }

        loadedScene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.frustumCulled = false;
          const name = object.name.toLowerCase();
          if (name === "videoplane") {
            object.material = mediaMaterial;
            object.rotation.x = Math.PI;
            object.rotation.y = Math.PI;
            object.scale.set(
              object.scale.x,
              object.scale.x / TARGET_VIDEO_RATIO,
              1
            );
            videoPlane = object;
            return;
          }
          if (name === "banc") {
            const material = blackMaterial.clone();
            blackMaterials.push(material);
            object.material = material;
            object.visible = true;
            return;
          }
          if (name === "ground") {
            object.visible = false;
            return;
          }
          if (name === "wall") {
            const material = wallMaterial.clone();
            wallMaterials.push(material);
            object.material = material;
            return;
          }
          if (name === "emissive") {
            const material = whiteMaterial.clone();
            whiteMaterials.push(material);
            object.material = material;
            return;
          }
          if (name === "cables") {
            object.material = cableMaterial;
            return;
          }
          if (name === "top" || name === "left" || name === "right") {
            object.visible = false;
          }
        });

        const stage = makeBlackStage(sceneBlackColor);
        stageMaterial = stage.material;
        modelGroup.add(stage.group);

        const right = findSceneObject(loadedScene, "right");
        const left = findSceneObject(loadedScene, "left");
        const top = findSceneObject(loadedScene, "top");
        if (right instanceof THREE.Mesh) {
          const mirror = new SourceReflector({
            height: 4.0497,
            mirror: 0.9,
            width: 2.6
          });
          mirror.mesh.position.copy(right.position);
          modelGroup.add(mirror.mesh);
          reflectors.push(mirror);
        }
        if (left instanceof THREE.Mesh) {
          const mirror = new SourceReflector({
            height: 4.0497,
            mirror: 0.9,
            width: 2.6
          });
          mirror.mesh.position.copy(left.position);
          mirror.mesh.rotateY(Math.PI);
          modelGroup.add(mirror.mesh);
          reflectors.push(mirror);
        }
        if (top instanceof THREE.Mesh) {
          const mirror = new SourceReflector({
            height: 8.62,
            mirror: 0.9,
            width: 2.6
          });
          mirror.mesh.position.copy(top.position);
          mirror.mesh.rotateX(-Math.PI / 2);
          mirror.mesh.rotateY(Math.PI);
          modelGroup.add(mirror.mesh);
          reflectors.push(mirror);
        }

        const ground = new SourceReflector({
          baseColor: sceneBgColor.clone(),
          ground: true,
          height: 24,
          mirror: 0.02,
          normalTexture,
          reflectionStrength: 0.38,
          resolution: 1536,
          shadowsTexture,
          textureStrength: 0.1,
          width: 24
        });
        ground.mesh.rotateX(-Math.PI / 2);
        modelGroup.add(ground.mesh);
        reflectors.push(ground);

        modelGroup.add(loadedScene);
        syncPostTheme();
        canvas.dataset.lostHeroModels = "loaded";
        onReady();
      })
      .catch(() => {
        canvas.dataset.lostHeroModels = "failed";
        onReady();
      });

    const composer = new EffectComposer(renderer);
    composer.multisampling = 2;
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new BloomEffect({
      blendFunction: BlendFunction.SCREEN,
      intensity: 0.16,
      luminanceSmoothing: 0,
      luminanceThreshold: 1,
      mipmapBlur: true,
      radius: 0.42
    });
    const bloomPass = new EffectPass(camera, bloom);
    composer.addPass(bloomPass);
    const copyPass = new CopyPass();
    composer.addPass(copyPass);
    const vignetteColor = sceneBgColor.clone();
    const vignetteTargetColor = sceneBgColor.clone();
    const vignetteColorUniform = new THREE.Uniform(vignetteColor);
    const finalPass = new EffectPass(
      camera,
      new Effect("lost-source-final", finalPassShader, {
        blendFunction: BlendFunction.NORMAL,
        uniforms: new Map<string, THREE.Uniform>([
          ["bloomTexture", new THREE.Uniform(copyPass.texture)],
          ["uNoiseStrength", new THREE.Uniform(0.07)],
          ["uVignetteStrength", new THREE.Uniform(0.42)],
          ["uVignetteColor", vignetteColorUniform],
          ["uMaxDistort", new THREE.Uniform(1.46)],
          ["uBendAmount", new THREE.Uniform(-0.032)]
        ])
      })
    );
    composer.addPass(finalPass);
    canvas.dataset.lostPostprocessing = "active";

    const pointer = { x: 0, y: 0 };
    const current = { x: 0, y: 0, scroll: 0 };

    const playVideo = () => {
      if (!video || document.hidden) return;
      if (cartOpenRef.current) return;
      void video
        .play()
        .then(() => {
          canvas.dataset.webglState = "playing";
        })
        .catch(() => undefined);
    };
    const pauseVideo = () => {
      if (video && !video.paused) video.pause();
      canvas.dataset.webglState = "paused";
    };
    const syncVideoState = () => {
      if (!video) return;
      if (
        shouldPauseLostHeroVideo({
          cartOpen: cartOpenRef.current,
          documentHidden: document.hidden
        })
      ) {
        pauseVideo();
      } else {
        playVideo();
      }
    };
    const activateVideoTexture = () => {
      if (!video || videoTexture) return;
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.flipY = false;
      const ratio =
        video.videoWidth && video.videoHeight
          ? video.videoWidth / video.videoHeight
          : TARGET_VIDEO_RATIO;
      fitLostHomeVideoTexture(texture, ratio);
      videoTexture = texture;
      mediaMaterial.map = texture;
      mediaMaterial.needsUpdate = true;
    };
    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const applySceneTheme = () => {
      colorFromVar("--bg", LOST_WALL_FALLBACK, sceneBgColor);
      colorFromVar("--black", LOST_BLACK_FALLBACK, sceneBlackColor);
      colorFromVar("--white", LOST_WHITE_FALLBACK, sceneWhiteColor);

      renderer.setClearColor(sceneBlackColor, 1);
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(sceneBlackColor);
      }
      wallMaterials.forEach((material) => {
        material.uniforms.baseColor.value.copy(sceneBgColor);
      });
      blackMaterials.forEach((material) => {
        material.color.copy(sceneBlackColor);
      });
      whiteMaterials.forEach((material) => {
        material.color.copy(sceneWhiteColor);
      });
      stageMaterial?.color.copy(sceneBlackColor);
      reflectors.forEach((reflector) => reflector.setBaseColor(sceneBgColor));
    };
    const syncPostTheme = () => {
      applySceneTheme();
      const postTheme = getLostHeroPostTheme({
        cartOpen: cartOpenRef.current,
        videoOpen: watchOpenRef.current
      });
      const darkFrame = postTheme === "dark";
      colorFromVar(
        darkFrame ? "--n-s-bg" : "--bg",
        darkFrame ? LOST_BLACK_FALLBACK : LOST_WALL_FALLBACK,
        vignetteTargetColor
      );

      canvas.dataset.lostPostTheme = darkFrame ? "dark" : "light";
    };
    const startVideoZoom = (open: boolean) => {
      if (!videoPlane) return;
      zoom.active = true;
      zoom.open = open;
      zoom.progress = 0;
      zoom.startedAt = performance.now();
      zoom.startPosition.copy(cameraRig.position);
      if (open) {
        zoom.originalPosition.copy(cameraRig.position);
        videoPlane.updateMatrixWorld();
        const planePosition = new THREE.Vector3();
        videoPlane.getWorldPosition(planePosition);
        zoom.targetPosition.set(
          planePosition.x * 4,
          planePosition.y / 3,
          planePosition.z
        );
        canvas.dataset.lostWatchVideo = "zooming";
      } else {
        zoom.targetPosition.copy(zoom.originalPosition);
        canvas.dataset.lostWatchVideo = "returning";
      }
    };
    const postThemeObserver = new MutationObserver(syncPostTheme);

    if (video) {
      video.addEventListener("loadedmetadata", activateVideoTexture);
      video.addEventListener(
        "loadeddata",
        () => {
          activateVideoTexture();
          playVideo();
        },
        { once: true }
      );
      if (video.readyState >= 2) activateVideoTexture();
      video.load();
      playVideo();
    }

    const lookTarget = new THREE.Vector3();
    const naturalPosition = new THREE.Vector3();
    const breathing = { x: 0, y: 0, z: 0 };
    let breathingOffset = 0;
    const render = (_time: number, deltaTime: number) => {
      if (disposed) return;
      if (
        !shouldRenderLostHeroFrame({
          documentHidden: document.hidden,
          inViewport: sceneInViewportRef.current
        })
      ) {
        return;
      }

      const deltaMs = Math.min(deltaTime || 16.6667, 50);
      const delta = deltaMs / 1000;
      breathingOffset += deltaMs / 16.6667;
      const viewWidth = viewportWidth.get() || window.innerWidth;
      const viewHeight = viewportHeight.get() || window.innerHeight;
      pointer.x = (pointerX.get() / viewWidth - 0.5) * 2;
      pointer.y = (pointerY.get() / viewHeight - 0.5) * 2;

      current.scroll = scrollProgressRef.current;
      current.x = sourceDamp(current.x, pointer.x, 0.1, deltaMs);
      current.y = sourceDamp(current.y, pointer.y, 0.1, deltaMs);
      vignetteColorUniform.value.lerp(vignetteTargetColor, 0.1);

      cableMaterial.uniforms.time.value += delta;
      const breathingFrequency = 0.01;
      const breathingAmplitude = 0.02;
      breathing.x = sourceDamp(
        breathing.x,
        Math.sin(breathingOffset * breathingFrequency) * breathingAmplitude,
        0.1,
        deltaMs
      );
      breathing.y = sourceDamp(
        breathing.y,
        Math.cos(breathingOffset * breathingFrequency) * breathingAmplitude,
        0.1,
        deltaMs
      );
      breathing.z = sourceDamp(
        breathing.z,
        Math.cos(breathingOffset * breathingFrequency) * breathingAmplitude,
        0.1,
        deltaMs
      );
      const scrollOffset = zoom.open ? 0 : current.scroll * 2;
      naturalPosition.set(
        breathing.x,
        current.scroll > 0 ? -scrollOffset : breathing.y,
        breathing.z - current.x * 0.6
      );
      if (zoom.active) {
        zoom.progress = Math.min(
          (performance.now() - zoom.startedAt) / VIDEO_ZOOM_DURATION,
          1
        );
        cameraRig.position.lerpVectors(
          zoom.startPosition,
          zoom.targetPosition,
          lostHomeVideoEasing(zoom.progress)
        );
        if (zoom.progress >= 1) {
          zoom.active = false;
          canvas.dataset.lostWatchVideo = zoom.open ? "open" : "closed";
        }
      } else if (zoom.open) {
        cameraRig.position.copy(zoom.targetPosition);
      } else {
        cameraRig.position.copy(naturalPosition);
      }
      if (videoPlane) {
        videoPlane.getWorldPosition(lookTarget);
        if (!zoom.open) lookTarget.y += scrollOffset * 5;
        camera.lookAt(lookTarget);
      } else {
        camera.lookAt(0, 2.05, 0);
      }

      if (videoTexture && video && !video.paused)
        videoTexture.needsUpdate = true;
      reflectors.forEach((reflector) =>
        reflector.render(renderer, scene, camera)
      );
      composer.render(delta);
    };
    runtimeRef.current = {
      render,
      setWatchOpen: startVideoZoom,
      syncPostTheme,
      syncVideoState
    };

    resize();
    syncPostTheme();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", syncVideoState);
    postThemeObserver.observe(document.documentElement, {
      attributeFilter: ["data-theme", "class"],
      attributes: true
    });

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", syncVideoState);
      postThemeObserver.disconnect();
      visibilityObserver?.disconnect();
      runtimeRef.current = null;
      pauseVideo();
      if (video) {
        video.removeAttribute("src");
        video.load();
        video = null;
      }
      imageTexture.dispose();
      shadowsTexture.dispose();
      normalTexture.dispose();
      videoTexture?.dispose();
      reflectors.forEach((reflector) => reflector.dispose());
      if (modelGroup) {
        disposeObject(modelGroup);
        modelGroup = null;
      }
      composer.dispose();
      renderer.dispose();
    };
  }, [imageUrl, onReady, videoUrl]);

  return (
    <canvas
      aria-hidden
      className="lost-hero-canvas col-span-full row-span-full h-full max-h-[100svh] w-full bg-[var(--black)]"
      data-lost-hero-media={videoUrl ? "video" : "image"}
      ref={canvasRef}
    />
  );
}
