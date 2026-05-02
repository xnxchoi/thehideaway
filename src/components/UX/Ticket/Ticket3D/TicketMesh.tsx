"use client";

import { PerspectiveCamera, RoundedBox } from "@react-three/drei";
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

const TICKET_W = 3.6;
const TICKET_H = 2.0;
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

  // Free the texture when the component unmounts or the inputs change.
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
      // User is in control — follow their rotation directly.
      targetRx = THREE.MathUtils.clamp(dragRotation.rx, -Math.PI, Math.PI);
      targetRy = dragRotation.ry;
    } else {
      // Idle wobble keeps the holographic shift alive even when nobody is
      // hovering. Pointer tilt layers on top when the cursor is over.
      const wobbleX = Math.sin(t * 0.45) * 0.03;
      const wobbleY = Math.sin(t * 0.6) * 0.05;
      const intensity = pointerActive ? 1 : 0.25;
      targetRx = wobbleX + -pointer.y * 0.28 * intensity;
      targetRy = wobbleY + pointer.x * 0.45 * intensity;
    }

    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRx, 6, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRy, 6, delta);
  });

  return (
    <>
      {/* This View needs its own camera — the project's shared Canvas uses an
          OrthographicCamera with the default −1..1 frustum, which would clip
          the ticket. makeDefault flips on only while in viewport. */}
      <PerspectiveCamera
        makeDefault={cameraActive}
        fov={32}
        position={[0, 0, 6]}
        near={0.1}
        far={50}
      />

      {/* Lights are scoped to this <View>'s scene (drei's View system gives
          each view its own scene graph). They won't affect other 3D content. */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3.5, 4, 5]}
        intensity={1.4}
        color="#fff7e6"
      />
      <pointLight position={[-3, -1.5, 3]} intensity={0.55} color="#c8d8ff" />
      <pointLight position={[2.5, -2, 2.5]} intensity={0.4} color="#ffd0d8" />

      <group ref={groupRef}>
        <RoundedBox
          args={[TICKET_W, TICKET_H, TICKET_D]}
          radius={0.08}
          smoothness={6}
          creaseAngle={0.4}
          castShadow
        >
          <meshPhysicalMaterial
            map={texture}
            color="#f5ecdb"
            roughness={0.32}
            metalness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.08}
            iridescence={1}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[200, 1200]}
            sheen={0.6}
            sheenColor="#ffd9b8"
            sheenRoughness={0.25}
          />
        </RoundedBox>
      </group>
    </>
  );
}
