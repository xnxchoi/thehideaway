"use client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import * as m from "motion/react-m";
import { useCallback, useRef } from "react";
import { SPEED_STEPS } from "../constants";
import { useSpeedControl } from "../hooks/useSpeedControl";

type SpeedDialProps = {
  size?: number;
  className?: string;
};

/**
 * TP-7-inspired rotary speed control.
 *
 * A ribbed circular dial with a position indicator and surrounding
 * speed step labels. Rotation is spring-animated.
 *
 * Desktop: scroll wheel or drag to rotate.
 * Mobile: drag to rotate, double-tap to reset, long-press for scrub.
 */
export const SpeedDial = ({ size = 64, className }: SpeedDialProps) => {
  const {
    angle,
    mode,
    currentSpeed,
    onPanStart,
    onPan,
    onPanEnd,
    onWheel,
    resetSpeed,
  } = useSpeedControl();

  const { isTouch } = useIsMobile();
  const lastTap = useRef(0);

  // Double-tap detection for mobile reset
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      resetSpeed();
    }
    lastTap.current = now;
  }, [resetSpeed]);

  const r = size / 2;
  const notchCount = 24;
  const indicatorLength = r * 0.35;

  return (
    <m.div
      className={cn("relative flex flex-col items-center gap-1", className)}
      onWheel={onWheel}
    >
      {/* Speed label */}
      <span
        className={cn(
          "font-sans text-[0.6rem] tracking-tight tabular-nums transition-colors duration-150",
          mode === "scrub" ? "text-rouge-400" : "text-faded-fg"
        )}
      >
        {mode === "scrub" ? "SCRUB" : `${currentSpeed}x`}
      </span>

      {/* The dial */}
      <m.div
        className={cn(
          "relative cursor-grab touch-none rounded-full select-none",
          "border-faded-fg/20 border",
          "active:cursor-grabbing"
        )}
        style={{ width: size, height: size }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        onTap={isTouch ? handleTap : undefined}
        role="slider"
        aria-label="Playback speed"
        aria-valuemin={SPEED_STEPS[0]}
        aria-valuemax={SPEED_STEPS[SPEED_STEPS.length - 1]}
        aria-valuenow={currentSpeed}
        aria-valuetext={`${currentSpeed}x speed`}
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full"
          aria-hidden="true"
        >
          {/* Outer ribbed texture — small notches around the rim */}
          {Array.from({ length: notchCount }).map((_, i) => {
            const a = (i * 360) / notchCount;
            const rad = (a * Math.PI) / 180;
            const outer = r - 1;
            const inner = r - 4;
            return (
              <line
                key={i}
                x1={r + outer * Math.cos(rad)}
                y1={r + outer * Math.sin(rad)}
                x2={r + inner * Math.cos(rad)}
                y2={r + inner * Math.sin(rad)}
                stroke="var(--faded-fg)"
                strokeWidth="0.75"
                opacity="0.25"
              />
            );
          })}

          {/* Inner circle */}
          <circle
            cx={r}
            cy={r}
            r={r * 0.6}
            fill="none"
            stroke="var(--faded-fg)"
            strokeWidth="0.5"
            opacity="0.15"
          />
        </svg>

        {/* Position indicator — rotates with the spring angle */}
        <m.div
          className="absolute inset-0 flex items-start justify-center"
          style={{ rotate: angle }}
        >
          <div
            className={cn(
              "rounded-full transition-colors duration-150",
              mode === "scrub" ? "bg-rouge-400" : "bg-bleu-400"
            )}
            style={{
              width: 3,
              height: indicatorLength,
              marginTop: 6
            }}
          />
        </m.div>

        {/* Center dot */}
        <div
          className="bg-faded-fg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 4, height: 4 }}
        />
      </m.div>
    </m.div>
  );
};
