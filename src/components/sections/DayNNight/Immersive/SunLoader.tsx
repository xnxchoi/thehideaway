"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDayNNightScene } from "../store";
import s from "../styles.module.scss";

interface SunLoaderProps {
  /** Total ms the loader stays on screen before hand-off. */
  durationMs?: number;
}

/**
 * Sun preloader — two-stage backdrop + chrome.
 *
 * Stage 1 (first 40% of duration) — a wide horizontal stream of light
 *   appears at the horizon line (vertical center of viewport). The sun
 *   itself is still hidden below the horizon. Progress 0 → 0.02.
 *
 * Stage 2 (remaining 60%) — the sun rises out from below the horizon and
 *   ends at exactly the horizon line, then hands off to the scene where it
 *   continues rising further up. Progress 0.02 → 0.05.
 *
 * SceneView reads `progress` and `phase` to render the sun and horizon
 * glow consistently across both stages and into the playing phase — no
 * swap, no flash. This component is just the chrome (title + label +
 * progress bar) and the dark spotlight backdrop.
 */
export function SunLoader({ durationMs = 2400 }: SunLoaderProps) {
  const t = useTranslations("Event.DayNNight");
  const [hiding, setHiding] = useState(false);
  const fillRef = useRef<HTMLDivElement>(null);
  const setProgress = useDayNNightScene((r) => r.setProgress);
  const setPhase = useDayNNightScene((r) => r.setPhase);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const u = Math.min(1, elapsed / durationMs);
      // Map loader-time u into staged scene progress:
      //   u 0 → 0.4  -> progress 0 → 0.02 (horizon glow, no sun)
      //   u 0.4 → 1  -> progress 0.02 → 0.05 (sun rises to horizon)
      let progress: number;
      if (u < 0.4) {
        progress = (u / 0.4) * 0.02;
      } else {
        const stage2 = (u - 0.4) / 0.6;
        const eased = 1 - Math.pow(1 - stage2, 2.5);
        progress = 0.02 + eased * 0.03;
      }
      setProgress(progress);
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${u})`;
      }
      if (u < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("loaded");
        setTimeout(() => {
          setHiding(true);
          // Match the CSS opacity transition (700ms) before flipping to
          // playing — during this window the sun stays at its loader-end
          // position (HORIZON_Y) and the chrome + backdrop fade out around it.
          setTimeout(() => {
            // Seed the scene at loopProgress 0.2 (start of the Cookout
            // act). The celestial sampler is calibrated so that this exact
            // loop position puts the sun at the horizon — matching the
            // loader's end-of-rise position. No handoff jump.
            setProgress(0.05 + 0.2 * 0.95);
            setPhase("playing");
          }, 700);
        }, 240);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [durationMs, setProgress, setPhase]);

  return (
    <div className={s.loader} data-hiding={hiding} aria-hidden={hiding}>
      <div className={s.loaderSpotlight} aria-hidden />
      <div className={s.loaderChrome}>
        <p className={s.loaderTitle}>{t("title")}</p>
        <p className={s.loaderLabel}>{t("loader.rising")}</p>
        <div className={s.loaderBar}>
          <div ref={fillRef} className={s.loaderBarFill} />
        </div>
      </div>
    </div>
  );
}
