"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { type ComponentProps, useRef } from "react";
import { type Mesh } from "three";
import { PaperContent3D } from "./PaperContent3D";
import { PaperPlane } from "./PaperPlane";
import { Sleeve3D } from "./Sleeve3D";
import type { InvoiceDisplay } from "../types";

// Paper aspect 1:1.55 — picked these world dimensions so the paper roughly
// fills the camera frustum at the chosen FOV / distance.
const PAPER_WIDTH = 2.0;
const PAPER_HEIGHT = PAPER_WIDTH * 1.55;

type InvoiceSceneProps = {
  invoice: InvoiceDisplay;
  /** True once the sleeve should descend off the paper. */
  revealed: boolean;
  /** Standard div props for the View container (positioning, sizing). */
  containerProps?: ComponentProps<"div">;
};

/**
 * R3F scene rendered into the shared <View.Port />. Everything is real 3D
 * geometry:
 *   - PaperPlane: cream mesh that receives the sleeve's cast shadow
 *   - PaperContent3D: text rendered via @react-three/uikit (SDF text)
 *   - Sleeve3D: leather mesh, casts shadow, animates on the spring
 *
 * Because the text is real geometry (not Drei <Html>), the sleeve mesh in
 * front of it is occluded automatically by the depth buffer — no manual
 * opacity gating, no DOM stacking conflicts.
 */
export function InvoiceScene({
  invoice,
  revealed,
  containerProps
}: InvoiceSceneProps) {
  const sleeveRef = useRef<Mesh>(null);

  return (
    <View visible {...containerProps}>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 1]}
        fov={36}
        near={0.1}
        far={1}
      />

      {/* Soft fill so the leather doesn't go pure-black in shadow */}
      <ambientLight intensity={0.45} />

      {/* Key light from upper-left, slightly forward. Casts the sleeve's
          shadow onto the paper plane below it. */}
      <directionalLight
        position={[-2.6, 3.2, 3.5]}
        intensity={1.4}
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

      {/* Subtle warm rim from the right to keep the leather from going flat */}
      <directionalLight position={[3, 1, 2]} intensity={0.25} color="#f4d8b8" />

      <PaperPlane width={PAPER_WIDTH} invoice={invoice} height={PAPER_HEIGHT} />

      {/* Text content as real 3D geometry, just in front of the paper plane.
          The sleeve mesh in front of it occludes naturally via depth buffer. */}

      <Sleeve3D
        ref={sleeveRef}
        width={PAPER_WIDTH}
        height={PAPER_HEIGHT}
        revealed={revealed}
      />
    </View>
  );
}
