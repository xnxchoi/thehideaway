"use client";

import { cn } from "@/lib/utils";
import { useRadio, useRadioStore } from "@/providers/RadioProvider";
import * as m from "motion/react-m";
import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import { useHaptics } from "../hooks/useHaptics";

type RewindButtonProps = {
  size?: number;
  className?: string;
};

/**
 * Rewind / skip-back control.
 * - If elapsed > 3s: seeks to beginning of current track
 * - If elapsed <= 3s: goes to previous track
 * - Rotation -30deg spring on press for tactile feel
 */
export const RewindButton = ({ size = 44, className }: RewindButtonProps) => {
  const { seek, setCurrentTrack } = useRadio();
  const elapsedTime = useRadioStore(useShallow((t) => t.elapsedTime));
  const currentIndex = useRadioStore(useShallow((t) => t.currentIndex));
  const haptics = useHaptics();

  const handleClick = useCallback(() => {
    if (elapsedTime > 3) {
      // Rewind to start of track
      seek(0);
    } else {
      // Go to previous track
      setCurrentTrack(currentIndex - 1);
    }
    haptics.impact();
  }, [elapsedTime, seek, setCurrentTrack, currentIndex, haptics]);

  return (
    <m.button
      onClick={handleClick}
      whileTap={{ scale: 0.88, rotate: -30 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={cn(
        "flex items-center justify-center rounded-full",
        "text-fg transition-colors duration-200",
        "hover:text-rouge-400 active:text-rouge-500",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bleu-400",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Rewind"
    >
      <svg
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[55%] w-[55%]"
      >
        {/* Double-arrow rewind icon */}
        <path
          d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7L6.85355 10.1464C7.04882 10.3417 7.04882 10.6583 6.85355 10.8536C6.65829 11.0488 6.34171 11.0488 6.14645 10.8536L2.64645 7.35355C2.45118 7.15829 2.45118 6.84171 2.64645 6.64645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645ZM12.8536 3.14645C13.0488 3.34171 13.0488 3.65829 12.8536 3.85355L9.70711 7L12.8536 10.1464C13.0488 10.3417 13.0488 10.6583 12.8536 10.8536C12.6583 11.0488 12.3417 11.0488 12.1464 10.8536L8.64645 7.35355C8.45118 7.15829 8.45118 6.84171 8.64645 6.64645L12.1464 3.14645C12.3417 2.95118 12.6583 2.95118 12.8536 3.14645Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </svg>
    </m.button>
  );
};
