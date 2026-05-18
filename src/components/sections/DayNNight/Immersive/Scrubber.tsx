"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useDayNNightScene } from "../store";
import s from "../styles.module.scss";

/**
 * Bottom timeline scrubber.
 *
 * A ruler-style marker across the foot of the immersive view, modeled on
 * `compsych.konpo.co`. Five labels (one per act) and a position indicator
 * that tracks scroll progress. Clicking a label scrolls the page to that
 * act's offset within the pinned scroll segment.
 *
 * Hidden during loader and on mobile (where the layout stacks vertically
 * and the scrubber's horizontal grammar doesn't apply).
 */
const ACTS = [
  { key: "opening", at: 0.0 },
  { key: "cookout", at: 0.2 },
  { key: "dress", at: 0.4 },
  { key: "night", at: 0.6 },
  { key: "reserve", at: 0.8 }
] as const;

export function Scrubber() {
  const t = useTranslations("Event.DayNNight.scrubber");
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const phase = useDayNNightScene((r) => r.phase);

  // Drive the indicator via rAF reading the same store the scene reads.
  // The scrubber represents the loop progress (scene 0.05 → 1.0 mapped to
  // 0 → 1 on the ruler) so 100% on the scrubber is end-of-loop, not the
  // sky's full night state.
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    const apply = () => {
      const progress = useDayNNightScene.getState().progress;
      // Map scene progress [0.05, 1.0] → scrubber progress [0, 1].
      const pinPct = Math.max(0, Math.min(1, (progress - 0.05) / 0.95));
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = `translateX(${pinPct * 100}%)`;
      }
      if (trackRef.current) {
        trackRef.current.style.setProperty(
          "--scrubber-progress",
          String(pinPct)
        );
      }
      raf = requestAnimationFrame(apply);
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const handleJump = (at: number) => {
    // Compute scroll target — pin starts at top of timelineWrap. The pin
    // distance equals one set width (track.scrollWidth / 2). Acts are at
    // 0, 0.2, 0.4, 0.6, 0.8 across that distance.
    const wrap = document.querySelector('[class*="timelineWrap"]');
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const pinStart = window.scrollY + wrapRect.top;
    const track = document.querySelector('[class*="timelineTrack"]');
    if (!track) return;
    const setWidth = (track as HTMLElement).scrollWidth / 2;
    const targetScroll = pinStart + at * setWidth;
    window.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  if (phase !== "playing") return null;

  return (
    <div className={s.scrubber} aria-hidden>
      <div ref={trackRef} className={s.scrubberTrack}>
        <div className={s.scrubberTicks} />
        <div ref={indicatorRef} className={s.scrubberIndicator} />
      </div>
      <div className={s.scrubberLabels}>
        {ACTS.map((act) => (
          <button
            key={act.key}
            type="button"
            className={s.scrubberLabel}
            onClick={() => handleJump(act.at)}
            style={{ ["--act-at" as string]: act.at }}
          >
            {t(act.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
