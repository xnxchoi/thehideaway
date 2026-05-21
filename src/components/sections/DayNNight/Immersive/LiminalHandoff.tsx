"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { useDayNNightScene } from "../store";
import { Tape3DScene } from "@/components/UX/TapePlayer/visuals/Tape3DScene";
import type { TapeCameraOverride } from "@/components/UX/TapePlayer/visuals/TapeModel";

/**
 * Cinematic handoff between Liminal (Act III edge) and Nighttime
 * (Act IV) — scroll-driven, no user click required.
 *
 * The choreography, written end-to-end:
 *
 *   progress < 0.40                  → off, nothing on stage
 *   0.40 ≤ progress < 0.50           → Tape3DScene translates up,
 *                                       camera frames close + display
 *                                       flat to viewport. Display:
 *                                       "The sun is setting." (static)
 *   0.50 ≤ progress < 0.55           → Display morphs to
 *                                       "Time for a change of pace."
 *                                       (still static)
 *   progress ≥ 0.55, not yet fired   → enter FIRE phase:
 *                                         * play tape_play.ogg (one-shot)
 *                                         * 500ms later, play
 *                                           tape_playing.ogg (loop)
 *                                         * fire() flips
 *                                           liminalHandoffFired = true
 *   fired                            → after LiminalRadioController's
 *                                       PLAY_DELAY_MS (~4.5s), HideawayFM
 *                                       takes over. Display switches to
 *                                       marquee mode, painting the
 *                                       current HideawayFM track string.
 *
 * The component is *stateless on progress + fired* aside from the
 * one-shot SFX ref guard, so scrolling back through Liminal after
 * firing leaves the post-handoff state intact (HideawayFM keeps
 * playing; the display stays in marquee mode).
 *
 * Reduced motion: tape SFX is preserved (sound isn't motion). The
 * Tape3DScene's own GSAP rotation is scroll-pinned regardless.
 */

const CAPTION_A_IN = 0.4;
const CAPTION_B_IN = 0.5;
const FIRE_IN = 0.55;

const TAPE_PLAY_SFX = "/assets/audio/tape_play.ogg";
const TAPE_PLAYING_SFX = "/assets/audio/tape_playing.ogg";

const TAPE_PLAYING_LOOP_MS = 4000; // stops as HideawayFM picks up

type Phase = "off" | "caption-a" | "caption-b" | "fire" | "post-fire";

function resolvePhase(progress: number, fired: boolean): Phase {
  if (fired) return "post-fire";
  if (progress < CAPTION_A_IN) return "off";
  if (progress < CAPTION_B_IN) return "caption-a";
  if (progress < FIRE_IN) return "caption-b";
  return "fire";
}

// Cinematic frame for the cassette reveal — closer than the standard
// Radio frame and rotated so the display is roughly face-on. Tuned by
// eye against the GLTF's default orientation; reset behaviour in
// TapeModel will lerp smoothly between this and the default frame
// when the cassette unmounts.
const CINEMATIC_FRAME: TapeCameraOverride = {
  position: [0, -0.5, 9],
  target: [0, -0.5, 0],
  fov: 9
};

export function LiminalHandoff() {
  const t = useTranslations("Event.DayNNight.liminal");
  const { progress, fired, fire } = useDayNNightScene(
    useShallow((r) => ({
      progress: r.progress,
      fired: r.liminalHandoffFired,
      fire: r.fireLiminalHandoff
    }))
  );
  const phase = resolvePhase(progress, fired);

  // Stage visibility: appear from caption-a onward; once visible,
  // stay (so scrolling back doesn't re-launch the reveal animation).
  const stageSeenRef = useRef(false);
  const stageOn = phase !== "off";
  if (stageOn) stageSeenRef.current = true;
  const stageMounted = stageOn || stageSeenRef.current;

  // SFX guard: fire the tape sequence exactly once when we first
  // enter the FIRE phase. Subsequent re-entries (e.g. user scrolling
  // forward then back then forward) are no-ops because `fired` is
  // already true and we never re-enter FIRE.
  const sfxFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== "fire" || sfxFiredRef.current) return;
    sfxFiredRef.current = true;

    const playSfx = (src: string, loop: boolean): HTMLAudioElement | null => {
      try {
        const a = new Audio(src);
        a.loop = loop;
        a.volume = 0.8;
        void a.play().catch(() => {});
        return a;
      } catch {
        return null;
      }
    };

    const playEl = playSfx(TAPE_PLAY_SFX, false);
    let loopEl: HTMLAudioElement | null = null;
    const loopStartId = window.setTimeout(() => {
      loopEl = playSfx(TAPE_PLAYING_SFX, true);
    }, 500);
    const loopStopId = window.setTimeout(() => {
      loopEl?.pause();
      loopEl = null;
    }, TAPE_PLAYING_LOOP_MS);

    // Fire on the same tick — LiminalRadioController watches this flag
    // and starts HideawayFM after its own PLAY_DELAY_MS hold. The two
    // halves are intentionally decoupled (this owns the SFX, the
    // controller owns the radio).
    fire();

    return () => {
      window.clearTimeout(loopStartId);
      window.clearTimeout(loopStopId);
      playEl?.pause();
      loopEl?.pause();
    };
  }, [phase, fire]);

  // Display content: cinematic caption during caption phases (static
  // ticker so it sits centered, paired with the CRT scanline overlay
  // baked into Tape3DScene); pass null when fired so the tape's own
  // HideawayFM-fed marquee paints the now-playing string.
  const displayOverride = (() => {
    if (phase === "caption-a")
      return { text: t("sunsetSubtitle"), tickerMode: "static" as const };
    if (phase === "caption-b" || phase === "fire")
      return { text: t("changeOfPace"), tickerMode: "static" as const };
    return null; // post-fire / off → HideawayFM marquee
  })();

  if (!stageMounted) return null;

  return (
    <div
      aria-hidden={phase === "off" || undefined}
      // Stack lifted clear of the QuickActions pill (z-47) and the
      // Scrubber (z-45). The Tape3DScene wraps a fixed-aspect div, so
      // we constrain the host to a viewport-anchored frame here.
      className="pointer-events-none fixed inset-x-0 bottom-[110px] z-[44] mx-auto flex justify-center md:bottom-[170px] xl:bottom-[190px]"
      data-dn-tape-trigger-host
    >
      {/* ScrollTrigger anchor — TapeModel's GSAP timeline needs a real
          DOM element to bind to. Unique id avoids collision with the
          radio surface on other pages. */}
      <div
        id="dn-liminal-tape-trigger"
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      />
      <div
        data-dn-tape-stage
        data-stage-on={stageOn || undefined}
        className="ease pointer-events-auto w-[min(86vw,520px)] origin-bottom transition-[transform,opacity] duration-[520ms] data-[stage-on]:translate-y-0 data-[stage-on]:opacity-100 [&:not([data-stage-on])]:translate-y-24 [&:not([data-stage-on])]:opacity-0"
      >
        <Tape3DScene
          scrollTriggerId="dn-liminal-tape-trigger"
          outerClassName="relative h-[280px] w-full xl:h-[320px]"
          cameraOverride={CINEMATIC_FRAME}
          displayOverride={displayOverride}
        />
      </div>
    </div>
  );
}
