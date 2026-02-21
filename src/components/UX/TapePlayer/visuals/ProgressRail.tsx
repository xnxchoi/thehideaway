"use client";

import { cn } from "@/lib/utils";
import { useRadioStore } from "@/providers/RadioProvider";
import { useMotionValue, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { useShallow } from "zustand/shallow";

type ProgressRailProps = {
  thin?: boolean;
  className?: string;
};

/**
 * Passive progress display — shows tape travel as a filled bar.
 * Non-interactive: seeking is handled by SeekKnob.
 */
export const ProgressRail = ({ thin = false, className }: ProgressRailProps) => {
  const elapsedTime = useRadioStore(useShallow((t) => t.elapsedTime));
  const remainingTime = useRadioStore(useShallow((t) => t.remainingTime));

  const duration = elapsedTime + remainingTime;
  const progress = duration > 0 ? elapsedTime / duration : 0;

  // Spring the progress for smooth visual updates
  const rawProgress = useMotionValue(progress);
  rawProgress.set(progress);
  const smoothProgress = useSpring(rawProgress, { stiffness: 120, damping: 20 });

  const baseHeight = thin ? 4 : 6;

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default items-center",
        className
      )}
      style={{ height: thin ? 16 : 20 }}
    >
      {/* Track (background) */}
      <div
        className="relative w-full overflow-hidden rounded-full bg-faded-fg/15"
        style={{ height: baseHeight }}
      >
        {/* Fill — spring-animated width */}
        <m.div
          className="absolute inset-y-0 left-0 rounded-full bg-bleu-400"
          style={{ width: smoothProgress.to((v) => `${v * 100}%`) }}
        />
      </div>
    </div>
  );
};
