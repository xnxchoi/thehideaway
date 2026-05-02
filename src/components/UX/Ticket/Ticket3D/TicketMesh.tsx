"use client";

import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  makeTicketRoughness,
  makeTicketTexture,
  type TicketTextureInput
} from "./makeTicketTexture";

export interface TicketMeshProps extends TicketTextureInput {
  pointer: { x: number; y: number };
  pointerActive: boolean;
  /**
   * When false, all input-driven motion is suppressed and the mesh
   * just idles. Used for list/pager views.
   */
  interactive: boolean;
  /**
   * Tap-driven flip state. true → ticket rotates 180° around Y to
   * present the back face.
   */
  flipped: boolean;
  cameraActive: boolean;
}

// Geometry constants — keep STUB_OFFSET in sync with the texture's STUB_RATIO
// in makeTicketTexture.ts so the printed perforation dots line up with the
// notches cut into the silhouette.
const TICKET_W = 4.6;
const TICKET_H = 2.3;
const TICKET_D = 0.06;
const STUB_OFFSET = 0.6;
const NOTCH_R = 0.07;

/**
 * Build the ticket silhouette: a rectangle with a tear-off perforation on
 * the right side, with small inward notches at the top and bottom of that
 * perforation line. Extruded for thickness, with a tiny bevel on the edges
 * so light catches them.
 *
 * The perimeter is wound counter-clockwise (which is what THREE.Shape
 * expects for an outer contour); a CW shape inverts the face normals and
 * the front of the ticket appears as a horizontally-mirrored back face.
 */
function buildTicketGeometry(): THREE.ExtrudeGeometry {
  const w2 = TICKET_W / 2;
  const h2 = TICKET_H / 2;
  const px = STUB_OFFSET;

  const shape = new THREE.Shape();

  // Counter-clockwise: top-left → bottom-left → bottom-right → top-right → close
  shape.moveTo(-w2, h2);
  shape.lineTo(-w2, -h2); // down the left edge
  shape.lineTo(px - NOTCH_R, -h2); // along the bottom edge to the notch
  // Bottom notch — semi-circle dipping UP into the body.
  // From WEST point (180°) to EAST point (0°) via NORTH (90°) = clockwise.
  shape.absarc(px, -h2, NOTCH_R, Math.PI, 0, true);
  shape.lineTo(w2, -h2); // continue along the bottom
  shape.lineTo(w2, h2); // up the right edge
  shape.lineTo(px + NOTCH_R, h2); // along the top edge to the notch
  // Top notch — semi-circle dipping DOWN into the body.
  // From EAST point (0°) to WEST point (180°) via SOUTH (270°) = clockwise.
  shape.absarc(px, h2, NOTCH_R, 0, Math.PI, true);
  shape.lineTo(-w2, h2); // close along the top edge

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: TICKET_D,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.012,
    bevelThickness: 0.008,
    curveSegments: 16
  });

  // Extrude pushes along +Z; centre on the origin instead.
  geom.translate(0, 0, -TICKET_D / 2);

  // Remap UVs so the texture maps [0, 1] across the front face's bounding
  // box. v is NOT inverted — for a CanvasTexture (default flipY=true),
  // sampling at v=1 returns canvas y=0 (top), which is exactly what we want
  // for vertices at the geometry's top edge.
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
  geom.computeVertexNormals();

  return geom;
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
  cameraActive
}: TicketMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => buildTicketGeometry(), []);
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const texture = useMemo(
    () => makeTicketTexture({ eventName, ticketNumber, date, location }),
    [eventName, ticketNumber, date, location]
  );
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  // Roughness map varies the surface finish across the ticket so the
  // iridescence doesn't read as one uniform sheen. Stub area + borders are
  // smoother (more holo); printed body is matter (cleaner readability).
  const roughnessMap = useMemo(() => makeTicketRoughness(), []);
  useEffect(() => {
    return () => {
      roughnessMap.dispose();
    };
  }, [roughnessMap]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // Idle wobble — always present but quieter when non-interactive so
    // multi-instance views don't draw the eye.
    const idleScale = interactive ? 1 : 0.4;
    const wobbleX = Math.sin(t * 0.45) * 0.04 * idleScale;
    const wobbleY = Math.sin(t * 0.6) * 0.07 * idleScale;

    // Hover tilt layered on top, only when interactive AND the cursor is
    // currently over a hover-capable container.
    const tiltScale = interactive && pointerActive ? 1 : 0;
    const tiltX = -pointer.y * 0.3 * tiltScale;
    const tiltY = pointer.x * 0.55 * tiltScale;

    // Flip — single tap rotates the ticket 180° around Y. Stacks on top
    // of the wobble + tilt so the card still breathes after flipping.
    const flipBase = flipped ? Math.PI : 0;

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, wobbleX + tiltX, 6, delta);
    // Slightly slower damp on Y so the flip animation reads as deliberate.
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      wobbleY + tiltY + flipBase,
      4.8,
      delta
    );
  });

  return (
    <>
      {/* Each <View> needs its own camera — the project's shared Canvas uses
          an OrthographicCamera with the default −1..1 frustum, which would
          clip the ticket entirely. Tightened to z=4.0 so the card fills
          ~94% of the View. */}
      <PerspectiveCamera
        makeDefault={cameraActive}
        fov={32}
        position={[0, 0, 4.0]}
        near={0.1}
        far={50}
      />

      {/* Image-based lighting via Lightformers — drives the iridescent
          shimmer along the edges without overpowering the printed surface. */}
      <Environment resolution={512} background={false}>
        <Lightformer
          intensity={2.6}
          color="#ffffff"
          position={[0, 5, -6]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={1.8}
          color="#b8a8ff"
          position={[-5, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[12, 1, 1]}
        />
        <Lightformer
          intensity={1.8}
          color="#a0e0ff"
          position={[5, -1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[12, 1, 1]}
        />
        <Lightformer
          intensity={1.0}
          color="#ffe0d8"
          position={[0, -5, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
      </Environment>

      <ambientLight intensity={0.32} />

      <group ref={groupRef}>
        <mesh geometry={geometry}>
          {/*
            Material balance:
            - meshPhysicalMaterial with the iridescent + clearcoat layers
              for the holo card feel.
            - roughnessMap modulates the sheen across the surface so the
              effect is selective (bright on borders/stub, calmer on the
              printed body) rather than a uniform plastic shine.
            - clearcoat dialled to 0.55 / clearcoatRoughness 0.32 so the
              typography reads head-on; iridescence still kicks in at
              oblique angles.
          */}
          <meshPhysicalMaterial
            map={texture}
            roughnessMap={roughnessMap}
            color="#ffffff"
            roughness={0.55}
            metalness={0.05}
            clearcoat={0.55}
            clearcoatRoughness={0.32}
            iridescence={0.85}
            iridescenceIOR={1.45}
            iridescenceThicknessRange={[200, 1400]}
            envMapIntensity={0.95}
          />
        </mesh>
      </group>
    </>
  );
}
