import { cn } from "@/lib/utils";
import { useRPImageNode } from "@/payload/fields/Article/Cover/rp-image/client/component/index";
import { clamp } from "@/utilities/mathUtilities";
import { LexicalEditor } from "@payloadcms/richtext-lexical/lexical";
import { MotionNodeDragHandlers } from "motion";
import { HTMLMotionProps, MotionValue, useMotionValue } from "motion/react";
import * as m from "motion/react-m";
import { RefObject, useCallback, useMemo, useState } from "react";

export const ImageResizer = ({
  editor,
  onResizeEnd,
  onResizeStart,
  motionWidth,
  imageRef
}: {
  editor: LexicalEditor;
  imageRef: RefObject<HTMLImageElement>;
  motionWidth: MotionValue<number>;
  onResizeStart: NonNullable<MotionNodeDragHandlers>["onDragStart"];
  onResizeEnd: NonNullable<MotionNodeDragHandlers>["onDragEnd"];
}) => {
  const draggingValue = useMotionValue<boolean>(false);
  const directionValue = useMotionValue<"east" | "west">("east");
  const maxWidth = useMemo(
    () => imageRef.current?.naturalWidth || 600,
    [imageRef]
  );
  const handleDragEast: NonNullable<MotionNodeDragHandlers["onDrag"]> =
    useCallback(
      (event, info) => {
        const newWidth = motionWidth.get() + info.delta.x;
        motionWidth.set(clamp(100, newWidth, maxWidth));
      },
      [maxWidth, motionWidth]
    );
  const handleDragWest: NonNullable<MotionNodeDragHandlers["onDrag"]> =
    useCallback(
      (event, info) => {
        const newWidth = motionWidth.get() - info.delta.x;
        motionWidth.set(clamp(100, newWidth, maxWidth));
      },
      [maxWidth, motionWidth]
    );
  const dragEastStart: NonNullable<MotionNodeDragHandlers["onDragStart"]> =
    useCallback(
      (event, info) => {
        const alreadyDragging = draggingValue.get();
        const currentDirection = directionValue.get();
        const alreadyDo = alreadyDragging && currentDirection === "west";
        if (alreadyDo) {
          return;
        }
        onResizeStart?.(event, info);
      },
      [directionValue, draggingValue, onResizeStart]
    );
  const dragWestStart: NonNullable<MotionNodeDragHandlers["onDragStart"]> =
    useCallback(
      (event, info) => {
        const alreadyDragging = draggingValue.get();
        const currentDirection = directionValue.get();
        const alreadyDo = alreadyDragging && currentDirection === "east";
        if (alreadyDo) {
          return;
        }
        directionValue.set("west");
        draggingValue.set(true);
        onResizeStart?.(event, info);
      },
      [directionValue, draggingValue, onResizeStart]
    );
  return (
    <>
      {" "}
      <RightResizeButton
        onDragStart={dragEastStart}
        onDrag={handleDragEast}
        onDragEnd={onResizeEnd}
      />
      <LeftResizeButton
        onDrag={handleDragWest}
        onDragStart={dragWestStart}
        onDragEnd={onResizeEnd}
      />
    </>
  );
};

const RightResizeButton = ({
  onDragEnd: onEnd,
  onDragStart: onStart,
  dragging,
  ...props
}: HTMLMotionProps<"div"> & { dragging?: boolean }) => {
  const isResizing = useRPImageNode((r) => r.isResizing);
  const onDragStart: NonNullable<MotionNodeDragHandlers["onDragStart"]> =
    useCallback(
      (event, info) => {
        onStart?.(event, info);
      },
      [onStart]
    );
  const onDragEnd: NonNullable<MotionNodeDragHandlers["onDragEnd"]> =
    useCallback(
      (event, info) => {
        onEnd?.(event, info);
      },
      [onEnd]
    );
  return (
    <m.div
      role="button"
      drag={"x"}
      dragDirectionLock={true}
      dragElastic={0}
      dragConstraints={{ left: 0, right: 0 }}
      draggable={!isResizing || !!dragging}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...props}
      whileDrag={{ cursor: "e-resize" }}
      className="pointer-events-none absolute top-0 right-0 flex h-full w-6 items-center justify-center group-hover:pointer-events-auto"
    >
      <div
        className={cn(
          "h-[48px] max-h-1/2 w-2.5 border-solid border-off-foreground/90 bg-[oklch(0.1684_0_0/60%)] opacity-0 transition-opacity duration-150 ease-in-out group-hover:opacity-100"
        )}
      />
    </m.div>
  );
};
const LeftResizeButton = ({
  onDragEnd: onEnd,
  onDragStart: onStart,
  ...props
}: HTMLMotionProps<"div">) => {
  const [draggingThis, setDraggingThis] = useState(false);
  const isResizing = useRPImageNode((r) => r.isResizing);
  const onDragStart: NonNullable<MotionNodeDragHandlers["onDragStart"]> =
    useCallback(
      (event, info) => {
        setDraggingThis(true);
        onStart?.(event, info);
      },
      [onStart]
    );
  const onDragEnd: NonNullable<MotionNodeDragHandlers["onDragEnd"]> =
    useCallback(
      (event, info) => {
        setDraggingThis(false);
        onEnd?.(event, info);
      },
      [onEnd]
    );
  return (
    <m.div
      role="button"
      drag={"x"}
      dragDirectionLock={true}
      dragElastic={0}
      dragConstraints={{ left: 0, right: 0 }}
      draggable={!isResizing || draggingThis}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...props}
      whileDrag={{ cursor: "w-resize" }}
      className="pointer-events-none absolute top-0 left-0 flex h-full w-6 items-center justify-center group-hover:pointer-events-auto"
    >
      <div
        className={cn(
          "h-[48px] max-h-1/2 w-2.5 border-solid border-off-foreground/90 bg-[oklch(0.1684_0_0/60%)] opacity-0 transition-opacity duration-150 ease-in-out group-hover:opacity-100"
        )}
      />
    </m.div>
  );
};
