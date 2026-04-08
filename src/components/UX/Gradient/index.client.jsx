"use client";
import {
  meshBounds,
  PerspectiveCamera,
  shaderMaterial,
  useTexture,
  View
} from "@react-three/drei";
import { useFrameFactor, useRPStore } from "../../../providers/RP_Pro.tsx";
import { useShallow } from "zustand/shallow";
import {
  Color as ThreeColor,
  DoubleSide,
  RepeatWrapping,
  Vector2,
  Vector3
} from "three";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import { animate, useMotionValueEvent } from "motion/react";
import { TWEEN_EASE } from "../../../constants/animations.ts";

export function VGradient() {
  const navIsOpen = useRPStore((l) => l.navIsOpen);

  return (
    <View
      className="absolute inset-0 z-[200]"
      visible={navIsOpen}
      data-active={navIsOpen}
    >
      <PerspectiveCamera
        near={0.01}
        far={1000}
        position={[0, 0, 0.2]}
        fov={35}
        aspect={2}
        makeDefault={navIsOpen}
      />
      <GradientInner />
    </View>
  );
}

useTexture.preload("/assets/seamless.png");
function GradientInner() {
  const navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  const noiseTexture = useTexture(
    {
      map: "/assets/seamless.png"
    },
    (texture) => {
      texture.wrapS = texture.wrapT = RepeatWrapping;
    }
  );
  const gradientt = useRef();
  const { gl, set, scene, camera } = useThree();
  const colorSchemes = useMemo(
    () => [
      [parseInt("d40000", 16), parseInt("9ecbd9", 16)],
      [parseInt("AA3422", 16), parseInt("77A6A6", 16)],
      [parseInt("9ecbd9", 16), parseInt("e7d5ba", 16)],
      [parseInt("f6b08a", 16), parseInt("fdf1e8", 16)],

      [parseInt("fdf1e8", 16), parseInt("9ecbd9", 16)],
      [parseInt("d40000", 16), parseInt("ffb400", 16)],
      [parseInt("d40000", 16), parseInt("9eff00", 16)],
      [parseInt("F57B66", 16), parseInt("C3EAD2", 16)],
      [parseInt("4D8593", 16), parseInt("F38B2B", 16)],
      [parseInt("AAE935", 16), parseInt("ADE9FF", 16)],
      [parseInt("F5C78E", 16), parseInt("E74B58", 16)],
      [parseInt("C67006", 16), parseInt("9CE8E3", 16)],
      [parseInt("F57B66", 16), parseInt("C3EAD2", 16)],
      [parseInt("d40000", 16), parseInt("f6b08a", 16)],
      [parseInt("d40000", 16), parseInt("9aa989", 16)]
    ],
    []
  );
  const colours = useMemo(
    () => [
      new ThreeColor(colorSchemes[0][0]),
      new ThreeColor(colorSchemes[0][1])
    ],
    [colorSchemes]
  );
  const uOffset = useMemo(() => new Vector2(0.42, 0.6), []);
  const u_pixels = useMemo(() => new Vector2(1, 1), []);
  const u_resolution = useMemo(() => new Vector2(1, 1), []);
  const uAdditionalOffset = useMemo(() => new Vector2(0), []);
  const u_color = useMemo(
    () => [
      new ThreeColor(colorSchemes[0][0]),
      new ThreeColor(colorSchemes[0][1]),
      new ThreeColor().setHex(0x353c45),
      new ThreeColor().setHex(0x0f0a0a)
    ],
    [colorSchemes]
  );
  const colore = useMemo(() => new ThreeColor().setRGB(122, 122, 122), []);
  const vecc = useMemo(() => new Vector3(0, 0, 0.46), []);
  const uniforms = useMemo(
    () => ({
      u_color: u_color,
      uColorMixer: 0,
      uAdditionalZoom: 0,
      uAdditionalOffset: uAdditionalOffset,
      uSize: 0.2,
      uOffset: uOffset,
      uSpeed: 0.02,
      u_pixels: u_pixels,
      u_resolution: u_resolution,
      u_time: 1.0,
      u_noiseTexture: noiseTexture,
      u_opacity: 1.0
    }),
    [uOffset, u_pixels, uAdditionalOffset, u_resolution, noiseTexture, u_color]
  );
  const GradientShader = shaderMaterial(uniforms, vertexShader, fragmentShader);
  extend({ GradientShader });

  const navItemSelected = useFrameFactor((r) => r.activeKey);
  const navItemHovered = useFrameFactor((r) => r.focusedKey);
  const menuMediaPreviewKeyValue = useRPStore(
    useShallow((l) => l.navigationPreviewMediaByKey)
  );
  /**
   *
   * @type {React.RefObject<{[x:string]:number}>}
   */
  const mapped = useRef({});
  const menuPreviewKeys = useRef([]);
  useEffect(() => {
    if (menuPreviewKeys.current.length < 1 && menuMediaPreviewKeyValue) {
      Object.keys(menuMediaPreviewKeyValue).forEach((k, i) => {
        mapped.current[k] = i;
        menuPreviewKeys.current.push(k);
      });
    }
  }, [menuMediaPreviewKeyValue]);

  useEffect(() => {
    let devicePixelRatio = window.devicePixelRatio || 2;
    let pe = gl.domElement.parentElement;
    gl.domElement.width = pe.offsetWidth;
    gl.domElement.height = pe.offsetHeight;
    gl.setPixelRatio(devicePixelRatio);
  }, [gl]);

  const updateColor = useCallback(() => {
    const ai = navItemSelected.get(),
      hi = navItemHovered.get();
    let selIndex =
      ai === -1 ? (hi === -1 ? 0 : mapped.current[hi]) : mapped.current[ai];
    let target = colorSchemes[selIndex] || colorSchemes[0];
    colours[0].setHex(target[0]);
    colours[1].setHex(target[1]);

    gradientt.current &&
      animate([
        [
          gradientt.current.u_color[0],
          {
            r: colours[0].r,
            g: colours[0].g,
            b: colours[0].b
          },
          {
            duration: 1.1,
            delay: 0.3,
            ease: TWEEN_EASE.power4.inOut,
            at: 0,
            type: "tween"
          }
        ],
        [
          gradientt.current.u_color[1],
          {
            r: colours[1].r,
            g: colours[1].g,
            b: colours[1].b
          },
          {
            duration: 1.1,
            delay: 0.3,
            ease: TWEEN_EASE.power4.inOut,
            at: 0,
            type: "tween"
          }
        ]
      ]);
  }, [navItemSelected, navItemHovered, colorSchemes, colours]);
  const toRef = useRef(null);
  useEffect(() => {
    toRef.current && clearTimeout(toRef.current);
    if (navIsOpen) {
      toRef.current = setTimeout(updateColor, 50);
    }
  }, [navIsOpen, colorSchemes, colours, updateColor]);
  useMotionValueEvent(navItemSelected, "change", () => {
    toRef.current && clearTimeout(toRef.current);
    toRef.current = setTimeout(updateColor, 50);
  });
  useMotionValueEvent(navItemHovered, "change", () => {
    toRef.current && clearTimeout(toRef.current);
    toRef.current = setTimeout(updateColor, 50);
  });
  useFrame((state, delta, frame) => {
    gradientt.current.uniforms.u_time.value += delta * 0.02;
  });
  return (
    <>
      <ambientLight args={[colore]} intensity={1} />
      <directionalLight
        color={colore.setRGB(164, 164, 164)}
        intensity={1}
        position={vecc}
      />
      <mesh raycast={meshBounds} visible={navIsOpen}>
        <planeGeometry args={[1.5, 1.5, 300, 300]} />
        <gradientShader
          ref={gradientt}
          extensions={{
            derivatives: "#extension GL_OES_standard_derivatives: enable"
          }}
          side={DoubleSide}
        />
      </mesh>
    </>
  );
}
