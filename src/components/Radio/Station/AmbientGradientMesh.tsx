"use client";

import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { MotionValue } from "motion/react";
import {
  BlendFunction,
  Effect,
  EffectPass,
  KawaseBlurPass,
  RenderPass
} from "postprocessing";
import { useEffect, useMemo, useRef } from "react";
import {
  Color as ThreeColor,
  DoubleSide,
  RepeatWrapping,
  Texture,
  Uniform,
  Vector2,
  Vector4
} from "three";
import fragmentShader from "../shaders/ambient.frag.glsl";
import vertexShader from "../shaders/ambient.vert.glsl";
import grain from "../shaders/grain.glsl";
// ── Theme color palettes ──────────────────────────────────────────────────
// Dark: FC Porto memorial — deep navy/blue-black, very subtle warm-blue shifts
// Grain is the star; blobs are barely-there atmospheric color
const DARK_BG = new ThreeColor().setStyle("#070c11"); // deep navy-black
const DARK_COLOR1 = new ThreeColor().setStyle("#182b38"); // dark steel blue
const DARK_COLOR2 = new ThreeColor().setStyle("#154751"); // muted slate
const DARK_COLOR3 = new ThreeColor().setStyle("#14151f"); // deep indigo shadow

// Light: Richard Sancho-inspired — muted lavender, warm gold, soft rose on cream
const LIGHT_BG = new ThreeColor().setStyle("#f8f6f5");
const LIGHT_COLOR1 = new ThreeColor().setStyle("#31a6bd"); // soft lavender
const LIGHT_COLOR2 = new ThreeColor().setStyle("#ff922c"); // warm gold
const LIGHT_COLOR3 = new ThreeColor().setStyle("#ffeac8"); // muted rose

// Blob intensity: how visible the gradient blobs are
// When playing: very subdued. When stopped: more pronounced but still dark/moody.
const BLOB_INTENSITY_PLAYING = 0.25;
const BLOB_INTENSITY_STOPPED = 0.36;

