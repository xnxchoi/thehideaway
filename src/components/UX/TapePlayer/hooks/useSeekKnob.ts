"use client";

import { useRadio, useRadioStore } from "@/providers/RadioProvider";
import { useMotionValue, useSpring } from "motion/react";
import { useCallback, useRef } from "react";
import { useShallow } from "zustand/shallow";
import { useHaptics } from "./useHaptics";

/**
 * Hook driving the rotary seek knob interaction.
 *
 * Drag to rotate → continuous seek through the track.
 * Scroll wheel → seek ±5s per tick.
 * Spring-animated rotation returns to neutral on release.
 */
export function useSeekKnob() {
  const { seek } = useRadio();
  const elapsedTime = useRadioStore(useShallow((t) => t.elapsedTime));
  const remainingTime = useRadioStore(useShallow((t) => t.remainingTime));
  const setSeeking = useRadioStore((t) => t.setSeeking);
  const haptics = useHaptics();

  const duration = elapsedTime + remainingTime;

  // Visual rotation angle — springs back to 0 on release
  const rawAngle = useMotionValue(0);
  const angle = useSpring(rawAngle, { stiffness: 200, damping: 25 });

  // Accumulated rotation for haptic ticks
  const rotAccum = useRef(0);
  const TICK_THRESHOLD = 30; // degrees per haptic tick

  const onPanStart = useCallback(() => {
    setSeeking(true);
    rotAccum.current = 0;
  }, [setSeeking]);

  const onPan = useCallback(
    (_: PointerEvent, info: { delta: { x: number; y: number } }) => {
      if (duration <= 0) return;

      const delta = info.delta.x * 0.6;
      rawAngle.set(rawAngle.get() + delta);

      // Map rotation delta to seek time
      // 360deg of accumulated rotation = full track duration
      const seekDelta = (delta / 360) * duration;
      const newPos = Math.max(0, Math.min(duration, elapsedTime + seekDelta));
      seek(newPos);

      // Haptic tick at regular rotation intervals
      rotAccum.current += Math.abs(delta);
      if (rotAccum.current >= TICK_THRESHOLD) {
        haptics.tick();
        rotAccum.current = 0;
      }
    },
    [duration, elapsedTime, seek, rawAngle, haptics]
  );

  const onPanEnd = useCallback(() => {
    rawAngle.set(0); // spring back to neutral
    setSeeking(false);
    haptics.impact();
  }, [rawAngle, setSeeking, haptics]);

  // Desktop scroll wheel: seek ±5s per tick
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (duration <= 0) return;

      const seekStep = e.deltaY > 0 ? -5 : 5;
      const newPos = Math.max(0, Math.min(duration, elapsedTime + seekStep));
      seek(newPos);
      haptics.tick();
    },
    [duration, elapsedTime, seek, haptics]
  );

  return {
    angle,
    duration,
    elapsedTime,
    onPanStart,
    onPan,
    onPanEnd,
    onWheel,
  };
}
