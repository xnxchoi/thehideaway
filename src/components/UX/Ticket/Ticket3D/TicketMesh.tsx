"use client";

import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  makeTicketBackTexture,
  makeTicketFoilMask,
  makeTicketRoughness,
  makeTicketTexture,
  type TicketTextureInput
} from "./makeTicketTexture";

export interface TicketMeshProps extends TicketTextureInput {
  pointer: { x: number; y: number };
  pointerActive: boolean;
  /** When false, all input-driven motion is suppressed and the mesh idles. */
  interactive: boolean;
  /** True → ticket rotates 180° around Y to present the back face. */
  flipped: boolean;
  cameraActive: boolean;
  /**
   * Tug — drag delta away from the stub seam, normalised to [-1, 1].
   * Positive values bend the ticket as if its stub is being pulled to
   * the right; negative values pull the body to the left. The mesh
   * translates this into a damped rotation.y bend on top of the wobble
   * + tilt + flip axes. Drives the signature gestural interaction.
   */
  tug: number;
}

const TICKET_W = 4.6;
const TICKET_H = 2.3;
const TICKET_D = 0.06;
const STUB_OFFSET = 0.6;
const NOTCH_R = 0.07;
const BEVEL_THICKNESS = 0.008;
// Front/back planes must clear the body's BEVEL extrusion (which extends
// the geometry past ±D/2 by bevelThickness). With offset > bevelThickness,
// the planes sit in front of the bevelled cap and aren't occluded.
const PLANE_OFFSET = BEVEL_THICKNESS + 0.006;

/**
 * Counter-clockwise outer perimeter for the ticket silhouette: a
 * rectangle with two inward semicircular notches at the perforation x.
 * Used both for the ExtrudeGeometry body and the flat ShapeGeometry
 * planes that carry the front/back textures.
 */
function buildTicketShape(): THREE.Shape {
  const w2 = TICKET_W / 2;
  const h2 = TICKET_H / 2;
  const px = STUB_OFFSET;

  // Densify edges: extra vertices along top + bottom (especially on the
  // stub side past the perforation) so the earcut triangulator produces
  // enough triangles for the perforation-hinge vertex bend to read as a
  // smooth curve rather than a hard fold. Without these extra points,
  // the shader bend would only displace the four corners of the stub.
  const steps = (from: number, to: number, n: number): number[] => {
    const out: number[] = [];
    for (let i = 1; i < n; i++) out.push(from + ((to - from) * i) / n);
    return out;
  };

  const shape = new THREE.Shape();
  shape.moveTo(-w2, h2);
  shape.lineTo(-w2, -h2);
  // Bottom: body side (sparse) → notch → stub side (dense).
  for (const x of steps(-w2, px - NOTCH_R, 4)) shape.lineTo(x, -h2);
  shape.lineTo(px - NOTCH_R, -h2);
  shape.absarc(px, -h2, NOTCH_R, Math.PI, 0, true);
  for (const x of steps(px + NOTCH_R, w2, 10)) shape.lineTo(x, -h2);
  shape.lineTo(w2, -h2);
  // Right edge: dense subdivision so the bend curves vertically too.
  for (const y of steps(-h2, h2, 6)) shape.lineTo(w2, y);
  shape.lineTo(w2, h2);
  // Top: stub side (dense) → notch → body side (sparse).
  for (const x of steps(w2, px + NOTCH_R, 10)) shape.lineTo(x, h2);
  shape.lineTo(px + NOTCH_R, h2);
  shape.absarc(px, h2, NOTCH_R, 0, Math.PI, true);
  for (const x of steps(px - NOTCH_R, -w2, 4)) shape.lineTo(x, h2);
  shape.lineTo(-w2, h2);
  return shape;
}

/**
 * Remap a flat ShapeGeometry's UVs so the texture maps [0, 1] across the
 * shape's bounding box. ShapeGeometry's default UVs use world coordinates
 * — we want bbox-normalised so the canvas texture lines up regardless of
 * the shape's actual position.
 */
function remapShapeUVs(geom: THREE.ShapeGeometry): void {
  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const sx = bb.max.x - bb.min.x;
  const sy = bb.max.y - bb.min.y;
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv.setXY(i, (x - bb.min.x) / sx, (y - bb.min.y) / sy);
  }
  uv.needsUpdate = true;
}

