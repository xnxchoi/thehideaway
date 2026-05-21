"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDayNNightScene } from "../store";
import { Button } from "@/components/core/Button";

/**
 * Page-local audio score for the Day n Night immersive scene.
 *
 * Single-bed system: only the daytime/country track is owned here.
 * The Liminal handoff transfers playback to HideawayFM (Track_1 → 2 → 3,
 * "YM.FM" set distributed across Liminal → Nighttime), so once
 * `liminalHandoffFired` flips true this component just silences itself
 * — HideawayFM takes over the night.
 *
 *   Act I/II — Daytime       country  /assets/audio/day-n-night/daytime.ogg
 *   Act III+ — Liminal/Night  HideawayFM (Track_1 / 2 / 3, scroll-paced)
 *
 *   ─ Daytime fades out across the photo-torrent end window
 *     (DAY_FADE_IN → DAY_FADE_OUT). The fade is scroll-driven so the
 *     country bed leaves cleanly before the cassette reveals itself.
 *   ─ After the cassette handoff fires, day gain is held at zero
 *     unconditionally — there is no second bed in this component to
 *     swap to. The HideawayFM controller takes over.
 *
 * Missing-file path: if daytime.ogg fails to decode, the audio toggle
 * unmounts itself and the rest of the page is unaffected.
 */

const DAY_SRC = "/assets/audio/day-n-night/daytime.ogg";

const BASE_VOL = 0.55;

// setTargetAtTime smoothing constants (seconds).
const RAMP_FAST = 0.08; // per-frame scroll updates
const RAMP_SLOW = 0.35; // event-driven handoff cut

/**
 * Daytime fade-out window — anchored to the photo-torrent end so the
 * country bed is gone by the time the cassette translates up. Tighter
 * than the old sunset-anchored window because the cinematic now hands
 * off via HideawayFM rather than blending two beds at the same instant.
 *
 * SKY_STOPS landmarks (from store.tsx) — for reference:
 *   0.279  Cookout
 *   0.478  Dress / sunset peak
 *   0.575  post-sunset / dusk
 *   0.664  Night center
 */
const DAY_FADE_IN = 0.36;
const DAY_FADE_OUT = 0.48;

interface TrackPipeline {
  audio: HTMLAudioElement;
  gain: GainNode;
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/**
 * Pure gain resolver. Pre-handoff: scroll-driven fade-out on the day
 * bed. Post-handoff: silence (HideawayFM owns the night).
 */
function resolveDayGain(progress: number, liminalFired: boolean): number {
  if (liminalFired) return 0;
  return 1 - smoothstep(DAY_FADE_IN, DAY_FADE_OUT, progress);
}

export function DayNNightScore() {
  const t = useTranslations("Event.DayNNight.audio");
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const dayRef = useRef<TrackPipeline | null>(null);
  // Apply the slower ramp exactly on the handoff edge; per-frame scroll
  // updates use the fast ramp.
  const prevHandoffRef = useRef(false);

  // Spin up the AudioContext + daytime pipeline on first enable.
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
    void makeTrack(DAY_SRC).then((day) => {
      if (cancelled) return;
      if (!day) {
        setFailed(true);
        if (ctx.state !== "closed") {
          void ctx.close().catch(() => {});
        }
        return;
      }
      dayRef.current = day;
      void ctx
        .resume()
        .then(() => {
          void day.audio.play().catch(() => {});
          setReady(true);
        })
        .catch(() => setFailed(true));
    });

    return () => {
      cancelled = true;
      dayRef.current?.audio.pause();
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        void ctxRef.current.close().catch(() => {});
      }
      ctxRef.current = null;
      dayRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  const progress = useDayNNightScene((r) => r.progress);
  const liminalFired = useDayNNightScene((r) => r.liminalHandoffFired);

  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      const ctx = ctxRef.current;
      const d = dayRef.current;
      if (!ctx || !d || ctx.state === "closed") {
        raf = requestAnimationFrame(tick);
        return;
      }

      const day = resolveDayGain(progress, liminalFired);
      const handoffEdge = liminalFired && !prevHandoffRef.current;
      const ramp = handoffEdge ? RAMP_SLOW : RAMP_FAST;
      prevHandoffRef.current = liminalFired;

      const now = ctx.currentTime;
      try {
        d.gain.gain.setTargetAtTime(day * BASE_VOL, now, ramp);
      } catch {
        // Context may transition to closed between the guard above and
        // this write; swallow and let cleanup stop the rAF.
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
