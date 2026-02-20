"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useTapeAnimation } from "../hooks/useTapeAnimation";
import { REEL_SPOKE_COUNT } from "../constants";

type TapeReelsProps = {
  diameter?: number;
  className?: string;
};

/**
 * OP-1 Field-inspired dual tape reel SVG.
 *
 * Two reels connected by a "tape" path. Supply reel (left) shrinks
 * as the track progresses; takeup reel (right) grows. Both rotate
 * via GSAP timelines driven by useTapeAnimation.
 *
 * SVG viewBox is 320x140 — gives room for two reels + tape path.
 */
export const TapeReels = ({ diameter = 120, className }: TapeReelsProps) => {
  const scopeRef = useRef<SVGSVGElement>(null);
  const supplyRef = useRef<SVGGElement>(null);
  const takeupRef = useRef<SVGGElement>(null);

  const { progress } = useTapeAnimation(supplyRef, takeupRef, scopeRef);

  // Reel radii: supply shrinks, takeup grows
  const minR = 18;
  const maxR = 48;
  const supplyR = maxR - progress * (maxR - minR);
  const takeupR = minR + progress * (maxR - minR);

  const hubR = 8;
  const cx1 = 80; // supply center x
  const cx2 = 240; // takeup center x
  const cy = 70; // both centers y

  // Generate spoke lines for a reel
  const spokes = (cx: number, r: number) => {
    const lines = [];
    for (let i = 0; i < REEL_SPOKE_COUNT; i++) {
      const angle = (i * 360) / REEL_SPOKE_COUNT;
      const rad = (angle * Math.PI) / 180;
      lines.push(
        <line
          key={i}
          x1={cx + hubR * Math.cos(rad)}
          y1={cy + hubR * Math.sin(rad)}
          x2={cx + (r - 2) * Math.cos(rad)}
          y2={cy + (r - 2) * Math.sin(rad)}
          stroke="var(--faded-fg)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      );
    }
    return lines;
  };

  // Tape path between the two reels (tangent line approximation)
  const tapeY1 = cy - hubR * 0.7;
  const tapeY2 = cy + hubR * 0.7;

  return (
    <svg
      ref={scopeRef}
      viewBox="0 0 320 140"
      className={cn("w-full select-none", className)}
      style={{ maxWidth: diameter * 2.67 }}
      aria-hidden="true"
    >
      {/* Tape path connecting reels */}
      <path
        d={`M ${cx1 + hubR} ${tapeY1} L ${cx2 - hubR} ${tapeY1}`}
        stroke="var(--faded-fg)"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
      <path
        d={`M ${cx1 + hubR} ${tapeY2} L ${cx2 - hubR} ${tapeY2}`}
        stroke="var(--faded-fg)"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />

      {/* Guide heads */}
      <circle cx={cx1 + supplyR + 8} cy={cy} r="2" fill="var(--rouge-500)" opacity="0.7" />
      <circle cx={cx2 - takeupR - 8} cy={cy} r="2" fill="var(--rouge-500)" opacity="0.7" />

      {/* Supply reel (left) */}
      <g ref={supplyRef}>
        {/* Outer ring */}
        <circle
          cx={cx1}
          cy={cy}
          r={supplyR}
          fill="none"
          stroke="var(--faded-fg)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        {/* Inner ring */}
        <circle
          cx={cx1}
          cy={cy}
          r={supplyR * 0.65}
          fill="none"
          stroke="var(--faded-fg)"
          strokeWidth="0.75"
          opacity="0.25"
        />
        {/* Hub */}
        <circle
          cx={cx1}
          cy={cy}
          r={hubR}
          fill="var(--off-bg)"
          stroke="var(--faded-fg)"
          strokeWidth="1.5"
        />
        {/* Center dot */}
        <circle cx={cx1} cy={cy} r="2.5" fill="var(--faded-fg)" />
        {/* Spokes */}
        {spokes(cx1, supplyR)}
      </g>

      {/* Takeup reel (right) */}
      <g ref={takeupRef}>
        <circle
          cx={cx2}
          cy={cy}
          r={takeupR}
          fill="none"
          stroke="var(--faded-fg)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <circle
          cx={cx2}
          cy={cy}
          r={takeupR * 0.65}
          fill="none"
          stroke="var(--faded-fg)"
          strokeWidth="0.75"
          opacity="0.25"
        />
        <circle
          cx={cx2}
          cy={cy}
          r={hubR}
          fill="var(--off-bg)"
          stroke="var(--faded-fg)"
          strokeWidth="1.5"
        />
        <circle cx={cx2} cy={cy} r="2.5" fill="var(--faded-fg)" />
        {spokes(cx2, takeupR)}
      </g>

      {/* Labels */}
      <text
        x={cx1}
        y={cy + maxR + 14}
        textAnchor="middle"
        fill="var(--faded-fg)"
        fontSize="8"
        fontFamily="var(--font-mono)"
        letterSpacing="0.08em"
        opacity="0.5"
      >
        SUPPLY
      </text>
      <text
        x={cx2}
        y={cy + maxR + 14}
        textAnchor="middle"
        fill="var(--faded-fg)"
        fontSize="8"
        fontFamily="var(--font-mono)"
        letterSpacing="0.08em"
        opacity="0.5"
      >
        TAKE-UP
      </text>
    </svg>
  );
};
