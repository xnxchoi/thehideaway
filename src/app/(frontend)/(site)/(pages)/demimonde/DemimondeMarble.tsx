"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  Canvas,
  extend,
  useFrame,
  useLoader,
  useThree
} from "@react-three/fiber";
import { ScreenQuad, shaderMaterial, useTexture } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import {
  EquirectangularReflectionMapping,
  FrontSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  type IUniform,
  type Mesh,
  type ShaderMaterial,
  type Texture,
  Vector2
} from "three";
import { RGBELoader } from "three-stdlib";
import fragmentShader from "./shaders/marble.frag.glsl";
import vertexShader from "./shaders/marble.vert.glsl";
import s from "./Demimonde.module.scss";

/**
 * Demimonde marble — frozen, lit, and metallic. Domain-warped fBM stone
 * pattern with analytical lighting and a HDR envMap reflection on the
 * veins. Renders a Drei <ScreenQuad> inside a standalone R3F <Canvas>.
 *
 * Why standalone Canvas, not the shared MainInternal canvas via <View>:
 *   • This is a single isolated decorative element inside one page.
 *   • The marble doesn't need to coexist with other 3D scenes here.
 *   • Standalone keeps the file self-contained — drop into another page
 *     without wiring through the View registry.
 *
 * The HDR (`urban_alley_01_1k.hdr`) is reused from /assets/three/environments/urban_alley/;
 * already in /public and used by the TapePlayer. No new asset cost.
 *
 * Frozen vs. animated: pattern is static (no u_time in the noise), but
 * the shader still updates per frame so the cursor highlight + envMap
 * reflection follow your pointer. Reduced-motion users get demand-mode
 * rendering — pattern is computed once, redrawn only on cursor move.
 *
 * Module-scope shaderMaterial registration is critical (matches
 * AmbientGradientMesh): redefining the class per-render unmounts and
 * remounts the material every frame and breaks materialRef.
 */

const HDR_URL = "/assets/three/environments/urban_alley/urban_alley_01_1k.hdr";
const GRAIN_URL = "/assets/papier.png";

const _marbleUniforms = {
  u_cursor: new Vector2(0.5, 0.5),
  u_resolution: new Vector2(1, 1),
  u_intensity: 0.6,
  u_scale: 2.0,
  u_envMap: null as Texture | null,
  u_envIntensity: 0.55,
  u_grainMap: null as Texture | null,
  u_grainTile: 6.0
};

const MarbleShaderMaterial = shaderMaterial(
  _marbleUniforms,
  vertexShader,
  fragmentShader
);
extend({ MarbleShaderMaterial });

type MarbleMaterialRef =
  | (Omit<ShaderMaterial, "uniforms"> & {
      uniforms: {
        [K in keyof typeof _marbleUniforms]: IUniform<
          (typeof _marbleUniforms)[K]
        >;
      };
    })
  | null;

interface MarbleSceneProps {
  reduced: boolean;
  scale: number;
  envIntensity: number;
  grainTile: number;
}

/**
 * Inner scene component. Lives inside <Canvas> so it can use R3F hooks.
 * Owns: HDR load, cursor listener, resize sync, useFrame tick.
 */
