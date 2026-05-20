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
 * Preloader — solid black-screen with a single horizontal "horizon" line
 * growing from a point at the viewport center outward to ~85vw wide
 * (compsych.konpo.co pattern).
 *
 * Construction:
 *   - Fully-opaque dark backdrop fixed to the viewport. Covers the scene
 *     underneath so the Opening hero text / sky / sun never leak through.
 *   - One element — `.loaderHorizon` — sits at the vertical center of
 *     the viewport. JS writes `transform: scaleX(u)` each frame where
 *     `u` is the load progress in [0, 1].
 *   - When `u` reaches 1.0, the whole element fades to opacity 0 (CSS
 *     transition, 700 ms). The scene below has its own horizon glow band
 *     sitting at the same y, and the sun is already at HORIZON_Y from
 *     the seamless handoff math, so the line "becomes" the scene's
 *     horizon as the loader fades.
 *
 * Scene `progress` continues to be written each tick (so the sun, sky
 * and act-track stay in sync with handoff math); the chrome itself is
 * pure horizon-line.
 */
export function SunLoader({ durationMs = 2400 }: SunLoaderProps) {
  const t = useTranslations("Event.DayNNight");
  const [hiding, setHiding] = useState(false);
  const horizonRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const setProgress = useDayNNightScene((r) => r.setProgress);
  const setPhase = useDayNNightScene((r) => r.setPhase);
  const initialLoopPosition = useDayNNightScene((r) => r.initialLoopPosition);
  const setLoaderProgress = useDayNNightScene((r) => r.setProgress);

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
      // Mirror the loader's local time u into the store so the Opening
      // act's choreographed reveal can fade copy in lockstep with the
      // sun rise (ComPsych-style — text comes IN during the load, not
      // after). Stays at 1 once the rAF hits u=1; never written again
      // after handoff.
      setLoaderProgress(u);
      if (horizonRef.current) {
        // The element is `position: absolute; top: 50%; left: 50%` with
        // baseline `transform: translate(-50%, -50%) scaleX(0)`. Each
        // tick we write the same translate plus a fresh scaleX(u) so the
        // line stays centered and grows from 0 → full width as u → 1.
        horizonRef.current.style.transform = `translate(-50%, -50%) scaleX(${u})`;
      }
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${u})`;
      }
      if (sunRef.current) {
        // Sun rise — runs in lockstep with the horizon's widening. The
        // sun's CENTER starts one scaled-half-height below the horizon
        // and lands on the horizon at u=1. Combined with .loaderSkyClip
        // (which hides everything below the horizon during the run),
        // the visible portion grows steadily from 0 → a half-disk.
        //
        // Both translateY and scale match the scene's sun at the
        // handoff position (SceneView's sampleCelestial at progress=0
        // returns size 0.115 → scale 0.115/0.085 = 1.353). When the
        // loader unmounts the scene sun is at the same place, same
        // size — no jank, no halo collapse, no "fried egg" pop.
        const SUN_BASE_HALF_PX = 32; // half of the 64px native sun height
        const SUN_HANDOFF_SCALE = 1.353;
        const riseY = (1 - u) * SUN_BASE_HALF_PX * SUN_HANDOFF_SCALE;
        sunRef.current.style.transform = `translateY(${riseY}px) scale(${SUN_HANDOFF_SCALE})`;
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
  }, [
    durationMs,
    setProgress,
    setPhase,
    setLoaderProgress,
    initialLoopPosition,
    horizonLoop
  ]);

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
