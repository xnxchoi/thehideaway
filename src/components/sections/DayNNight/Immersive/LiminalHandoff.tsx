"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
import { useShallow } from "zustand/shallow";
import { useDayNNightScene } from "../store";

/**
 * Cinematic handoff between Liminal (Act 2) and Nighttime (Act 3) — see
 * `readmes/DAY_N_NIGHT_HANDOFF.md` § 2.9 for the locked frame-by-frame
 * choreography and § 3.6 for the component spec.
 *
 * Layers owned here, in render order:
 *   1. Subtitle line (cinematic "subtitle in a film" register, not
 *      ordinary UI copy). Morphs through two phases.
 *   2. Cassette card (CSS placeholder — the 3D Tape3DScene is deferred
 *      per § 5 path 1 to avoid the TapePlayer ↔ HideawayFM coupling).
 *      Whooshes up from below on cue.
 *   3. The actual handoff trigger: the cassette's play button. Calls
 *      `fireLiminalHandoff()` on the store, which lights up the audio
 *      score's Sunset → Nighttime bed (see `<DayNNightScore>`).
 *
 * Phases, all derived purely from `progress` + `liminalHandoffFired`
 * so the component is stateless / re-entry-safe (scrolling back into
 * Liminal after firing leaves the post-handoff state intact):
 *
 *   progress < 0.40                          → nothing on stage
 *   0.40 ≤ progress < 0.50                   → subtitle A ("The sun
 *                                              is setting.")
 *   0.50 ≤ progress < 0.55, NOT fired        → cassette whooshes up,
 *                                              subtitle A held
 *   progress ≥ 0.55, NOT fired               → subtitle morphs to B
 *                                              ("Time for a change of
 *                                              pace."), cassette
 *                                              breathes to invite click
 *   fired                                    → subtitle hidden, cassette
 *                                              stays on stage with reels
 *                                              quietly spinning
 *
 * Click SFX is synthesized inline via Web Audio so we don't need to
 * ship a separate cassette-click.opus asset — short noise burst with
 * a sharp envelope, ≤ 200ms per the spec. Falls through silently if
 * AudioContext is unavailable.
 *
 * Reduced motion: whoosh / breathe / reel-spin all collapse to static
 * states; audio click is preserved (sound isn't motion).
 */

// Progress thresholds — must stay coherent with DayNNightScore's
// DAY_FADE_OUT (0.55) and NIGHT_FADE_IN (0.55). The subtitle B / invite
// phase starts at exactly DAY_FADE_OUT so the country track is at zero
// gain by the time the cassette becomes pressable.
const SUBTITLE_IN = 0.4;
const CASSETTE_IN = 0.5;
const INVITE_IN = 0.55;
const HANDOFF_OUT = 0.7; // above this, post-handoff visuals only

type Phase = "off" | "subtitle-a" | "cassette-arriving" | "invite" | "fired";

function resolvePhase(progress: number, fired: boolean): Phase {
  if (fired) return "fired";
  if (progress < SUBTITLE_IN) return "off";
  if (progress < CASSETTE_IN) return "subtitle-a";
  if (progress < INVITE_IN) return "cassette-arriving";
  if (progress < HANDOFF_OUT) return "invite";
  return "off";
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Synthesized cassette-button click — short white-noise burst with
 * a sharp attack and exponential decay. Returns a function that
 * plays the click; pass to the button's onClick.
 *
 * AudioContext is created lazily on first call so we stay inside
 * the user-gesture stack (iOS Safari requirement). Silent if Web
 * Audio is unavailable.
 */
function useClickSfx(): () => void {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      const w = window as unknown as {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctx = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctx) return;
      let ctx = ctxRef.current;
      if (!ctx) {
        ctx = new Ctx();
        ctxRef.current = ctx;
      }
      void ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      // Two-layer click: a noise burst for the mechanical "snap" and a
      // tiny low sine thump for the body of the keypress.
      const noiseDur = 0.07;
      const buffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * noiseDur),
        ctx.sampleRate
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.6;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.42, now + 0.003);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1800;
      noise.connect(hp).connect(noiseGain).connect(ctx.destination);
      noise.start(now);
      noise.stop(now + noiseDur);
      const thump = ctx.createOscillator();
      thump.type = "sine";
      thump.frequency.setValueAtTime(180, now);
      thump.frequency.exponentialRampToValueAtTime(60, now + 0.09);
      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(0.0001, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.22, now + 0.005);
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      thump.connect(thumpGain).connect(ctx.destination);
      thump.start(now);
      thump.stop(now + 0.13);
    } catch {
      // No-op on any audio failure — visual handoff still fires.
    }
  }, []);
}

