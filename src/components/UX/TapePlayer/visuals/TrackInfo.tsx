"use client";

import { cn } from "@/lib/utils";
import { useRadioStore } from "@/providers/RadioProvider";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

type TrackInfoProps = {
  /** "hero" for large display, "compact" for single/two line */
  size?: "hero" | "full" | "compact";
  className?: string;
};

/**
 * Track metadata display — artist, title, album.
 * Adapts presentation based on size variant.
 * Animates on track change via AnimatePresence.
 */
export const TrackInfo = ({ size = "full", className }: TrackInfoProps) => {
  const tracks = useRadioStore((t) => t.tracks);
  const currentIndex = useRadioStore(useShallow((t) => t.currentIndex));

  const track = useMemo(
    () => tracks[currentIndex] ?? null,
    [tracks, currentIndex]
  );

  if (!track) return null;

  if (size === "compact") {
    return (
      <CompactInfo
        key={track.id}
        artist={track.artist}
        title={track.title}
        className={className}
      />
    );
  }

  if (size === "hero") {
    return (
      <HeroInfo
        key={track.id}
        artist={track.artist}
        title={track.title}
        album={track.album}
        className={className}
      />
    );
  }

  return (
    <FullInfo
      key={track.id}
      artist={track.artist}
      title={track.title}
      album={track.album}
      className={className}
    />
  );
};

type InfoData = {
  artist: string;
  title: string;
  album?: string;
  className?: string;
};

const FullInfo = ({ artist, title, album, className }: InfoData) => (
  <AnimatePresence mode="wait">
    <m.div
      key={`${artist}-${title}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className={cn("flex flex-col items-center gap-0.5 text-center", className)}
    >
      <span className="font-sans text-xs font-medium uppercase tracking-widest text-faded-fg">
        {artist}
      </span>
      <span className="font-serif text-lg font-bold italic leading-tight">
        {title}
      </span>
      {album && (
        <span className="font-sans text-[0.65rem] tracking-wide text-faded-fg/60">
          {album}
        </span>
      )}
    </m.div>
  </AnimatePresence>
);

const HeroInfo = ({ artist, title, album, className }: InfoData) => (
  <AnimatePresence mode="wait">
    <m.div
      key={`${artist}-${title}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className={cn("flex flex-col items-center gap-1 text-center", className)}
    >
      <span className="font-sans text-sm font-medium uppercase tracking-[0.2em] text-faded-fg">
        {artist}
      </span>
      <span className="font-serif text-3xl font-bold italic leading-tight min-sm:text-4xl">
        {title}
      </span>
      {album && (
        <span className="font-sans text-xs tracking-wide text-faded-fg/50">
          {album}
        </span>
      )}
    </m.div>
  </AnimatePresence>
);

const CompactInfo = ({
  artist,
  title,
  className,
}: Omit<InfoData, "album">) => (
  <AnimatePresence mode="wait">
    <m.div
      key={`${artist}-${title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex min-w-0 items-center gap-1.5 truncate text-sm",
        className
      )}
    >
      <span className="truncate font-sans text-xs font-medium text-faded-fg">
        {artist}
      </span>
      <span className="text-faded-fg/30">·</span>
      <span className="truncate font-serif text-sm font-semibold italic">
        {title}
      </span>
    </m.div>
  </AnimatePresence>
);
