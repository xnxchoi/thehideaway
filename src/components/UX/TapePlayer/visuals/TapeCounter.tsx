"use client";

import { cn } from "@/lib/utils";
import { useRadioStore } from "@/providers/RadioProvider";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useMemo } from "react";
import { useShallow } from "zustand/shallow";

type TapeCounterProps = {
  height?: number;
  className?: string;
};

/** Format seconds into MM:SS:FF (frames at 30fps for tape-counter feel) */
function formatTapeTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = Math.floor(abs % 60);
  const f = Math.floor((abs % 1) * 30); // 30 "frames" per second
  const sign = seconds < 0 ? "-" : "";
  return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** A single digit cell with flip animation on change */
const DigitCell = ({ char, index }: { char: string; index: number }) => (
  <AnimatePresence mode="popLayout" initial={false}>
    <m.span
      key={`${index}-${char}`}
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -8, opacity: 0 }}
      transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
      className="inline-block"
    >
      {char}
    </m.span>
  </AnimatePresence>
);

/**
 * OP-1 Field-inspired digital tape counter.
 * Shows elapsed time on the left and remaining (negative) on the right.
 * Each digit flips independently when its value changes.
 */
export const TapeCounter = ({ height = 36, className }: TapeCounterProps) => {
  const elapsedTime = useRadioStore(useShallow((t) => t.elapsedTime));
  const remainingTime = useRadioStore(useShallow((t) => t.remainingTime));

  const elapsed = useMemo(() => formatTapeTime(elapsedTime), [elapsedTime]);
  const remaining = useMemo(
    () => formatTapeTime(-remainingTime),
    [remainingTime]
  );

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between rounded-sm bg-off-bg px-3",
        "font-mono text-bleu-200 tabular-nums tracking-tight",
        className
      )}
      style={{ height }}
      role="timer"
      aria-label={`Elapsed: ${elapsed}, Remaining: ${remaining}`}
    >
      {/* Elapsed */}
      <div className="flex items-center gap-0">
        {elapsed.split("").map((char, i) => (
          <DigitCell key={`e-${i}`} char={char} index={i} />
        ))}
      </div>

      {/* Center separator — playback rate indicator */}
      <PlaybackRateIndicator />

      {/* Remaining */}
      <div className="flex items-center gap-0 opacity-60">
        {remaining.split("").map((char, i) => (
          <DigitCell key={`r-${i}`} char={char} index={i} />
        ))}
      </div>
    </div>
  );
};

const PlaybackRateIndicator = () => {
  const playbackRate = useRadioStore(useShallow((t) => t.playbackRate));

  if (playbackRate === 1.0) {
    return (
      <span className="text-[0.6em] opacity-30">
        ▶
      </span>
    );
  }

  return (
    <m.span
      key={playbackRate}
      initial={{ scale: 1.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "text-[0.6em] font-medium",
        playbackRate > 1 ? "text-rouge-400" : "text-bleu-400"
      )}
    >
      {playbackRate}x
    </m.span>
  );
};
