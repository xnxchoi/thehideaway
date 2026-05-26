"use client";

import { useEffect, useRef } from "react";
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectComposer,
  EffectPass,
  RenderPass
} from "postprocessing";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getLostScrollY, syncLostScrollY } from "@/lib/lenis/runtime";

type Props = {
  imageUrl: string;
  videoUrl?: string | null;
};

const OFLYN_SCENE = "/assets/lostinseoul/oflyn/scene.glb";
const OFLYN_SHADOWS = "/assets/lostinseoul/oflyn/shadows.png";
const OFLYN_NORMAL = "/assets/lostinseoul/oflyn/normal.jpg";
const LOST_BLUE = 0x2358ff;
const LOST_WALL = 0xf2f1ea;
const LOST_BENCH = 0x171713;
const LOST_STAGE = 0x050505;
const TARGET_VIDEO_RATIO = 21 / 9;
const VIDEO_ZOOM_DURATION = 1000;

const finalPassShader = `
uniform sampler2D bloomTexture;
uniform float uNoiseStrength;
uniform float uVignetteStrength;
uniform vec3 uVignetteColor;
uniform float uMaxDistort;
uniform float uBendAmount;

float random2d(vec2 coord) {
  return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainUv(inout vec2 uv) {
  vec2 center = uv - 0.5;
  float dist = dot(center, center);
  uv += center * dist * uBendAmount * uMaxDistort;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * uVignetteStrength;
  vec3 bloom = texture2D(bloomTexture, uv).rgb;
  float noise = random2d(gl_FragCoord.xy) - 0.5;
  vec3 color = inputColor.rgb + bloom * 0.18 + noise * uNoiseStrength;
  outputColor = vec4(mix(uVignetteColor, color, clamp(vignette, 0.0, 1.0)), inputColor.a);
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
  vec2 normalUv = coord.xy + coord.z * normal.xz * 0.042;
  vec3 bake = texture2D(tBake, meshUV).rgb;
  vec3 reflection = texture2D(tDiffuse, normalUv).rgb * reflectionStrength;
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

function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

function sourceDamp(
  current: number,
  target: number,
  amount: number,
  deltaMs: number
) {
  return lerp(current, target, 1 - Math.exp(-amount * 0.05 * deltaMs));
}

function oflynVideoEasing(progress: number) {
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

function fitOflynVideoTexture(texture: THREE.Texture, mediaRatio: number) {
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

function makeBlackStage() {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: LOST_STAGE,
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

  return group;
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
      energyColor: { value: new THREE.Color(LOST_BLUE) },
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
  private readonly originalMaterial: THREE.Material | THREE.Material[] | null;
  private readonly dynamicUpdate: boolean;
  private readonly updateInterval: number;
  private lastUpdateTime = 0;

  constructor({
    ground = false,
    height,
    mesh,
    mirror,
    normalTexture,
    baseColor = new THREE.Color(LOST_WALL),
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
    this.dynamicUpdate = !ground;
    this.updateInterval = ground ? 1000 / 24 : 1000 / 30;
  }

  render(
    renderer: THREE.WebGLRenderer,
    renderScene: THREE.Scene,
    mainCamera: THREE.PerspectiveCamera
  ) {
    const now = performance.now();
    if (
      !this.dynamicUpdate &&
      now - this.lastUpdateTime < this.updateInterval
    ) {
      return;
    }
    this.lastUpdateTime = now;
    this.mesh.updateMatrixWorld();
    mainCamera.updateMatrixWorld();

    const reflectorWorldPosition = new THREE.Vector3().setFromMatrixPosition(
      this.mesh.matrixWorld
    );
    const cameraWorldPosition = new THREE.Vector3().setFromMatrixPosition(
      mainCamera.matrixWorld
    );

    this.rotationMatrix.extractRotation(this.mesh.matrixWorld);
    this.normal.set(0, 0, 1);
    this.normal.applyMatrix4(this.rotationMatrix);
    this.view.subVectors(reflectorWorldPosition, cameraWorldPosition);
    if (this.view.dot(this.normal) > 0) return;

    this.view.reflect(this.normal).negate();
    this.view.add(reflectorWorldPosition);
    this.rotationMatrix.extractRotation(mainCamera.matrixWorld);
    this.target.set(0, 0, -1);
    this.target.applyMatrix4(this.rotationMatrix);
    this.target.add(cameraWorldPosition);
    this.target.sub(reflectorWorldPosition);
    this.target.reflect(this.normal).negate();
    this.target.add(reflectorWorldPosition);

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
      reflectorWorldPosition
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
    renderer.xr.enabled = currentXr;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    renderer.setRenderTarget(currentTarget);
    this.mesh.visible = true;
  }

  dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
    if (this.originalMaterial) this.mesh.material = this.originalMaterial;
  }
}

export function LostHeroScene({ imageUrl, videoUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      canvas,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

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
    const shadowsTexture = textureLoader.load(OFLYN_SHADOWS);
    shadowsTexture.colorSpace = THREE.SRGBColorSpace;
    shadowsTexture.flipY = true;
    const normalTexture = textureLoader.load(OFLYN_NORMAL);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;

    let video: HTMLVideoElement | null = videoUrl
      ? createHeroVideo(videoUrl)
      : null;
    const imageTexture = textureLoader.load(imageUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      coverTexture(texture, 4 / 5, TARGET_VIDEO_RATIO);
    });
    imageTexture.colorSpace = THREE.SRGBColorSpace;
    let videoTexture: THREE.VideoTexture | null = null;

    const whiteMaterial = new THREE.MeshBasicMaterial({
      color: 0xe8e8e8,
      side: THREE.DoubleSide
    });
    const wallMaterial = createTexturedSurfaceMaterial({
      baseColor: LOST_WALL,
      normalTexture,
      shadowsTexture
    });
    const blackMaterial = new THREE.MeshBasicMaterial({
      color: LOST_BENCH,
      side: THREE.DoubleSide
    });
    const cableMaterial = createCablePulseMaterial();
    const mediaMaterial = new THREE.MeshBasicMaterial({
      map: imageTexture,
      side: THREE.DoubleSide,
      transparent: true
    });

    const reflectors: SourceReflector[] = [];
    let modelGroup: THREE.Group | null = new THREE.Group();
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
      .loadAsync(OFLYN_SCENE)
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
            object.material = blackMaterial.clone();
            object.visible = true;
            return;
          }
          if (name === "ground") {
            object.visible = false;
            return;
          }
          if (name === "wall") {
            object.material = wallMaterial.clone();
            return;
          }
          if (name === "emissive") {
            object.material = whiteMaterial.clone();
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

        modelGroup.add(makeBlackStage());

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
          baseColor: new THREE.Color(LOST_WALL),
          ground: true,
          height: 24,
          mirror: 0.02,
          normalTexture,
          reflectionStrength: 0.082,
          resolution: 1536,
          shadowsTexture,
          textureStrength: 0.1,
          width: 24
        });
        ground.mesh.rotateX(-Math.PI / 2);
        modelGroup.add(ground.mesh);
        reflectors.push(ground);

        modelGroup.add(loadedScene);
        canvas.dataset.lostOflynModels = "loaded";
      })
      .catch(() => {
        canvas.dataset.lostOflynModels = "failed";
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
    const finalPass = new EffectPass(
      camera,
      new Effect("lost-source-final", finalPassShader, {
        blendFunction: BlendFunction.NORMAL,
        uniforms: new Map<string, THREE.Uniform>([
          ["bloomTexture", new THREE.Uniform(bloom.texture)],
          ["uNoiseStrength", new THREE.Uniform(0.025)],
          ["uVignetteStrength", new THREE.Uniform(0.42)],
          ["uVignetteColor", new THREE.Uniform(new THREE.Color(0x000000))],
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
      if (!video || reducedMotion.matches || document.hidden) return;
      if (document.body.dataset.lostBagOpen === "true") return;
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
        reducedMotion.matches ||
        document.hidden ||
        document.body.dataset.lostBagOpen === "true"
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
      fitOflynVideoTexture(texture, ratio);
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
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const startVideoZoom = (open: boolean) => {
      if (!videoPlane || reducedMotion.matches) return;
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
    const onWatchVideo = (event: Event) => {
      const requestedOpen =
        event instanceof CustomEvent && typeof event.detail?.open === "boolean"
          ? event.detail.open
          : !zoom.open;
      startVideoZoom(requestedOpen);
    };
    const bagObserver = new MutationObserver(syncVideoState);

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

    let raf = 0;
    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();
    let elapsed = 0;
    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const deltaMs = delta * 1000;
      elapsed += delta;
      const scrollLimit = Math.min(window.innerHeight * 1.2, 800);
      syncLostScrollY();
      const scroll = Math.min(
        Math.max(getLostScrollY() / Math.max(scrollLimit, 1), 0),
        1
      );
      current.scroll = scroll;
      current.x = sourceDamp(current.x, pointer.x, 0.1, deltaMs);
      current.y = sourceDamp(current.y, pointer.y, 0.1, deltaMs);

      const motion = reducedMotion.matches ? 0 : 1;
      cableMaterial.uniforms.time.value = elapsed;
      const breathingX = Math.sin(elapsed * 0.6) * 0.02 * motion;
      const breathingY = Math.cos(elapsed * 0.6) * 0.02 * motion;
      const breathingZ =
        Math.cos(elapsed * 0.6) * 0.02 * motion - current.x * 0.6 * motion;
      const scrollOffset = zoom.open ? 0 : current.scroll * 2;
      const naturalPosition = new THREE.Vector3(
        breathingX,
        current.scroll > 0 ? -scrollOffset : breathingY,
        breathingZ
      );
      if (zoom.active) {
        zoom.progress = Math.min(
          (performance.now() - zoom.startedAt) / VIDEO_ZOOM_DURATION,
          1
        );
        cameraRig.position.lerpVectors(
          zoom.startPosition,
          zoom.targetPosition,
          oflynVideoEasing(zoom.progress)
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
      raf = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    document.addEventListener("lost:watch-video", onWatchVideo);
    document.addEventListener("visibilitychange", syncVideoState);
    reducedMotion.addEventListener("change", syncVideoState);
    bagObserver.observe(document.body, {
      attributeFilter: ["data-lost-bag-open"],
      attributes: true
    });
    raf = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("lost:watch-video", onWatchVideo);
      document.removeEventListener("visibilitychange", syncVideoState);
      reducedMotion.removeEventListener("change", syncVideoState);
      bagObserver.disconnect();
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
  }, [imageUrl, videoUrl]);

  return (
    <canvas
      aria-hidden
      className="lost-hero-canvas col-span-full row-span-full h-full max-h-[100svh] w-full bg-black"
      data-lost-hero-media={videoUrl ? "video" : "image"}
      ref={canvasRef}
    />
  );
}
