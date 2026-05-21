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
 *      /day-n-night mounts. Keep it paused; the global radio is silent
 *      until the cinematic explicitly starts it.
 *
 *   2. Once `liminalHandoffFired` flips true, the LiminalHandoff
 *      component has already played its tape SFX. After the SFX
 *      window (PLAY_DELAY_MS), call HideawayFM.play().
 *
 *   3. Scroll-driven track distribution across Liminal → Nighttime →
 *      Closing. Each TRACK_STOPS entry maps a scene-progress threshold
 *      to a HideawayFM track index. When `progress` crosses a
 *      threshold and the current track isn't already there, call
 *      next() / previous() until the indices align.
 *
 *   4. Restore on unmount — re-attach previous HideawayFM track? No.
 *      The page deliberately re-seeds Track_1 on mount; on unmount we
 *      simply pause so the audio doesn't follow the user off-page.
 */

// Filename slugs we use to identify the three Day-n-Night tracks within
// HideawayFM's catalog. The fallback roll in machine/fetchTracks.ts
// already maps Track_1.ogg → YM.FM and Track_2/3 to subsequent slots,
// and the prod Tracks collection mirrors that filename convention.
const TRACK_FILE_PATTERNS = [
  /Track[_-]?1\.(ogg|mp3)/i,
  /Track[_-]?2\.(ogg|mp3)/i,
  /Track[_-]?3\.(ogg|mp3)/i
];

// Map scene-progress milestones to track index. The first stop is the
// post-handoff baseline (Track_1 stays through the late-Liminal). 2nd
// and 3rd stops live in the early-Night and mid-Night windows so the
// jumps feel scroll-paced rather than time-paced.
const TRACK_STOPS: { at: number; idx: number }[] = [
  { at: 0.55, idx: 0 }, // Track_1 — opens the night
  { at: 0.7, idx: 1 }, // Track_2 — mid-night
  { at: 0.84, idx: 2 } // Track_3 — late-night, into Closing
];

// SFX hold before the radio audibly takes over. Matches the spec line
// "after 4~5 secs, we actually set the radio state to play".
const PLAY_DELAY_MS = 4500;

function indexForProgress(progress: number): number {
  let chosen = TRACK_STOPS[0]!.idx;
  for (const stop of TRACK_STOPS) {
    if (progress >= stop.at) chosen = stop.idx;
  }
  return chosen;
}

export function LiminalRadioController() {
  const tracks = useHideawayFM((s) => s.tracks);
  const currentIndex = useHideawayFM((s) => s.currentIndex);
  const setCurrentIndex = useHideawayFM((s) => s.setCurrentIndex);
  const setInitialSeek = useHideawayFM((s) => s.setInitialSeek);
  const controls = useHideawayFMControls();
  const liminalFired = useDayNNightScene((r) => r.liminalHandoffFired);
  const progress = useDayNNightScene((r) => r.progress);

  // Track-id resolution: re-derive whenever the catalog populates.
  const dnIndicesRef = useRef<number[]>([]);
  useEffect(() => {
    if (!tracks.length) return;
    const indices = TRACK_FILE_PATTERNS.map((re) =>
      tracks.findIndex((t) => re.test(t.url))
    );
    dnIndicesRef.current = indices;
    // Seed to Track_1 immediately, seek 0, keep paused. The global
    // radio is silent until the cinematic explicitly fires play().
    const t1 = indices[0];
    if (t1 != null && t1 >= 0 && t1 !== currentIndex) {
      setCurrentIndex(t1);
      setInitialSeek(0);
      controls.pause();
      void controls.refresh().catch(() => {});
    }
    // Pause on unmount so the night doesn't follow the user off-page.
    return () => {
      controls.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks.length]);

  // Begin playback after the tape-SFX window once the handoff fires.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!liminalFired || startedRef.current) return;
    const id = window.setTimeout(() => {
      startedRef.current = true;
      void controls.play().catch(() => {});
    }, PLAY_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [liminalFired, controls]);

  // Scroll-driven track jumps. Once fired + playing, advance/regress
  // to keep currentIndex aligned with the TRACK_STOPS table.
  useEffect(() => {
    if (!liminalFired || !startedRef.current) return;
    const dn = dnIndicesRef.current;
    if (dn.length !== 3) return;
    const targetSlot = indexForProgress(progress);
    const target = dn[targetSlot];
    if (target == null || target < 0 || target === currentIndex) return;
    // Use next/previous so HideawayFM's crossfade machine handles the
    // hand-off cleanly rather than setting currentIndex directly,
    // which would hard-cut.
    const delta = target - currentIndex;
    if (delta > 0) {
      for (let i = 0; i < delta; i++) void controls.next().catch(() => {});
    } else {
      for (let i = 0; i < -delta; i++) void controls.previous().catch(() => {});
    }
  }, [progress, liminalFired, currentIndex, controls]);

  return null;
}
