"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { useDayNNightScene } from "../store";

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
  const initialLoopPosition = useDayNNightScene((r) => r.initialLoopPosition);

  const horizonLoop = useDayNNightScene(useShallow((r) => r.horizonLoop));
  useEffect(() => {
    // Where the loop "lands" after handoff: scene-progress IS the
    // loopProgress now, so the handoff target equals initialLoopPosition
    // (the anchor-act center derived from the live act layout).
    // Pulled at tick-time because Timeline writes it asynchronously
    // after measuring the act track; the store's fallback (0.2) covers
    // the first paint / SSR window.
    const handoffProgress = initialLoopPosition;

    let raf: number;
    // Timeouts scheduled after the rAF completes must be cleared on
    // unmount; otherwise they fire on an unmounted component and race
    // with index.tsx's unmount reset (setProgress(0); setPhase("loading")).
    let hideTimeout: ReturnType<typeof setTimeout> | undefined;
    let playTimeout: ReturnType<typeof setTimeout> | undefined;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const u = Math.min(1, elapsed / durationMs);
      // Map loader-time u into staged scene progress. The loader covers
      // scene-progress [0, horizonLoop] (pre-dawn → sun-at-horizon, the
      // anchor-act center). horizonLoop is pulled per-tick because
      // Timeline writes it asynchronously after measuring the act track.
      //   u 0 → 0.4  -> progress 0 → 0.4·horizonLoop (horizon glow, no sun)
      //   u 0.4 → 1  -> progress 0.4·horizonLoop → horizonLoop (sun rises)
      const stage1End = 0.4 * horizonLoop;
      let progress: number;
      if (u < 0.4) {
        progress = (u / 0.4) * stage1End;
      } else {
        const stage2 = (u - 0.4) / 0.6;
        const eased = 1 - Math.pow(1 - stage2, 2.5);
        progress = stage1End + eased * (horizonLoop - stage1End);
      }
      setProgress(progress);
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${u})`;
      }
      if (u < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPhase("loaded");
        hideTimeout = setTimeout(() => {
          setHiding(true);
          // Match the CSS opacity transition (700ms) before flipping to
          // playing — during this window the sun stays at its loader-end
          // position (HORIZON_Y) and the chrome + backdrop fade out
          // around it.
          playTimeout = setTimeout(() => {
            // Seed the scene at the measured anchor-act center. The
            // celestial sampler shares the same store-derived
            // initialLoopPosition so the sun is at the horizon at this
            // exact loop position — no handoff jump.
            setProgress(handoffProgress);
            setPhase("playing");
          }, 700);
        }, 240);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (hideTimeout !== undefined) clearTimeout(hideTimeout);
      if (playTimeout !== undefined) clearTimeout(playTimeout);
    };
  }, [durationMs, setProgress, setPhase]);

  return (
    <div
      className="ease fixed inset-0 z-[60] text-[var(--dn-fg)] transition-opacity duration-[700ms] data-[hiding=true]:pointer-events-none data-[hiding=true]:opacity-0"
      data-hiding={hiding}
      aria-hidden={hiding}
    >
      <div
        data-dn-loader-spotlight
        aria-hidden
        className="pointer-events-none absolute inset-0"
      />
      <div className="absolute bottom-[18%] left-1/2 grid w-[min(80vw,320px)] -translate-x-1/2 justify-items-center gap-[14px] text-center">
        <p className="font-serif text-[2.4rem] font-bold tracking-[-0.01em] text-[var(--dn-fg)]">
          {t("title")}
        </p>
        <p className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-mute)] uppercase">
          {t("loader.rising")}
        </p>
        <div className="relative h-px w-full overflow-hidden bg-[oklch(from_var(--dn-fg)_l_c_h_/_0.18)]">
          <div
            ref={fillRef}
            className="ease absolute inset-0 origin-left scale-x-0 bg-[oklch(from_var(--dn-fg)_l_c_h_/_0.7)] transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
}
