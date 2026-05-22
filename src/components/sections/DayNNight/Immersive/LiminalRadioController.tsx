"use client";

import { useEffect, useRef } from "react";
import { useHideawayFM, useHideawayFMControls } from "@/providers/HideawayFM";
import { useDayNNightScene } from "../store";

/**
 * Page-local controller that hands off the night to HideawayFM.
 *
 * Behaviour:
 *
 *   1. Pin HideawayFM to Track_1 (YM.FM — "Shibuya Nights") the moment
 *      /day-n-night mounts. Keep it paused.
 *
 *   2. Once `liminalHandoffFired` flips true (fired by LiminalHandoff at
 *      progress ≥ RADIO_START_AT), arm a delayed start. If the user is
 *      inside the zone when the timer fires, play. If they've scrolled
 *      out before it fires, the timer is cancelled.
 *
 *   3. Pause whenever progress leaves the zone — whether the user scrolls
 *      past the end (≥ RADIO_SILENCE_AT), scrolls backward below
 *      RADIO_START_AT, or the seamless loop wraps to near-zero. Resume
 *      immediately if they scroll back into the zone.
 *
 *   4. Below RADIO_RESET_BELOW (hysteresis gap before RADIO_START_AT),
 *      fully reset playback state so the next zone entry re-arms a fresh
 *      delayed start. This covers both backward-scroll re-entry and the
 *      GSAP loop wrap.
 *
 *   5. On unmount, cancel any pending timer and pause.
 */

const TRACK_FILE_PATTERN = /Track[_-]?1\.(ogg|mp3)/i;

// SFX-hold matching the tape cassette window.
const PLAY_DELAY_MS = 4500;

// Zone boundaries.
const RADIO_START_AT = 0.55;
const RADIO_SILENCE_AT = 0.92;

// Hysteresis: full state reset when progress drops below this.
// Sits a step below RADIO_START_AT so a brief backward nudge past
// the zone entry doesn't immediately reset the start state.
const RADIO_RESET_BELOW = 0.45;

export function LiminalRadioController() {
  const tracks = useHideawayFM((s) => s.tracks);
  const currentIndex = useHideawayFM((s) => s.currentIndex);
  const setCurrentIndex = useHideawayFM((s) => s.setCurrentIndex);
  const setInitialSeek = useHideawayFM((s) => s.setInitialSeek);
  const controls = useHideawayFMControls();
  const liminalFired = useDayNNightScene((r) => r.liminalHandoffFired);
  const inZone = useDayNNightScene(
    (r) => r.progress >= RADIO_START_AT && r.progress < RADIO_SILENCE_AT
  );
  const belowReset = useDayNNightScene((r) => r.progress < RADIO_RESET_BELOW);

  const track1IndexRef = useRef<number>(-1);
  const playTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const silencedRef = useRef(false);

  // Pin Track_1 on mount; clean up timer and audio on unmount.
  useEffect(() => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => TRACK_FILE_PATTERN.test(t.url));
    track1IndexRef.current = idx;
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);
      setInitialSeek(0);
      controls.pause();
      void controls.refresh().catch(() => {});
    }
    return () => {
      if (playTimerRef.current !== null) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      controls.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  // Unified zone controller.
  // Runs on every progress tick; all calls to play/pause are guarded
  // by refs so they fire at most once per state transition.
  useEffect(() => {
    if (!liminalFired) {
      // `liminalFired` flipped back off (e.g. handoff reset). Cancel any
      // pending start timer so a stale timer can't fire `play()` into a
      // scene that has since been reset.
      if (playTimerRef.current !== null) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    if (inZone) {
      // Arm: schedule start if not yet started and no timer is pending.
      if (!startedRef.current && playTimerRef.current === null) {
        playTimerRef.current = window.setTimeout(() => {
          playTimerRef.current = null;
          startedRef.current = true;
          silencedRef.current = false;
          void controls.play().catch(() => {});
        }, PLAY_DELAY_MS);
      }
      // Resume: was started then silenced (e.g. scrolled out and back in).
      if (startedRef.current && silencedRef.current) {
        silencedRef.current = false;
        void controls.play().catch(() => {});
      }
    } else {
      // Outside zone — cancel any pending start timer.
      if (playTimerRef.current !== null) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      // Pause if currently playing.
      if (startedRef.current && !silencedRef.current) {
        silencedRef.current = true;
        controls.pause();
      }
      // Hard reset below hysteresis: clear state so the next zone entry
      // (whether a forward scroll or the next loop cycle) arms a fresh start.
      if (belowReset) {
        startedRef.current = false;
        silencedRef.current = false;
      }
    }
  }, [belowReset, inZone, liminalFired, controls]);

  return null;
}
