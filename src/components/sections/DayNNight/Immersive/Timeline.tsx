"use client";

import { useWindowResize } from "@/utilities/use_window_resize";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { useTranslations as UseTranslationsType } from "next-intl";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useShallow } from "zustand/shallow";
import { useLenis } from "lenis/react";
import { useDayNNightScene, SECTION_KEYS, type ActLayout } from "../store";
import { Polaroid, PolaroidGroup } from "./Polaroid";
import {
  RevealItem,
  RevealStage,
  useActHalfwayActive,
  useActRevealActive
} from "./Reveal";
import { SceneView } from "./SceneView";
import { SurvivalKit } from "../SurvivalKit";
import {
  Act,
  ActEyebrow,
  TITLE_HERO,
  TITLE_SECTION,
  LEDE,
  BODY_SERIF,
  KICKER_MONO,
  LABEL_MONO
} from "./Act";
import { OpeningCard } from "./OpeningCard";
import { useStickyZone } from "./SeamBridge";
import * as m from "motion/react-m";
import { MarkerText } from "./MarkerText";
import { Button } from "@/components/core/Button";
import { useDetailsContext } from "./DetailsContext";

/**
 * Anchors that polaroid clusters use for their parallax windows. These
 * match the SKY_STOPS section centers in store.ts so each cluster
 * appears to slide through frame as the user passes the section center.
 */
const ANCHOR_COOKOUT = 0.279;
const ANCHOR_NIGHT = 0.664;

/**
 * Act indices in SECTION_KEYS order. Used with `useActRevealActive`
 * (see Reveal.tsx) which reads the live `layout.startsFrac` to decide
 * when each act's copy reveal should fire — anchored on the act's
 * START position, not its CENTER (the prior static threshold model
 * anchored on CENTER and fired too late, leaving copy hidden when the
 * act first entered the viewport).
 */
const ACT_INDEX_COOKOUT = 1;
const ACT_INDEX_DRESS = 2;
const ACT_INDEX_NIGHT = 3;
const ACT_INDEX_CLOSING = 4;

// ScrollTrigger is registered globally in TransitionProvider — see
// readmes/DAY_N_NIGHT.md § 9 ("No new gsap.registerPlugin at module scope
// without a guard"). The import here keeps the symbol available for the
// matchMedia callbacks below; registration is owned upstream.

/**
 * Measure the first set of acts in the track and write the layout to
 * the scene store. The track contains two duplicate ActSets (10 acts
 * total) for the seamless modulo loop — we measure the first 5 only.
 *
 * SCSS owns the widths (each `.actOpening/.actCookout/...` declares its
 * own `--act-w` multiplier on `100vw`); this function reads the rendered
 * widths and derives starts / centers / setWidth / fractions. Called on
 * mount and on every ResizeObserver tick so the layout stays current
 * as the viewport changes.
 */
function measureActLayout(trackEl: HTMLElement): ActLayout | null {
  const acts = Array.from(trackEl.children) as HTMLElement[];
  if (acts.length < SECTION_KEYS.length) return null;
  const firstSet = acts.slice(0, SECTION_KEYS.length);
  const widths = firstSet.map((a) => a.getBoundingClientRect().width);
  const setWidth = widths.reduce((sum, w) => sum + w, 0);
  if (setWidth <= 0) return null;
  const starts: number[] = [];
  let cum = 0;
  for (const w of widths) {
    starts.push(cum);
    cum += w;
  }
  const centers = starts.map((start, i) => start + widths[i] / 2);
  const viewportFrac = window.innerWidth / setWidth;
  return {
    keys: SECTION_KEYS,
    widths,
    starts,
    centers,
    setWidth,
    viewportFrac,
    startsFrac: starts.map((startPx) => startPx / setWidth),
    centersFrac: centers.map((centerPx) => centerPx / setWidth)
  };
}

type Translator = ReturnType<typeof UseTranslationsType>;

/**
 * Horizontal timeline — the heart of the immersive view.
 *
 * Vertical scroll is pinned and converted into a horizontal translate of the
 * track. The track holds two consecutive copies of the same five acts so
 * the loop is seamless: at the moment scroll passes the pin end, the user
 * is visually at the start of the second copy (== start of the first copy),
 * and we snap scroll back to the pin start. The visual content at the
 * boundary is identical, so the jump is invisible. Scrolling backward past
 * the start mirrors this by snapping forward to the end.
 *
 * Below `lg` (1024px) the SCSS unwinds the horizontal layout into a
 * stacked vertical column; we skip the pin/scrub entirely on those widths.
 */
