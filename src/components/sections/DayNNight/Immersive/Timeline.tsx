"use client";

import { cn } from "@/lib/utils";
import { useWindowResize } from "@/utilities/use_window_resize";
import { Link } from "@/components/core/Link/Link";
import { useEffect, useRef } from "react";
import type { useTranslations as UseTranslationsType } from "next-intl";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useShallow } from "zustand/shallow";
import { useLenis } from "lenis/react";
import { useDayNNightScene, SECTION_KEYS, type ActLayout } from "../store";
import { Polaroid, PolaroidGroup } from "./Polaroid";
import { RevealItem, RevealStage, useActRevealActive } from "./Reveal";
import { SceneView } from "./SceneView";
import { SurvivalKit } from "../SurvivalKit";
import {
  Act,
  ActEyebrow,
  TITLE_HERO,
  TITLE_SECTION,
  TITLE_PAIR,
  LEDE,
  BODY_SERIF,
  KICKER_MONO,
  LABEL_MONO
} from "./Act";
import { OpeningCard } from "./OpeningCard";
import { useStickyZone } from "./SeamBridge";

/**
 * Anchors that polaroid clusters use for their parallax windows. These
 * match the SKY_STOPS section centers in store.ts so each cluster
 * appears to slide through frame as the user passes the section center.
 */
const ANCHOR_COOKOUT = 0.279;
const ANCHOR_DRESS = 0.478;
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
export function Timeline() {
  const t = useTranslations("Event.DayNNight");
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
      className="relative z-[3] h-screen w-full overflow-hidden pb-25 max-lg:h-auto max-lg:overflow-visible lg:h-dvh"
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
        <ActSet t={t} isPlaying={isPlaying} />
        {/* Second set — duplicate, marked aria-hidden. Hidden from AT but
            visible to the scroll loop so the boundary is seamless. */}
        <ActSet t={t} isPlaying={isPlaying} ariaHidden />
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
  /** When true, the Opening's choreographed reveal fires. The duplicate
   *  ActSet receives the same flag so both copies stay in sync. */
  isPlaying: boolean;
  ariaHidden?: boolean;
}

