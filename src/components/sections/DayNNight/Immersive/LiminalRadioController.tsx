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
 *      progress ≥ 0.55), start Track_1 after PLAY_DELAY_MS.
 *
 *   3. Before the Closing act ends (progress ≥ RADIO_SILENCE_AT), pause
 *      so the night fades out cleanly before daytime returns at the loop
 *      wrap. DayNNightScore handles the daytime fade-back-in.
 *
 *   4. On unmount, pause so the radio doesn't follow the user off-page.
 */

const TRACK_FILE_PATTERN = /Track[_-]?1\.(ogg|mp3)/i;

// SFX-hold matching the old tape cassette window — keeps the audio
// start feeling earned rather than immediate.
const PLAY_DELAY_MS = 4500;

// Pause HideawayFM before the seamless loop wraps back to daytime.
// This sits in the late-Closing window (~0.92 out of 1.0) so the
// radio fades to silence a beat before DayNNightScore's daytime
// bed fades back in at DAY_RETURN_IN (0.93).
const RADIO_SILENCE_AT = 0.92;

export function LiminalRadioController() {
  const tracks = useHideawayFM((s) => s.tracks);
  const currentIndex = useHideawayFM((s) => s.currentIndex);
  const setCurrentIndex = useHideawayFM((s) => s.setCurrentIndex);
  const setInitialSeek = useHideawayFM((s) => s.setInitialSeek);
  const controls = useHideawayFMControls();
  const liminalFired = useDayNNightScene((r) => r.liminalHandoffFired);
  const progress = useDayNNightScene((r) => r.progress);

  // Track-id resolution: seed to Track_1 on mount, keep paused.
  const track1IndexRef = useRef<number>(-1);
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
      controls.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  // Begin playback after the handoff delay.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!liminalFired || startedRef.current) return;
    const id = window.setTimeout(() => {
      startedRef.current = true;
      void controls.play().catch(() => {});
    }, PLAY_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [liminalFired, controls]);

  // Pause before the loop wraps back to daytime.
  const silencedRef = useRef(false);
  useEffect(() => {
    if (!liminalFired || !startedRef.current) return;
    if (progress >= RADIO_SILENCE_AT && !silencedRef.current) {
      silencedRef.current = true;
      controls.pause();
    }
  }, [progress, liminalFired, controls]);

  return null;
}
