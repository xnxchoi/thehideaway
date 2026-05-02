"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  PerspectiveCamera
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  makeTicketTexture,
  type TicketTextureInput
} from "./makeTicketTexture";

export interface TicketMeshProps extends TicketTextureInput {
  pointer: { x: number; y: number };
  pointerActive: boolean;
  dragRotation: { rx: number; ry: number };
  dragging: boolean;
  cameraActive: boolean;
}

// Geometry constants — keep these in sync with the texture's STUB_RATIO in
// makeTicketTexture.ts so the printed perforation dots line up with the
// notches cut into the silhouette.
const TICKET_W = 4.6;
const TICKET_H = 2.3;
const TICKET_D = 0.06;
const STUB_OFFSET = 0.6; // perforation x in centred shape coords
const NOTCH_R = 0.07;

/**
 * Build the ticket silhouette: a rectangle with a tear-off perforation on
 * the right side and small inward notches at the top and bottom of that
 * perforation line. Extruded for thickness, with a tiny bevel on the edges
 * so light catches them.
 */
function buildTicketGeometry(): THREE.ExtrudeGeometry {
  const w2 = TICKET_W / 2;
  const h2 = TICKET_H / 2;
  const px = STUB_OFFSET;

  const shape = new THREE.Shape();

  // Counter-clockwise outer perimeter, starting top-left.
  shape.moveTo(-w2, h2);
  shape.lineTo(px - NOTCH_R, h2);
  // Top notch — semi-circle dipping DOWN into the ticket.
  shape.absarc(px, h2, NOTCH_R, Math.PI, 0, false);
  shape.lineTo(w2, h2);
  shape.lineTo(w2, -h2);
  shape.lineTo(px + NOTCH_R, -h2);
  // Bottom notch — semi-circle dipping UP into the ticket.
  shape.absarc(px, -h2, NOTCH_R, 0, Math.PI, false);
  shape.lineTo(-w2, -h2);
  shape.lineTo(-w2, h2);

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

  // ExtrudeGeometry's default UV generator uses world coordinates. Remap so
  // the front face's u and v span [0, 1] across the bounding box — that
  // way the canvas texture (which is also bbox-mapped) lines up with the
  // geometry, perforation dots aligning with notches.
  geom.computeBoundingBox();
  const bb = geom.boundingBox!;
  const sx = bb.max.x - bb.min.x;
  const sy = bb.max.y - bb.min.y;
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Flip v so canvas y=0 (top) maps to mesh y=h2 (top).
    uv.setXY(i, (x - bb.min.x) / sx, 1 - (y - bb.min.y) / sy);
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
  dragRotation,
  dragging,
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

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    let targetRx: number;
    let targetRy: number;

    if (dragging) {
      targetRx = THREE.MathUtils.clamp(dragRotation.rx, -Math.PI, Math.PI);
      targetRy = dragRotation.ry;
    } else {
      const wobbleX = Math.sin(t * 0.45) * 0.04;
      const wobbleY = Math.sin(t * 0.6) * 0.07;
      const intensity = pointerActive ? 1 : 0.3;
      targetRx = wobbleX + -pointer.y * 0.3 * intensity;
      targetRy = wobbleY + pointer.x * 0.55 * intensity;
    }

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRx, 6, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRy, 6, delta);
  });

  return (
    <>
      {/* Each <View> needs its own camera — the project's shared Canvas uses
          an OrthographicCamera with the default −1..1 frustum, which would
          clip the ticket entirely. */}
      <PerspectiveCamera
        makeDefault={cameraActive}
        fov={32}
        position={[0, 0, 5.4]}
        near={0.1}
        far={50}
      />

      {/* Image-based lighting via Lightformers. Drives the iridescent shimmer
          along the edges without overpowering the printed surface. */}
      <Environment resolution={512} background={false}>
        <Lightformer
          intensity={2.6}
          color="#ffffff"
          position={[0, 5, -6]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={1.6}
          color="#c8a8ff"
          position={[-5, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[12, 1, 1]}
        />
        <Lightformer
          intensity={1.6}
          color="#a8e8ff"
          position={[5, -1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[12, 1, 1]}
        />
        <Lightformer
          intensity={1.0}
          color="#ffd0c0"
          position={[0, -5, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
      </Environment>

      <ambientLight intensity={0.35} />

      <group ref={groupRef}>
        <mesh geometry={geometry} castShadow>
          {/*
            Material balance: keep the iridescent shimmer for the luxe feel,
            but turn down clearcoat / raise its roughness so the surface
            isn't a mirror — otherwise the printed typography drowns in
            specular highlights and you can't read what's on the ticket.
          */}
          <meshPhysicalMaterial
            map={texture}
            color="#ffffff"
            roughness={0.45}
            metalness={0.05}
            clearcoat={0.6}
            clearcoatRoughness={0.35}
            iridescence={0.85}
            iridescenceIOR={1.45}
            iridescenceThicknessRange={[200, 1400]}
            envMapIntensity={0.9}
          />
        </mesh>

        {/* Soft contact shadow grounds the card on the page. */}
        <ContactShadows
          position={[0, -TICKET_H / 2 - 0.05, 0]}
          opacity={0.32}
          scale={6}
          blur={2.4}
          far={2}
          resolution={512}
        />
      </group>
    </>
  );
}
