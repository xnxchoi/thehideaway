"use client";

import { useLenis } from "lenis/react";
import { MotionNodePanHandlers } from "motion";
import { useMotionValue, useSpring, useTransform } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  WheelEventHandler
} from "react";

import { useHideawayFMControls } from "@/providers/HideawayFM";
import { useNowPlaying, usePlayState } from "@/providers/HideawayFM/hooks";

import { useHaptics } from "./useHaptics";

type MotionPanner<
  T extends keyof MotionNodePanHandlers = keyof MotionNodePanHandlers
> = NonNullable<MotionNodePanHandlers[T]>;

/**
 * Hook driving the rotary seek knob interaction.
 *
 * Drag to rotate → continuous seek through the track.
 * Scroll wheel → seek ±5s per tick.
 * Spring-animated rotation returns to neutral on release.
 *
 * Seeking is role-gated at the controls layer; for `user`/`patron` roles
 * `controls.seek()` is a no-op but the knob still animates visually so
 * the interaction doesn't feel broken. Actual transport skip is hidden
 * at the layout level via `useRadioControls()`.
 */
export function useSeekKnob() {
  const controls = useHideawayFMControls();
  const { track, elapsedMs, durationMs } = useNowPlaying();
  const { optimistic } = usePlayState();

  // Mirror store values into MotionValues so pan handlers read the latest
  // without re-binding callbacks each render.
  const currentTrack = useMotionValue(track);
  useEffect(() => {
    currentTrack.set(track);
  }, [track, currentTrack]);

  const durationSecMV = useTransform(() =>
    durationMs > 0 ? durationMs / 1000 : (currentTrack.get()?.duration ?? 0)
  );

  const elapsedSec = elapsedMs / 1000;
  const elapsedSecMV = useMotionValue(elapsedSec);
  useEffect(() => {
    elapsedSecMV.set(elapsedSec);
  }, [elapsedSec, elapsedSecMV]);

  // Local seeking flag — replaces legacy `setSeeking` store action.
  // Used only for transient UI feedback on the knob itself.
  const [, setSeeking] = useState(false);
  const haptics = useHaptics();

  // Visual rotation angle — springs back to 0 on release
  const rawAngle = useMotionValue(0);
  const angle = useSpring(rawAngle, { stiffness: 200, damping: 25 });

  // Accumulated rotation for haptic ticks
  const rotAccum = useRef(0);
  const TICK_THRESHOLD = 30; // degrees per haptic tick

  const onPanStart: MotionPanner<"onPanStart"> = useCallback(() => {
    setSeeking(true);
    rotAccum.current = 0;
  }, []);

  const onPan: MotionPanner<"onPan"> = useCallback(
    (_, info) => {
      const duration = durationSecMV.get();
      if (duration <= 0) return;

      const delta = info.delta.x * 0.6;
      rawAngle.set(rawAngle.get() + delta);

      // Map rotation delta to seek time
      // 360deg of accumulated rotation = full track duration
      const seekDelta = (delta / 360) * duration;
      const elapsed = elapsedSecMV.get();
      const newPos = Math.max(0, Math.min(duration, elapsed + seekDelta));
      controls.seek(newPos);

      // Haptic tick at regular rotation intervals
      rotAccum.current += Math.abs(delta);
      if (rotAccum.current >= TICK_THRESHOLD) {
        haptics.tick();
        rotAccum.current = 0;
      }
    },
    [durationSecMV, elapsedSecMV, controls, rawAngle, haptics]
  );

  const onPanEnd: MotionPanner<"onPanEnd"> = useCallback(() => {
    rawAngle.set(0); // spring back to neutral
    setSeeking(false);
    haptics.impact();
  }, [rawAngle, haptics]);

  const lenis = useLenis();
  const counterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oT = useCallback(() => {
    lenis && lenis.start();
  }, [lenis]);

  const isPlayingMV = useMotionValue(optimistic);
  useEffect(() => {
    isPlayingMV.set(optimistic);
  }, [optimistic, isPlayingMV]);

  // Desktop scroll wheel: seek ±5s per tick
  const onWheel: WheelEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.preventDefault();
      if (e.currentTarget.dataset.active !== "true") return;
      if (!isPlayingMV.get()) return;
      counterRef.current && clearTimeout(counterRef.current);
      const duration = durationSecMV.get();
      const elapsed = elapsedSecMV.get();
      if (duration <= 0) return;
      lenis && lenis.stop();
      const seekStep = e.deltaY > 0 ? -5 : 5;
      const newPos = Math.max(0, Math.min(duration, elapsed + seekStep));
      controls.seek(newPos);
      haptics.tick();
      counterRef.current = setTimeout(oT, 50);
    },
    [isPlayingMV, durationSecMV, elapsedSecMV, lenis, controls, haptics, oT]
  );

  return {
    angle,
    onPanStart,
    onPan,
    onPanEnd,
    onWheel
  };
}
