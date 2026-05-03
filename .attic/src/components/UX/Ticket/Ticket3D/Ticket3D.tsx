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
  /**
   * When false, the ticket is purely visual — no hover tilt, no flip,
   * just an idle wobble. Use for list/pager views where multiple flashy
   * tickets would be distracting (and on mobile, downright hostile).
   * Default true.
   */
  interactive?: boolean;
  /**
   * Optional controlled flipped state (lifted by the parent). When omitted
   * the component manages its own internal state.
   */
  flipped?: boolean;
  /**
   * Called when the user taps the ticket (only fires when interactive).
   * Use this to lift the flipped state or trigger focused mode.
   */
  onFlip?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Detect hover-capable input (i.e. a mouse). Touch-only devices return
 * false so we don't pin a hover-tilt that depends on a hover state which
 * never resolves.
 */
function useHoverCapable(): boolean {
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return canHover;
}

/**
 * The 3D ticket — a holographic, iridescent paper-card object rendered
 * into the project's shared canvas via drei's <View>.
 *
 * Interaction model:
 *   - Hover-capable devices: the cursor tilts the ticket; tapping flips it.
 *   - Touch devices: tapping flips it. No continuous tilt (touch users
 *     don't have a persistent hover state, so the tilt would feel broken).
 *   - When `interactive=false`: neither — the ticket just idles.
 */
export function Ticket3D({
  className,
  style,
  interactive = true,
  flipped: flippedProp,
  onFlip,
  ...textureInput
}: Ticket3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.1 });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      inViewRef(node);
    },
    [inViewRef]
  );

  const canHover = useHoverCapable();
  const hoverTiltActive = interactive && canHover;

  // Internal flip state used when the parent doesn't provide one.
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = flippedProp ?? internalFlipped;

  // ── Pointer move (hover tilt) — only on hover-capable inputs ────────────
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [pointerActive, setPointerActive] = useState(false);

  useEffect(() => {
    if (!hoverTiltActive) {
      setPointer({ x: 0, y: 0 });
      setPointerActive(false);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      // Ignore touch/pen — pointer-tilt is mouse-only.
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
  }, [hoverTiltActive]);

  // ── Tug — signature gesture ─────────────────────────────────────────────
  // Pointer-down → start tracking horizontal drag from the start point.
  // Drag delta is normalised against half the container width and clamped
  // to [-1, 1] for the mesh. On pointer-up the tug springs back to 0,
  // and if drag was minimal we treat it as a tap-to-flip.
  const [tug, setTug] = useState(0);
  const dragStateRef = useRef<{
    startX: number;
    halfW: number;
    moved: boolean;
    /** Latest tug magnitude — crossed-threshold tracker for haptics. */
    lastTug: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const el = containerRef.current;
      if (!el) return;
      // Avoid stealing scroll on touch — if the user starts a vertical
      // gesture, browser scroll wins.
      const rect = el.getBoundingClientRect();
      dragStateRef.current = {
        startX: e.clientX,
        halfW: rect.width / 2,
        moved: false,
        lastTug: 0
      };
      el.setPointerCapture?.(e.pointerId);
    },
    [interactive]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      if (Math.abs(dx) > 6) ds.moved = true;
      // Normalise — full half-width drag = tug 1.0. The mesh applies its
      // own square-root easing on top so small drags still register.
      const next = Math.max(-1, Math.min(1, dx / ds.halfW));
      // Haptic feedback on threshold crossings — the paper "gives" at
      // 60% pull (would-be tear point). Only fires once per crossing
      // direction. navigator.vibrate is a no-op on desktop and on iOS,
      // and silent on permission-denied — safe to call unconditionally.
      const wasBeyond = Math.abs(ds.lastTug) >= 0.6;
      const isBeyond = Math.abs(next) >= 0.6;
      if (
        !wasBeyond &&
        isBeyond &&
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function"
      ) {
        navigator.vibrate(10);
      }
      ds.lastTug = next;
      setTug(next);
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
      // No drag → it was a tap. Trigger flip.
      if (interactive && ds && !ds.moved) {
        if (onFlip) onFlip();
        else setInternalFlipped((f) => !f);
      }
    },
    [interactive, onFlip]
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
      ref={setRefs}
      className={cn("relative aspect-[2/1] w-full select-none", className)}
      style={{
        touchAction: "manipulation",
        cursor: interactive ? "pointer" : "default",
        // CSS drop-shadow follows the View's rendered alpha. The warm key
        // light in TicketMesh sits at +3.5,+2.5 (front-right), so the cast
        // shadow biases left and down. Two terms only:
        //   - Soft cast — neutral (warm-tinted shadows look Photoshop-y),
        //     biased to negative-x for the directional key.
        //   - Tight contact — close, dark, no offset, sells paper-on-
        //     surface without the Dribbble floating-card look.
        filter:
          "drop-shadow(-12px 38px 48px rgba(14, 10, 6, 0.28)) drop-shadow(0 2px 3px rgba(14, 10, 6, 0.34))",
        ...style
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      // a11y: a flippable ticket is effectively a button.
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onFlip) onFlip();
          else setInternalFlipped((f) => !f);
        }
      }}
    >
      <View className="absolute inset-0">
        <Suspense fallback={null}>
          <TicketMesh
            {...textureInput}
            pointer={pointer}
            pointerActive={pointerActive && hoverTiltActive}
            interactive={interactive}
            flipped={flipped}
            cameraActive={inView}
            tug={interactive ? tug : 0}
          />
        </Suspense>
      </View>
    </div>
  );
}
