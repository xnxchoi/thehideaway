import { cn } from "@/lib/utils";
import { useCoordinator } from "@/providers/CoordinatorCtx";
import { clamp } from "@/utilities/mathUtilities";
import type { LexicalEditor } from "@payloadcms/richtext-lexical/lexical";
import { HTMLMotionProps, useMotionValue } from "motion/react";
import * as m from "motion/react-m";
import type { RefObject } from "react";
import { useCallback, useMemo, useState } from "react";
import { useRPImageNode } from "./index";

export const ImageResizer = ({
  isFocused,
  hovered,
  editor,
  onResizeEnd,
  onResizeStart,
  imageRef,
  motionWidth
}: {
  editor: LexicalEditor;
  isFocused: boolean;
  hovered: boolean;
  imageRef: RefObject<HTMLImageElement>;
  motionWidth: ReturnType<typeof useMotionValue<number>>;
  onResizeStart?: (e: PointerEvent) => void;
  onResizeEnd?: (e: PointerEvent) => void;
}) => {
  const unsetCursor = useCoordinator((r) => r.unsetFn);
  const reinitializeCursor = useCoordinator((r) => r.setFn);
  const xVal = useCoordinator((r) => r.x),
    yVal = useCoordinator((r) => r.y);

  const [isDragging, setIsDragging] = useState(false);
  const maxWidth = useMemo(
    () => imageRef.current?.naturalWidth || 700,
    [imageRef]
  );
  const handlePointerDown = useCallback(
    (side: "left" | "right") => (e: React.PointerEvent<HTMLDivElement>) => {
      // 1. STOP PROPAGATION: Prevents Lexical from stealing focus
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget;
      // 2. POINTER CAPTURE: Even if mouse moves outside the div, we keep receiving events
      target.setPointerCapture(e.pointerId);
      unsetCursor();
      const startX = e.clientX;
      const startWidth = motionWidth.get();

      setIsDragging(true);
      onResizeStart?.(e.nativeEvent);

      const onPointerMove = (moveEvent: PointerEvent) => {
        // Calculate delta based on side
        const currentX = moveEvent.clientX;
        const deltaX = currentX - startX;
        xVal.set(currentX);
        yVal.set(moveEvent.clientY);
        // If dragging right handle: moving right adds width
        // If dragging left handle: moving left (negative delta) adds width
        const effectiveDelta = side === "right" ? deltaX : -deltaX;

        const newWidth = startWidth + effectiveDelta;

        // Update the motion value directly
        motionWidth.set(clamp(newWidth, 144, maxWidth));
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        setIsDragging(false);
        onResizeEnd?.(upEvent);
        target.releasePointerCapture(upEvent.pointerId);
        reinitializeCursor();
        // Clean up listeners
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      // Attach listeners to window to ensure smooth drag even if cursor leaves iframe/div
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [
      unsetCursor,
      motionWidth,
      onResizeStart,
      xVal,
      yVal,
      maxWidth,
      onResizeEnd,
      reinitializeCursor
    ]
  );

  return (
    <>
      {" "}
      <RightResizeButton
        onPointerDown={handlePointerDown("right")}
        hovered={hovered}
        isFocused={isDragging || isFocused}
      />
      <LeftResizeButton
        hovered={hovered}
        onPointerDown={handlePointerDown("left")}
        isFocused={isDragging || isFocused}
      />
    </>
  );
};

const RightResizeButton = ({
  onPointerDown,
  isFocused,
  hovered,
  ...props
}: HTMLMotionProps<"div"> & {
  isFocused: boolean;
  hovered: boolean;
}) => {
  const isResizing = useRPImageNode((r) => r.isResizing);

  return (
    <m.div
      role="button"
      onPointerDown={onPointerDown}
      {...props}
      className={cn(
        "absolute top-0 right-0 z-50 flex h-full w-6 items-center justify-center",
        isFocused || hovered
          ? "pointer-events-auto"
          : "group-hover:pointer-events-none"
      )}
    >
      <div
        className={cn(
          "h-[48px] max-h-1/2 w-2.5 border-solid border-off-foreground/90 bg-[oklch(0.1684_0_0/60%)] transition-opacity duration-150 ease-in-out",
          isResizing || isFocused || hovered
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        )}
      />
    </m.div>
  );
};
const LeftResizeButton = ({
  onPointerDown,
  isFocused,
  hovered,
  ...props
}: HTMLMotionProps<"div"> & {
  isFocused: boolean;
  hovered: boolean;
}) => {
  const isResizing = useRPImageNode((r) => r.isResizing);

  return (
    <m.div
      role="button"
      onPointerDown={onPointerDown}
      {...props}
      className={cn(
        "absolute top-0 left-0 z-50 flex h-full w-6 items-center justify-center",
        isResizing || isFocused || hovered
          ? "pointer-events-auto"
          : "group-hover:pointer-events-none"
      )}
    >
      <div
        className={cn(
          "h-[48px] max-h-1/2 w-2.5 border-solid border-off-foreground/90 bg-[oklch(0.1684_0_0/60%)] transition-opacity duration-150 ease-in-out",
          isResizing || isFocused || hovered
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        )}
      />
    </m.div>
  );
};
