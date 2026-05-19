"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useDayNNightScene } from "../store";
import { DayNightAudio } from "./DayNightAudio";
import { Scrubber } from "./Scrubber";
import { SunLoader } from "./SunLoader";
import { Timeline } from "./Timeline";

/**
 * Immersive view orchestrator.
 *
 * Layers (back → front), all nested inside Timeline's pinned wrap so the
 * site's smooth-scroll wrapper doesn't break their fixed-positioning:
 *
 *   1. SceneView   — pure CSS sky gradient + horizon glow + sun disk,
 *                    driven by a single per-frame rAF reading the shared
 *                    progress in store.ts.
 *   2. .grain      — atmospheric noise overlay (mix-blend overlay).
 *   3. Track       — 5 acts × 2 copies, horizontally translated by GSAP
 *                    ScrollTrigger for a seamless modulo loop.
 *   4. ScrollHint  — fades out on first scroll.
 *   5. Scrubber    — bottom timeline with section jump labels.
 *   6. SunLoader   — covers everything during load, hands off seamlessly.
 */
export function ImmersiveView() {
  const t = useTranslations("Event.DayNNight");
  const phase = useDayNNightScene((r) => r.phase);
  const [hintHidden, setHintHidden] = useState(false);

  // Hide the scroll hint on first scroll.
  useEffect(() => {
    if (phase !== "playing") return;
    const onScroll = () => setHintHidden(true);
    window.addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  // Reset progress to 0 on mount so a re-entry replays the loader handoff.
  useEffect(() => {
    return () => {
      useDayNNightScene.getState().setProgress(0);
      useDayNNightScene.getState().setPhase("loading");
    };
  }, []);

  return (
    <div className="relative w-full min-h-dvh [--reveal-x:50%] [--reveal-y:50%]">
      {/* Timeline owns the pinned scroll context; SceneView (sky + sun + moon)
          and the grain overlay live inside it so they share the pin. */}
      <Timeline />
      <div
        data-hidden={hintHidden || phase !== "playing"}
        aria-hidden
        className="fixed left-1/2 bottom-20 -translate-x-1/2 z-[45] font-mono text-[10px] tracking-[0.28em] uppercase text-[var(--dn-fg-mute)] hidden lg:inline-flex gap-[10px] items-center pointer-events-none transition-opacity duration-500 ease data-[hidden=true]:opacity-0"
      >
        <span data-dn-scroll-hint-line className="inline-block w-7 h-px bg-current" />
        <span>{t("scrollHint")}</span>
      </div>
      <Scrubber />
      {/* Background audio bed — independent of the main site's Radio.
          Renders its own chrome toggle (top-right, below the view toggle);
          stays inert until the user opts in, then crossfades country/
          hiphop by scene progress. See DayNightAudio.tsx. */}
      <DayNightAudio />
      {phase !== "playing" ? <SunLoader /> : null}
    </div>
  );
}
