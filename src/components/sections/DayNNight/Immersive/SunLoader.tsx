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
 * Sun preloader — backdrop + chrome only.
 *
 * The actual sun visual is owned by `SceneView`; this loader is a dark
 * spotlight backdrop with a transparent cutout at the sun's current
 * position, plus the title + label + progress chrome. The backdrop reveals
 * the sun through its cutout as the sun rises (via store `progress`
 * 0 → 0.05). When the loader completes, the backdrop and chrome fade out
 * together while the sun smoothly migrates to its scene-arc start position
 * — one continuous element, no swap.
 */
export function SunLoader({ durationMs = 1700 }: SunLoaderProps) {
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
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out for the rise.
      const eased = 1 - Math.pow(1 - t, 2.5);
      setProgress(eased * 0.05);
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${eased})`;
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("loaded");
        // Brief beat so the user registers the completed rise.
        setTimeout(() => {
          setHiding(true);
          // Match the CSS opacity transition (700ms) before flipping to
          // playing — that's the window during which the sun migrates
          // from loader-center to its scene-arc start.
          setTimeout(() => setPhase("playing"), 700);
        }, 240);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [durationMs, setProgress, setPhase]);

  return (
    <div className={s.loader} data-hiding={hiding} aria-hidden={hiding}>
      {/* Spotlight cutout — radial gradient with transparent center at the
          sun's screen position (CSS vars set by SceneView). */}
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
