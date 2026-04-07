"use client";

import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import {
  Color as ThreeColor,
  DoubleSide,
  RepeatWrapping,
  Vector2,
  Vector3
} from "three";
import vertexShader from "../shaders/ambient.vert.glsl";
import fragmentShader from "../shaders/ambient.frag.glsl";

// Radio-specific warm palettes: deep amber, burnt sienna, dark earth
const RADIO_PALETTE = [
  new ThreeColor().setHex(0x8b4513), // saddle brown
  new ThreeColor().setHex(0xb8651a), // burnt sienna
  new ThreeColor().setHex(0x1a1208)  // dark earth
];

type AmbientGradientMeshProps = {
  opacity: MotionValue<number>;
  audioLevel: MotionValue<number>;
  fogProgress: MotionValue<number>;
};

export function AmbientGradientMesh({
  opacity,
  audioLevel,
  fogProgress
}: AmbientGradientMeshProps) {
  useTexture.preload("/assets/seamless.png");
  const materialRef = useRef<any>(null);
  const { gl } = useThree();

  const noiseTexture = useTexture(
    { map: "/assets/seamless.png" },
    (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
    }
  );

  const uOffset = useMemo(() => new Vector2(0.42, 0.6), []);
  const u_pixels = useMemo(() => new Vector2(1, 1), []);
  const u_resolution = useMemo(() => new Vector2(1, 1), []);
  const uAdditionalOffset = useMemo(() => new Vector2(0, 0), []);
  const colore = useMemo(() => new ThreeColor().setRGB(122, 122, 122), []);
  const vecc = useMemo(() => new Vector3(0, 0, 0.46), []);

  const u_color = useMemo(
    () => [
      new ThreeColor().copy(RADIO_PALETTE[0]),
      new ThreeColor().copy(RADIO_PALETTE[1]),
      new ThreeColor().copy(RADIO_PALETTE[2])
    ],
    []
  );

  const uniforms = useMemo(
    () => ({
      u_color,
      uColorMixer: 0,
      uAdditionalZoom: 0,
      uAdditionalOffset,
      uSize: 0.2,
      uOffset,
      uSpeed: 0.015,
      u_pixels,
      u_resolution,
      u_time: 1.0,
      u_noiseTexture: noiseTexture,
      u_opacity: 0.3,
      u_audioLevel: 0.0,
      u_fogProgress: 0.0
    }),
    [uOffset, u_pixels, uAdditionalOffset, u_resolution, noiseTexture, u_color]
  );

  const AmbientShader = shaderMaterial(
    uniforms,
    vertexShader,
    fragmentShader
  );
  extend({ AmbientShader });

  // Sync pixel ratio
  useEffect(() => {
    const dpr = window.devicePixelRatio || 2;
    const pe = gl.domElement.parentElement;
    if (pe) {
      gl.domElement.width = pe.offsetWidth;
      gl.domElement.height = pe.offsetHeight;
    }
    gl.setPixelRatio(dpr);
  }, [gl]);

  // Animate uniforms each frame — read MotionValues without React re-renders
  useFrame((_state, delta) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;

    // Time — slow crawl
    mat.uniforms.u_time.value += delta * 0.015;

    // Reactive uniforms from MotionValues
    mat.uniforms.u_opacity.value = opacity.get();
    mat.uniforms.u_audioLevel.value = audioLevel.get();
    mat.uniforms.u_fogProgress.value = fogProgress.get();
  });

  return (
    <>
      <ambientLight args={[colore]} intensity={1} />
      <directionalLight
        color={colore.setRGB(164, 164, 164)}
        intensity={1}
        position={vecc}
      />
      <mesh>
        <planeGeometry args={[1.5, 1.5, 200, 200]} />
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
    </>
  );
}
