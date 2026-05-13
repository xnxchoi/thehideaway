"use client";

import {
  ContactShadows,
  Environment,
  PerspectiveCamera,
  View
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ComponentProps, Suspense, useRef } from "react";
import { type DirectionalLight, MathUtils, type Mesh, Vector3 } from "three";
import { PaperPlane } from "./PaperPlane";
import { Sleeve3D } from "./Sleeve3D";
import type { InvoiceDisplay } from "../types";

const PAPER_WIDTH = 2.0;
const PAPER_HEIGHT = PAPER_WIDTH * 1.55;

// Camera distance per phase. Constrained so the paper (3.1 world units tall)
// always fits the camera frustum at fov=36° — that requires z >= ~4.77.
//   - presenting: z=5, paper sits comfortably with breathing room
//   - focused:    z=4.6, slight push-in for drama; pair with a larger
//                 viewport so paper appears much bigger on screen.
const CAM_PRESENTING = new Vector3(0, 0, 5);
const CAM_FOCUSED = new Vector3(0, -0.04, 4.6);

type Phase = "sealed" | "revealing" | "presenting" | "focused";

type InvoiceSceneProps = {
  invoice: InvoiceDisplay;
  phase: Phase;
  containerProps?: ComponentProps<"div">;
};

/**
 * Pure 3D scene — every visible piece is real geometry.
 *   - PaperPlane: cream cotton mesh, receives the sleeve's cast shadow
 *   - PaperContent3D: each text element is a Drei <Text> SDF mesh sitting
 *     just in front of the paper surface; lit by the scene's lights, occluded
 *     by the sleeve mesh via the depth buffer
 *   - Sleeve3D: leather mesh that descends with spring physics
 *   - CameraRig: lerps between presenting (back) and focused (close-up)
 *   - CursorLight: directional light steered by mouse position
 */
export function InvoiceScene({
  invoice,
  phase,
  containerProps
}: InvoiceSceneProps) {
  const sleeveRef = useRef<Mesh>(null);

  return (
    <View visible {...containerProps}>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 5]}
        fov={36}
        near={0.1}
        far={50}
      />
      <CameraRig phase={phase} />

      {/* Image-based lighting — gives sheen + clearcoat something to reflect */}
      <Suspense fallback={null}>
        <Environment preset="apartment" environmentIntensity={0.55} />
      </Suspense>

      <ambientLight intensity={0.18} />

      <CursorLight phase={phase} />

      {/* Subtle warm rim from the right to keep the leather from going flat */}
      <directionalLight position={[3, 1, 2]} intensity={0.2} color="#f4d8b8" />

      {/* Paper grounding shadow */}
      <ContactShadows
        position={[0, -PAPER_HEIGHT / 2 - 0.01, -0.02]}
        rotation={[Math.PI / 2, 0, 0]}
        opacity={0.35}
        scale={PAPER_WIDTH * 1.4}
        blur={2.4}
        far={0.6}
        resolution={512}
      />

      {/* Paper plane — text content is baked into its diffuse map via
          <RenderTexture>, so the paper's normal+roughness apply uniformly
          to the printed text too (ink absorbs into the fiber). */}
      <Suspense fallback={null}>
        <PaperPlane
          invoice={invoice}
          width={PAPER_WIDTH}
          height={PAPER_HEIGHT}
        />
      </Suspense>

      <Sleeve3D
        ref={sleeveRef}
        width={PAPER_WIDTH}
        height={PAPER_HEIGHT}
        revealed={phase !== "sealed"}
      />
    </View>
  );
}

/**
 * Lerps the camera between presenting (back) and focused (close-up) positions
 * on phase change.
 */
function CameraRig({ phase }: { phase: Phase }) {
  const target = useRef(new Vector3());
  useFrame((state) => {
    target.current.copy(phase === "focused" ? CAM_FOCUSED : CAM_PRESENTING);
    state.camera.position.lerp(target.current, 0.06);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * Directional light steered by mouse position. Subtle in presenting mode,
 * widened in focused mode for more drama on the close-up.
 */
function CursorLight({ phase }: { phase: Phase }) {
  const lightRef = useRef<DirectionalLight>(null);
  const baseX = -2.6;
  const baseY = 3.2;
  const baseZ = 3.5;

  useFrame((state) => {
    if (!lightRef.current) return;
    const isFocused = phase === "focused";
    const range = isFocused ? 1.6 : 0.8;
    const targetX = baseX + state.pointer.x * range;
    const targetY = baseY + state.pointer.y * range * 0.6;
    lightRef.current.position.x = MathUtils.lerp(
      lightRef.current.position.x,
      targetX,
      0.05
    );
    lightRef.current.position.y = MathUtils.lerp(
      lightRef.current.position.y,
      targetY,
      0.05
    );
    lightRef.current.position.z = baseZ;
    lightRef.current.target.position.set(0, 0, 0);
    lightRef.current.target.updateMatrixWorld();
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[baseX, baseY, baseZ]}
      intensity={1.1}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-near={0.5}
      shadow-camera-far={12}
      shadow-camera-left={-3}
      shadow-camera-right={3}
      shadow-camera-top={3}
      shadow-camera-bottom={-3}
      shadow-bias={-0.0005}
    />
  );
}
