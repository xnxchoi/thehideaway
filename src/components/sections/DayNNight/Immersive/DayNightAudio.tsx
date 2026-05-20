"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { useDayNNightScene } from "../store";

/**
 * Page-local audio bed for the Day n Night immersive scene.
 *
 * Two long loops — country for daytime, hiphop for nighttime — are
 * crossfaded by scroll progress and run through a shared low-pass
 * filter that closes during the transition zones so the genre swap
 * "muffles out" instead of cutting hard.
 *
 * Architecture
 * ────────────
 *   AudioContext
 *     ├── <audio daytime.opus> → MediaElementSource → Lowpass → Gain → dest
 *     └── <audio nighttime.opus> → MediaElementSource → Lowpass → Gain → dest
 *
 * Both audio elements are `loop` + `preload="auto"`. Playback starts on
 * the first user click of the chrome toggle (browser autoplay policies
 * forbid sound without a user gesture). After that, a rAF tick reads
 * scene `progress` from the store and writes target gain + filter
 * frequency via `setTargetAtTime` so transitions are smoothed by the
 * audio engine itself — no manual easing per frame.
 *
 * Deliberately decoupled from the site's main Radio (Howler-based) per
 * project direction — this page's score is part of the scene, not part
 * of the user's persistent radio session.
 *
 * Files
 * ─────
 * The component looks for:
 *   /public/audio/day-n-night/daytime.opus
 *   /public/audio/day-n-night/nighttime.opus
 *
 * Either file 404'ing → the toggle quietly disables itself and the rest
 * of the page is unaffected. Drop in the actual tracks at those paths
 * to enable the bed.
 */

const DAY_SRC = "/audio/day-n-night/daytime.opus";
const NIGHT_SRC = "/audio/day-n-night/nighttime.opus";

interface TrackPipeline {
  audio: HTMLAudioElement;
  gain: GainNode;
  filter: BiquadFilterNode;
}

/**
 * Cross-fade + mix curve indexed by scene progress (0..1).
 *
 * Returns:
 *   day   — gain weight for the country track     (0..1)
 *   night — gain weight for the hiphop track       (0..1)
 *   mix   — low-pass intensity (0 open / 1 muffled)
 *
 * Progress landmarks from SKY_STOPS in store.ts:
 *   0.00  daytime (loop wrap, == 1.00)
 *   0.088 Opening center: full daytime
 *   0.279 Cookout center: golden hour
 *   0.478 Dress center:   sunset
 *   0.664 Night center:   deep night
 *   0.876 Closing center: pre-dawn
 *   1.00  daytime again
 *
 * Country owns Opening → Cookout (0..0.45), hands the room over through
 * sunset, hiphop takes Dress → Night → Closing (0.5..0.9), then country
 * lifts back in during the dawn return so the wrap is sonically as
 * seamless as it is visually.
 */
function curve(progress: number): {
  day: number;
  night: number;
  mix: number;
} {
  const ss = (a: number, b: number, x: number): number => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Country: full through Opening + Cookout, fades by Dress.
  const dayCore = 1 - ss(0.32, 0.5, progress);
  // …then lifts back during the dawn return so the 1.0 → 0.0 wrap
  // doesn't have an audible seam either.
  const dayReturn = ss(0.94, 1.0, progress);
  const day = Math.max(dayCore, dayReturn);

  // Hiphop: enters at sunset, peaks at Night, fades through Closing.
  const night = ss(0.5, 0.66, progress) * (1 - ss(0.82, 0.94, progress));

  // Low-pass mix: peaks where both tracks have meaningful gain
  // (sunset/Dress and dawn/Closing). 4× weighting amplifies "both
  // audible" instants into a properly muffled drop.
  const overlap = Math.min(day, night) * 4;
  // Sunset zone explicitly muffled even where overlap math reads low.
  const sunsetMix = ss(0.45, 0.52, progress) * (1 - ss(0.6, 0.7, progress));
  const mix = Math.max(0, Math.min(1, overlap + sunsetMix));

  return { day, night, mix };
}

