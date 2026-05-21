"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { useDayNNightScene } from "../store";
import { Button } from "@/components/core/Button";

/**
 * Page-local audio score for the Day n Night immersive scene
 * (§ 3.5 of `readmes/DAY_N_NIGHT_HANDOFF.md`).
 *
 * Three tracks, mixed-model transitions:
 *
 *   Act 1 — Daytime         country  /assets/audio/day-n-night/daytime.ogg
 *   Act 2 — Liminal/Sunset  house    /track_media/Track_3.mp3
 *   Act 3 — Nighttime       hip-hop  /assets/audio/day-n-night/nighttime.ogg
 *
 *   ─ Daytime → Sunset  : EVENT-DRIVEN. Fired by the cassette button
 *                         press inside `<LiminalHandoff>` (§ 3.6) via
 *                         the scene store's `fireLiminalHandoff()`
 *                         action — synced to the click SFX frame.
 *
 *   ─ Sunset → Nighttime : SCROLL-DRIVEN. ~1.5s smoothstep crossfade
 *                          on `useDayNNightScene.progress`, anchored
 *                          around the dusk → deep-night transition
 *                          so the hiphop/house bed is established by
 *                          the time the YM.FM credit block lands.
 *
 * Architecture
 * ────────────
 *   AudioContext
 *     ├── <audio daytime>   → MediaElementSource → Gain → dest
 *     ├── <audio sunset>    → MediaElementSource → Gain → dest
 *     └── <audio nighttime> → MediaElementSource → Gain → dest
 *
 * All three are `loop` + `preload="metadata"`. Playback only begins
 * once the user clicks the chrome audio toggle (autoplay policy).
 * The post-handoff state is reactive to the store flag, so the
 * future `<LiminalHandoff>` only needs to call
 * `fireLiminalHandoff()` on the cassette click frame.
 *
 * Any missing track → its pipeline disables itself and the toggle
 * gives up; the rest of the page is unaffected.
 */

const DAY_SRC = "/assets/audio/day-n-night/daytime.ogg";
const SUNSET_SRC = "/track_media/Track_3.mp3";
const NIGHT_SRC = "/assets/audio/day-n-night/nighttime.ogg";

const BASE_VOL = 0.55;

// Time constants for setTargetAtTime smoothing (seconds).
const RAMP_FAST = 0.08; // per-frame scroll updates
const RAMP_SLOW = 0.35; // event-driven handoff cut

/**
 * Scroll-driven fade windows.
 *
 * SKY_STOPS landmarks (from store.tsx) — for reference:
 *   0.279  Cookout
 *   0.478  Dress / sunset peak
 *   0.575  post-sunset / dusk
 *   0.664  Night center: deep night
 *
 * Day fades out across the sunset-peak → post-sunset window per
 * § 2.3 of the handoff doc — *"Daytime → silence: during § 2.1
 * the country track fades out across the photo torrent; reaches
 * zero by the end of § 2.2 (the held beat)"*. This is the only
 * scroll-driven gain on the pre-handoff path; Sunset comes in
 * via the cassette button-press event (§ 2.9), not scroll.
 *
 * Night crossfades in from Sunset post-handoff, anchored around
 * dusk → deep-night so the hiphop/house bed is established by
 * the time the YM.FM credit block lands in Act 3.
 */
const DAY_FADE_IN = 0.42;
const DAY_FADE_OUT = 0.55;
const NIGHT_FADE_IN = 0.55;
const NIGHT_FADE_OUT = 0.68;