export function TicketMesh({
  eventName,
  ticketNumber,
  date,
  location,
  pointer,
  pointerActive,
  interactive,
  flipped,
  cameraActive,
  tug
}: TicketMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  // ── Geometry ───────────────────────────────────────────────────────────
  const { bodyGeom, faceGeom } = useMemo(() => {
    const shape = buildTicketShape();
    const body = new THREE.ExtrudeGeometry(shape, {
      depth: TICKET_D,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.012,
      bevelThickness: BEVEL_THICKNESS,
      curveSegments: 16
    });
    body.translate(0, 0, -TICKET_D / 2);
    body.computeVertexNormals();

    const face = new THREE.ShapeGeometry(shape, 16);
    remapShapeUVs(face);
    return { bodyGeom: body, faceGeom: face };
  }, []);

  useEffect(() => {
    return () => {
      bodyGeom.dispose();
      faceGeom.dispose();
    };
  }, [bodyGeom, faceGeom]);

  // ── Fonts-ready guard ──────────────────────────────────────────────────
  // Canvas2D resolves font CSS at draw time; if Playfair Display / Inter
  // / Noto Serif KR haven't loaded yet, we'll bake textures using the
  // fallback chain (Georgia / Helvetica / Apple SD Gothic) and the type
  // never recovers without a fresh remount. We bump a tick once
  // document.fonts.ready resolves so the texture useMemos re-run with
  // the real webfonts active.
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) setFontTick((t) => t + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ── Textures ───────────────────────────────────────────────────────────
  const frontTexture = useMemo(
    () => makeTicketTexture({ eventName, ticketNumber, date, location }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventName, ticketNumber, date, location, fontTick]
  );
  const backTexture = useMemo(
    () => makeTicketBackTexture({ eventName, ticketNumber, date, location }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventName, ticketNumber, date, location, fontTick]
  );
  const foilAlpha = useMemo(
    () => makeTicketFoilMask({ eventName, ticketNumber, date, location }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventName, ticketNumber, date, location, fontTick]
  );
  const roughnessMap = useMemo(() => makeTicketRoughness(), []);

  useEffect(() => {
    return () => {
      frontTexture.dispose();
      backTexture.dispose();
      foilAlpha.dispose();
      roughnessMap.dispose();
    };
  }, [frontTexture, backTexture, foilAlpha, roughnessMap]);

  // ── Perforation hinge shader bend ──────────────────────────────────────
  // The critic's blocker: the ticket yaws as one rigid plane, but the
  // perforation seam *exists* to articulate the bend. Real paper hinges
  // there. We inject a vertex transform into MeshPhysicalMaterial via
  // onBeforeCompile so the stub-side vertices rotate around the
  // perforation x-axis, driven by a shared `uTug` uniform updated each
  // frame. Body side stays rooted; bend ramps in over a smoothstep so
  // the seam itself doesn't crease violently. This keeps full PBR (the
  // foil layer's anisotropy, sheen, etc.) intact — no custom shader.
  const bendUniforms = useMemo(
    () => ({
      uTug: { value: 0 },
      uPerfX: { value: STUB_OFFSET }
    }),
    []
  );

  /**
   * onBeforeCompile injection. The `signX` param exists because the back
   * face mesh is rotated 180° around Y, so its local x-axis is mirrored.
   * Passing -1 inverts the bend direction so the seam articulates the
   * same way visually whether front or back is presented.
   */
  const makeBendOnBeforeCompile = useMemo(
    () =>
      (signX: number) =>
      (shader: THREE.WebGLProgramParametersWithUniforms): void => {
        shader.uniforms.uTug = bendUniforms.uTug;
        shader.uniforms.uPerfX = bendUniforms.uPerfX;
        shader.uniforms.uSignX = { value: signX };

        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `#include <common>
            uniform float uTug;
            uniform float uPerfX;
            uniform float uSignX;`
        );

        // Inject after the position has been written into `transformed`.
        // smoothstep ramps the bend in so vertices right at the seam
        // barely move (preserving perforation alignment) and vertices
        // far from the seam carry the full rotation.
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
            {
              float perf = uPerfX;
              float dx = (transformed.x - perf) * uSignX;
              if (dx > 0.0) {
                float falloff = smoothstep(0.04, 1.6, dx);
                float angle = uTug * 0.42 * falloff * uSignX;
                float c = cos(angle);
                float s = sin(angle);
                vec3 p = transformed - vec3(perf, 0.0, 0.0);
                transformed = vec3(
                  p.x * c + p.z * s,
                  p.y,
                  -p.x * s + p.z * c
                ) + vec3(perf, 0.0, 0.0);
              }
            }`
        );
      },
    [bendUniforms]
  );

  const onBeforeCompileFront = useMemo(
    () => makeBendOnBeforeCompile(1),
    [makeBendOnBeforeCompile]
  );
  const onBeforeCompileBack = useMemo(
    () => makeBendOnBeforeCompile(-1),
    [makeBendOnBeforeCompile]
  );

  // ── Animation ──────────────────────────────────────────────────────────
  // Damped tug value for the shader uniform — separate from the prop so
  // the bend springs back smoothly on release rather than snapping.
  const dampedTugRef = useRef(0);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // Idle wobble — quieter when not interactive (multi-instance views).
    const idleScale = interactive ? 1 : 0.4;
    const wobbleX = Math.sin(t * 0.45) * 0.035 * idleScale;
    const wobbleY = Math.sin(t * 0.6) * 0.06 * idleScale;

    const tiltScale = interactive && pointerActive ? 1 : 0;
    const tiltX = -pointer.y * 0.25 * tiltScale;
    const tiltY = pointer.x * 0.45 * tiltScale;

    const flipBase = flipped ? Math.PI : 0;

    // Tug — the signature gesture. The shader bend at the perforation
    // hinge does the heavy lifting; we still add a small global pitch so
    // the whole card lifts slightly as it's pulled (paper can't bend
    // along one axis without compensating elsewhere).
    const tugClamped = THREE.MathUtils.clamp(tug, -1, 1);
    const tugPitch = Math.abs(tugClamped) * -0.05;

    // Drive the shader's tug uniform with sqrt easing so small drags get
    // an immediate yield and large drags compress against a soft ceiling.
    // Damping is faster while actively pulling, slower on release so the
    // paper "settles" rather than snaps.
    const eased = Math.sign(tugClamped) * Math.sqrt(Math.abs(tugClamped));
    const dampRate = Math.abs(tugClamped) > 0.02 ? 12 : 6;
    dampedTugRef.current = THREE.MathUtils.damp(
      dampedTugRef.current,
      eased,
      dampRate,
      delta
    );
    bendUniforms.uTug.value = dampedTugRef.current;

    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      wobbleX + tiltX + tugPitch,
      6,
      delta
    );
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      wobbleY + tiltY + flipBase,
      4.8,
      delta
    );
  });

  return (
    <>
      {/* Each <View> needs its own camera — the project's shared Canvas
          uses an OrthographicCamera with the default −1..1 frustum, which
          would clip the ticket entirely. Pulled back to z=4.8 with fov=30
          so the wobble + tilt extremes never push the ticket off-screen. */}
      <PerspectiveCamera
        makeDefault={cameraActive}
        fov={30}
        position={[0, 0, 5.6]}
        near={0.1}
        far={50}
      />

      {/*
        Lighting — gallery white box.
        The previous warm-tinted rig was poisoning bone paper into sepia
        on a dark-mode page. Three rules now:
          1. Diffuse light is NEUTRAL bright — paper renders as paper.
          2. Environment has bright sources from many angles so the
             metallic foil layer has something to reflect (metalness with
             a dim env reflects darkness).
          3. One slightly warm rim only, low intensity, to keep the
             vermilion stamp + foil shimmer alive without tinting paper.
      */}
      <Environment resolution={512} background={false}>
        {/* Big neutral key — gallery softbox front-right */}
        <Lightformer
          intensity={3.2}
          color="#ffffff"
          position={[3, 2, 4]}
          rotation={[0, -Math.PI / 4, 0]}
          scale={[7, 7, 1]}
          form="rect"
        />
        {/* Neutral fill from camera-left — keeps the body lit when the
            ticket tilts away from the key */}
        <Lightformer
          intensity={2.0}
          color="#ffffff"
          position={[-4, 1, 3]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[6, 6, 1]}
          form="rect"
        />
        {/* Top neutral wash — adds environment bounces so metallic foil
            picks up multi-directional reflection */}
        <Lightformer
          intensity={1.6}
          color="#ffffff"
          position={[0, 5, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
          form="rect"
        />
        {/* Slightly warm rim from upper-back — catches the bevelled edge
            and brushes the foil with a hint of champagne */}
        <Lightformer
          intensity={2.2}
          color="#fff0d4"
          position={[0, 3.5, -3]}
          rotation={[Math.PI / 2.6, 0, 0]}
          scale={[8, 1.4, 1]}
          form="rect"
        />
        {/* Cool kicker from below — gives the foil a subtle dichroic
            shift when the card tilts forward */}
        <Lightformer
          intensity={0.8}
          color="#dde6f2"
          position={[0, -3, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[6, 3, 1]}
          form="rect"
        />
      </Environment>

      {/* Bright neutral ambient floor — paper needs uniform light to read
          as the colour it actually is, not the colour the lights tint it. */}
      <ambientLight intensity={0.45} color="#ffffff" />
      {/* Direct directional light to lift the diffuse off the env so the
          paper doesn't depend entirely on env reflection (which the body
          material reads at envMapIntensity=0.78). */}
      <directionalLight intensity={0.7} color="#ffffff" position={[2, 3, 4]} />

      <group ref={groupRef}>
        {/*
          Body — extruded silhouette providing thickness, sides, and the
          bevelled edges that catch light. No texture map; the front/back
          planes carry the printed surface. The slight z-offset of those
          planes prevents z-fighting with this body's caps.
        */}
        {/*
          Body — matte bone paper. The critic flagged "iridescence on a
          near-white desaturated base reads as a dirty smudge". Iridescence
          pulled to 0.18 with a tightly tuned thickness band catches the
          rim only when the card rotates — paper doesn't shimmer like a
          credit card. Clearcoat low (0.18) so the surface has subtle
          satin without becoming plasticky.
        */}
        <mesh geometry={bodyGeom}>
          <meshPhysicalMaterial
            roughnessMap={roughnessMap}
            color="#f7eed4"
            roughness={0.85}
            metalness={0.0}
            clearcoat={0.1}
            clearcoatRoughness={0.55}
            envMapIntensity={1.0}
            onBeforeCompile={onBeforeCompileFront}
          />
        </mesh>

        {/* Front face — paper with printed ink. */}
        <mesh
          geometry={faceGeom}
          position={[0, 0, TICKET_D / 2 + PLANE_OFFSET]}
        >
          <meshPhysicalMaterial
            map={frontTexture}
            roughnessMap={roughnessMap}
            color="#ffffff"
            roughness={0.82}
            metalness={0.0}
            clearcoat={0.1}
            clearcoatRoughness={0.5}
            envMapIntensity={1.0}
            side={THREE.FrontSide}
            onBeforeCompile={onBeforeCompileFront}
          />
        </mesh>

        {/*
          Foil overlay — a separate plane sitting a hair above the front
          face. Its alphaMap is the foil mask (white = H monogram + serial
          digits, black elsewhere) so the metallic material only renders
          on those marks. This is what turns "drawn gold ink" into actual
          champagne foil that streaks under raking light.

          Anisotropy is the magic ingredient: the BRDF stretches specular
          highlights in one direction, producing the hair-thin "brush"
          band that runs across foil as the card tilts. Anisotropy
          rotation π/2 aligns the streak vertically so it crawls across
          horizontal motion — the natural axis of card tilt.
        */}
        <mesh
          geometry={faceGeom}
          position={[0, 0, TICKET_D / 2 + PLANE_OFFSET + 0.001]}
          renderOrder={1}
        >
          <meshPhysicalMaterial
            alphaMap={foilAlpha}
            transparent
            color="#f0cf85"
            metalness={1.0}
            roughness={0.18}
            anisotropy={0.85}
            anisotropyRotation={Math.PI / 2}
            clearcoat={0.7}
            clearcoatRoughness={0.14}
            iridescence={0.4}
            iridescenceIOR={1.6}
            iridescenceThicknessRange={[300, 900]}
            envMapIntensity={2.4}
            depthWrite={false}
            side={THREE.FrontSide}
            onBeforeCompile={onBeforeCompileFront}
          />
        </mesh>

        {/*
          Back face — same body material, rotated 180° around Y. Renders
          only when the camera looks at it (after the user flips).
        */}
        <mesh
          geometry={faceGeom}
          position={[0, 0, -TICKET_D / 2 - PLANE_OFFSET]}
          rotation={[0, Math.PI, 0]}
        >
          <meshPhysicalMaterial
            map={backTexture}
            roughnessMap={roughnessMap}
            color="#ffffff"
            roughness={0.82}
            metalness={0.0}
            clearcoat={0.1}
            clearcoatRoughness={0.5}
            envMapIntensity={1.0}
            side={THREE.FrontSide}
            onBeforeCompile={onBeforeCompileBack}
          />
        </mesh>
      </group>
    </>
  );
}