export function DayNightAudio() {
  const t = useTranslations("Event.DayNNight.audio");
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const dayRef = useRef<TrackPipeline | null>(null);
  const nightRef = useRef<TrackPipeline | null>(null);

  // Lifecycle: spin up the AudioContext + pipelines on first enable.
  // Tear down on disable AND on unmount — both paths go through the
  // cleanup function so the AudioContext + audio elements never leak
  // (a prior version left them attached when the user navigated away
  // while audio was on).
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
        audio.preload = "auto";
        let settled = false;
        const onLoad = () => {
          if (settled) return;
          settled = true;
          try {
            const source = ctx.createMediaElementSource(audio);
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.Q.value = 0.7;
            filter.frequency.value = 18000;
            const gain = ctx.createGain();
            gain.gain.value = 0;
            source.connect(filter).connect(gain).connect(ctx.destination);
            resolve({ audio, gain, filter });
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
        audio.addEventListener("error", onFail, { once: true });
        // Belt + suspenders: some browsers don't fire canplaythrough
        // reliably; loadeddata is acceptable for our purpose too.
        audio.addEventListener("loadeddata", onLoad, { once: true });
      });

    let cancelled = false;
    void Promise.all([makeTrack(DAY_SRC), makeTrack(NIGHT_SRC)]).then(
      ([day, night]) => {
        if (cancelled) return;
        if (!day || !night) {
          setFailed(true);
          // Close the orphaned context so a failed load doesn't leak
          // a heavyweight AudioContext.
          if (ctx.state !== "closed") {
            void ctx.close().catch(() => {});
          }
          return;
        }
        dayRef.current = day;
        nightRef.current = night;
        void ctx
          .resume()
          .then(() => {
            void day.audio.play().catch(() => {});
            void night.audio.play().catch(() => {});
            setReady(true);
          })
          .catch(() => setFailed(true));
      }
    );

    return () => {
      cancelled = true;
      dayRef.current?.audio.pause();
      nightRef.current?.audio.pause();
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        void ctxRef.current.close().catch(() => {});
      }
      ctxRef.current = null;
      dayRef.current = null;
      nightRef.current = null;
      setReady(false);
    };
  }, [enabled]);
  const progress = useDayNNightScene(useShallow((r) => r.progress));

  // rAF tick: write target gain + filter freq from scene progress.
  // `setTargetAtTime` lets the audio engine smooth — no per-frame easing
  // math here, no clicks/pops at boundaries.
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      const { day, night, mix } = curve(progress);

      const ctx = ctxRef.current;
      const d = dayRef.current;
      const n = nightRef.current;
      // Guard against a closed AudioContext — when the user toggles off,
      // the enabled-effect cleanup may close `ctx` before this tick is
      // cancelled (setReady(false) only cleans up on the next commit).
      // `setTargetAtTime` on a closed context throws InvalidStateError;
      // skip the write and let the cancelAnimationFrame in cleanup catch
      // up on the next frame.
      if (!ctx || !d || !n || ctx.state === "closed") {
        raf = requestAnimationFrame(tick);
        return;
      }

      const now = ctx.currentTime;
      const RAMP = 0.08; // ~80ms smoothing time constant
      const BASE_VOL = 0.55; // overall ceiling — background bed, not foreground
      // 18 kHz open → ~600 Hz when fully mixed.
      const filterFreq = 18000 - mix * 17400;

      try {
        d.gain.gain.setTargetAtTime(day * BASE_VOL, now, RAMP);
        n.gain.gain.setTargetAtTime(night * BASE_VOL, now, RAMP);
        d.filter.frequency.setTargetAtTime(filterFreq, now, RAMP);
        n.filter.frequency.setTargetAtTime(filterFreq, now, RAMP);
      } catch {
        // Context can transition to closed between the check above and
        // the writes (browser-internal close). Swallow and let cleanup
        // stop the rAF.
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [ready]);

  if (failed) return null;

  return (
    <button
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
    </button>
  );
}
