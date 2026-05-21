"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";
import { useDayNNightScene } from "../store";
import { DayNNightScore } from "./DayNNightScore";
import { DetailsContext } from "./DetailsContext";
import { DetailsDrawer } from "./DetailsDrawer";
import { FriendsTorrent, type FriendsTorrentPhoto } from "./FriendsTorrent";
import { LiminalHandoff } from "./LiminalHandoff";
import { LiminalRadioController } from "./LiminalRadioController";
import { QuickActions } from "./QuickActions";
import { useActWindowActive } from "./Reveal";
import { Scrubber } from "./Scrubber";
import { SubtitleSequence } from "./SubtitleSequence";
import { SunLoader } from "./SunLoader";
import { Timeline } from "./Timeline";

// Act III ("dress" slot) index in SECTION_KEYS order. Mirrors the
// removed ACT_INDEX_DRESS that lived in Timeline.tsx before the
// dress JSX block was stripped.
const ACT_INDEX_DRESS = 2;

// Past-event photos for the FriendsTorrent. Module-scope constant.
//
// Policy: use the photo set exhaustively. Don't curate by hand — every
// JPEG/PNG that lands in `public/assets/day-n-night/past-events/` ends
// up in the torrent. The visual variety is the point; the dev harness
// at `/dn-friends-torrent` uses the same set so what you tune there is
// what ships. Only filter (e.g. drop the lowest-resolution sources)
// when the count grows large enough to be a measurable perf hit.
const PAST_EVENT_FILENAMES = [
  "KakaoTalk_Image_2026-05-21-03-03-19_001.jpeg",
  "KakaoTalk_Image_2026-05-21-03-03-19_002.jpeg",
  "KakaoTalk_Image_2026-05-21-03-03-19_003.jpeg",
  "KakaoTalk_Image_2026-05-21-03-03-20_004.jpeg",
  "partypic - 1.png",
  "partypic - 2.png",
  "partypic - 3.png",
  "partypic - 4.png",
  "partypic - 6.png",
  "partypic - 7.png",
  "partypic - 8.png",
  "partypic - 9.png",
  "partypic - 10.png",
  "partypic - 11.png",
  "partypic - 12.png",
  "partypic - 13.png",
  "partypica - 2.png",
  "partypica - 3.png",
  "partypica - 4.png",
  "partypica - 5.png"
];

const FRIENDS_PHOTOS: FriendsTorrentPhoto[] = PAST_EVENT_FILENAMES.map((f) => ({
  src: encodeURI(`/assets/day-n-night/past-events/${f}`)
}));

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
  const captions = useTranslations("Event.DayNNight.dressCode.captions");
  // MEMOIZED: a fresh array literal here would force SubtitleSequence's
  // useEffect (which has `captions` in its deps) to tear down + restart
  // the timeline on every ImmersiveView re-render — including the
  // re-render caused by the photo-cue setting `torrentCued`. Memoizing
  // keeps the array identity stable across renders for the lifetime of
  // the current locale, so the subtitle sequence advances unmolested.
  const dressCaptions = useMemo(
    () => [captions("1"), captions("2"), captions("3"), captions("4")],
    [captions]
  );
  const phase = useDayNNightScene(useShallow((r) => r.phase));
  const [hintHidden, setHintHidden] = useState(false);
  // Single source of truth for the right-side Details drawer. The
  // top-right QuickActions trigger and the in-act OpeningCard both
  // consume this via DetailsContext.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const setProgress = useDayNNightScene((r) => r.setProgress);
  const setPhase = useDayNNightScene((r) => r.setPhase);
  const resetLiminalHandoff = useDayNNightScene((r) => r.resetLiminalHandoff);

  // ── Act III dress-window gate ───────────────────────────────────────
  // `useActWindowActive` is two-way (not sticky like useActRevealActive)
  // — flips back to false when the user scrolls past the dress act,
  // which is exactly what we want: the subtitle sequence and photo
  // torrent should arm on entry and disarm on exit. `entryCount`
  // increments on every false→true edge so SubtitleSequence's
  // `replayKey` restarts the card sequence each time the user
  // re-enters the act (rare, but the seamless modulo loop means it
  // happens once per cycle).
  const dressWindow = useActWindowActive(ACT_INDEX_DRESS);

  // Photo torrent activation. Subtitle fires `onPhotoCue` ~0.5s into
  // card 3; we flip this to true. Resets to false whenever the dress
  // window closes so the next entry starts with photos hidden.
  const [torrentCued, setTorrentCued] = useState(false);
  const handlePhotoCue = useCallback(() => setTorrentCued(true), []);
  useEffect(() => {
    if (!dressWindow.active) setTorrentCued(false);
  }, [dressWindow.active]);
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
        {/* Local audio score — owns daytime.ogg only. Fades out across
          the photo-torrent window; once the cassette handoff fires,
          this goes silent and HideawayFM picks up the night. See
          DayNNightScore.tsx. */}
        <DayNNightScore />
        {/* Pins HideawayFM to Track_1 on mount, starts playback after
          the tape SFX window once the handoff fires, and advances
          Track_1 → 2 → 3 at scroll thresholds. Headless. */}
        <LiminalRadioController />
        {/* Cinematic Liminal → Nighttime handoff. Subtitle morph +
          cassette (TapeModel); pressing it fires the store's liminal
          handoff, which silences the day bed and starts HideawayFM
          after the SFX hold. Stateless on progress + handoff flag —
          safe on re-entry. */}
        <LiminalHandoff />
        {/* Act III dress window: photo torrent + subtitle sequence.
          Both gated on the act's scroll window via useActWindowActive,
          mounted here at the ImmersiveView root (NOT inside Timeline's
          pinned track) so fixed positioning works and the photo
          torrent fills the viewport while Act III is on screen.
          SubtitleSequence.replayKey = dressWindow.entryCount → cards
          restart from 0 on every re-entry. */}
        <FriendsTorrent
          photos={FRIENDS_PHOTOS}
          active={dressWindow.active && torrentCued}
        />
        <SubtitleSequence
          captions={dressCaptions}
          active={dressWindow.active}
          replayKey={dressWindow.entryCount}
          onPhotoCue={handlePhotoCue}
        />
        {/* Single Details drawer instance — driven by DetailsContext so
          QuickActions and OpeningCard share one drawer. */}
        <DetailsDrawer open={detailsOpen} onOpenChange={setDetailsOpen} />
        {/* SeamBridge overlay removed 2026-05-21. The bookend fade at
          the loop's wrap is now handled solely by Timeline's
          `bookendFade` (driven by `useStickyZone`) so the two
          "Day n Night" titles never overlap, but no separate chrome
          element transitions across the seam. The wrap reads as a
          quiet beat between night and the next dawn. */}
        {phase !== "playing" ? <SunLoader /> : null}
      </div>
    </DetailsContext.Provider>
  );
}