function MarbleScene({
  reduced,
  scale,
  envIntensity,
  grainTile
}: MarbleSceneProps) {
  const matRef = useRef<MarbleMaterialRef>(null);
  const meshRef = useRef<Mesh>(null);
  const { gl, size, invalidate } = useThree();
  const cursor = useRef(new Vector2(0.5, 0.5));
  const intensityTarget = useRef(0.4);
  const intensity = useRef(0.4);

  // Load + configure the HDR equirectangular map. useLoader caches by
  // URL so multiple <DemimondeMarble> instances share one texture.
  const envMap = useLoader(RGBELoader, HDR_URL);
  useMemo(() => {
    if (!envMap) return;
    envMap.mapping = EquirectangularReflectionMapping;
    // Linear filtering keeps the metallic reflection smooth across the
    // vein crests. Default nearest sampling causes a sparkly aliased
    // look on low-resolution HDRs.
    envMap.minFilter = LinearFilter;
    envMap.magFilter = LinearFilter;
    envMap.generateMipmaps = false;
    envMap.needsUpdate = true;
  }, [envMap]);

  // Paper-grain micro-texture. Repeat-wrap so tiling factors > 1 give
  // continuous coverage. NoColorSpace — we sample the .r channel as a
  // luminance perturbation, not a viewable color, so sRGB→linear
  // conversion would distort the math.
  const grainMap = useTexture(GRAIN_URL, (t) => {
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.colorSpace = NoColorSpace;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.anisotropy = 4;
    t.needsUpdate = true;
  }) as Texture;

  // Sync resolution + scale + envMap + grain uniforms.
  useEffect(() => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.u_resolution.value.set(size.width, size.height);
    m.uniforms.u_scale.value = scale;
    m.uniforms.u_envIntensity.value = envIntensity;
    m.uniforms.u_grainTile.value = grainTile;
    if (envMap) m.uniforms.u_envMap.value = envMap;
    if (grainMap) m.uniforms.u_grainMap.value = grainMap;
    invalidate();
  }, [
    size.width,
    size.height,
    scale,
    envIntensity,
    grainTile,
    envMap,
    grainMap,
    invalidate
  ]);

  // Cursor: pointermove on window, mapped to canvas-local (0..1).
  // Listening on window (not canvas) lets the bloom drift off-disc.
  useEffect(() => {
    const canvas = gl.domElement;
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (isCoarse) {
      intensityTarget.current = 0.55;
      return;
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(rect.width, 1);
      const h = Math.max(rect.height, 1);
      const x = (e.clientX - rect.left) / w;
      // ScreenQuad uvs are bottom-left origin; flip y from screen coords.
      const y = 1.0 - (e.clientY - rect.top) / h;
      // Soft margin so the bloom continues to drift outside the disc.
      cursor.current.x = Math.max(-0.2, Math.min(1.2, x));
      cursor.current.y = Math.max(-0.2, Math.min(1.2, y));
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      intensityTarget.current = inside ? 1.0 : 0.45;
      if (reduced) invalidate();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [gl, invalidate, reduced]);

  useFrame((_state, delta) => {
    const m = matRef.current;
    if (!m) return;

    // No time advancement — pattern is frozen by design. We still tick
    // each frame so cursor + intensity uniforms can lerp toward their
    // targets, which keeps the bloom responsive without animating the
    // marble itself.
    const c = m.uniforms.u_cursor.value;
    if (reduced) {
      // demand-mode rendering: lerp can never converge. Snap instead.
      c.x = cursor.current.x;
      c.y = cursor.current.y;
      intensity.current = intensityTarget.current;
    } else {
      const alpha = 1 - Math.exp(-delta * 9);
      c.x = c.x + (cursor.current.x - c.x) * alpha;
      c.y = c.y + (cursor.current.y - c.y) * alpha;
      intensity.current =
        intensity.current +
        (intensityTarget.current - intensity.current) * alpha;
    }
    m.uniforms.u_intensity.value = intensity.current;
  });

  return (
    <ScreenQuad ref={meshRef} frustumCulled={false}>
      {/** @ts-expect-error Drei shaderMaterial JSX intrinsic from extend() **/}
      <marbleShaderMaterial ref={matRef} side={FrontSide} />
    </ScreenQuad>
  );
}

interface DemimondeMarbleProps {
  /** Base feature scale. Smaller = larger blotches, bigger = finer veining. */
  scale?: number;
  /** HDR envMap reflection strength on metallic veins. 0 = off, ~1 = present, 3 = very showy. */
  envIntensity?: number;
  /** Tile multiplier for the paper-grain micro-texture. Lower = larger grain, higher = finer. */
  grainTile?: number;
  /** Optional className for the wrapping div (defaults to absolute fill). */
  className?: string;
}

export function DemimondeMarble({
  scale = 2.0,
  envIntensity = 0.55,
  grainTile = 6.0,
  className
}: DemimondeMarbleProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className={className ?? s.marbleHost} aria-hidden>
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        }}
        // Always-tick even when frozen — cursor lerp needs continuous
        // frames. Reduced-motion drops to demand mode (cursor snaps so
        // single frames still produce a correct picture).
        frameloop={reduced ? "demand" : "always"}
        flat
      >
        <Suspense fallback={null}>
          <MarbleScene
            reduced={reduced}
            scale={scale}
            envIntensity={envIntensity}
            grainTile={grainTile}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
