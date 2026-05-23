"use client";

import { useEffect, useRef } from "react";
import { useDayNNightScene } from "../store";
import { YMFM_PLAY_EVENT, YMFM_STATE_EVENT } from "./YMFMCredit";

/**
 * Page-local YM.FM controller.
 *
 * Track_1.ogg is part of the Day n Night score, not the global station
 * queue. Keeping it local avoids fighting HideawayFM's seed/current-track
 * lifecycle while still using the same fade discipline as AmbientAudio:
 * every entry ramps from silence to headroom, every exit fades before pause.
 */

const TRACK_SRC = "/track_media/Track_1.ogg";
const HEADROOM = 0.38;
const FADE_IN_MS = 1200;
const FADE_OUT_MS = 900;

const RADIO_START_AT = 0.55;
const RADIO_SILENCE_AT = 0.92;
const RADIO_RESET_BELOW = 0.45;

function dispatchPlaying(playing: boolean) {
  window.dispatchEvent(
    new CustomEvent(YMFM_STATE_EVENT, { detail: { playing } })
  );
}

function fadeVolume(
  audio: HTMLAudioElement,
  to: number,
  durationMs: number,
  onDone?: () => void
) {
  const from = audio.volume;
  const start = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = t * t * (3 - 2 * t);
    audio.volume = from + (to - from) * eased;
    if (t < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      onDone?.();
    }
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function LiminalRadioController() {
  const liminalFired = useDayNNightScene((r) => r.liminalHandoffFired);
  const inZone = useDayNNightScene(
    (r) => r.progress >= RADIO_START_AT && r.progress < RADIO_SILENCE_AT
  );
  const belowReset = useDayNNightScene((r) => r.progress < RADIO_RESET_BELOW);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeCancelRef = useRef<(() => void) | null>(null);
  const playTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const silencedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(TRACK_SRC);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      fadeCancelRef.current?.();
      if (playTimerRef.current !== null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      audio.pause();
      audioRef.current = null;
      dispatchPlaying(false);
    };
  }, []);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeCancelRef.current?.();
    audio.volume = Math.min(audio.volume, HEADROOM);
    void audio
      .play()
      .then(() => {
        startedRef.current = true;
        silencedRef.current = false;
        dispatchPlaying(true);
        fadeCancelRef.current = fadeVolume(audio, HEADROOM, FADE_IN_MS);
      })
      .catch(() => {
        dispatchPlaying(false);
      });
  };

  const pause = () => {
    const audio = audioRef.current;
    if (!audio || silencedRef.current) return;
    fadeCancelRef.current?.();
    silencedRef.current = true;
    fadeCancelRef.current = fadeVolume(audio, 0, FADE_OUT_MS, () => {
      audio.pause();
      dispatchPlaying(false);
    });
  };

  useEffect(() => {
    const onPlayRequest = () => play();
    window.addEventListener(YMFM_PLAY_EVENT, onPlayRequest);
    return () => window.removeEventListener(YMFM_PLAY_EVENT, onPlayRequest);
  });

  useEffect(() => {
    if (!liminalFired) {
      if (playTimerRef.current !== null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    if (inZone) {
      if (!startedRef.current && playTimerRef.current === null) {
        playTimerRef.current = window.setTimeout(() => {
          playTimerRef.current = null;
          play();
        }, 4500);
      }
      if (startedRef.current && silencedRef.current) play();
    } else {
      if (playTimerRef.current !== null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      if (startedRef.current && !silencedRef.current) pause();
      if (belowReset) {
        startedRef.current = false;
        silencedRef.current = false;
      }
    }
  }, [belowReset, inZone, liminalFired]);

  return null;
}
