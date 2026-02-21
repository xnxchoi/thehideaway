"use client";

import {useIsMobile} from "@/providers/MiddleMan";
import {useRadio, useRadioStore} from "@/providers/RadioProvider";
import {useMotionValue, useSpring, useTransform} from "motion/react";
import {useCallback, useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/shallow";
import {
  DEFAULT_PLAYBACK_RATE,
  SCRUB_MODE_THRESHOLD,
  SPEED_STEP_ANGLE,
  SPEED_STEPS,
  WHEEL_STEP_THRESHOLD,
} from "../constants";
import type {SpeedDialMode} from "../types";
import {useHaptics} from "./useHaptics";

/**
 * Hook driving the TP-7-style speed dial interaction.
 *
 * Rate mode (default): rotation snaps to discrete speed steps.
 * Scrub mode (Shift on desktop, long-press on mobile): rotation
 * continuously seeks through the track.
 */
export function useSpeedControl() {
  const { setPlaybackRate, seek } = useRadio();
  const playbackRate = useRadioStore(useShallow((t) => t.playbackRate));
  const e = useRadioStore(useShallow((t) => t.elapsedTime));
  const elaos = useMotionValue(e);
  useEffect(() => elaos.set(e), [e, elaos])
  const setSeeking = useRadioStore((t) => t.setSeeking);
  const { isTouch } = useIsMobile();
  const haptics = useHaptics();
  const currentIndex = useRadioStore(useShallow((t) => t.currentIndex));
  const tracks = useRadioStore(useShallow((t) => t.tracks));
  const currentTrack = useMotionValue(tracks[currentIndex]);
  useEffect(() => {
    currentTrack.set(tracks[currentIndex]);
  }, [currentIndex, currentTrack, tracks])
  const [mode, setMode] = useState<SpeedDialMode>("rate");
  const durationC = useTransform(() => currentTrack.get().duration || 0);

  // Find current step index from playbackRate
  const currentStepIndex = SPEED_STEPS.findIndex((s) => s >= playbackRate);
  const stepIndex = useRef(currentStepIndex >= 0 ? currentStepIndex : 3); // default to 1.0x

  // Visual angle — spring-animated for snap feel
  const rawAngle = useMotionValue(stepIndex.current * SPEED_STEP_ANGLE);
  const angle = useSpring(rawAngle, { stiffness: 300, damping: 20 });

  // Cumulative delta for scrub mode
  const scrubAccum = useRef(0);

  // Scroll wheel accumulator for dampening
  const wheelAccum = useRef(0);

  // Long-press timer for mobile scrub mode
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Desktop: Shift key toggles scrub mode
  useEffect(() => {
    if (isTouch) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setMode("scrub");
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setMode("rate");
        setSeeking(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isTouch, setSeeking]);

  const onPanStart = useCallback(() => {
    if (isTouch) {
      // Start long-press timer for scrub mode
      longPressTimer.current = setTimeout(() => {
        setMode("scrub");
        setSeeking(true);
        haptics.heavy();
      }, SCRUB_MODE_THRESHOLD);
    }
    scrubAccum.current = 0;
  }, [isTouch, setSeeking, haptics]);

  const onPan = useCallback(
    (_: PointerEvent, info: { delta: { x: number; y: number } }) => {
      // Use horizontal delta as rotation input
      const delta = info.delta.x * 0.8;
      const duration = durationC.get(), elapsedTime = elaos.get();
      if (modeRef.current === "scrub") {
        // Scrub: map rotation to seek position
        if (duration <= 0) return;
        scrubAccum.current += delta;
        // 200px drag = full track duration
        const seekDelta = (scrubAccum.current / 200) * duration;
        const newPos = Math.max(0, Math.min(duration, elapsedTime + seekDelta));
        seek(newPos);
        scrubAccum.current = 0;
      } else {
        // Rate: map to discrete steps
        const currentAngle = rawAngle.get();
        const newAngle = currentAngle + delta;

        // Find nearest step
        const nearestStepIdx = Math.round(newAngle / SPEED_STEP_ANGLE);
        const clampedIdx = Math.max(
          0,
          Math.min(SPEED_STEPS.length - 1, nearestStepIdx)
        );

        if (clampedIdx !== stepIndex.current) {
          stepIndex.current = clampedIdx;
          const rate = SPEED_STEPS[clampedIdx];
          setPlaybackRate(rate);
          haptics.tick();
        }

        rawAngle.set(clampedIdx * SPEED_STEP_ANGLE);
      }
    },
      [durationC, elaos, seek, rawAngle, setPlaybackRate, haptics]
  );

  const onPanEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (modeRef.current === "scrub" && isTouch) {
      setMode("rate");
      setSeeking(false);
    }
  }, [isTouch, setSeeking]);

  // Scroll wheel for desktop — dampened with accumulation
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (modeRef.current === "scrub") return;
      e.preventDefault();

      wheelAccum.current += e.deltaY;

      if (Math.abs(wheelAccum.current) >= WHEEL_STEP_THRESHOLD) {
        const direction = wheelAccum.current > 0 ? -1 : 1;
        wheelAccum.current = 0;

        const newIdx = Math.max(
          0,
          Math.min(SPEED_STEPS.length - 1, stepIndex.current + direction)
        );
        if (newIdx !== stepIndex.current) {
          stepIndex.current = newIdx;
          setPlaybackRate(SPEED_STEPS[newIdx]);
          rawAngle.set(newIdx * SPEED_STEP_ANGLE);
          haptics.tick();
        }
      }
    },
    [setPlaybackRate, rawAngle, haptics]
  );

  // Reset speed to 1.0x (double-tap on mobile)
  const resetSpeed = useCallback(() => {
    const defaultIdx = SPEED_STEPS.indexOf(DEFAULT_PLAYBACK_RATE);
    stepIndex.current = defaultIdx;
    setPlaybackRate(DEFAULT_PLAYBACK_RATE);
    rawAngle.set(defaultIdx * SPEED_STEP_ANGLE);
    haptics.impact();
  }, [setPlaybackRate, rawAngle, haptics]);

  return {
    angle,
    mode,
    currentSpeed: playbackRate,
    onPanStart,
    onPan,
    onPanEnd,
    onWheel,
    resetSpeed,
  };
}