interface TrackPipeline {
  audio: HTMLAudioElement;
  gain: GainNode;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Resolve the three target gains for a given scene progress + handoff
 * state. Pure function — no audio side effects.
 */
function resolveGains(
  progress: number,
  liminalFired: boolean
): { day: number; sunset: number; night: number } {
  // Pre-handoff path: Day plays through Daytime acts, scroll-driven
  // fade to silence across the sunset window. Sunset stays muted
  // until the cassette button-press event fires; Night stays muted
  // until Sunset hands off. This means a user who reaches Night
  // without the (event-driven) handoff hears silence rather than
  // incongruous country music — graceful degrade.
  if (!liminalFired) {
    const dayWeight = 1 - smoothstep(DAY_FADE_IN, DAY_FADE_OUT, progress);
    return { day: dayWeight, sunset: 0, night: 0 };
  }
  // Post-handoff path: Day is gone. Sunset → Night smoothstep
  // crossfade on scroll.
  const nightWeight = smoothstep(NIGHT_FADE_IN, NIGHT_FADE_OUT, progress);
  return {
    day: 0,
    sunset: 1 - nightWeight,
    night: nightWeight
  };
}

export function DayNNightScore() {
  const t = useTranslations("Event.DayNNight.audio");
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const dayRef = useRef<TrackPipeline | null>(null);
  const sunsetRef = useRef<TrackPipeline | null>(null);
  const nightRef = useRef<TrackPipeline | null>(null);
  // Apply the slower ramp exactly on the handoff edge; per-frame
  // scroll updates use the fast ramp.
  const prevHandoffRef = useRef(false);

  // Spin up the AudioContext + pipelines on first enable.
  useEffect(() => {
    if (!enabled) return;

    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctx = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctx) {
      setFailed(true);
      return;
    }
    const ctx = new Ctx();
    ctxRef.current = ctx;

    const makeTrack = (src: string): Promise<TrackPipeline | null> =>
      new Promise((resolve) => {
        const audio = new Audio(src);
        audio.loop = true;
        audio.preload = "metadata";
        let settled = false;
        const onLoad = () => {
          if (settled) return;
          settled = true;
          try {
            const source = ctx.createMediaElementSource(audio);
            const gain = ctx.createGain();
            gain.gain.value = 0;
            source.connect(gain).connect(ctx.destination);
            resolve({ audio, gain });
          } catch {
            resolve(null);
          }
        };
        const onFail = () => {
          if (settled) return;
          settled = true;
          resolve(null);
        };
        audio.addEventListener("canplaythrough", onLoad, { once: true });
        audio.addEventListener("loadeddata", onLoad, { once: true });
        audio.addEventListener("error", onFail, { once: true });
      });

    let cancelled = false;
    void Promise.all([
      makeTrack(DAY_SRC),
      makeTrack(SUNSET_SRC),
      makeTrack(NIGHT_SRC)
    ]).then(([day, sunset, night]) => {
      if (cancelled) return;
      if (!day || !sunset || !night) {
        setFailed(true);
        if (ctx.state !== "closed") {
          void ctx.close().catch(() => {});
        }
        return;
      }
      dayRef.current = day;
      sunsetRef.current = sunset;
      nightRef.current = night;
      void ctx
        .resume()
        .then(() => {
          void day.audio.play().catch(() => {});
          void sunset.audio.play().catch(() => {});
          void night.audio.play().catch(() => {});
          setReady(true);
        })
        .catch(() => setFailed(true));
    });

    return () => {
      cancelled = true;
      dayRef.current?.audio.pause();
      sunsetRef.current?.audio.pause();
      nightRef.current?.audio.pause();
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        void ctxRef.current.close().catch(() => {});
      }
      ctxRef.current = null;
      dayRef.current = null;
      sunsetRef.current = null;
      nightRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  const { progress, liminalFired } = useDayNNightScene(
    useShallow((r) => ({
      progress: r.progress,
      liminalFired: r.liminalHandoffFired
    }))
  );

  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      const ctx = ctxRef.current;
      const d = dayRef.current;
      const s = sunsetRef.current;
      const n = nightRef.current;
      if (!ctx || !d || !s || !n || ctx.state === "closed") {
        raf = requestAnimationFrame(tick);
        return;
      }

      const { day, sunset, night } = resolveGains(progress, liminalFired);
      const handoffEdge = liminalFired && !prevHandoffRef.current;
      const ramp = handoffEdge ? RAMP_SLOW : RAMP_FAST;
      prevHandoffRef.current = liminalFired;

      const now = ctx.currentTime;
      try {
        d.gain.gain.setTargetAtTime(day * BASE_VOL, now, ramp);
        s.gain.gain.setTargetAtTime(sunset * BASE_VOL, now, ramp);
        n.gain.gain.setTargetAtTime(night * BASE_VOL, now, ramp);
      } catch {
        // Context may transition to closed between the guard above
        // and these writes; swallow and let cleanup stop the rAF.
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [ready, progress, liminalFired]);

  if (failed) return null;

  return (
    <Button
      type="button"
      data-dn-chrome-pill
      data-dn-audio-toggle
      data-on={enabled || undefined}
      className="group ease fixed top-16 right-5 z-[46] inline-flex cursor-pointer appearance-none items-center gap-2 rounded-full border border-[var(--dn-chrome-line)] px-[14px] py-[7px] font-mono text-[10px] tracking-[0.18em] text-[var(--dn-chrome-fg-mute)] uppercase transition-[color,border-color] duration-[250ms] hover:text-[var(--dn-chrome-fg)] data-[on]:border-[oklch(from_var(--dn-chrome-fg)_l_c_h_/_0.4)] data-[on]:text-[var(--dn-chrome-fg)] md:top-[84px] md:right-8 xl:top-24 xl:right-12"
      onClick={() => setEnabled((v) => !v)}
      aria-label={enabled ? t("off") : t("on")}
      aria-pressed={enabled}
    >
      <span
        aria-hidden
        className="ease -translate-y-px text-[13px] leading-none opacity-45 transition-opacity duration-[250ms] group-data-[on]:opacity-100"
      >
        ♪
      </span>
      <span data-dn-audio-text className="max-[480px]:hidden">
        {t("label")}
      </span>
    </Button>
  );
}
