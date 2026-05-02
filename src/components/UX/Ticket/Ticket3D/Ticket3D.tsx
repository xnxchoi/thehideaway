"use client";

import { View } from "@react-three/drei";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { TicketMesh } from "./TicketMesh";
import type { TicketTextureInput } from "./makeTicketTexture";

export interface Ticket3DProps extends TicketTextureInput {
  className?: string;
  style?: CSSProperties;
}

/**
 * The 3D ticket — a holographic, iridescent paper-card object that responds
 * to hover (PC) and drag (any pointer). Rendered into the project's shared
 * canvas via drei's <View>, so it composites cleanly alongside other 3D
 * content on the page.
 *
 * Information *about* the ticket lives outside this component — see the
 * sibling info layout in the ticket pages. This component is intentionally
 * just visual presence.
 */
export function Ticket3D({ className, style, ...textureInput }: Ticket3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.1 });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      inViewRef(node);
    },
    [inViewRef]
  );

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [pointerActive, setPointerActive] = useState(false);
  const [dragRotation, setDragRotation] = useState({ rx: 0, ry: 0 });
  const [dragging, setDragging] = useState(false);

  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    baseRx: number;
    baseRy: number;
  } | null>(null);

  // ── Pointer move (hover tilt) ────────────────────────────────────────────
  const updatePointerFromEvent = useCallback((e: PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setPointer({ x, y });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => updatePointerFromEvent(e);
    const onEnter = () => setPointerActive(true);
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
  }, [updatePointerFromEvent]);

  // ── Pointer drag (free rotate) ───────────────────────────────────────────
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseRx: dragRotation.rx,
      baseRy: dragRotation.ry
    };
    setDragging(true);
  };

  const onPointerMoveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setDragRotation({
      ry: drag.baseRy + dx * 0.006,
      rx: drag.baseRx - dy * 0.006
    });
  };

  const releaseDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const el = containerRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    dragStateRef.current = null;
    setDragging(false);
  };

  return (
    <div
      ref={setRefs}
      className={cn("relative aspect-[2/1] w-full select-none", className)}
      style={{
        touchAction: "none",
        cursor: dragging ? "grabbing" : "grab",
        // CSS drop-shadow follows the rendered alpha of the View, so the
        // shadow tilts and stretches naturally with the ticket's rotation
        // — much better than a flat orthogonal contact shadow on the
        // ground plane.
        filter:
          "drop-shadow(0 28px 36px rgba(20, 14, 8, 0.18)) drop-shadow(0 8px 14px rgba(20, 14, 8, 0.10))",
        ...style
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMoveDrag}
      onPointerUp={releaseDrag}
      onPointerCancel={releaseDrag}
    >
      <View className="absolute inset-0">
        <Suspense fallback={null}>
          <TicketMesh
            {...textureInput}
            pointer={pointer}
            pointerActive={pointerActive}
            dragRotation={dragRotation}
            dragging={dragging}
            cameraActive={inView}
          />
        </Suspense>
      </View>
    </div>
  );
}
