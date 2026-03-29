"use client";

import { MotionBtn } from "@/components/core/Button";
import { cn } from "@/lib/utils";
import { useRadio, useRadioStore } from "@/providers/RadioProvider";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";
import { ICON_PATHS } from "../constants";
import { useHaptics } from "../hooks/useHaptics";

gsap.registerPlugin(MorphSVGPlugin);

type PlayPauseButtonProps = {
  size?: number;
  className?: string;
};

/**
 * Play/Pause toggle with MorphSVG icon morphing.
 * Spring scale on press, haptic feedback.
 */
export const PlayPauseButton = ({
  size = 44,
  className
}: PlayPauseButtonProps) => {
  const { toggle, playing } = useRadio();
  const trackStatus = useRadioStore(useShallow((t) => t.trackStatus));
  const haptics = useHaptics();
  const howlPlayerRef = useRef<Howl>(null!),
    howlPauserRef = useRef<Howl>(null!),
    howlPlayingsRef = useRef<Howl>(null!);
  useEffect(() => {
    !howlPlayerRef.current &&
      (howlPlayerRef.current = new Howl({
        format: ["ogg"],
        src: ["/assets/audio/tape_playing.ogg"],
        autoplay: false,
        preload: true,
        volume: 0.1,
        loop: false
      }));
    !howlPauserRef.current &&
      (howlPauserRef.current = new Howl({
        format: ["ogg"],
        src: ["/assets/audio/tape_pause.ogg"],
        autoplay: false,
        preload: true,
        volume: 0.1,
        loop: false
      }));
    !howlPlayingsRef.current &&
      (howlPlayingsRef.current = new Howl({
        format: ["ogg"],
        src: ["/assets/audio/tape_playing.ogg"],
        autoplay: false,
        preload: true,
        volume: 0.1,
        loop: true
      }));
  }, []);
  const pathRef = useRef<SVGPathElement>(null);
  const wrapperRef = useRef<HTMLButtonElement>(null);
  const morphTL = useRef<GSAPTimeline>(null!);

  // Set up the MorphSVG timeline (play ↔ pause morph)
  useGSAP(
    () => {
      if (!pathRef.current) return;
      morphTL.current = gsap
        .timeline({
          defaults: { duration: 0.25, ease: "power2.inOut" },
          paused: true
        })
        .fromTo(
          pathRef.current,
          {
            morphSVG: {
              type: "rotational",
              map: "complexity",
              shape: ICON_PATHS.pause
            }
          },
          {
            morphSVG: {
              type: "rotational",
              map: "complexity",
              shape: ICON_PATHS.play
            }
          }
        );
    },
    { scope: wrapperRef }
  );

  // Drive the morph direction based on playing state
  useEffect(() => {
    if (!morphTL.current) return;
    if (playing) {
      morphTL.current.reverse();
    } else {
      morphTL.current.play();
    }
  }, [playing]);
  const status = useRadioStore(useShallow((r) => r.playing));
  const state = useMotionValue(status);
  useEffect(() => {
    state.set(status);
  }, [status, state]);
  const handleClick = useCallback(() => {
    const playingAsIs = state.get();
    //If playing (=convert to pause)
    if (playingAsIs) {
      howlPauserRef.current.seek(0);
      howlPauserRef.current.volume(0.3);
      howlPlayingsRef.current.pause();
      howlPauserRef.current.play();
      morphTL.current.play();
      toggle();
    } else {
      howlPlayingsRef.current.seek(0);
      howlPlayerRef.current.seek(0);
      howlPlayerRef.current.once("play", () => {
        morphTL.current.reverse();

        howlPlayingsRef.current.volume(0.3);
        howlPlayingsRef.current.play();
        howlPlayingsRef.current.once("fade", () => {
          toggle();
        });
        howlPlayingsRef.current.fade(0.3, 0.1, 0.5);
      });
      howlPlayerRef.current.play();
    }
    haptics.impact();
  }, [toggle, state, haptics]);

  const isLoading = trackStatus === "loading";

  return (
    <MotionBtn
      ref={wrapperRef}
      onClick={handleClick}
      disabled={isLoading}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "flex items-center justify-center rounded-full",
        "text-fg transition-colors duration-200",
        "hover:text-rouge-400 active:text-rouge-500",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu-400",
        "disabled:opacity-40",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={playing ? "Pause" : "Play"}
    >
      <svg
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[60%] w-[60%]"
      >
        <path
          ref={pathRef}
          d={ICON_PATHS.play}
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </MotionBtn>
  );
};