type AmbientGradientMeshProps = {
  opacity: MotionValue<number>;
  audioLevel: MotionValue<number>;
  fogProgress: MotionValue<number>;
  isDark: boolean;
  playing: boolean;
};
const displacementEffect = new Effect(
  "displacement",
  `
    uniform vec2 uDisplacementStrength;
    uniform float uCursorColoring;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        // UV aspect fix
        /* vec2 nUv = (-.5 + uv) * 2.;
        if( resolution.x < resolution.y ) {
            nUv.x *= resolution.x / resolution.y;
        } else {
            nUv.y *= resolution.y / resolution.x;
        }
        nUv = nUv / 2. + .5; */


        vec2 dUv = vec2(
            uv.x 
            uv.y
        );

        vec4 color = texture2D(inputBuffer, dUv);

        color.rgb += color.rgb * gpgpuColor.b * uCursorColoring;

        outputColor = vec4(color.rgb, 1.0);
    }`,
  {
    blendFunction: BlendFunction.NORMAL,
    uniforms: new Map([
      ["uDisplacementStrength" as const, new Uniform(new Vector2(2, 2))],
      ["uCursorColoring" as const, new Uniform(1.5)]
    ])
  }
);
export function AmbientGradientMesh({
  opacity,
  audioLevel,
  fogProgress,
  isDark,
  playing
}: AmbientGradientMeshProps) {
  useTexture.preload("/assets/seamless.png");
  const materialRef = useRef<any>(null);
  const { size, scene, camera } = useThree();
  const pixelSize = window.devicePixelRatio;
  const uXCount = new Uniform(size.width / pixelSize);
  const uYCount = new Uniform(size.height / pixelSize);
  const uIntensity = new Uniform(1.29);
  const renderPass = new RenderPass(scene, camera);
  const grainEffect = new Effect("grain", grain, {
    blendFunction: BlendFunction.NORMAL,
    uniforms: new Map([
      ["uXCount", uXCount],
      ["uYCount", uYCount],
      ["uIntensity", uIntensity]
    ])
  });
  const blurPass = new KawaseBlurPass();
  blurPass.scale = 2;
  const effectPass = new EffectPass(camera, grainEffect);
  const passes = [renderPass, blurPass, effectPass];
  const noiseTexture = useTexture(
      "/assets/seamless.png",
      (texture: Texture) => {
        texture.wrapS = texture.wrapT = RepeatWrapping;
      }
    ),
    uTime = new Uniform(0),
    uSize = new Uniform(0.2),
    uOffset = new Uniform(new Vector2(0.42, 0.6)),
    uSpeed = new Uniform(0.02),
    uColor1 = new Uniform(new ThreeColor("rgb(65,66,73)")),
    uColor2 = new Uniform(new ThreeColor("rgb(36,39,51)")),
    uColor3 = new Uniform(new ThreeColor("rgb(49,103,160)")),
    uColor4 = new Uniform(new ThreeColor("rgb(117,153,245)"));

  const uNoiseTexture = new Uniform(noiseTexture),
    uColorMixer = new Uniform(0),
    uMenuMode = new Uniform(0),
    uAdditionalZoom = new Uniform(0),
    uAdditionalOffset = new Uniform(new Vector2(0, 0));
  const u_resolution = useMemo(() => new Vector4(1, 1, 1, 1), []);

  const bgColor = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_BG : LIGHT_BG),
    [isDark]
  );
  const color1 = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_COLOR1 : LIGHT_COLOR1),
    [isDark]
  );
  const color2 = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_COLOR2 : LIGHT_COLOR2),
    [isDark]
  );
  const color3 = useMemo(
    () => new ThreeColor().copy(isDark ? DARK_COLOR3 : LIGHT_COLOR3),
    [isDark]
  );

  const uniforms = useMemo(
    () => ({
      u_time: 0,
      u_resolution,
      u_bgColor: bgColor,
      u_color1: color1,
      u_color2: color2,
      u_color3: color3,
      u_audioLevel: 0.0,
      u_fogProgress: 0.0,
      u_opacity: 1.0,
      u_grainIntensity: isDark ? 0.14 : 0.08,
      u_blobIntensity: BLOB_INTENSITY_STOPPED,
      u_noiseTexture: noiseTexture
    }),
    [u_resolution, bgColor, color1, color2, color3, noiseTexture, isDark]
  );

  const AmbientShader = shaderMaterial(uniforms, vertexShader, fragmentShader);
  extend({ AmbientShader });

  // Sync resolution
  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.u_resolution.value.set(
      size.width,
      size.height,
      1,
      1
    );
  }, [size]);

  // Update colors when theme changes
  useEffect(() => {
    if (!materialRef.current) return;
    const m = materialRef.current.uniforms;
    m.u_bgColor.value.copy(isDark ? DARK_BG : LIGHT_BG);
    m.u_color1.value.copy(isDark ? DARK_COLOR1 : LIGHT_COLOR1);
    m.u_color2.value.copy(isDark ? DARK_COLOR2 : LIGHT_COLOR2);
    m.u_color3.value.copy(isDark ? DARK_COLOR3 : LIGHT_COLOR3);
    m.u_grainIntensity.value = isDark ? 0.14 : 0.08;
  }, [isDark]);

  // Smoothly transition blob intensity based on playing state
  const targetBlobIntensity = useRef(BLOB_INTENSITY_STOPPED);
  useEffect(() => {
    targetBlobIntensity.current = playing
      ? BLOB_INTENSITY_PLAYING
      : BLOB_INTENSITY_STOPPED;
  }, [playing]);

  useFrame((_state, delta) => {
    if (!materialRef.current) return;
    const m = materialRef.current.uniforms;

    m.u_time.value += delta;

    // Smoothly lerp blob intensity toward target
    const current = m.u_blobIntensity.value;
    const target = targetBlobIntensity.current;
    m.u_blobIntensity.value += (target - current) * delta * 1.5;

    // Reactive uniforms
    m.u_opacity.value = opacity.get();
    m.u_fogProgress.value = fogProgress.get();
    m.u_audioLevel.value = audioLevel.get();
  });

  return (
    <mesh>
      {/* Simple quad — all complexity is in the fragment shader */}
      <planeGeometry args={[1.5, 1.5, 1, 1]} />
      {/* @ts-expect-error — dynamically extended shader material */}
      <ambientShader
        ref={materialRef}
        extensions={{
          derivatives: "#extension GL_OES_standard_derivatives: enable"
        }}
        side={DoubleSide}
        transparent
      />
    </mesh>
  );
}
