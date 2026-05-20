"use client";

import Link from "next/link";
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
  // Per-act reveal gates. Opening gates on `isPlaying` so it doesn't
  // fire while the loader is still visible (the prior `whileInView`
  // model triggered during the loader covering, completing Opening's
  // stagger before the user could see it). The other 4 acts gate on a
  // layout-aware scene-progress threshold so the blur-in lands before
  // the heading sits at viewport center, not after. P0.2 + P0.3.
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

  // The 5 acts are wrapped in a Fragment so the parent track gets them as
  // direct flex children — GSAP measures scrollWidth across them. Each
  // act keeps the same outer flex-item width but gets its own
  // internal layout class so it doesn't read as another stamp of the same
  // header/body/footer template.
  return (
    <>
      {/* Act 1 — Opening / Daybreak.
          Asymmetric hero (P5c). Title + kicker + lede stack top-left;
          SurvivalKit summary doc bottom-right. The two regions overlap
          diagonally so the eye reads title-down-into-summary, not
          column-vs-column. Eyebrow spans the top edge; date/location
          strip spans the bottom-left.

          --act-w bumped 1 → 1.5 so the asymmetric composition has
          breathing room; the wider act also means the user spends
          more vertical scroll inside Opening, giving the summary doc
          longer screen time before scene transitions to Cookout. */}
      <section
        data-dn-act
        style={{ "--act-w": 1.45 } as React.CSSProperties}
        aria-label={t("opening.label")}
        aria-hidden={ariaHidden || undefined}
        inert={ariaHidden ? true : undefined}
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-cols-[minmax(0,8fr)_minmax(0,5fr)] grid-rows-[auto_1fr_auto] gap-x-16 px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full max-lg:grid-cols-1 md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="col-span-full inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[3.5rem] font-medium tracking-normal text-[var(--dn-fg)] italic">
              I.
            </span>
            <span className="text-bold font-serif text-[3rem] capitalize italic">
              {t("opening.label")}
            </span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("opening.time")}</span>
          </span>
          {/* Left column — title block. Anchored to the upper-left of
              the content area (row 2 start) so the eye lands here first.
              The opening.body line carries the editorial voice beneath
              the lede; it sits as a quiet serif aside between the lede
              and the SurvivalKit's bottom-right anchor. */}
          {/* Title block — RevealStage with NO max-w on the container
              so the hero title can take full column width and grow to
              theatrical scale (P5c v4 — golden-ratio columns + bigger
              type). Lede and opening.body each carry their own
              narrower max-w for prose readability; the title floats
              free of those constraints so it reads as the act's
              structural element. */}
          {/* Title block — Visual System v1.
              Natural left alignment (no justify-self override). Top
              of row 2 baseline shared with the kit on the right.
              Inner gap = 24px (sm) between kicker/title, 40px (md)
              between title/lede, 24px between lede/body. */}
          <RevealStage
            as="div"
            active={openingActive}
            className="col-start-1 col-end-2 row-start-2 row-end-3 grid content-start gap-6 self-start max-lg:col-span-full"
          >
            <RevealItem
              as="p"
              className="font-mono text-[11px] tracking-[0.32em] text-[var(--dn-fg-mute)] uppercase"
            >
              {t("opening.kicker")}
            </RevealItem>
            <RevealItem
              as="h2"
              className="font-serif text-[clamp(4rem,7vw,8rem)] leading-[0.95] font-bold tracking-[-0.025em] text-[var(--dn-fg)]"
            >
              {t("title")}
            </RevealItem>
            <RevealItem
              as="p"
              className="mt-4 max-w-[40ch] text-[clamp(1.5rem,1.7vw,1.7rem)] leading-[1.4] font-light tracking-[-0.005em] text-[var(--dn-fg-mute)]"
            >
              {t("opening.lede")}
            </RevealItem>
            <RevealItem
              as="p"
              className="max-w-[44ch] font-serif text-[clamp(1.6rem,2vw,2rem)] leading-[1.3] tracking-[-0.005em] text-[var(--dn-fg-mute)] italic"
            >
              {t("opening.body")}
            </RevealItem>
          </RevealStage>
          {/* Right column — SurvivalKit. Bottom-anchored so it pulls
              the eye downward-right after reading the title block,
              completing the diagonal composition. Embedded variant
              strips the standalone top margin and tightens the
              max-width so it fits the column. */}
          {/* Kit (col 2) — natural left alignment, top-aligned at row 2.
              Shares the title block's top baseline so the eye reads
              title ↔ kit eyebrow as a single horizontal anchor line. */}
          <div className="col-start-2 col-end-3 row-start-2 row-end-3 hidden self-start lg:block">
            <SurvivalKit variant="embedded" />
          </div>
          <div className="col-start-1 col-end-2 row-start-3 row-end-4 flex gap-12 self-end font-mono text-[11px] tracking-[0.18em] text-[var(--dn-fg-faint)] uppercase max-lg:col-span-full max-lg:flex-wrap max-lg:gap-6">
            <span className="inline-flex items-baseline gap-[10px]">
              <span className="text-[var(--dn-fg-faint)]">
                {t("date.weekday")}
              </span>
              <span className="text-[var(--dn-fg-mute)]">{t("date.full")}</span>
            </span>
            <span className="inline-flex items-baseline gap-[10px]">
              <span className="text-[var(--dn-fg-faint)]">
                {t("location.label")}
              </span>
              <span className="text-[var(--dn-fg-mute)]">
                {t("location.neighborhood")}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Act 2 — Cookout (P5c: top-anchored against Night's bottom-anchor).
          Heading + lede anchored TOP-LEFT of the content area (just
          below the eyebrow), Food/Drinks list anchored BOTTOM-RIGHT.
          The diagonal reads top-left → bottom-right ("morning lift,
          afternoon settle"). Night does the opposite — bottom-anchored
          on both sides ("evening weight") — so the two adjacent acts
          read as visually distinct passes through similar material. */}
      <section
        data-dn-act
        style={{ "--act-w": 1.6 } as React.CSSProperties}
        aria-label={t("act.day.heading")}
        aria-hidden={ariaHidden || undefined}
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
        inert={ariaHidden ? true : undefined}
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-cols-[minmax(0,5fr)_minmax(0,7fr)] grid-rows-[auto_1fr_auto] gap-x-[55px] gap-y-[34px] px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full max-lg:grid-cols-1 md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          {/* R4: gap-y-[34px] on the grid creates breathing room
              between the row-1 eyebrow and the row-2 title block. */}
          <span className="col-span-full inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[3.5rem] font-medium tracking-normal text-[var(--dn-fg)] italic">
              II.
            </span>
            <span className="text-bold font-serif text-[3rem] capitalize italic">
              {t("included.heading").toLowerCase()}
            </span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("act.day.time")}</span>
          </span>
          <RevealStage
            as="div"
            active={cookoutActive}
            className="col-start-1 col-end-2 row-start-2 row-end-3 grid max-w-[56ch] content-start gap-6 self-start xl:gap-8"
          >
            <RevealItem
              as="h2"
              className="font-serif text-[clamp(3rem,6vw,5.4rem)] leading-[1] font-bold tracking-[-0.02em] text-[var(--dn-fg)]"
            >
              {t("act.day.heading")}
            </RevealItem>
            <RevealItem
              as="p"
              className="max-w-[48ch] text-[clamp(1.4rem,1.6vw,1.7rem)] leading-[1.5] font-light tracking-[-0.005em] text-[var(--dn-fg-mute)]"
            >
              {t("act.day.body")}
            </RevealItem>
          </RevealStage>
          <ul
            className="col-start-2 col-end-3 row-start-3 row-end-4 m-0 grid min-w-[280px] list-none gap-[18px] self-end justify-self-end p-0"
            aria-label={t("included.heading")}
          >
            <li className="grid gap-1 border-t border-[var(--dn-line)] pt-[14px]">
              <span className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
                {t("included.food.label")}
              </span>
              <span className="font-serif text-[clamp(1.6rem,1.7vw,1.9rem)] font-medium tracking-[-0.01em] text-[var(--dn-fg)]">
                {t("included.food.items")}
              </span>
            </li>
            <li className="grid gap-1 border-t border-[var(--dn-line)] pt-[14px]">
              <span className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
                {t("included.drinks.label")}
              </span>
              <span className="font-serif text-[clamp(1.6rem,1.7vw,1.9rem)] font-medium tracking-[-0.01em] text-[var(--dn-fg)]">
                {t("included.drinks.items")}
              </span>
            </li>
          </ul>
          {/* Cookout moodboard — smash burgers + ambient food vibes.
              The polaroid cluster lives in the right portion of the
              act, parallaxed around the Cookout anchor (0.279).
              R3: polaroid widths bumped (180/230/210 → 280/340/300)
              and cluster gap bumped (gap-7 → gap-14) so the photos
              hold their territory instead of huddling tiny in vast
              empty zone. */}
          <PolaroidGroup className="hidden lg:pointer-events-none lg:absolute lg:top-[22%] lg:right-[4vw] lg:z-[4] lg:flex lg:gap-10">
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
        </div>
      </section>

      {/* Act 3 — Dress code.
          The two options are the content; the heading is chrome. Caps
          mono eyebrow up top, the two columns as a split-screen with a
          thin vertical rule between them, and the secret line in italic
          serif as a quiet aside anchored bottom-left. */}
      <section
        data-dn-act
        style={{ "--act-w": 1.55 } as React.CSSProperties}
        aria-label={t("dressCode.heading")}
        aria-hidden={ariaHidden || undefined}
        inert={ariaHidden ? true : undefined}
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-rows-[auto_auto_1fr_auto] gap-5 px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[3.5rem] font-medium tracking-normal text-[var(--dn-fg)] italic">
              III.
            </span>
            <span className="text-bold font-serif text-[3rem] capitalize italic">
              {t("dressCode.heading")}
            </span>
          </span>
          {/* The dressCode.intro RevealStage was removed: it rendered an
              empty fragment and consumed a grid row + an animation
              slot. Two-column dress code below is now the only revealed
              content under the Dress eyebrow. */}
          <RevealStage
            as="div"
            active={dressActive}
            className="grid max-w-[980px] grid-cols-1 content-end gap-9 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-14"
          >
            <div className="grid max-w-[38ch] gap-[14px]">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--dn-fg-faint)] uppercase">
                01
              </span>
              <RevealItem
                as="h3"
                className="font-serif text-[clamp(1.8rem,2.4vw,2.4rem)] leading-[1.1] font-bold text-[var(--dn-fg)]"
              >
                {t("dressCode.option1.label")}
              </RevealItem>
              <RevealItem
                as="p"
                className="max-w-[42ch] text-[1.4rem] leading-[1.55] font-light text-[var(--dn-fg-mute)]"
              >
                {t("dressCode.option1.body")}
              </RevealItem>
            </div>
            <div
              aria-hidden
              className="hidden w-px self-stretch bg-[var(--dn-line)] lg:block"
            />
            <div className="grid max-w-[38ch] gap-[14px]">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[var(--dn-fg-faint)] uppercase">
                02
              </span>
              <RevealItem
                as="h3"
                className="font-serif text-[clamp(1.8rem,2.4vw,2.4rem)] leading-[1.1] font-bold text-[var(--dn-fg)]"
              >
                {t("dressCode.option2.label")}
              </RevealItem>
              <RevealItem
                as="p"
                className="max-w-[42ch] text-[1.4rem] leading-[1.55] font-light text-[var(--dn-fg-mute)]"
              >
                {t("dressCode.option2.body")}
              </RevealItem>
            </div>
          </RevealStage>
          {/* Dress moodboard — outfit references pulled straight from the
              dev doc's pop-culture stills. Mixed serif + marker captions
              so the cluster feels like a film-club mood wall instead of
              a polished catalog. Parallaxed around the Dress anchor. */}
          <PolaroidGroup className="hidden lg:pointer-events-none lg:absolute lg:top-[8%] lg:right-[4vw] lg:z-[4] lg:flex lg:max-w-[46vw] lg:flex-wrap lg:justify-end lg:gap-6">
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
        </div>
      </section>

      {/* Act 4 — Night.
          Heading takes the upper-left quadrant in a wide serif scale.
          Lede sits beneath. YM.FM credit is anchored bottom-right as a
          small "stamp" — caps label above a body line, with a thin
          rule overhead. The asymmetry is the point: the night side of
          the loop weighs differently than the cookout side. */}
      <section
        data-dn-act
        style={{ "--act-w": 1.45 } as React.CSSProperties}
        aria-label={t("act.night.label")}
        aria-hidden={ariaHidden || undefined}
        inert={ariaHidden ? true : undefined}
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-cols-[minmax(0,8fr)_minmax(0,5fr)] grid-rows-[auto_1fr_auto] gap-x-[55px] px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full max-lg:grid-cols-1 md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="col-span-full inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[3.5rem] font-medium tracking-normal text-[var(--dn-fg)] italic">
              IV.
            </span>
            <span className="text-bold font-serif text-[3rem] capitalize italic">
              {t("act.night.label")}
            </span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("act.night.time")}</span>
          </span>
          <RevealStage
            as="div"
            active={nightActive}
            className="col-start-1 col-end-2 row-start-2 row-end-3 grid max-w-[42ch] gap-[21px] self-end max-lg:col-span-full xl:gap-[34px]"
          >
            <RevealItem
              as="h2"
              className="max-w-[11ch] font-serif text-[clamp(3rem,6vw,5.4rem)] leading-[1.02] font-bold tracking-[-0.02em] text-[var(--dn-fg)]"
            >
              {t("act.night.heading")}
            </RevealItem>
            <RevealItem
              as="p"
              className="max-w-[38ch] text-[clamp(1.4rem,1.65vw,1.75rem)] leading-[1.45] font-light tracking-[-0.005em] text-[var(--dn-fg-mute)]"
            >
              {t("act.night.body")}
            </RevealItem>
          </RevealStage>
          <div className="col-start-2 col-end-3 row-start-3 row-end-4 grid max-w-[320px] min-w-[240px] gap-2 self-end justify-self-end max-lg:col-span-full max-lg:justify-self-start">
            <span
              aria-hidden
              className="mb-[10px] block h-px w-14 bg-[var(--dn-fg)] opacity-60"
            />
            <span className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
              {t("tribute.heading")}
            </span>
            <span className="font-serif text-[clamp(1.3rem,1.4vw,1.55rem)] leading-[1.4] text-[var(--dn-fg-mute)] italic">
              {t("tribute.body")}
            </span>
          </div>
          {/* Night moodboard — the cocktail/suit/jacket references. */}
          <PolaroidGroup className="hidden lg:pointer-events-none lg:absolute lg:top-[14%] lg:right-[5vw] lg:z-[4] lg:flex lg:max-w-[38vw] lg:gap-[26px]">
            <Polaroid
              src="/assets/day-n-night/DraggedImage-6.png"
              alt={t("moodboard.night.suit.alt")}
              caption={t("moodboard.night.suit.caption")}
              width={230}
              aspect={1.781}
              angle={-5}
              depth={0.6}
              anchor={ANCHOR_NIGHT}
            />
            <Polaroid
              src="/assets/day-n-night/DraggedImage-7.png"
              alt={t("moodboard.night.jacket.alt")}
              caption={t("moodboard.night.jacket.caption")}
              width={210}
              aspect={1.501}
              angle={4}
              depth={-0.5}
              anchor={ANCHOR_NIGHT}
            />
          </PolaroidGroup>
        </div>
      </section>

      {/* Act 5 — Closing / RSVP (P5c bookend).
          The loop's climax — same "Day n Night" title as Opening, but
          mirrored compositionally so the bookend reads as paired, not
          duplicate. Title block sits TOP-RIGHT (Opening had it
          top-left); the SurvivalKit reprise sits BOTTOM-LEFT (Opening
          had it bottom-right). The closing italic line frames the
          SurvivalKit from above as a quiet farewell prelude to the
          practical info.

          --act-w bumped 1.4 → 1.6 so the bookend has the same lateral
          breathing room as Opening (1.5) and the user spends comparable
          scroll time on both ends of the loop. */}
      <section
        data-dn-act
        style={{ "--act-w": 1.65 } as React.CSSProperties}
        aria-label={t("rsvpCta.primary")}
        aria-hidden={ariaHidden || undefined}
        inert={ariaHidden ? true : undefined}
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-cols-[minmax(0,5fr)_minmax(0,8fr)] grid-rows-[auto_1fr_auto] gap-x-16 px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full max-lg:grid-cols-1 md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          {/* Eyebrow — right-aligned to anchor the title-top-right
              orientation. Opening's eyebrow is left-aligned; the
              mirrored alignment is the first signal of the bookend. */}
          <span className="col-span-full inline-flex items-baseline justify-end gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[3.5rem] font-medium tracking-normal text-[var(--dn-fg)] italic">
              V.
            </span>
            <span className="text-bold font-serif text-[3rem] capitalize italic">
              {t("entry.heading")}
            </span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("date.short")}</span>
          </span>
          {/* Left column — closing italic framing + SurvivalKit reprise.
              The italic line sits as a quiet farewell prelude ("see you
              there") above the practical-info dossier. Bottom-anchored
              so it pulls the eye downward-left, completing the diagonal
              against the upper-right title block. */}
          <div className="col-start-1 col-end-2 row-start-2 row-end-3 hidden flex-col justify-start gap-6 self-start max-lg:col-span-full lg:flex">
            <p className="max-w-[44ch] font-serif text-[clamp(1.6rem,2.4vw,2.1rem)] leading-[1.2] tracking-[-0.005em] text-[var(--dn-fg-mute)] italic">
              {t("closing.lede")}
            </p>
            <SurvivalKit variant="embedded" />
          </div>
          {/* Right column — title block + CTA. Mirrors Opening's
              left-column title block in scale and weight so the loop
              reads bookended; the CTA replaces Opening's date/location
              strip as the act's final affordance. */}
          {/* Right column title block — mirrors Opening's title
              scale + structure for the bookend. justify-self-end
              keeps the title anchored to the right edge of the wider
              8fr column. */}
          <RevealStage
            as="div"
            active={closingActive}
            className="col-start-2 col-end-3 row-start-2 row-end-3 grid content-start gap-6 self-start max-lg:col-span-full"
          >
            <RevealItem
              as="p"
              className="font-mono text-[11px] tracking-[0.22em] text-[var(--dn-fg-mute)] uppercase"
            >
              {t("closing.kicker")}
            </RevealItem>
            <RevealItem
              as="h2"
              className="font-serif text-[clamp(4rem,7vw,8rem)] leading-[0.95] font-bold tracking-[-0.025em] text-[var(--dn-fg)]"
            >
              {t("title")}
            </RevealItem>
            <RevealItem as="div">
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
          {/* Hosts strip — right-aligned bottom edge. Pairs with
              Opening's left-aligned bottom date/location strip — same
              tier of editorial chrome, opposing alignment. */}
          <div className="col-start-2 col-end-3 row-start-3 row-end-4 grid max-w-[280px] gap-3 self-end justify-self-end text-right max-lg:col-span-full max-lg:justify-self-start max-lg:text-left">
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
        </div>
      </section>
    </>
  );
}
