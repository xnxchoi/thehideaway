import { animated, useSpring } from "@react-spring/three";
import { RoundedBox } from "@react-three/drei";
import { forwardRef } from "react";
import { Color, type Mesh } from "three";

type Sleeve3DProps = {
  /** Width and height of the sleeve in world units. Should match the paper plane. */
  width: number;
  height: number;
  /** Phase from the parent state machine. Determines target position. */
  revealed: boolean;
};

const LEATHER = new Color("#4a1010");

/**
 * The leather sleeve as a real 3D mesh. Casts shadow onto the paper plane via
 * the scene's directional light. Animation uses spring physics for a
 * gravity-like fall instead of CSS easing.
 */
export const Sleeve3D = forwardRef<Mesh, Sleeve3DProps>(function Sleeve3D(
  { width, height, revealed },
  ref
) {
  // Sleeve at y=0 covers the paper. When revealed, it descends past the bottom
  // edge (-height for a clean exit). Heavy mass + low tension reads as gravity.
  const { y } = useSpring({
    y: revealed ? -height * 1.05 : 0,
    config: { mass: 3.2, tension: 55, friction: 28 },
    delay: revealed ? 350 : 0
  });

  return (
    <animated.group position-y={y}>
      {/* The sleeve body — slightly thicker than a sheet, with rounded edges
          so the silhouette reads as leather, not a UI rectangle. */}
      <RoundedBox
        ref={ref}
        args={[width, height, 0.06]}
        radius={0.018}
        smoothness={4}
        position={[0, 0, 0.04]}
        castShadow
      >
        <meshPhysicalMaterial
          color={LEATHER}
          roughness={0.55}
          metalness={0.05}
          clearcoat={0.35}
          clearcoatRoughness={0.6}
          reflectivity={0.2}
        />
      </RoundedBox>

      {/* Faint warm rim along the top edge — catches the key light, suggests a
          lifted cover edge rather than a flat slab. */}
      <mesh position={[0, height / 2 - 0.012, 0.072]} castShadow={false}>
        <planeGeometry args={[width * 0.985, 0.018]} />
        <meshBasicMaterial color="#a85040" transparent opacity={0.6} />
      </mesh>
    </animated.group>
  );
});
