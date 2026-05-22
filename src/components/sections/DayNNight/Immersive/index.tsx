"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useActHalfwayActive, useActWindowActive } from "./Reveal";
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
  // Two-beat caption sequence narrated above the FriendsTorrent:
  //
  //   1. Q&A pair       — "Dress code" (topic, mono small-caps) above
  //                        "Blue & teal." (answer, serif). Both lines
  //                        appear together as one card, read as label
  //                        + value.
  //   2. Lead-in        — "If you want references — here's pics from
  //                        past events:" — the photo torrent fades in
  //                        once this card has cleared (see
  //                        `handlePhotoCue` below).
  //
  // The old standalone beat ("Blue & teal — how you work that in…")
  // was dropped — it restated the Q&A card's "Blue & teal" answer.
  //
  // MEMOIZED: a fresh array literal would force SubtitleSequence's
  // useEffect (which has `captions` in its deps) to tear down + restart
  // the timeline on every ImmersiveView re-render. Memoizing keeps the
  // array identity stable across renders for the lifetime of the
  // current locale.
  const dressCaptions = useMemo(
    () => [
      <div key="qa" className="grid gap-2.5">
        <span className="font-mono text-[12px] tracking-[0.32em] uppercase opacity-55 md:text-[13px]">
          {captions("topic")}
        </span>
        <span className="font-serif text-[clamp(1.65rem,2.8vw,2.15rem)] leading-[1.2]">
          {captions("answer")}
        </span>
      </div>,
      captions("refs")
    ],
    [captions]
  );
  const phase = useDayNNightScene(useShallow((r) => r.phase));
  // Sequenced entry reveal: 0 = background only, 1 = content, 2 = chrome.
  // Stages advance on fixed delays after phase transitions to "playing" so
  // the first impression is: sky → Act I copy → HUD chrome.
  const [revealStage, setRevealStage] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    if (phase !== "playing") {
      setRevealStage(0);
      return;
    }
    const t1 = window.setTimeout(() => setRevealStage(1), 200);
    const t2 = window.setTimeout(() => setRevealStage(2), 600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [phase]);
  const [hintHidden, setHintHidden] = useState(false);
  // Single source of truth for the right-side Details drawer. The
  // top-right QuickActions trigger and the in-act OpeningCard both
  // consume this via DetailsContext.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const setProgress = useDayNNightScene((r) => r.setProgress);
  const setPhase = useDayNNightScene((r) => r.setPhase);
  const resetLiminalHandoff = useDayNNightScene((r) => r.resetLiminalHandoff);

  // ── Dress sentinel — mobile visibility gate ──────────────────────────
  // On desktop, FriendsTorrent + SubtitleSequence are gated by the GSAP
  // layout-aware `dressWindow.active` below. On mobile, GSAP never runs
  // the horizontal layout measurement, so `dressWindow.active` is always
  // false. The sentinel div (placed in document flow inside the dress Act
  // by Timeline.tsx) provides a visibility signal instead.
  const dressSentinelRef = useRef<HTMLDivElement>(null);
  const [mobileInDress, setMobileInDress] = useState(false);
  const mobileInDressRef = useRef(false);
  useEffect(() => {
    const node = dressSentinelRef.current;
    if (!node) return;

    const update = (next: boolean) => {
      if (mobileInDressRef.current === next) return;
      mobileInDressRef.current = next;
      setMobileInDress(next);
    };
    const observer = new IntersectionObserver(
      ([entry]) => update(Boolean(entry?.isIntersecting)),
      { rootMargin: "-2% 0px -2% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
  // Second-half-of-Liminal pivot. Once scroll crosses the dress
  // window's midpoint the torrent fades and the YM.FM credit (Act III
  // grid content in Timeline.tsx) reveals — driven off the same hook
  // so the two transitions stay in lockstep.
  const dressSecondHalf = useActHalfwayActive(ACT_INDEX_DRESS, 0.5);

  // Photo torrent cue. SubtitleSequence fires `onPhotoCue` once the
  // final caption ("If you want references — here's pics from past
  // events:") has held and faded out — the torrent then rises into the
  // cleared frame. Resets on dress-window exit so the next entry starts
  // with photos hidden and replays the lead-in.
  const [torrentCued, setTorrentCued] = useState(false);
  const handlePhotoCue = useCallback(() => setTorrentCued(true), []);
  // Reset when outside the dress window on EITHER path — desktop
  // (`dressWindow.active`) or mobile (`mobileInDress`). Watching only
  // `dressWindow.active` left the cue permanently latched on mobile
  // (that flag is always false there), so the torrent never re-gated.
  useEffect(() => {
    if (!dressWindow.active && !mobileInDress) setTorrentCued(false);
  }, [dressWindow.active, mobileInDress]);

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
    <DetailsContext value={{ open: detailsOpen, setOpen: setDetailsOpen }}>
      <div className="relative min-h-svh w-full p-0 [--reveal-x:50%] [--reveal-y:50%]">
        {/* Timeline owns the pinned scroll context; SceneView (sky + sun + moon)
          and the grain overlay live inside it so they share the pin.
          contentRevealed gates Act I's RevealStage so it only fires
          once the entry sequence has reached the content beat (200ms). */}
        <Timeline
          contentRevealed={revealStage >= 1}
          dressSentinelRef={dressSentinelRef}
        />
        <div
          data-hidden={hintHidden || phase !== "playing" || revealStage < 2}
          aria-hidden
          className="ease pointer-events-none fixed bottom-1/4 left-1/2 z-[45] hidden -translate-x-1/2 items-center gap-[10px] font-mono text-[10px] tracking-[0.28em] text-[var(--dn-fg-mute)] uppercase transition-opacity duration-500 data-[hidden=true]:opacity-0 lg:inline-flex"
        >
          <span
            data-dn-scroll-hint-line
            className="inline-block h-px w-7 bg-current"
          />
          <span>{t("scrollHint")}</span>
        </div>
        <Scrubber visible={revealStage >= 2} />
        {/* Bottom action island — mounts at stage 2 so the m.div spring
          entrance fires exactly when chrome should appear. */}
        {revealStage >= 2 && <QuickActions />}
        {/* Local audio score — owns daytime.ogg only. Fades out across
          the photo-torrent window; once the cassette handoff fires,
          this goes silent and HideawayFM picks up the night. See
          DayNNightScore.tsx. */}
        {phase === "playing" && revealStage >= 2 && (
          <DayNNightScore initialEnabled={audioEnabled} />
        )}
        {/* Pins HideawayFM to Track_1 on mount, starts playback after
          the tape SFX window once the handoff fires, and advances
          Track_1 → 2 → 3 at scroll thresholds. Headless. */}
        <LiminalRadioController />
        {/* Liminal → Nighttime handoff captions. Fires liminalHandoffFired
          at progress ≥ 0.55, which LiminalRadioController uses to start
          HideawayFM after its delay window. HTML-only — no 3D. */}
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
          // First half of Liminal only, AND only after the caption
          // sequence has introduced them — the third caption ("If you
          // want references…") triggers `onPhotoCue`, which flips
          // `torrentCued` true and fades the layer in directly under
          // the line that's introducing it. The midpoint pivot clears
          // the whole layer so the YM.FM credit reads against bare sky.
          // On mobile, FriendsTorrent's own sentinelActive gate (driven
          // by dressSentinelRef) takes over since dressWindow.active is
          // always false when GSAP layout never runs.
          active={dressWindow.active && torrentCued && !dressSecondHalf}
          // `cued` gates the mobile (sentinel-driven) visibility path on
          // the same caption cue: on mobile `active` is always false, so
          // without this the torrent would appear the instant the dress
          // sentinel scrolled in — before the caption sequence ran.
          cued={torrentCued}
          sentinelRef={dressSentinelRef}
          // Lifted out of the pinned wrap's stacking context:
          //   • `fixed` so the layer stays viewport-anchored while
          //     the pin scrolls the ImmersiveView root upward
          //     (an `absolute inset-0` child would scroll off-screen
          //     with the expanded pin-spacer).
          //   • `z-[40]` clears Timeline (z-3) but sits below
          //     SubtitleSequence (z-43), LiminalHandoff (z-44),
          //     Scrubber (z-45), and QuickActions (z-47) so the
          //     captions read on top and the chrome stays clickable.
          className="fixed z-[40]"
        />
        <SubtitleSequence
          captions={dressCaptions}
          // Captions disarm at the dress midpoint so they don't keep
          // narrating while the YM.FM credit reveals. On mobile,
          // dressWindow.active is always false (GSAP never measures the
          // horizontal layout), so mobileInDress (sentinel-driven) takes
          // over — no midpoint concept on mobile.
          active={(dressWindow.active && !dressSecondHalf) || mobileInDress}
          replayKey={dressWindow.entryCount}
          onPhotoCue={handlePhotoCue}
          // Give captions ~2–3× the scroll real estate they had at 1800ms
          // per card, so they don't flash by before the user can read them.
          perCardMs={3500}
          // The lead-in caption ("If you want references — here's pics
          // from past events:") plays out and fades like the others; the
          // photo torrent then rises into the cleared frame (onPhotoCue
          // fires after the final caption has faded). The caption no
          // longer lingers as a tagline over the torrent.
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
        {phase !== "playing" ? (
          <SunLoader
            onEnter={(withAudio) => setAudioEnabled(withAudio)}
            onSummary={() => setDetailsOpen(true)}
          />
        ) : null}
      </div>
    </DetailsContext>
  );
}
