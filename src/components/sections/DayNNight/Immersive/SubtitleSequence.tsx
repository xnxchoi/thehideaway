"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

export interface SubtitleSequenceProps {
  /** Ordered caption strings. Render order = play order. */
  captions: string[];
  /** When true, the sequence plays. When false, fades out. */
  active?: boolean;
  /** Milliseconds each caption sits fully on screen. */
  perCardMs?: number;
  /** Milliseconds for the in/out fade. */
  fadeMs?: number;
  /**
   * Called once per sequence cycle at the moment caption[2] (zero-indexed)
   * reaches full opacity + `photoCueOffsetMs`. Used to trigger the photo
   * torrent fade-in slightly after card 3 enters frame, per the
   * handoff doc's "photos begin flowing ~0.5s into the third caption"
   * spec.
   */
  onPhotoCue?: () => void;
  /** Offset within card-3's on-screen window for the photo cue. */
  photoCueOffsetMs?: number;
  /** Bumping this number replays the sequence from card 0. */
  replayKey?: number;
  /**
   * When true, the last caption stays on screen after the sequence
   * completes (parent controls dismissal via `active`). When false
   * (default), the last card fades out `perCardMs` after entering —
   * giving the line its beat, then yielding the surface to whatever
   * sits behind the subtitle layer (e.g. the photo torrent). */
  lingerOnLast?: boolean;
  /** Optional extra classes on the outer fixed wrapper. */
  className?: string;
}

const DEFAULT_PER_CARD_MS = 1800;
const DEFAULT_FADE_MS = 400;
const DEFAULT_PHOTO_CUE_OFFSET_MS = 500;
const CARD_3_INDEX = 2;

/**
 * Movie-subtitle style caption sequence.
 *
 * Renders an ordered list of short caption cards at the bottom of the
 * viewport, one at a time, with cross-fades between them. Built for the
 * Day n Night `/day-n-night` dress→friends-torrent stretch: four cards
 * narrate the dress code (`Dress however you want;` / `Anything goes.`
 * / `But if you're looking for references…` / `Some pictures from our
 * past parties.`) and the photo torrent flows in halfway through
 * card 3.
 *
 * Self-contained — no store/context coupling. The consumer drives
 * activation via the `active` prop and listens for the photo cue via
 * `onPhotoCue`. `replayKey` lets the consumer restart the sequence
 * (incrementing it re-runs the GSAP timeline from card 0).
 *
 * z-index sits below QuickActions (47), Scrubber (45), and the
 * LiminalHandoff cassette (44). Mounted at the ImmersiveView root,
 * NOT inside the pinned horizontal Act track — fixed positioning
 * survives outside the GSAP transform context.
 */
export function SubtitleSequence({
  captions,
  active = true,
  perCardMs = DEFAULT_PER_CARD_MS,
  fadeMs = DEFAULT_FADE_MS,
  onPhotoCue,
  photoCueOffsetMs = DEFAULT_PHOTO_CUE_OFFSET_MS,
  replayKey = 0,
  lingerOnLast = false,
  className
}: SubtitleSequenceProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    active ? 0 : null
  );
  const tweens = useRef<gsap.core.Tween[]>([]);
  const timeouts = useRef<number[]>([]);

  // The onPhotoCue prop can change identity across renders; capture it
  // in a ref so the timeline reads the latest value without
  // re-triggering the effect.
  const photoCueRef = useRef(onPhotoCue);
  photoCueRef.current = onPhotoCue;

  useEffect(() => {
    // Clean up any in-flight tweens / timers from the prior run.
    tweens.current.forEach((t) => t.kill());
    tweens.current = [];
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];

    if (!active || captions.length === 0) {
      setActiveIndex(null);
      return;
    }

    // Sequence layout: each card occupies (fade-in + hold + fade-out).
    // Cards 0..N-1 fire at i * (perCardMs + fadeMs) so the cross-fade
    // window is shared. Photo cue fires at:
    //   (CARD_3_INDEX * (perCardMs + fadeMs)) + photoCueOffsetMs.
    setActiveIndex(0);
    for (let i = 1; i < captions.length; i++) {
      const id = window.setTimeout(
        () => setActiveIndex(i),
        i * (perCardMs + fadeMs)
      );
      timeouts.current.push(id);
    }

    if (onPhotoCue && captions.length > CARD_3_INDEX) {
      const fireAt = CARD_3_INDEX * (perCardMs + fadeMs) + photoCueOffsetMs;
      const id = window.setTimeout(() => {
        photoCueRef.current?.();
      }, fireAt);
      timeouts.current.push(id);
    }

    // Last card fade-out. After the final card has been visible for
    // `perCardMs`, fade it to null so the layer clears. Skip when
    // `lingerOnLast` is true — the parent then controls dismissal
    // via the `active` prop (e.g. when the user scrolls out of the
    // act window).
    if (!lingerOnLast) {
      const lastIndex = captions.length - 1;
      const lastEnter = lastIndex * (perCardMs + fadeMs);
      const lastExit = lastEnter + perCardMs;
      const id = window.setTimeout(() => setActiveIndex(null), lastExit);
      timeouts.current.push(id);
    }

    return () => {
      tweens.current.forEach((t) => t.kill());
      tweens.current = [];
      timeouts.current.forEach((id) => window.clearTimeout(id));
      timeouts.current = [];
    };
    // intentionally re-runs on replayKey change to restart from card 0
  }, [
    active,
    captions,
    perCardMs,
    fadeMs,
    photoCueOffsetMs,
    replayKey,
    lingerOnLast,
    onPhotoCue
  ]);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[clamp(80px,12vh,140px)] z-[43] flex justify-center px-6",
        className
      )}
    >
      <div className="relative h-[2.6em] w-full max-w-[60ch] text-center">
        {captions.map((text, i) => (
          <SubtitleCard
            key={i}
            text={text}
            visible={activeIndex === i}
            fadeMs={fadeMs}
          />
        ))}
      </div>
    </div>
  );
}

interface SubtitleCardProps {
  text: string;
  visible: boolean;
  fadeMs: number;
}

function SubtitleCard({ text, visible, fadeMs }: SubtitleCardProps) {
  return (
    <span
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        "font-serif text-[clamp(1.05rem,1.6vw,1.45rem)] leading-[1.4]",
        "tracking-[0.005em] text-white/95",
        // Soft text-shadow so the caption stays legible over any
        // background brightness (matches the directional vignette in
        // FriendsTorrent's right/warm edge).
        "drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
      )}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${fadeMs}ms ease-out`,
        willChange: "opacity"
      }}
    >
      {text}
    </span>
  );
}
