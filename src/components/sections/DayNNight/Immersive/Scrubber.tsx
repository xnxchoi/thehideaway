"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useDayNNightScene } from "../store";
import s from "../styles.module.scss";

/**
 * Bottom timeline scrubber — flat, compsych-style.
 *
 * A single continuous tick row across the full width with one short
 * indicator bar floating above. The indicator slides horizontally to
 * track loop progress. Labels sit below the ruler — the active label
 * takes the foreground weight; clicking any label scrolls forward to
 * the next occurrence of that section in the loop (forward-only).
 *
 * No backdrop blur, no per-section fills, no gradients. Flat on the sky.
 */
const SECTIONS = [
  { key: "opening", at: 0.0 },
  { key: "cookout", at: 0.2 },
  { key: "dress", at: 0.4 },
  { key: "night", at: 0.6 },
  { key: "reserve", at: 0.8 }
] as const;

const SECTION_SIZE = 1 / SECTIONS.length;

export function Scrubber() {
  const t = useTranslations("Event.DayNNight.scrubber");
  const phase = useDayNNightScene((r) => r.phase);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Array<HTMLButtonElement | null>>([
    null,
    null,
    null,
    null,
    null
  ]);

  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;

    const apply = () => {
      const progress = useDayNNightScene.getState().progress;
      const loopProgress = Math.max(
        0,
        Math.min(0.99999, (progress - 0.05) / 0.95)
      );
      const currentSection = Math.floor(loopProgress / SECTION_SIZE);

      if (indicatorRef.current && trackRef.current) {
        const trackWidth = trackRef.current.clientWidth;
        const x = loopProgress * trackWidth;
        indicatorRef.current.style.transform = `translateX(${x}px)`;
      }

      labelRefs.current.forEach((label, i) => {
        if (!label) return;
        label.setAttribute("data-active", String(i === currentSection));
      });

      raf = requestAnimationFrame(apply);
    };

    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const handleJump = (targetLoopPos: number) => {
    const wrap = document.querySelector('[class*="timelineWrap"]');
    const track = document.querySelector('[class*="timelineTrack"]');
    if (!wrap || !track) return;
    const wrapRect = wrap.getBoundingClientRect();
    const pinStart = window.scrollY + wrapRect.top;
    const setWidth = (track as HTMLElement).scrollWidth / 2;
    const INITIAL_LOOP_POSITION = 0.5;
    const totalScrolled = window.scrollY - pinStart;
    if (totalScrolled < 0) {
      window.scrollTo({
        top: pinStart + (targetLoopPos - INITIAL_LOOP_POSITION) * setWidth,
        behavior: "smooth"
      });
      return;
    }
    const currentLoopPos =
      (INITIAL_LOOP_POSITION * setWidth + totalScrolled) % setWidth;
    const targetPx = targetLoopPos * setWidth;
    const delta = (targetPx - currentLoopPos + setWidth) % setWidth;
    // If the target is the current section, advance a full loop so the
    // click still moves — keeps the user's forward-only rule.
    const forwardDelta = delta < 1 ? setWidth : delta;
    window.scrollTo({
      top: window.scrollY + forwardDelta,
      behavior: "smooth"
    });
  };

  if (phase !== "playing") return null;

  return (
    <div className={s.scrubber} aria-hidden>
      <div ref={trackRef} className={s.scrubberTrack}>
        <div ref={indicatorRef} className={s.scrubberIndicator} aria-hidden />
      </div>
      <div className={s.scrubberLabels}>
        {SECTIONS.map((sec, i) => (
          <button
            key={sec.key}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            type="button"
            className={s.scrubberLabel}
            onClick={() => handleJump(sec.at)}
          >
            {t(sec.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
