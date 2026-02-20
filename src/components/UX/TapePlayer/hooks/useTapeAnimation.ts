"use client";

import { useRadioStore } from "@/providers/RadioProvider";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
import { useShallow } from "zustand/shallow";
import { REEL_BASE_DURATION } from "../constants";

/**
 * Drives the dual-reel GSAP rotation animation.
 * Supply reel slows as track progresses, takeup reel speeds up.
 * TimeScale is linked to playing state and playbackRate.
 */
export function useTapeAnimation(
  supplyRef: React.RefObject<SVGGElement | null>,
  takeupRef: React.RefObject<SVGGElement | null>,
  scopeRef: React.RefObject<HTMLElement | SVGElement | null>
) {
  const playing = useRadioStore(useShallow((t) => t.playing));
  const playbackRate = useRadioStore(useShallow((t) => t.playbackRate));
  const elapsedTime = useRadioStore(useShallow((t) => t.elapsedTime));
  const remainingTime = useRadioStore(useShallow((t) => t.remainingTime));

  const duration = elapsedTime + remainingTime;
  const progress = duration > 0 ? elapsedTime / duration : 0;

  const supplyTL = useRef<GSAPTimeline>(null!);
  const takeupTL = useRef<GSAPTimeline>(null!);

  // Create the perpetual rotation timelines
  useGSAP(
    () => {
      if (!supplyRef.current || !takeupRef.current) return;

      supplyTL.current = gsap
        .timeline({
          defaults: { ease: "none", repeat: -1, yoyo: false },
        })
        .to(supplyRef.current, {
          rotate: 360,
          duration: REEL_BASE_DURATION,
          transformOrigin: "center center",
        });

      takeupTL.current = gsap
        .timeline({
          defaults: { ease: "none", repeat: -1, yoyo: false },
        })
        .to(takeupRef.current, {
          rotate: -360,
          duration: REEL_BASE_DURATION,
          transformOrigin: "center center",
        });
    },
    { scope: scopeRef }
  );

  // Animate timeScale based on playing, playbackRate, and progress
  useGSAP(
    () => {
      if (!supplyTL.current || !takeupTL.current) return;

      const active = playing ? 1 : 0;
      // Supply reel: faster when more tape (start), slower near end
      const supplySpeed = active * playbackRate * Math.max(0.15, 1 - progress);
      // Takeup reel: slower at start, faster as it fills
      const takeupSpeed = active * playbackRate * Math.max(0.15, progress);

      gsap.to(supplyTL.current, {
        timeScale: supplySpeed,
        duration: 0.6,
        ease: playing ? "power2.in" : "power2.out",
        overwrite: true,
      });

      gsap.to(takeupTL.current, {
        timeScale: takeupSpeed,
        duration: 0.6,
        ease: playing ? "power2.in" : "power2.out",
        overwrite: true,
      });
    },
    { dependencies: [playing, playbackRate, progress], scope: scopeRef }
  );

  return { progress };
}
