"use client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import { useRadio, useRadioStore } from "@/providers/RadioProvider";
import {
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useRef } from "react";
import { useShallow } from "zustand/shallow";
import { useHaptics } from "../hooks/useHaptics";

type ProgressRailProps = {
  thin?: boolean;
  className?: string;
};

/**
 * Draggable seek bar.
 * - Thin variant (4px) for sidebar/drawer
 * - Standard variant (6px) for full player
 * - Expands on hover/drag for better grip
 * - Thumb scales up on grab
 */
export const ProgressRail = ({ thin = false, className }: ProgressRailProps) => {
  const elapsedTime = useRadioStore(useShallow((t) => t.elapsedTime));
  const remainingTime = useRadioStore(useShallow((t) => t.remainingTime));
  const setSeeking = useRadioStore((t) => t.setSeeking);
  const { seek } = useRadio();
  const { isTouch } = useIsMobile();
  const haptics = useHaptics();

  const duration = elapsedTime + remainingTime;
  const progress = duration > 0 ? elapsedTime / duration : 0;

  const railRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Scale for the thumb on drag
  const thumbScale = useMotionValue(1);
  const thumbSpring = useSpring(thumbScale, { stiffness: 400, damping: 25 });

  // Rail height expansion on hover/drag
  const railScale = useMotionValue(1);
  const railSpring = useSpring(railScale, { stiffness: 300, damping: 20 });

  const seekToPosition = useCallback(
    (clientX: number) => {
      if (!railRef.current || duration <= 0) return;
      const rect = railRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seek(ratio * duration);
    },
    [duration, seek]
  );

  const onPanStart = useCallback(() => {
    isDragging.current = true;
    setSeeking(true);
    thumbScale.set(1.4);
    railScale.set(thin ? 1.5 : 1.8);
    haptics.selection();
  }, [setSeeking, thumbScale, railScale, thin, haptics]);

  const onPan = useCallback(
    (_: PointerEvent, info: PanInfo) => {
      if (!railRef.current || !isDragging.current) return;
      const rect = railRef.current.getBoundingClientRect();
      const clientX = info.point.x;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seek(ratio * duration);
    },
    [duration, seek]
  );

  const onPanEnd = useCallback(() => {
    isDragging.current = false;
    setSeeking(false);
    thumbScale.set(1);
    railScale.set(1);
    haptics.impact();
  }, [setSeeking, thumbScale, railScale, haptics]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging.current) return;
      seekToPosition(e.clientX);
      haptics.impact();
    },
    [seekToPosition, haptics]
  );

  const baseHeight = thin ? 4 : 6;
  const thumbSize = isTouch ? 16 : 12;

  return (
    <m.div
      className={cn("group/rail relative flex w-full cursor-pointer items-center", className)}
      style={{ height: isTouch ? 32 : 20 }}
      onMouseEnter={() => !isDragging.current && railScale.set(1.3)}
      onMouseLeave={() => !isDragging.current && railScale.set(1)}
    >
      {/* Track (background) */}
      <m.div
        ref={railRef}
        className="relative w-full overflow-hidden rounded-full bg-faded-fg/15"
        style={{
          height: baseHeight,
          scaleY: railSpring,
          transformOrigin: "center",
        }}
        onClick={onClick}
      >
        {/* Fill */}
        <m.div
          className="absolute inset-y-0 left-0 rounded-full bg-bleu-400"
          style={{ width: `${progress * 100}%` }}
        />
      </m.div>

      {/* Thumb */}
      <m.div
        className={cn(
          "absolute rounded-full bg-fg shadow-sm",
          "opacity-0 transition-opacity duration-150",
          "group-hover/rail:opacity-100",
          isDragging.current && "opacity-100"
        )}
        style={{
          width: thumbSize,
          height: thumbSize,
          left: `calc(${progress * 100}% - ${thumbSize / 2}px)`,
          scale: thumbSpring,
        }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
      />
    </m.div>
  );
};
