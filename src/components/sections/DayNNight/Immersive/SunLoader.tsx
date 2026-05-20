"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDayNNightScene, useDayNNightStore } from "../store";

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
  const setLoaderProgress = useDayNNightScene((r) => r.setLoaderProgress);
  // Imperative store handle so the rAF tick reads fresh
  // `horizonLoop` + `initialLoopPosition` even when Timeline writes the
  // measured layout AFTER this effect started. Previously these were
  // captured by closure at effect creation time — the FALLBACK_HORIZON
  // value `0` leaked into the entire loader run and collapsed both
  // stage bounds to 0→0 (sun never visibly rose; santa-loop H1).
  const store = useDayNNightStore();

  useEffect(() => {
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
      // anchor-act center). horizonLoop is pulled per-tick from the
      // store because Timeline writes it asynchronously after measuring
      // the act track — closure-captured values would stale at the
      // FALLBACK_HORIZON (0) for the entire loader run.
      const horizonLoop = store.getState().horizonLoop;
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
            // Seed the scene at the measured anchor-act center. Read
            // fresh from the store so a late layout measurement
            // doesn't strand us at FALLBACK_HORIZON. Bumped 700ms →
            // 800ms to give the 700ms backdrop fade a 100ms buffer
            // before Opening's reveal fires (santa-loop S2).
            setProgress(store.getState().initialLoopPosition);
            setPhase("playing");
          }, 800);
        }, 240);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (hideTimeout !== undefined) clearTimeout(hideTimeout);
      if (playTimeout !== undefined) clearTimeout(playTimeout);
    };
  }, [durationMs, setProgress, setPhase, setLoaderProgress, store]);

  return (
    <div
      className="group pointer-events-none fixed inset-0 z-[60] text-[var(--dn-fg)]"
      data-hiding={hiding}
      aria-hidden
    >
      {/* Dark backdrop — fades to 0 during the handoff (700ms) so the
          scene underneath becomes visible. */}
      <div
        aria-hidden
        className="ease absolute inset-0 bg-faded-black/99 transition-opacity duration-700 group-data-[hiding='true']:opacity-0"
      />

      {/* Sky clip — everything inside this absolute container is hidden
          below the viewport's vertical midline. The sun rises through
          the clip until its center lands on the horizon at u=1. The May
          19 effect lived here as a SCSS `.loaderSkyClip` rule; Tailwind
          arbitrary-property syntax is `[clip-path:value]` (not
          `clip-[path:value]` which silently no-ops). */}
      <div
        className="pointer-events-none absolute inset-0 [clip-path:inset(0_0_50%_0)]"
        aria-hidden
      >
        {/* Sun — rises from one half-height below the horizon to the
            horizon center. Transform is written every rAF tick by the
            useEffect above; this ref bind was previously missing,
            making the rAF writes no-ops against null. The sun sits at
            the viewport's vertical midline (top: 50%) and is centered
            horizontally. */}
        <div
          ref={sunRef}
          className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,oklch(92%_0.12_75)_0%,oklch(85%_0.16_60)_40%,oklch(75%_0.18_45)_70%,oklch(65%_0.14_35/0)_100%)] shadow-[0_0_40px_0_oklch(85%_0.16_60/0.5),0_0_80px_0_oklch(80%_0.14_50/0.3)] will-change-transform group-data-[hiding='true']:opacity-0 group-data-[hiding='true']:transition-opacity group-data-[hiding='true']:duration-700"
          aria-hidden
        />
      </div>

      {/* Horizon line — grows from a point at center outward via scaleX.
          Two Tailwind typos fixed: `cubir-bezier` → `cubic-bezier`, and
          the transition syntax was inline arbitrary-value not
          single-property. Fades out (opacity 0.7s) during handoff so
          the scene's own horizon glow takes over. */}
      <div
        ref={horizonRef}
        className="absolute top-1/2 left-1/2 h-px w-[min(85vw,1400px)] origin-center -translate-x-1/2 -translate-y-1/2 scale-0 bg-faded-white/85 shadow-[0_0_6px_0_oklch(85%_0.08_70/0.35),0_0_18px_0_oklch(80%_0.06_60/0.18)] transition-[transform_0.3s_cubic-bezier(0.25,0.46,0.45,0.95),opacity_0.7s_ease] group-data-[hiding='true']:opacity-0"
        aria-hidden
      />
      <div className="relative h-px w-full overflow-hidden bg-[oklch(from_var(--dn-fg)_l_c_h_/_0.18)]">
        <div
          ref={fillRef}
          className="ease absolute inset-0 origin-left scale-x-0 bg-[oklch(from_var(--dn-fg)_l_c_h_/_0.7)] transition-transform duration-300"
        />
      </div>

      {/* Chrome — title, label, progress bar. Anchored bottom-center so
          the type doesn't overlap the rising sun (which lives at
          vertical mid). The earlier version dropped this positioning
          and the chrome collapsed to top-left. */}
      <div
        className="pointer-events-none absolute bottom-[18%] left-1/2 grid w-[min(80vw,360px)] -translate-x-1/2 justify-items-center gap-[14px] text-center group-data-[hiding='true']:opacity-0 group-data-[hiding='true']:transition-opacity group-data-[hiding='true']:duration-700"
        aria-hidden
      >
        <p className="font-serif text-[2.4rem] font-bold tracking-[-0.01em] text-[var(--dn-fg)]">
          {t("title")}
        </p>
        <p className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-mute)] uppercase">
          {t("loader.rising")}
        </p>
      </div>
    </div>
  );
}
