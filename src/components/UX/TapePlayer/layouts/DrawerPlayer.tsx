"use client";

import { cn } from "@/lib/utils";
import { TransportBar } from "../controls/TransportBar";
import { ProgressRail } from "../visuals/ProgressRail";
import { TapeCounter } from "../visuals/TapeCounter";
import { TapeReels } from "../visuals/TapeReels";
import { TrackInfo } from "../visuals/TrackInfo";
import { SIZES } from "../constants";

type DrawerPlayerProps = {
  className?: string;
};

/**
 * Mobile drawer variant — touch-optimized with small reels.
 *
 * Layout (horizontal feel):
 *   Left: mini TapeReels
 *   Right:
 *     TrackInfo (two lines)
 *     ProgressRail
 *     TapeCounter + TransportBar
 */
export const DrawerPlayer = ({ className }: DrawerPlayerProps) => {
  const sizes = SIZES.drawer;

  return (
    <div className={cn("flex w-full items-start gap-3 px-3 py-3", className)}>
      {/* Mini reels on the left */}
      <div className="flex shrink-0 items-center justify-center pt-1">
        <TapeReels diameter={sizes.reelDiameter} className="w-[120px]" />
      </div>

      {/* Info + controls on the right */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <TrackInfo size="compact" />
        <ProgressRail thin className="w-full" />
        <TapeCounter
          height={sizes.counterHeight}
          className="w-full text-[0.6rem]"
        />
        <TransportBar compact />
      </div>
    </div>
  );
};
