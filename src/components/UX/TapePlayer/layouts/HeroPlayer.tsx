"use client";

import { cn } from "@/lib/utils";
import { useRadioStore } from "@/providers/RadioProvider";
import * as m from "motion/react-m";
import { useRef } from "react";
import { useShallow } from "zustand/shallow";
import { PlayPauseButton } from "../controls/PlayPauseButton";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { TapeReels } from "../visuals/TapeReels";
import { TrackInfo } from "../visuals/TrackInfo";
import { SIZES } from "../constants";

type HeroPlayerProps = {
  className?: string;
};

/**
 * Hero section variant — large, scroll-linked, meant to grab attention.
 *
 * The tape reels rotate gently as the user scrolls past, hinting
 * that this is interactive. A large play button overlays the center.
 * Clicking or tapping transitions the user into the full player experience.
 */
export const HeroPlayer = ({ className }: HeroPlayerProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const { opacity, y } = useScrollReveal(containerRef);
  const hasRadio = useRadioStore(useShallow((t) => t.hasRadio));
  const sizes = SIZES.hero;

  if (!hasRadio) return null;

  return (
    <m.section
      ref={containerRef}
      className={cn(
        "relative flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden py-16",
        className
      )}
      style={{ opacity, y }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--bleu-400) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Large tape reels */}
        <TapeReels diameter={sizes.reelDiameter} />

        {/* Track metadata — hero scale */}
        <TrackInfo size="hero" />

        {/* Prominent play button */}
        <PlayPauseButton size={64} className="mt-2" />

        {/* Scroll hint */}
        <m.div
          className="mt-8 flex flex-col items-center gap-1 text-faded-fg/40"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <span className="font-mono text-[0.6rem] uppercase tracking-widest">
            scroll to explore
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 15 15"
            fill="none"
            className="opacity-50"
          >
            <path
              d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          </svg>
        </m.div>
      </div>
    </m.section>
  );
};