export function LiminalHandoff() {
  const t = useTranslations("Event.DayNNight.liminal");
  const reduced = usePrefersReducedMotion();
  const playClick = useClickSfx();
  const { progress, fired, fire } = useDayNNightScene(
    useShallow((r) => ({
      progress: r.progress,
      fired: r.liminalHandoffFired,
      fire: r.fireLiminalHandoff
    }))
  );
  const phase = resolvePhase(progress, fired);

  // Lock the cassette on stage from the moment it first arrives — once
  // it's in, it stays for the rest of the session (or until the
  // immersive view unmounts and resets the store). Prevents the whoosh
  // animation from re-firing if the user scrolls back through Liminal.
  const cassetteSeenRef = useRef(false);
  const cassetteShouldShow =
    phase === "cassette-arriving" || phase === "invite" || phase === "fired";
  if (cassetteShouldShow) cassetteSeenRef.current = true;
  const cassetteOn = cassetteShouldShow || cassetteSeenRef.current;

  const subtitleKey =
    phase === "subtitle-a" || phase === "cassette-arriving"
      ? "sunsetSubtitle"
      : phase === "invite"
        ? "changeOfPace"
        : null;

  const onClick = () => {
    if (fired) return;
    playClick();
    fire();
  };

  return (
    <div
      aria-hidden={phase === "off" || undefined}
      className="pointer-events-none fixed inset-x-0 bottom-[12vh] z-[44] flex flex-col items-center gap-7 max-md:bottom-[10vh] xl:gap-9"
    >
      {/* Subtitle — cinematic register, mono-caps with letter-spacing. */}
      <div className="relative flex h-[2.2em] w-[min(86vw,640px)] items-end justify-center text-center">
        <AnimatePresence mode="wait">
          {subtitleKey ? (
            <m.p
              key={subtitleKey}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{
                duration: reduced ? 0.12 : 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="font-serif text-[clamp(1.15rem,2.2vw,1.65rem)] leading-snug font-light tracking-tight text-[var(--dn-fg)] italic [text-shadow:0_1px_24px_oklch(0_0_0/0.45)]"
            >
              {t(subtitleKey)}
            </m.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Cassette placeholder — pure CSS, sits below the subtitle. The 3D
          variant lives behind path 3 of the TapePlayer decoupling work
          tracked in DAY_N_NIGHT_HANDOFF.md § 5. */}
      <m.button
        type="button"
        data-dn-liminal-cassette
        data-fired={fired || undefined}
        onClick={onClick}
        disabled={!cassetteOn || (phase !== "invite" && !fired)}
        aria-label={fired ? "Audio playing" : "Press to start the night"}
        initial={false}
        animate={
          cassetteOn
            ? { y: 0, opacity: 1 }
            : reduced
              ? { y: 0, opacity: 0 }
              : { y: 120, opacity: 0 }
        }
        transition={
          reduced
            ? { duration: 0.18, ease: "easeOut" }
            : {
                y: { type: "spring", stiffness: 130, damping: 18, mass: 1.1 },
                opacity: { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
              }
        }
        className={[
          "pointer-events-auto group relative isolate",
          "flex flex-col items-stretch gap-3 rounded-[10px]",
          "border border-[oklch(from_var(--dn-fg)_l_c_h_/_0.18)]",
          "bg-[oklch(from_var(--dn-bg)_calc(l*0.4)_c_h_/_0.92)]",
          "px-5 py-4 backdrop-blur-md",
          "shadow-[0_12px_40px_-8px_oklch(0_0_0/0.5),inset_0_1px_0_oklch(from_var(--dn-fg)_l_c_h_/_0.08)]",
          "w-[min(76vw,260px)]",
          "transition-[transform,border-color,box-shadow] duration-300 ease-out",
          "data-[fired]:cursor-default",
          "[&:not([data-fired])]:hover:-translate-y-0.5",
          "[&:not([data-fired])]:hover:border-[oklch(from_var(--dn-fg)_l_c_h_/_0.32)]",
          "[&:not([data-fired])]:hover:shadow-[0_18px_50px_-10px_oklch(0_0_0/0.6),inset_0_1px_0_oklch(from_var(--dn-fg)_l_c_h_/_0.12)]",
          "disabled:cursor-default"
        ].join(" ")}
      >
        {/* Reel deck — two spools + label window in the middle. */}
        <div className="relative flex items-center justify-between gap-3">
          <Reel spinning={fired} reduced={reduced} />
          <div
            aria-hidden
            className="flex h-[34px] flex-1 flex-col justify-center rounded-[3px] border border-[oklch(from_var(--dn-fg)_l_c_h_/_0.12)] bg-[oklch(from_var(--dn-bg)_calc(l*0.2)_c_h)] px-2.5"
          >
            <span className="font-mono text-[9px] tracking-[0.22em] text-[var(--dn-fg-faint)] uppercase">
              Side B
            </span>
            <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--dn-fg-mute)]">
              YM·FM
            </span>
          </div>
          <Reel spinning={fired} reduced={reduced} />
        </div>

        {/* Play button + breathe halo when in invite phase. */}
        <div className="relative flex items-center justify-center pt-1">
          {phase === "invite" && !reduced ? (
            <m.span
              aria-hidden
              className="absolute h-9 w-9 rounded-full border border-[oklch(from_var(--dn-fg)_l_c_h_/_0.4)]"
              animate={{
                scale: [1, 1.4, 1.4],
                opacity: [0.7, 0, 0]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ) : null}
          <span
            aria-hidden
            className={[
              "relative flex h-9 w-9 items-center justify-center rounded-full",
              "border border-[oklch(from_var(--dn-fg)_l_c_h_/_0.32)]",
              "text-[var(--dn-fg)]",
              fired ? "bg-[oklch(from_var(--dn-fg)_l_c_h_/_0.12)]" : ""
            ].join(" ")}
          >
            {fired ? (
              // Pause glyph
              <span className="flex gap-[3px]">
                <span className="block h-3 w-[2px] rounded-sm bg-current" />
                <span className="block h-3 w-[2px] rounded-sm bg-current" />
              </span>
            ) : (
              // Play glyph
              <span
                className="block h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-current"
                style={{ marginLeft: 2 }}
              />
            )}
          </span>
        </div>

        <span className="text-center font-mono text-[9px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
          {fired ? "Now playing" : "Press play"}
        </span>
      </m.button>
    </div>
  );
}

/**
 * Two-spoke reel — spins only when fired. Reduced-motion locks to a
 * static frame so users with the OS preference don't see continuous
 * rotation.
 */
function Reel({
  spinning,
  reduced
}: {
  spinning: boolean;
  reduced: boolean;
}) {
  return (
    <span
      aria-hidden
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[oklch(from_var(--dn-fg)_l_c_h_/_0.2)] bg-[oklch(from_var(--dn-bg)_calc(l*0.2)_c_h)]"
    >
      <m.span
        className="relative block h-5 w-5 rounded-full border border-[oklch(from_var(--dn-fg)_l_c_h_/_0.28)]"
        animate={spinning && !reduced ? { rotate: 360 } : { rotate: 0 }}
        transition={
          spinning && !reduced
            ? { duration: 2.6, repeat: Infinity, ease: "linear" }
            : { duration: 0.2 }
        }
        style={{ transformOrigin: "50% 50%" }}
      >
        <span className="absolute top-1/2 left-1/2 block h-[1px] w-3 -translate-x-1/2 -translate-y-1/2 bg-[oklch(from_var(--dn-fg)_l_c_h_/_0.4)]" />
        <span className="absolute top-1/2 left-1/2 block h-3 w-[1px] -translate-x-1/2 -translate-y-1/2 bg-[oklch(from_var(--dn-fg)_l_c_h_/_0.4)]" />
        <span className="absolute top-1/2 left-1/2 block h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--dn-fg)]" />
      </m.span>
    </span>
  );
}
