"use client";

import {useRadio, useRadioStore} from "@/providers/RadioProvider";
import {useLenis} from "lenis/react";
import {MotionNodePanHandlers} from "motion";
import {useMotionValue, useSpring, useTransform} from "motion/react";
import {useCallback, useEffect, useRef, WheelEventHandler} from "react";
import {useShallow} from "zustand/shallow";
import {useHaptics} from "./useHaptics";

type MotionPanner<T extends keyof MotionNodePanHandlers = keyof MotionNodePanHandlers> = NonNullable<MotionNodePanHandlers[T]>
/**
 * Hook driving the rotary seek knob interaction.
 *
 * Drag to rotate → continuous seek through the track.
 * Scroll wheel → seek ±5s per tick.
 * Spring-animated rotation returns to neutral on release.
 */
export function useSeekKnob() {
  const { seek } = useRadio();
    const currentIndex = useRadioStore(useShallow((t) => t.currentIndex));
    const tracks = useRadioStore(useShallow((t) => t.tracks));
    const currentTrack = useMotionValue(tracks[currentIndex]);
    useEffect(() => currentTrack.set(tracks[currentIndex]), [currentIndex, currentTrack, tracks]
    )
    const durationO = useTransform(() => currentTrack.get().duration || 0)
    const e = useRadioStore(useShallow((t) => t.elapsedTime));
    const elapsedTimee = useMotionValue(e);
    useEffect(
        () => elapsedTimee.set(e), [e, elapsedTimee]
    )
    const setSeeking = useRadioStore((t) => t.setSeeking);
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
  }, [setSeeking]);

    const onPan: MotionPanner<"onPan"> = useCallback(
        (_, info) => {
            const duration = durationO.get();
      if (duration <= 0) return;

      const delta = info.delta.x * 0.6;
      rawAngle.set(rawAngle.get() + delta);

      // Map rotation delta to seek time
      // 360deg of accumulated rotation = full track duration
      const seekDelta = (delta / 360) * duration;
            const elapsedTime = elapsedTimee.get();
      const newPos = Math.max(0, Math.min(duration, elapsedTime + seekDelta));
      seek(newPos);

      // Haptic tick at regular rotation intervals
      rotAccum.current += Math.abs(delta);
      if (rotAccum.current >= TICK_THRESHOLD) {
        haptics.tick();
        rotAccum.current = 0;
      }
    },
        [durationO, elapsedTimee, seek, rawAngle, haptics]
  );

    const onPanEnd: MotionPanner<"onPanEnd"> = useCallback(() => {
    rawAngle.set(0); // spring back to neutral
    setSeeking(false);
    haptics.impact();
  }, [rawAngle, setSeeking, haptics]);
    const lenis = useLenis()
    const counterRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const oT = useCallback(() => {
        lenis && lenis.start()
    }, [lenis])
    const dp = useRadioStore(useShallow(r => r.playing))
    const isPlaying = useMotionValue(dp);
    useEffect(
        () => {
            isPlaying.set(dp)
        }, [dp, isPlaying]
    )
  // Desktop scroll wheel: seek ±5s per tick
    const onWheel: WheelEventHandler<HTMLDivElement> = useCallback(
        (e) => {
      e.preventDefault();
            if (e.currentTarget.dataset.active !== "true") return;
            if (!isPlaying.get()) return;
            counterRef.current && clearTimeout(counterRef.current)
            const duration = durationO.get();
            const elapsedTime = elapsedTimee.get();
      if (duration <= 0) return;
            lenis && lenis.stop();
      const seekStep = e.deltaY > 0 ? -5 : 5;
      const newPos = Math.max(0, Math.min(duration, elapsedTime + seekStep));
      seek(newPos);
      haptics.tick();
            counterRef.current = setTimeout(oT, 50)
    },
        [isPlaying, durationO, elapsedTimee, lenis, seek, haptics, oT]
  );

  return {
    angle,

      onPanStart,
    onPan,
    onPanEnd,
    onWheel,
  };
}
