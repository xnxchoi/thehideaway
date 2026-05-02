"use client";

import {
  ContactShadows,
  Environment,
  Lightformer,
  PerspectiveCamera,
  RoundedBox
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  makeTicketTexture,
  type TicketTextureInput
} from "./makeTicketTexture";

export interface TicketMeshProps extends TicketTextureInput {
  /**
   * Pointer position normalised to [-1, 1] within the host element.
   * Drives the hover-tilt when the user is not actively dragging.
   */
  pointer: { x: number; y: number };
  /** True while the pointer is over the host element. */
  pointerActive: boolean;
  /** User-driven rotation (set during a pointer drag). */
  dragRotation: { rx: number; ry: number };
  /** True while a drag is in progress — pauses the idle/hover behaviour. */
  dragging: boolean;
  /** Toggle `makeDefault` on the camera — true only while this View is in
   *  the viewport, so multiple Ticket3D instances don't fight for the
   *  default camera. */
  cameraActive: boolean;
}

const TICKET_W = 4.0;
const TICKET_H = 2.3;
const TICKET_D = 0.06;

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
      // User in control — follow their rotation directly.
      targetRx = THREE.MathUtils.clamp(dragRotation.rx, -Math.PI, Math.PI);
      targetRy = dragRotation.ry;
    } else {
      // Idle wobble keeps the holographic shift alive even when nobody is
      // hovering. Pointer tilt layers on top when the cursor is over.
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
          clip the ticket entirely. makeDefault flips on only while in
          viewport so multiple Ticket3D instances don't fight. */}
      <PerspectiveCamera
        makeDefault={cameraActive}
        fov={35}
        position={[0, 0, 4.2]}
        near={0.1}
        far={50}
      />

      {/* Image-based lighting via Lightformers. This is what makes the
          iridescent + clearcoat layers actually paint colour onto the card —
          a single directional light won't do it. Background stays
          transparent so it composites with the page. */}
      <Environment resolution={512} background={false}>
        {/* Top key — broad, neutral white. */}
        <Lightformer
          intensity={3.2}
          color="#ffffff"
          position={[0, 5, -6]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
        {/* Side rim — cool magenta-violet, paints one edge of the holo. */}
        <Lightformer
          intensity={2.4}
          color="#c8a8ff"
          position={[-5, 1, 1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[12, 1, 1]}
        />
        {/* Side rim — cool cyan, paints the opposite edge. */}
        <Lightformer
          intensity={2.4}
          color="#a8e8ff"
          position={[5, -1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[12, 1, 1]}
        />
        {/* Soft fill from below — warm peach, hint of warmth without yellowing. */}
        <Lightformer
          intensity={1.4}
          color="#ffd0c0"
          position={[0, -5, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[8, 8, 1]}
        />
      </Environment>

      {/* Tiny ambient kick so the back of the card doesn't fall to black
          when the user drags it past 90°. */}
      <ambientLight intensity={0.2} />

      <group ref={groupRef}>
        <RoundedBox
          args={[TICKET_W, TICKET_H, TICKET_D]}
          radius={0.07}
          smoothness={6}
          creaseAngle={0.4}
          castShadow
        >
          <meshPhysicalMaterial
            map={texture}
            color="#ffffff"
            roughness={0.22}
            metalness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.04}
            iridescence={1}
            iridescenceIOR={1.45}
            iridescenceThicknessRange={[200, 1400]}
            envMapIntensity={1.4}
          />
        </RoundedBox>

        {/* Soft shadow under the card — grounds it on the page. */}
        <ContactShadows
          position={[0, -TICKET_H / 2 - 0.05, 0]}
          opacity={0.35}
          scale={6}
          blur={2.4}
          far={2}
          resolution={512}
        />
      </group>
    </>
  );
}
