"use client";

import { useDomCursor } from "@/components/core/cursorWrapper";
import { SPRING_EASE } from "@/constants/animations";
import { cn } from "@/lib/utils";
import { useRadioStore } from "@/providers/RadioProvider";
import { useLenis } from "lenis/react";
import {
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform
} from "motion/react";
import * as m from "motion/react-m";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useShallow } from "zustand/shallow";
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

    onPanStart,
    onPan,
    onPanEnd,
    onWheel
  } = useSeekKnob();
  const e = useRadioStore(useShallow((r) => r.elapsedTime));
  const currentIndex = useRadioStore(useShallow((r) => r.currentIndex));
  const tracks = useRadioStore(useShallow((r) => r.tracks));
  const currentTrack = useMotionValue(tracks[currentIndex]);
  useEffect(() => {
    currentTrack.set(tracks[currentIndex]);
  }, [currentIndex, tracks, currentTrack]);
  const re = useRef<HTMLDivElement>(null!);
  const dur = useTransform(() => currentTrack.get().duration);
  useMotionValueEvent(dur, "change", (args) => {
    re.current.setAttribute("aria-valuemax", formatTime(args));
  });
  const elaps = useMotionValue(e);
  useMotionValueEvent(elaps, "change", (elapsedTime) => {
    re.current.setAttribute("aria-valuetext", formatTime(elapsedTime));
    re.current.setAttribute(
      "aria-valuenow",
      formatTime(Math.floor(elapsedTime))
    );
  });
  useEffect(() => {
    elaps.set(e);
  }, [e, elaps]);
  const ra = useMotionValue(size / 2);
  const rah = useTransform(() => ra.get() * 0.3);
  const pro = useTransform(() => {
    const duration = dur.get(),
      elapsedTime = elaps.get();
    return duration > 0 ? elapsedTime / duration : 0;
  });
  const notchCount = 20;
  const lenis = useLenis();
  const [isActive, setIsActive] = useState(false);
  const onEnter: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
    setIsActive(true);
  }, []);
  const onLeave: MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      setIsActive(false);
      lenis && lenis.start();
    },
    [lenis]
  );
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter,
    onLeave
  });

  // SVG arc for progress indicator
  const arcR = useTransform(() => ra.get() - 6);
  const c = useTransform(() => 2 * Math.PI * arcR.get());
  const circumference = useSpring(c, SPRING_EASE.power4.inOut);
  const arcOffse = useTransform(() => circumference.get() * (1 - pro.get()));
  const arcOffset = useSpring(arcOffse, SPRING_EASE.power4.inOut);
  const tra = useMotionTemplate`rotate(-90deg)`;
  return (
    <m.div
      className={cn("relative flex flex-col items-center gap-1", className)}
      data-active={isActive}
      onWheel={onWheel}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      {/* Position label */}
      <span className="text-faded-fg font-mono text-[0.6rem] tracking-tight tabular-nums">
        {formatTime(e)}
      </span>

      {/* The knob */}
      <m.div
        className={cn(
          "relative cursor-grab touch-none rounded-full select-none",
          "border-faded-fg/20 border"
        )}
        ref={re}
        style={{ width: size, height: size }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        role="slider"
        aria-label="Seek position"
        aria-valuemin={0}
        tabIndex={0}
      >
        <m.svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full"
          aria-hidden="true"
        >
          {/* Progress arc (background) */}
          <m.circle
            cx={ra}
            cy={ra}
            r={arcR}
            fill="none"
            stroke="var(--faded-fg)"
            strokeWidth="2"
            opacity="0.1"
          />

          {/* Progress arc (filled) */}
          <m.circle
            cx={ra}
            cy={ra}
            r={arcR}
            fill="none"
            stroke="var(--bleu-400)"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={arcOffset}
            strokeLinecap="round"
            opacity="0.8"
            style={{
              transform: tra
            }}
          />

          {/* Outer ribbed texture */}
          {Array.from({ length: notchCount }).map((_, i) => {
            const a = (i * 360) / notchCount;
            const r = ra.get();
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
        </m.svg>

        {/* Position indicator — rotates with spring angle */}
        <m.div
          className="absolute inset-0 flex items-start justify-center"
          style={{ rotate: angle }}
        >
          <m.div
            className="rounded-full bg-bleu-400"
            style={{
              width: 2.5,
              height: rah,
              marginTop: 5
            }}
          />
        </m.div>

        {/* Center dot */}
        <div
          className="bg-faded-fg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 3, height: 3 }}
        />
      </m.div>
    </m.div>
  );
};
