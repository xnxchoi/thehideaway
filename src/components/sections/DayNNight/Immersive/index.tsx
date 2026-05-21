"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { useDayNNightScene } from "../store";
import { DayNNightScore } from "./DayNNightScore";
import { DetailsContext } from "./DetailsContext";
import { DetailsDrawer } from "./DetailsDrawer";
import { LiminalHandoff } from "./LiminalHandoff";
import { QuickActions } from "./QuickActions";
import { Scrubber } from "./Scrubber";
import { SeamBridge } from "./SeamBridge";
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
  const phase = useDayNNightScene(useShallow((r) => r.phase));
  const [hintHidden, setHintHidden] = useState(false);
  // Single source of truth for the right-side Details drawer. The
  // top-right QuickActions trigger and the in-act OpeningCard both
  // consume this via DetailsContext.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const setProgress = useDayNNightScene((r) => r.setProgress);
  const setPhase = useDayNNightScene((r) => r.setPhase);
  const resetLiminalHandoff = useDayNNightScene((r) => r.resetLiminalHandoff);
  // Hide the scroll hint on first scroll.
  useEffect(() => {
    if (phase !== "playing") return;
    const onScroll = () => setHintHidden(true);
    window.addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  // Reset progress to 0 on mount so a re-entry replays the loader handoff.
  // Reset the Liminal handoff flag too — the cassette stays "playing" once
  // pressed, but only within a single mount of the immersive view.
  useEffect(() => {
    return () => {
      setProgress(0);
      setPhase("loading");
      resetLiminalHandoff();
    };
  }, [setPhase, setProgress, resetLiminalHandoff]);

  return (
    <DetailsContext.Provider
      value={{ open: detailsOpen, setOpen: setDetailsOpen }}
    >
      <div className="relative min-h-screen w-full p-0 [--reveal-x:50%] [--reveal-y:50%] max-md:min-h-dvh">
        {/* Timeline owns the pinned scroll context; SceneView (sky + sun + moon)
          and the grain overlay live inside it so they share the pin. */}
        <Timeline />
        <div
          data-hidden={hintHidden || phase !== "playing"}
          aria-hidden
          className="ease pointer-events-none fixed bottom-1/4 left-1/2 z-[45] hidden -translate-x-1/2 items-center gap-[10px] font-mono text-[10px] tracking-[0.28em] text-[var(--dn-fg-mute)] uppercase transition-opacity duration-500 data-[hidden=true]:opacity-0 lg:inline-flex"
        >
          <span
            data-dn-scroll-hint-line
            className="inline-block h-px w-7 bg-current"
          />
          <span>{t("scrollHint")}</span>
        </div>
        <Scrubber />
        {/* Bottom action island — accented Reserve + Details capsule.
          DynamicIsland-style frosted pill sitting above the Scrubber
          and ViewToggle. Reserve = inverted fill, Details = outline. */}
        <QuickActions />
        {/* Three-track audio score — independent of the site's Radio.
          Country (Act 1) → House (Act 2, event-driven via the cassette
          handoff) → Hip-hop/house (Act 3, scroll-driven crossfade).
          Toggle button positioning lives in dn.css via
          [data-dn-audio-toggle]. See DayNNightScore.tsx. */}
        <DayNNightScore />
        {/* Cinematic Liminal → Nighttime handoff (§ 2.9 / § 3.6 of
          DAY_N_NIGHT_HANDOFF.md). Subtitle morph + cassette
          placeholder; pressing the cassette fires the store's
          liminal handoff, which lights up the audio score's Sunset
          → Nighttime bed. Stateless on progress + handoff flag — safe
          on re-entry. */}
        <LiminalHandoff />
        {/* Single Details drawer instance — driven by DetailsContext so
          QuickActions and OpeningCard share one drawer. */}
        <DetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} />
        {/* Sticky-pin bookend overlay — rendered HERE (root of immersive
          view) rather than inside Timeline so its position:fixed is
          truly viewport-relative, not captured by the GSAP-pinned
          wrap's transform context / overflow-hidden. */}
        <SeamBridge />
        {phase !== "playing" ? <SunLoader /> : null}
      </div>
    </DetailsContext.Provider>
  );
}
