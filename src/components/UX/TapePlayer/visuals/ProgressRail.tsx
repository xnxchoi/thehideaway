"use client";

import { SPRING_EASE } from "@/constants/animations";
import { cn } from "@/lib/utils";
import { useNowPlaying } from "@/providers/HideawayFM/hooks";
import {
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform
} from "motion/react";
import * as m from "motion/react-m";
import { useEffect } from "react";

type ProgressRailProps = {
  thin?: boolean;
  className?: string;
};

/**
 * Passive progress display — shows tape travel as a filled bar.
 * Non-interactive: seeking is handled by SeekKnob.
 */
export const ProgressRail = ({
  thin = false,
  className
}: ProgressRailProps) => {
  const nowPlaying = useNowPlaying();
  const progress = useMotionValue(nowPlaying.progress);
  useEffect(() => {
    progress.set(nowPlaying.progress);
  }, [nowPlaying.progress, progress]);
  // Spring the progress for smooth visual updates
  const smoothProgress = useSpring(progress, SPRING_EASE.power4.inOut);
  const widthd = useTransform(smoothProgress, [0, 1], [0, 100]);
  const width = useMotionTemplate`${widthd}%`;
  const baseHeight = useMotionValue(thin ? 4 : 6);
  const height = useMotionValue(thin ? 10 : 16);

  return (
    <m.div
      className={cn(
        "relative flex w-full cursor-default items-center",
        className
      )}
      style={{ height }}
    >
      {/* Track (background) */}
      <m.div
        className="bg-faded-fg/15 relative w-full overflow-hidden rounded-full"
        style={{ height: baseHeight }}
      >
        {/* Fill — spring-animated width */}
        <m.div
          className="absolute inset-y-0 left-0 rounded-full bg-bleu-400"
          style={{ width }}
        />
      </m.div>
    </m.div>
  );
};
