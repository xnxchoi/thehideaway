"use client";

import { Canvas } from "@react-three/fiber";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { cn } from "@/lib/utils";
import { TicketMesh } from "./TicketMesh";
import type { TicketTextureInput } from "./makeTicketTexture";

export interface TicketSpotlightStageProps extends TicketTextureInput {
  flipped: boolean;
  onFlip: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * The spotlight uses its own dedicated <Canvas> rather than rendering
 * into the project's shared canvas via drei's <View>.
 *
 * Why: the spotlight overlay sits in front of the shared canvas with a
 * backdrop-blur on it. Anything rendered into the shared canvas (i.e. the
 * page-level Ticket3D, AND a spotlight Ticket3D-via-View) gets blurred
 * along with the page. Giving the spotlight its own Canvas at z-index
 * above the backdrop fixes that.
 *
 * The interaction model here is the same as Ticket3D: hover-tilt on
 * hover-capable inputs, tap-to-flip everywhere.
 */
export function TicketSpotlightStage({
  className,
  style,
  flipped,
  onFlip,
  ...textureInput
}: TicketSpotlightStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [pointerActive, setPointerActive] = useState(false);
  const [tug, setTug] = useState(0);
  const dragStateRef = useRef<{
    startX: number;
    halfW: number;
    moved: boolean;
  } | null>(null);

  // Hover tilt — mouse-only.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setPointer({ x, y });
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setPointerActive(true);
    };
    const onLeave = () => {
      setPointerActive(false);
      setPointer({ x: 0, y: 0 });
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Tug — same gesture as Ticket3D. Pointer-down captures the start;
  // horizontal drag normalises against half-width into [-1, 1]; release
  // without drag = flip; release with drag springs the tug back to 0.
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      dragStateRef.current = {
        startX: e.clientX,
        halfW: rect.width / 2,
        moved: false
      };
      el.setPointerCapture?.(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      if (Math.abs(dx) > 6) ds.moved = true;
      setTug(Math.max(-1, Math.min(1, dx / ds.halfW)));
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const ds = dragStateRef.current;
      dragStateRef.current = null;
      const el = containerRef.current;
      el?.releasePointerCapture?.(e.pointerId);
      setTug(0);
      if (ds && !ds.moved) onFlip();
    },
    [onFlip]
  );

  const handlePointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      dragStateRef.current = null;
      const el = containerRef.current;
      el?.releasePointerCapture?.(e.pointerId);
      setTug(0);
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-[2/1] w-full select-none", className)}
      style={{
        touchAction: "manipulation",
        cursor: "pointer",
        filter:
          "drop-shadow(-18px 56px 72px rgba(14, 10, 6, 0.42)) drop-shadow(0 3px 5px rgba(14, 10, 6, 0.46))",
        ...style
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
    >
      <Canvas
        className="absolute inset-0"
        gl={{
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <TicketMesh
            {...textureInput}
            pointer={pointer}
            pointerActive={pointerActive}
            interactive
            flipped={flipped}
            cameraActive
            tug={tug}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