function ActSet({ t, isPlaying, ariaHidden = false }: ActSetProps) {
  // Per-act reveal gates. Opening fires once `phase === "playing"`
  // (i.e. the loader has handed off); the other 4 acts gate on a
  // layout-aware scene-progress threshold via `useActRevealActive` so
  // the blur-in lands as each act enters frame, not when its center
  // reaches viewport center.
  //
  // The two ActSets (primary + duplicate-for-loop) each call these
  // hooks independently; the boolean selector pattern means each ActSet
  // re-renders only on the threshold crossing, not on every progress
  // write. Both copies stay in sync because they read from the same
  // store.
  const openingActive = isPlaying;
  const cookoutActive = useActRevealActive(ACT_INDEX_COOKOUT);
  const dressActive = useActRevealActive(ACT_INDEX_DRESS);
  const nightActive = useActRevealActive(ACT_INDEX_NIGHT);
  const closingActive = useActRevealActive(ACT_INDEX_CLOSING);
  // True only during the sticky window (Closing title at viewport-left
  // → Opening's left edge enters viewport). Outside this narrow window
  // the bookend titles render as normal RevealItems and move with the
  // GSAP track.
  const inStickyZone = useStickyZone();
  const bookendFade = {
    opacity: inStickyZone ? 0 : 1,
    transition: "opacity 200ms ease-out"
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
      <Act
        width={1.3}
        ariaLabel={t("opening.label")}
        ariaHidden={ariaHidden}
        className="lg:-left-[22%]"
      >
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
        <div className="col-start-8 col-end-13 row-start-2 row-end-3 hidden self-end justify-self-end max-lg:col-span-full lg:flex">
          <OpeningCard />
        </div>
        {/* Bottom-left strip — date + location. Mirrors Closing's bottom-
            right hosts strip; same tier of editorial chrome, opposing
            alignment. */}
        <div className="col-start-1 col-end-5 row-start-3 row-end-4 grid max-w-[280px] gap-3 self-end justify-self-start max-lg:col-span-full">
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
        </div>
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

      {/* ── Act III — Dress Code ─────────────────────────────────────────
          Centerfold. Heading top-left (Section scale), two numbered
          options (01 / 02) bottom-left at Pair scale, polaroid wall
          floating right at the shared band height. */}
      <Act
        width={1.55}
        ariaLabel={t("dressCode.heading")}
        ariaHidden={ariaHidden}
      >
        <ActEyebrow numeral="III" label={t("scrubber.dress")} align="left" />
        <RevealStage
          as="div"
          active={dressActive}
          className="col-start-1 col-end-8 row-start-2 row-end-4 grid content-between gap-12 self-stretch max-lg:col-span-full"
        >
          <RevealItem as="h2" className={cn(TITLE_SECTION, "max-w-[18ch]")}>
            {t("dressCode.heading")}
          </RevealItem>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-12">
            <div className="grid max-w-[36ch] gap-[14px]">
              <span className={LABEL_MONO}>01</span>
              <RevealItem as="h3" className={TITLE_PAIR}>
                {t("dressCode.option1.label")}
              </RevealItem>
              <RevealItem as="p" className={`${LEDE} max-w-[40ch]`}>
                {t("dressCode.option1.body")}
              </RevealItem>
            </div>
            <div className="grid max-w-[36ch] gap-[14px]">
              <span className={LABEL_MONO}>02</span>
              <RevealItem as="h3" className={TITLE_PAIR}>
                {t("dressCode.option2.label")}
              </RevealItem>
              <RevealItem as="p" className={`${LEDE} max-w-[40ch]`}>
                {t("dressCode.option2.body")}
              </RevealItem>
            </div>
          </div>
        </RevealStage>
        <PolaroidGroup className="hidden lg:pointer-events-none lg:absolute lg:top-[16%] lg:right-[4vw] lg:z-[4] lg:flex lg:max-w-[42vw] lg:flex-wrap lg:justify-end lg:gap-6">
          <Polaroid
            variant="stamped"
            overlay="card-2_front-clear"
            src="/assets/day-n-night/DraggedImage-1.png"
            alt={t("moodboard.dress.romeo.alt")}
            caption={t("moodboard.dress.romeo.caption")}
            width={250}
            angle={-4}
            depth={0.4}
            anchor={ANCHOR_DRESS}
          />
          <Polaroid
            variant="stamped"
            overlay="card-4_front-clear"
            src="/assets/day-n-night/DraggedImage-2.png"
            alt={t("moodboard.dress.pink.alt")}
            caption={t("moodboard.dress.pink.caption")}
            width={230}
            angle={3}
            depth={-0.5}
            anchor={ANCHOR_DRESS}
          />
          <Polaroid
            variant="stamped"
            overlay="card-4_front-clear"
            src="/assets/day-n-night/DraggedImage-3.png"
            alt={t("moodboard.dress.dad.alt")}
            caption={t("moodboard.dress.dad.caption")}
            width={220}
            angle={-3}
            depth={0.7}
            anchor={ANCHOR_DRESS}
          />
        </PolaroidGroup>
      </Act>

      {/* ── Act IV — Night ───────────────────────────────────────────────
          Feature spread, evening weight. Title + lede bottom-left,
          tribute dossier bottom-right framed with a thin top rule,
          polaroid cluster floating right at the shared band height. */}
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
        <div className="col-start-9 col-end-13 row-start-3 row-end-4 grid max-w-[320px] min-w-[240px] gap-2 self-end justify-self-end max-lg:col-span-full max-lg:justify-self-start">
          <span
            aria-hidden
            className="mb-[10px] block h-px w-14 bg-[var(--dn-fg)] opacity-60"
          />
          <span className={LABEL_MONO}>{t("tribute.heading")}</span>
          <span className="font-serif text-[clamp(1.3rem,1.4vw,1.55rem)] leading-[1.4] text-[var(--dn-fg-mute)] italic">
            {t("tribute.body")}
          </span>
        </div>
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
        <div className="col-start-1 col-end-6 row-start-2 row-end-3 hidden flex-col gap-6 self-end max-lg:col-span-full lg:flex">
          <p className={`${BODY_SERIF} max-w-[40ch]`}>{t("closing.lede")}</p>
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
              <Link
                href="/tickets/day-n-night"
                className="ease mt-3 inline-flex cursor-pointer items-baseline gap-[18px] border-0 border-b border-[var(--dn-fg)] bg-transparent py-[18px] pb-4 font-mono text-[13px] tracking-[0.32em] text-[var(--dn-fg)] uppercase no-underline transition-[gap,padding] duration-300 hover:gap-7 hover:pr-3 md:text-sm"
                tabIndex={ariaHidden ? -1 : undefined}
              >
                <span>{t("rsvpCta.primary")}</span>
                <span aria-hidden className="text-[1.2em] leading-none">
                  →
                </span>
              </Link>
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
