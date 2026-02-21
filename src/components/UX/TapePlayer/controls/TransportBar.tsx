"use client";

import { cn } from "@/lib/utils";
import { ForwardButton } from "./ForwardButton";
import { PlayPauseButton } from "./PlayPauseButton";
import { RewindButton } from "./RewindButton";
import { SpeedDial } from "./SpeedDial";

type TransportBarProps = {
  compact?: boolean;
  showDial?: boolean;
  className?: string;
};

/**
 * Groups transport controls into a horizontal strip.
 * Compact mode hides the speed dial and reduces button sizes.
 */
export const TransportBar = ({
  compact = false,
  showDial = true,
  className,
}: TransportBarProps) => {
  const buttonSize = compact ? 36 : 48;
  const dialSize = compact ? 48 : 64;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        compact ? "gap-2" : "gap-6",
        className
      )}
    >
      <RewindButton size={buttonSize} />
      <PlayPauseButton size={buttonSize + (compact ? 4 : 8)} />
      <ForwardButton size={buttonSize} />
      {showDial && <SpeedDial size={dialSize} />}
    </div>
  );
};