interface TimelineProps {
  /** True once the entry animation reaches the content beat (set by ImmersiveView). */
  contentRevealed: boolean;
  /** Ref to the sentinel sizing div placed inside the dress Act for mobile visibility. */
  dressSentinelRef?: RefObject<HTMLDivElement | null>;
}

export function Timeline({ contentRevealed, dressSentinelRef }: TimelineProps) {
  const t = useTranslations("Event.DayNNight");
  const { setOpen: setDetailsOpen } = useDetailsContext();
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const setProgress = useDayNNightScene((r) => r.setProgress);
  const setPhase = useDayNNightScene((r) => r.setPhase);
  const setLayout = useDayNNightScene((r) => r.setLayout);
  const readLayout = useDayNNightScene(useShallow((r) => r.layout));
  const initialLoopPos = useDayNNightScene((r) => r.initialLoopPosition);
  const phase = useDayNNightScene(useShallow((r) => r.phase));
  const isPlaying = phase === "playing";
  // Lenis is captured here (component scope) and read through a ref so
  // the soft-pin effect below can call `lenis.scrollTo` without
  // re-running every time Lenis re-mounts. Used by P5b-P1.1.
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;

  // ── Section-hero soft-pin (P5b-P1.1) ────────────────────────────────
  // After the user stops scrolling, if their position sits within ~5% of
  // an act center, gently tween back to that center. If they're further
  // than 5% (i.e. clearly moving past), leave them alone. Goal: catch
  // small drift, never fight intentional scroll. Subtle.
  //
  // Implementation runs OUTSIDE useGSAP so it can pull live `lenis` and
  // store reads without scope-binding issues. Desktop only — the mobile
  // breakpoint flattens to vertical scroll and doesn't need this.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (!isPlaying) return;

    const SNAP_THRESHOLD_FRAC = 0.05; // 5% of one cycle's width
    const SNAP_DELAY_MS = 180; // wait after scroll stops
    const SNAP_DURATION_S = 0.45; // tween length (subtle)
    let snapTimer: number | undefined;

    const attemptSnap = () => {
      // `readLayout` is subscribed at component scope; the effect's
      // closure has the freshest value because `readLayout` is in the
      // dep array — any layout update tears down + recreates this
      // effect with the new closure.
      const liveLayout = readLayout;
      if (!liveLayout || liveLayout.setWidth <= 0) return;
      const wrapEl = wrap.current;
      if (!wrapEl) return;

      const wrapRect = wrapEl.getBoundingClientRect();
      const pinStart = window.scrollY + wrapRect.top;
      const totalScrolled = window.scrollY - pinStart;
      // Only snap while inside the pinned region.
      if (totalScrolled < 0) return;

      const sw = liveLayout.setWidth;
      const loopPos = (initialLoopPos * sw + totalScrolled) % sw;
      const currentProgress = loopPos / sw;

      // S3: seam guard — when scroll is within ~10% of either edge of
      // the modulo loop, do NOT snap. The seamless wrap depends on
      // smooth motion through progress ∈ [0.9, 1.0) → [0.0, 0.1), and
      // a snap fired in that zone locks scroll mid-seam (user-reported
      // "this is where the scroll locks lol").
      const SEAM_GUARD = 0.1;
      if (currentProgress < SEAM_GUARD || currentProgress > 1 - SEAM_GUARD) {
        return;
      }

      // Find nearest center in cycle-fraction space.
      let nearest = liveLayout.centersFrac[0];
      let minDist = Math.abs(currentProgress - nearest);
      for (const c of liveLayout.centersFrac) {
        const d = Math.abs(currentProgress - c);
        if (d < minDist) {
          minDist = d;
          nearest = c;
        }
      }
      // Sub-5% threshold check — outside this band, don't fight the user.
      if (minDist >= SNAP_THRESHOLD_FRAC) return;

      // Signed delta in cycle-fraction → pixel delta → target scrollY.
      const deltaPx = (nearest - currentProgress) * sw;
      // Avoid the no-op case where we're already centered.
      if (Math.abs(deltaPx) < 1) return;

      const target = window.scrollY + deltaPx;
      const liveLenis = lenisRef.current;
      if (liveLenis) {
        liveLenis.scrollTo(target, { duration: SNAP_DURATION_S });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    };

    const onScroll = () => {
      if (snapTimer !== undefined) window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(attemptSnap, SNAP_DELAY_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (snapTimer !== undefined) window.clearTimeout(snapTimer);
    };
  }, [isPlaying, readLayout, initialLoopPos]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop — modulo-based horizontal loop. The pin extends across N
      // virtual loops worth of scroll distance. Track position is computed
      // by modulo against one set-width — the user only ever moves forward
      // (no rewind, no scroll-bar snap-back). When the scroll value crosses
      // a set-width boundary, the track wraps from `-setWidth + ε` to `0`
      // instantly. Since the duplicate set rendered at `x = -setWidth` is
      // visually identical to the original at `x = 0`, the wrap is invisible.
      //
      // The initial offset (`INITIAL_LOOP_POSITION`) places the user at
      // mid-loop on first paint so the loader hand-off (sun at horizon) is
      // continuous with the scene's mid-loop sun-at-horizon position.
      mm.add("(min-width: 1024px)", () => {
        if (!track.current || !wrap.current) return;

        const trackEl = track.current;

        const LOOPS = 14; // how many cycles before user hits page bottom

        // Measure once up front so the store has layout before
        // ScrollTrigger seeds — otherwise `initialLoopPosition` is the
        // fallback 0.2 and the loader hand-off lands off the horizon.
        const initialLayout = measureActLayout(trackEl);
        if (initialLayout) setLayout(initialLayout);

        // Read setWidth + initialLoopPosition live from the store on
        // every tick so resize events that update the layout
        // (ResizeObserver below) propagate without needing closures
        // to be re-bound.
        const setWidth = () => readLayout?.setWidth ?? trackEl.scrollWidth / 2;

        const pinDistance = () => setWidth() * LOOPS;

        // Shared updater — same math for initial paint and every
        // scroll tick. Pulled out so we can seed initial state on
        // ScrollTrigger creation; otherwise the loader's progress=0.05
        // would leak into the scene math and render the sun below the
        // viewport instead of at the horizon hand-off position.
        const update = (selfProgress: number) => {
          const sw = setWidth();
          const init = initialLoopPos;
          const totalScrolled = selfProgress * pinDistance();
          const loopPos = (init * sw + totalScrolled) % sw;
          const loopProgress = loopPos / sw;
          gsap.set(trackEl, { x: -loopProgress * sw });
          // scene-progress IS loopProgress now — sky stops at 0.0 and
          // 1.0 are identical so the wrap is seamless.
          setProgress(loopProgress);
        };

        const st = ScrollTrigger.create({
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${pinDistance()}`,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress)
        });

        // Seed the initial state at scroll=0 so the sun lands on the
        // horizon as soon as the loader hands off.
        update(0);

        // Re-measure on size changes — viewport resize, devtools
        // toggle, etc. — and refresh ScrollTrigger so the pin
        // distance recomputes against the new set width.
        const ro = new ResizeObserver(() => {
          const next = measureActLayout(trackEl);
          if (next) {
            setLayout(next);
            st.refresh();
          }
        });
        ro.observe(trackEl);

        return () => {
          ro.disconnect();
          st.kill();
        };
      });

      // Mobile/tablet — vertical scroll, progress driven by document scroll.
      mm.add("(max-width: 1023px)", () => {
        if (!wrap.current) return;
        // Below `lg` we never enter the immersive loader pin; ensure the
        // phase is `playing` so SunLoader's overlay never blocks the stack.
        setPhase("playing");
        const st = ScrollTrigger.create({
          trigger: wrap.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.4,
          onUpdate: (self) => {
            // scene-progress IS loopProgress in [0, 1] now.
            setProgress(self.progress);
          }
        });
        return () => st.kill();
      });

      return () => mm.revert();
    },
    { scope: wrap }
  );

  return (
    <div
      ref={wrap}
      data-dn-wrap
      className="relative z-[3] h-svh w-full overflow-clip pb-25 max-lg:h-auto max-lg:overflow-visible"
    >
      {/* Scene lives inside the pinned wrap so its `position: fixed` pieces
          remain anchored to the viewport throughout the pin. The site's
          smooth-scroll wrapper breaks raw fixed-positioning mid-scroll;
          nesting under the pinned element side-steps that. */}
      <SceneView />
      <div
        data-dn-grain
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] opacity-[0.45] mix-blend-overlay"
      />
      <div
        ref={track}
        data-dn-track
        className="flex h-full will-change-transform max-lg:h-auto max-lg:flex-col"
      >
        {/* First set — the primary, accessible acts. */}
        <ActSet
          t={t}
          contentRevealed={contentRevealed}
          dressSentinelRef={dressSentinelRef}
          onOpenDetails={() => setDetailsOpen(true)}
        />
        {/* Second set — duplicate, marked aria-hidden. Hidden from AT but
            visible to the scroll loop so the boundary is seamless. */}
        <ActSet
          t={t}
          contentRevealed={contentRevealed}
          dressSentinelRef={dressSentinelRef}
          onOpenDetails={() => setDetailsOpen(true)}
          ariaHidden
        />
      </div>
      {/* Note: <SeamBridge /> is rendered at the ImmersiveView root
          (not here) so its position:fixed escapes the GSAP-pinned wrap
          + its overflow-hidden context. Keeping it inside this wrap
          made the sticky overlay clipped/captured by the wrap's
          transform during pinning. */}
    </div>
  );
}

interface ActSetProps {
  t: Translator;
  /** Sequenced-entry gate: true once the entry animation reaches the
   *  content beat (200ms after phase="playing"). Controls Act I's
   *  `openingActive` reveal. The duplicate ActSet receives the same
   *  flag so both copies stay in sync. */
  contentRevealed: boolean;
  ariaHidden?: boolean;
  dressSentinelRef?: RefObject<HTMLDivElement | null>;
  onOpenDetails: () => void;
}

function ActSet({
  t,
  contentRevealed,
  ariaHidden = false,
  dressSentinelRef,
  onOpenDetails
}: ActSetProps) {
  // Per-act reveal gates. Opening fires once `contentRevealed` is true
  // (i.e. the sequenced entry animation has reached the content beat);
  // the other 4 acts gate on a layout-aware scene-progress threshold
  // via `useActRevealActive` so the blur-in lands as each act enters
  // frame, not when its center reaches viewport center.
  //
  // The two ActSets (primary + duplicate-for-loop) each call these
  // hooks independently; the boolean selector pattern means each ActSet
  // re-renders only on the threshold crossing, not on every progress
  // write. Both copies stay in sync because they read from the same
  // store.
  const openingActive = contentRevealed;

  const [openingStep, setOpeningStep] = useState(0);
  useEffect(() => {
    // Guard: only the primary (non-aria-hidden) ActSet fires the cascade.
    // Both ActSets share the same `openingActive` signal, so without this
    // guard both would independently schedule the timeouts and double-fire.
    if (ariaHidden) {
      setOpeningStep(0);
      return;
    }
    if (!openingActive) {
      setOpeningStep(0);
      return;
    }
    setOpeningStep(1);
    const t1 = window.setTimeout(() => setOpeningStep(2), 350);
    const t2 = window.setTimeout(() => setOpeningStep(3), 700);
    const t3 = window.setTimeout(() => setOpeningStep(4), 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [openingActive, ariaHidden]);

  const cookoutActive = useActRevealActive(ACT_INDEX_COOKOUT);
  // Dress / Liminal splits into two halves: the FriendsTorrent +
  // caption sequence in the first half, the YM.FM dedicated credit
  // section in the second. Non-sticky so the section gracefully
  // retracts if the user scrolls back into the photo-torrent half.
  const ymRevealActive = useActHalfwayActive(ACT_INDEX_DRESS, 0.5);
  const nightActive = useActRevealActive(ACT_INDEX_NIGHT);
  const closingActive = useActRevealActive(ACT_INDEX_CLOSING);
  // True only during the sticky window (Closing title at viewport-left
  // → Opening's left edge enters viewport). Outside this narrow window
  // the bookend titles render as normal RevealItems and move with the
  // GSAP track.
  const inStickyZone = useStickyZone();
  const bookendFade = {
    opacity: inStickyZone ? 0 : 1,
    transition: "opacity 500ms ease-in-out"
  } as const;
  // Trigger re-renders on viewport resize so polaroid clusters and
  // grid columns recompute against the new width.
  useWindowResize({ debounce: 50, detectHeightChange: false });
  // The 5 acts share a single <Act> frame (12-col grid + tokenized
  // padding from dn.css) so the magazine pacing reads consistently
  // as the user scrolls the loop. Each act places its children into
  // the grid via col-start / row-start utilities.
  return (
    <>
      {/* ── Act I — The Cover ─────────────────────────────────────────────
          Poster-style cover. Mirror of Act V's composition, flipped LR:
          eyebrow LEFT, title-block LEFT (cols 1-7), dossier (opening.body
          + SurvivalKit) RIGHT (cols 8-13), date/location strip bottom-
          LEFT. The bookend reads as a true reflection — same grammar,
          opposite hand. */}
      <Act width={1.3} ariaLabel={t("opening.label")} ariaHidden={ariaHidden}>
        <ActEyebrow
          numeral="I"
          label={t("opening.label")}
          time={t("opening.time")}
          align="left"
        />
        {/* Opening title block — kicker + hero title + lede.
            Reveal cascade preserved. Outer div carries grid placement
            so the inner RevealStage can be opacity-faded only during
            the sticky window (see useStickyZone); outside the window
            this block moves with the GSAP track like any other Act
            content. */}
        <div
          className="col-start-1 col-end-7 row-start-2 row-end-3 self-end max-lg:col-span-full"
          style={bookendFade}
        >
          <RevealStage
            as="div"
            active={openingActive}
            className="grid content-end gap-7 xl:gap-9"
          >
            <RevealItem as="p" className={KICKER_MONO}>
              {t("opening.kicker")}
            </RevealItem>
            <RevealItem as="h2" className={TITLE_HERO}>
              {t("title")}
            </RevealItem>
            <RevealItem as="p" className={`${LEDE} max-w-[38ch]`}>
              {t("opening.lede")}
            </RevealItem>
          </RevealStage>
        </div>
        {/* Right col — paper invitation card. Clickable surface that
            opens the Details drawer (via DetailsContext). Mirrors
            Closing's left dossier slot, but trades the always-visible
            SurvivalKit for a single paper-style trigger that pulls the
            same info into the drawer on demand. */}
        {/* Right col — paper invitation card, springs in at step 2. */}
        <m.div
          className="col-start-8 col-end-13 row-start-2 row-end-3 hidden max-w-[400px] self-end justify-self-end max-lg:col-span-full lg:flex"
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={
            openingStep >= 2
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 18, scale: 0.97 }
          }
          transition={{ type: "spring", bounce: 0.12, duration: 0.55 }}
        >
          <OpeningCard />
        </m.div>
        {/* Bottom-left strip — date + location, fades in with step 1. */}
        <m.div
          className="col-start-1 col-end-5 row-start-3 row-end-4 grid max-w-[280px] gap-3 self-end justify-self-start max-lg:col-span-full"
          initial={{ opacity: 0, y: 6 }}
          animate={
            openingStep >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }
          }
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
        >
          <span
            aria-hidden
            className="mr-auto mb-3 block h-px w-14 bg-[var(--dn-fg)] opacity-60"
          />
          <span className="font-mono text-[11px] leading-[1.7] tracking-[0.18em] text-[var(--dn-fg-mute)] uppercase">
            {t("date.full")}
          </span>
          <span className="font-mono text-[11px] leading-[1.7] tracking-[0.18em] text-[var(--dn-fg-mute)] uppercase">
            {t("location.neighborhood")}
          </span>
        </m.div>
      </Act>

      {/* ── Act II — Cookout ─────────────────────────────────────────────
          Feature spread. Title + lede bottom-left, food/drinks menu strip
          bottom-right, polaroid cluster floating in the right margin at
          the shared --dn-polaroid-band height (16%). */}
      <Act
        width={1.55}
        ariaLabel={t("act.day.heading")}
        ariaHidden={ariaHidden}
      >
        <ActEyebrow
          numeral="II"
          label={t("scrubber.cookout")}
          time={t("act.day.time")}
          align="left"
        />
        <RevealStage
          as="div"
          active={cookoutActive}
          className="col-start-1 col-end-8 row-start-2 row-end-3 grid max-w-[52ch] content-end gap-6 self-end max-lg:col-span-full xl:gap-8"
        >
          <RevealItem as="h2" className={TITLE_SECTION}>
            {t("act.day.heading")}
          </RevealItem>
          <RevealItem as="p" className={`${LEDE} max-w-[46ch]`}>
            {t("act.day.body")}
          </RevealItem>
        </RevealStage>
        <ul
          className="col-start-8 col-end-13 row-start-3 row-end-4 m-0 grid min-w-[240px] list-none gap-[18px] self-end justify-self-end p-0 max-lg:col-span-full max-lg:justify-self-start"
          aria-label={t("included.heading")}
        >
          <li className="grid gap-[6px] border-t border-[var(--dn-line)] pt-[14px]">
            <span className={LABEL_MONO}>{t("included.food.label")}</span>
            <span className="font-serif text-[clamp(1.55rem,1.7vw,1.9rem)] font-medium tracking-[-0.01em] text-[var(--dn-fg)]">
              {t("included.food.items")}
            </span>
          </li>
          <li className="grid gap-[6px] border-t border-[var(--dn-line)] pt-[14px]">
            <span className={LABEL_MONO}>{t("included.drinks.label")}</span>
            <span className="font-serif text-[clamp(1.55rem,1.7vw,1.9rem)] font-medium tracking-[-0.01em] text-[var(--dn-fg)]">
              {t("included.drinks.items")}
            </span>
          </li>
        </ul>
        <PolaroidGroup className="hidden lg:pointer-events-none lg:absolute lg:top-[16%] lg:right-[4vw] lg:z-[4] lg:flex lg:gap-10">
          <Polaroid
            src="/assets/day-n-night/DraggedImage.png"
            alt={t("moodboard.cookout.burger.alt")}
            caption={t("moodboard.cookout.burger.caption")}
            width={220}
            aspect={0.75}
            angle={-4}
            depth={0.7}
            anchor={ANCHOR_COOKOUT}
            priority={!ariaHidden}
          />
          <Polaroid
            src="/assets/day-n-night/IMG_8543.png"
            alt={t("moodboard.cookout.rooftop.alt")}
            caption={t("moodboard.cookout.rooftop.caption")}
            width={260}
            aspect={1.769}
            angle={5}
            depth={-0.4}
            anchor={ANCHOR_COOKOUT}
            priority={!ariaHidden}
          />
          <Polaroid
            src="/assets/day-n-night/IMG_9520.png"
            alt={t("moodboard.cookout.vibe.alt")}
            width={230}
            aspect={1.333}
            angle={-2}
            depth={1.0}
            anchor={ANCHOR_COOKOUT}
            priority={!ariaHidden}
          />
        </PolaroidGroup>
      </Act>

      {/* ── Act III — Liminal ────────────────────────────────────────────
          Two-beat act. First half: <FriendsTorrent> photos overlay
          the viewport after <SubtitleSequence> introduces the cue
          across the bottom. Both are fixed-positioned at the
          ImmersiveView root (not in this grid) and gated on the dress
          window's active flag.
          Second half: photos clear and the YM.FM credit reveals in
          this grid. The fade is driven by `useActHalfwayActive` from
          index.tsx so torrent and credit transition off the same
          threshold. The LiminalHandoff cassette hangs centred in the
          viewport throughout the second half (z-44), naming nothing —
          the cassette is the sound, the section names the source. */}
      {/* Act III runs WIDE — far wider than the surrounding acts —
          because Liminal carries the longest stretch of choreography on
          this page: photo torrent + caption sequence in the first half,
          YM.FM credit reveal + LiminalHandoff cassette in the second.
          The caption cue is timer-driven (~8s), so the act must be wide
          enough that the photo torrent still gets a generous horizontal
          scroll stretch after the captions clear — the desktop analogue
          of the mobile dress sentinel's height. Keep this multiplier
          and that sentinel scaled together when retuning torrent
          screen time. Pacing wins; the loop math handles whatever
          multiplier we pick. */}
      <Act width={8.4} ariaLabel={t("scrubber.dress")} ariaHidden={ariaHidden}>
        <ActEyebrow numeral="III" label={t("scrubber.dress")} align="left" />
        {/* YM.FM dedicated section. Anchored to row 2 self-end so the
            block sits below the cassette frame at the bottom of the
            viewport — clean of the centred Tape3DScene canvas. The
            handle is an external link to Instagram; tabIndex={-1} on
            the aria-hidden duplicate ActSet keeps focus order sane
            across the seamless loop. */}
        {/* Mobile sentinel — placed BEFORE the YM.FM block so the mobile
            vertical stack scrolls THROUGH the FriendsTorrent stretch
            before the YM.FM credit reveals. On desktop the sentinel is
            lg:hidden and the YM.FM block keeps its explicit lg: grid
            placement, so this DOM order only governs the mobile flow.

            Height = caption-sequence runway + a guaranteed FriendsTorrent
            window. The caption cue is timer-driven (~8s), so the sentinel
            is sized long enough that the photos still get a generous
            scroll stretch after the captions clear — even at a brisk
            scroll. Lengthen/shorten this to retune the torrent's
            screen time. */}
        {!ariaHidden && dressSentinelRef && (
          <div
            ref={dressSentinelRef}
            className="pointer-events-none relative col-span-full lg:hidden"
            style={{ minHeight: "650svh" }}
            aria-hidden
          />
        )}
        <RevealStage
          as="div"
          active={ymRevealActive}
          className="grid content-end gap-6 self-end max-lg:col-span-full lg:col-start-1 lg:col-end-9 lg:row-start-2 lg:row-end-3 xl:gap-8"
        >
          <RevealItem as="p" className={KICKER_MONO}>
            {t("act.night.dj.eyebrow")}
          </RevealItem>
          <RevealItem as="h2" className={`${TITLE_SECTION} max-w-[8ch]`}>
            {t("act.night.dj.name")}
          </RevealItem>
          <RevealItem as="div" className="grid gap-2">
            <span
              aria-hidden
              className="block h-px w-12 bg-[var(--dn-fg)] opacity-60"
            />
            <span className={LABEL_MONO}>{t("act.night.dj.role")}</span>
          </RevealItem>
          <RevealItem
            as="p"
            className="max-w-[42ch] font-serif text-[clamp(1.2rem,1.35vw,1.5rem)] leading-[1.45] tracking-[-0.005em] text-[var(--dn-fg-mute)] italic"
          >
            {t("act.night.dj.blurb")}
          </RevealItem>
          <RevealItem as="div">
            <a
              href="https://instagram.com/yangminwoo"
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${t("act.night.dj.name")} — ${t("act.night.dj.handle")} on Instagram`}
              tabIndex={ariaHidden ? -1 : undefined}
              className="ease inline-flex items-baseline gap-3 border-0 border-b border-[var(--dn-fg)] py-2 pb-2 font-mono text-[12px] tracking-[0.28em] text-[var(--dn-fg)] uppercase no-underline transition-[gap,padding] duration-300 hover:gap-5 hover:pr-2 md:text-[13px]"
            >
              <span>{t("act.night.dj.handle")}</span>
              <span aria-hidden className="text-[1.2em] leading-none">
                →
              </span>
            </a>
          </RevealItem>
        </RevealStage>
      </Act>

      {/* ── Act IV — Night ───────────────────────────────────────────────
          Feature spread, evening weight. Scene-setter heading + body
          in the left column; polaroid cluster floating right at the
          shared band height. The YM.FM naming beat lives in Act III
          (Liminal's second half), not here — by the time the viewer
          reaches Night they already know whose decks these are. */}
      <Act width={1.5} ariaLabel={t("act.night.label")} ariaHidden={ariaHidden}>
        <ActEyebrow
          numeral="IV"
          label={t("scrubber.night")}
          time={t("act.night.time")}
          align="left"
        />
        <RevealStage
          as="div"
          active={nightActive}
          className="col-start-1 col-end-8 row-start-2 row-end-3 grid max-w-[44ch] gap-6 self-end max-lg:col-span-full xl:gap-9"
        >
          <RevealItem as="h2" className={`${TITLE_SECTION} max-w-[11ch]`}>
            {t("act.night.heading")}
          </RevealItem>
          <RevealItem as="p" className={`${LEDE} max-w-[40ch]`}>
            {t("act.night.body")}
          </RevealItem>
        </RevealStage>
        {/* PLACEHOLDER — YM photos TBC. Per readmes/DAY_N_NIGHT_HANDOFF.md
            § 2.4 / § 3.7: scatter of 5–8 polaroids around the cassette,
            mixed widths (130–260px), broad angle spread (±10°), mixed
            depth signs, mostly empty captions, 1–2 back cards for ambient
            clutter. Swap to YM-specific photos when delivered to
            public/assets/day-n-night/ym/. */}
        <PolaroidGroup className="hidden lg:pointer-events-none lg:absolute lg:top-[14%] lg:right-[4vw] lg:z-[4] lg:flex lg:max-w-[42vw] lg:flex-wrap lg:justify-end lg:gap-7">
          <Polaroid
            src="/assets/day-n-night/IMG_5282.png"
            width={240}
            aspect={1.5}
            angle={-7}
            depth={0.6}
            anchor={ANCHOR_NIGHT}
          />
          <Polaroid
            src="/assets/day-n-night/IMG_6339.png"
            width={170}
            aspect={1.0}
            angle={5}
            depth={-0.4}
            anchor={ANCHOR_NIGHT}
          />
          <Polaroid
            src="/assets/day-n-night/DraggedImage-4.png"
            width={200}
            aspect={1.5}
            angle={-3}
            depth={0.4}
            anchor={ANCHOR_NIGHT}
          />
          <Polaroid
            variant="back"
            backTexture="card-2_back"
            width={150}
            angle={9}
            depth={-0.6}
            anchor={ANCHOR_NIGHT}
          />
          <Polaroid
            src="/assets/day-n-night/DraggedImage-5.png"
            width={220}
            aspect={1.5}
            angle={6}
            depth={0.8}
            anchor={ANCHOR_NIGHT}
          />
          <Polaroid
            src="/assets/day-n-night/DraggedImage-6.png"
            width={185}
            aspect={1.78}
            angle={-5}
            depth={-0.3}
            anchor={ANCHOR_NIGHT}
          />
        </PolaroidGroup>
      </Act>

      {/* ── Act V — Reserve / Back Cover ─────────────────────────────────
          Closing spread. Eyebrow right-aligned (first signal of the
          bookend). Right side gets the hero title mirror + closing kicker
          + CTA. Left side gets the SurvivalKit — practical info lives
          here, not on the cover. Hosts strip bottom-right. */}
      <Act width={1.3} ariaLabel={t("rsvpCta.primary")} ariaHidden={ariaHidden}>
        <ActEyebrow
          numeral="V"
          label={t("entry.heading")}
          time={t("date.short")}
          align="right"
        />
        {/* Host pair — closing placement keeps the cover clean and makes
            "hosted by yours truly" read as one caption for both hosts. */}
        <PolaroidGroup
          active
          className="pointer-events-none absolute inset-0 z-[14]"
        >
          <Polaroid
            src="/assets/day-n-night/hosts/ingyu.jpeg"
            angle={-8}
            width={220}
            className="max-lg:!top-[10%] max-lg:!left-[8%] max-lg:!w-[38vw]"
            style={{ position: "absolute", top: "12%", left: "9%" }}
          />
          <Polaroid
            overlay="card-2_front-clear"
            src="/assets/day-n-night/hosts/sean.png"
            variant="stamped"
            angle={7}
            width={205}
            className="max-lg:!top-[16%] max-lg:!left-[39%] max-lg:!w-[36vw]"
            style={{ position: "absolute", top: "20%", left: "24%" }}
          />
        </PolaroidGroup>
        <div
          className="pointer-events-none absolute z-[15] max-lg:!top-[34%] max-lg:!left-[16%]"
          style={{ top: "47%", left: "13%" }}
        >
          <MarkerText
            text={t("opening.hostedBy")}
            active
            className="font-serif text-[clamp(1.05rem,6.4vw,1.55rem)] font-bold text-[var(--dn-fg)] italic opacity-85 lg:text-[2.25rem] lg:text-faded-black lg:opacity-90"
          />
        </div>
        <div className="col-start-1 col-end-6 row-start-2 row-end-3 hidden flex-col gap-6 self-end max-lg:col-span-full lg:flex">
          <div className="grid gap-3">
            <span className={LABEL_MONO}>{t("tribute.heading")}</span>
            <p className={`${BODY_SERIF} max-w-[34ch]`}>{t("tribute.body")}</p>
          </div>
          <SurvivalKit variant="embedded" />
        </div>
        {/* Closing title block — kicker + hero title + Reserve CTA.
            Reveal cascade preserved. Opacity-faded only during the
            sticky window (see useStickyZone). */}
        <div
          className="col-start-7 col-end-13 row-start-2 row-end-3 self-end text-right max-lg:col-span-full max-lg:text-left"
          style={bookendFade}
        >
          <RevealStage
            as="div"
            active={closingActive}
            className="grid content-end gap-7 xl:gap-9"
          >
            <RevealItem
              as="p"
              className={`${KICKER_MONO} justify-self-end max-lg:justify-self-start`}
            >
              {t("closing.kicker")}
            </RevealItem>
            <RevealItem as="h2" className={TITLE_HERO}>
              {t("title")}
            </RevealItem>
            <RevealItem
              as="div"
              className="justify-self-end max-lg:justify-self-start"
            >
              {ariaHidden ? (
                <span className="ease mt-3 inline-flex items-baseline gap-[18px] border-0 border-b border-[var(--dn-fg)] bg-transparent py-[18px] pb-4 font-mono text-[13px] tracking-[0.32em] text-[var(--dn-fg)] uppercase no-underline md:text-sm">
                  <span>{t("rsvpCta.primary")}</span>
                  <span aria-hidden className="text-[1.2em] leading-none">
                    →
                  </span>
                </span>
              ) : (
                <Button
                  type="button"
                  onClick={onOpenDetails}
                  aria-haspopup="dialog"
                  className="ease mt-3 inline-flex cursor-pointer items-baseline gap-[18px] border-0 border-b border-[var(--dn-fg)] bg-transparent py-[18px] pb-4 font-mono text-[13px] tracking-[0.32em] text-[var(--dn-fg)] uppercase no-underline transition-[gap,padding] duration-300 hover:gap-7 hover:pr-3 md:text-sm"
                >
                  <span>{t("rsvpCta.primary")}</span>
                  <span aria-hidden className="text-[1.2em] leading-none">
                    →
                  </span>
                </Button>
              )}
            </RevealItem>
          </RevealStage>
        </div>
        <div className="col-start-9 col-end-13 row-start-3 row-end-4 grid max-w-[280px] gap-3 self-end justify-self-end text-right max-lg:col-span-full max-lg:justify-self-start max-lg:text-left">
          <span
            aria-hidden
            className="mb-3 ml-auto block h-px w-14 bg-[var(--dn-fg)] opacity-60 max-lg:ml-0"
          />
          <span className="font-mono text-[11px] leading-[1.7] tracking-[0.18em] text-[var(--dn-fg-mute)] uppercase">
            {t("footer.hosts")}
          </span>
          <span className="font-mono text-[11px] leading-[1.7] tracking-[0.18em] text-[var(--dn-fg-mute)] uppercase">
            {t("footer.rsvpClosesAt")}
          </span>
        </div>
      </Act>
    </>
  );
}
