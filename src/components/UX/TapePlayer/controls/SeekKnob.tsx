"use client";

import { cn } from "@/lib/utils";
import * as m from "motion/react-m";
import { useSeekKnob } from "../hooks/useSeekKnob";

type SeekKnobProps = {
  size?: number;
  className?: string;
};

/** Format seconds into MM:SS */
function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const mins = Math.floor(abs / 60);
  const secs = Math.floor(abs % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * TP-7/iPod Classic-inspired rotary seek knob.
 *
 * Drag to rotate → continuous seek through the track.
 * Scroll wheel → seek ±5s per tick.
 * Shows a progress arc and current position label.
 * Springs back to neutral rotation on release.
 */
export const SeekKnob = ({ size = 56, className }: SeekKnobProps) => {
  const {
    angle,
    duration,
    elapsedTime,
    onPanStart,
    onPan,
    onPanEnd,
    onWheel,
  } = useSeekKnob();

  const r = size / 2;
  const progress = duration > 0 ? elapsedTime / duration : 0;
  const notchCount = 20;

  // SVG arc for progress indicator
  const arcR = r - 6;
  const circumference = 2 * Math.PI * arcR;
  const arcOffset = circumference * (1 - progress);

  return (
    <m.div
      className={cn("relative flex flex-col items-center gap-1", className)}
      onWheel={onWheel}
    >
      {/* Position label */}
      <span className="font-mono text-[0.6rem] tabular-nums tracking-tight text-faded-fg">
        {formatTime(elapsedTime)}
      </span>

      {/* The knob */}
      <m.div
        className={cn(
          "relative cursor-grab touch-none select-none rounded-full",
          "border border-faded-fg/20",
          "active:cursor-grabbing"
        )}
        style={{ width: size, height: size }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        role="slider"
        aria-label="Seek position"
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration)}
        aria-valuenow={Math.floor(elapsedTime)}
        aria-valuetext={formatTime(elapsedTime)}
        tabIndex={0}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full"
          aria-hidden="true"
        >
          {/* Progress arc (background) */}
          <circle
            cx={r}
            cy={r}
            r={arcR}
            fill="none"
            stroke="var(--faded-fg)"
            strokeWidth="2"
            opacity="0.1"
          />

          {/* Progress arc (filled) */}
          <circle
            cx={r}
            cy={r}
            r={arcR}
            fill="none"
            stroke="var(--bleu-400)"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={arcOffset}
            strokeLinecap="round"
            opacity="0.8"
            transform={`rotate(-90 ${r} ${r})`}
          />

          {/* Outer ribbed texture */}
          {Array.from({ length: notchCount }).map((_, i) => {
            const a = (i * 360) / notchCount;
            const rad = (a * Math.PI) / 180;
            const outer = r - 1;
            const inner = r - 3.5;
            return (
              <line
                key={i}
                x1={r + outer * Math.cos(rad)}
                y1={r + outer * Math.sin(rad)}
                x2={r + inner * Math.cos(rad)}
                y2={r + inner * Math.sin(rad)}
                stroke="var(--faded-fg)"
                strokeWidth="0.5"
                opacity="0.2"
              />
            );
          })}
        </svg>

        {/* Position indicator — rotates with spring angle */}
        <m.div
          className="absolute inset-0 flex items-start justify-center"
          style={{ rotate: angle }}
        >
          <div
            className="rounded-full bg-bleu-400"
            style={{
              width: 2.5,
              height: r * 0.3,
              marginTop: 5,
            }}
          />
        </m.div>

        {/* Center dot */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-faded-fg"
          style={{ width: 3, height: 3 }}
        />
      </m.div>
    </m.div>
  );
};
