"use client";

import Link from "next/link";
import { useRef } from "react";
import type { useTranslations as UseTranslationsType } from "next-intl";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDayNNightScene, SECTION_KEYS, type ActLayout } from "../store";
import { Polaroid, PolaroidGroup } from "./Polaroid";
import { RevealItem, RevealStage } from "./Reveal";
import { SceneView } from "./SceneView";

/**
 * Anchors that polaroid clusters use for their parallax windows. These
 * match the SKY_STOPS section centers in store.ts so each cluster
 * appears to slide through frame as the user passes the section center.
 */
const ANCHOR_COOKOUT = 0.279;
const ANCHOR_DRESS = 0.478;
const ANCHOR_NIGHT = 0.664;

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
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          if (!track.current || !wrap.current) return;

          const trackEl = track.current;
          const setLayout = useDayNNightScene.getState().setLayout;
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
          const readLayout = () => useDayNNightScene.getState().layout;
          const setWidth = () =>
            readLayout()?.setWidth ?? trackEl.scrollWidth / 2;
          const initialLoopPos = () =>
            useDayNNightScene.getState().initialLoopPosition;
          const pinDistance = () => setWidth() * LOOPS;

          // Shared updater — same math for initial paint and every
          // scroll tick. Pulled out so we can seed initial state on
          // ScrollTrigger creation; otherwise the loader's progress=0.05
          // would leak into the scene math and render the sun below the
          // viewport instead of at the horizon hand-off position.
          const update = (selfProgress: number) => {
            const sw = setWidth();
            const init = initialLoopPos();
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
        }
      );

      // Reduced-motion desktop — show all acts in a vertical stack, no scrub.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: reduce)", () => {
        if (!track.current) return;
        gsap.set(track.current, { x: 0 });
        // Advance the sky to mid-day so the scene reads correctly. Also
        // force `playing` so SunLoader unmounts even if its own reduced-
        // motion early-return failed to fire (e.g. SSR ordering).
        setProgress(0.5);
        useDayNNightScene.getState().setPhase("playing");
      });

      // Mobile/tablet — vertical scroll, progress driven by document scroll.
      mm.add("(max-width: 1023px)", () => {
        if (!wrap.current) return;
        // Below `lg` we never enter the immersive loader pin; ensure the
        // phase is `playing` so SunLoader's overlay never blocks the stack.
        useDayNNightScene.getState().setPhase("playing");
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
      className="relative w-full h-dvh overflow-hidden z-[3] max-lg:h-auto max-lg:overflow-visible"
    >
      {/* Scene lives inside the pinned wrap so its `position: fixed` pieces
          remain anchored to the viewport throughout the pin. The site's
          smooth-scroll wrapper breaks raw fixed-positioning mid-scroll;
          nesting under the pinned element side-steps that. */}
      <SceneView />
      <div data-dn-grain aria-hidden className="absolute inset-0 z-[2] pointer-events-none mix-blend-overlay opacity-[0.45]" />
      <div ref={track} data-dn-track className="flex h-full will-change-transform max-lg:flex-col max-lg:h-auto">
        {/* First set — the primary, accessible acts. */}
        <ActSet t={t} />
        {/* Second set — duplicate, marked aria-hidden. Hidden from AT but
            visible to the scroll loop so the boundary is seamless. */}
        <ActSet t={t} ariaHidden />
      </div>
    </div>
  );
}

interface ActSetProps {
  t: Translator;
  ariaHidden?: boolean;
}

function ActSet({ t, ariaHidden = false }: ActSetProps) {
  // The 5 acts are wrapped in a Fragment so the parent track gets them as
  // direct flex children — GSAP measures scrollWidth across them. Each
  // act keeps the same outer flex-item width but gets its own
  // internal layout class so it doesn't read as another stamp of the same
  // header/body/footer template.
  return (
    <>
      {/* Act 1 — Opening / Daybreak.
          Centered hero. Eyebrow above, serif title below, tagline below
          that, with a thin date+location strip anchored at the bottom. */}
      <section
        data-dn-act
        style={{ "--act-w": 1 } as React.CSSProperties}
        aria-label={t("opening.label")}
        aria-hidden={ariaHidden || undefined}
        className="flex-none relative overflow-hidden flex justify-center items-stretch h-full max-lg:w-full max-lg:min-h-dvh max-lg:h-auto"
      >
        <div className="flex-none w-screen max-w-screen h-full relative grid grid-rows-[auto_1fr_auto] justify-items-center text-center pt-16 px-6 pb-[84px] md:pt-[88px] md:px-12 md:pb-24 xl:pt-[104px] xl:px-20 xl:pb-28 max-lg:w-full max-lg:max-w-full">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] xl:text-[11px] tracking-[0.28em] uppercase text-[var(--dn-fg-mute)] whitespace-nowrap">
            <span className="font-serif italic font-medium text-[1.4em] tracking-normal normal-case text-[var(--dn-fg)]">
              I
            </span>
            <span>{t("opening.label")}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("opening.time")}</span>
          </span>
          <RevealStage as="div" className="grid gap-4 max-w-[880px] m-auto justify-items-center">
            <RevealItem as="p" className="font-mono text-[11px] tracking-[0.32em] uppercase text-[var(--dn-fg-mute)]">
              {t("opening.kicker")}
            </RevealItem>
            <RevealItem as="h2" className="font-serif font-bold text-[clamp(4rem,9vw,9rem)] leading-[0.94] tracking-[-0.022em] text-[var(--dn-fg)]">
              {t("title")}
            </RevealItem>
            <RevealItem as="p" className="max-w-[32ch] text-[clamp(1.4rem,1.7vw,1.8rem)] font-light leading-[1.4] text-[var(--dn-fg-mute)] tracking-[-0.005em]">
              {t("opening.lede")}
            </RevealItem>
          </RevealStage>
          <div className="flex gap-12 font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--dn-fg-faint)]">
            <span className="inline-flex gap-[10px] items-baseline">
              <span className="text-[var(--dn-fg-faint)]">{t("date.weekday")}</span>
              <span className="text-[var(--dn-fg-mute)]">{t("date.full")}</span>
            </span>
            <span className="inline-flex gap-[10px] items-baseline">
              <span className="text-[var(--dn-fg-faint)]">{t("location.label")}</span>
              <span className="text-[var(--dn-fg-mute)]">{t("location.neighborhood")}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Act 2 — Cookout.
          Asymmetric. Heading anchored top-left, lede in a narrow column
          beneath. Food / Drinks lists anchored bottom-right as a stack
          of label + comma-separated items. The empty space mid-frame is
          intentional — the sun is doing the work there. */}
      <section
        data-dn-act
        style={{ "--act-w": 1.15 } as React.CSSProperties}
        aria-label={t("act.day.heading")}
        aria-hidden={ariaHidden || undefined}
        className="flex-none relative overflow-hidden flex justify-center items-stretch h-full max-lg:w-full max-lg:min-h-dvh max-lg:h-auto"
      >
        <div className="flex-none w-screen max-w-screen h-full relative grid grid-rows-[auto_1fr_auto] grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-x-12 pt-16 px-6 pb-[84px] md:pt-[88px] md:px-12 md:pb-24 xl:pt-[104px] xl:px-20 xl:pb-28 max-lg:w-full max-lg:max-w-full">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] xl:text-[11px] tracking-[0.28em] uppercase text-[var(--dn-fg-mute)] whitespace-nowrap col-span-full">
            <span className="font-serif italic font-medium text-[1.4em] tracking-normal normal-case text-[var(--dn-fg)]">
              II
            </span>
            <span>{t("included.heading")}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("act.day.time")}</span>
          </span>
          <RevealStage as="div" className="col-start-1 col-end-2 row-start-2 row-end-3 self-end grid gap-[22px] max-w-[56ch]">
            <RevealItem as="h2" className="font-serif font-bold text-[clamp(3rem,6vw,5.4rem)] leading-[1] tracking-[-0.02em] text-[var(--dn-fg)]">
              {t("act.day.heading")}
            </RevealItem>
            <RevealItem as="p" className="text-[clamp(1.4rem,1.6vw,1.7rem)] leading-[1.5] font-light text-[var(--dn-fg-mute)] max-w-[48ch] tracking-[-0.005em]">
              {t("act.day.body")}
            </RevealItem>
          </RevealStage>
          <ul
            className="col-start-2 col-end-3 row-start-3 row-end-4 self-end justify-self-end list-none grid gap-[18px] p-0 m-0 min-w-[280px]"
            aria-label={t("included.heading")}
          >
            <li className="grid gap-1 pt-[14px] border-t border-[var(--dn-line)]">
              <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-[var(--dn-fg-faint)]">
                {t("included.food.label")}
              </span>
              <span className="font-serif text-[clamp(1.6rem,1.7vw,1.9rem)] font-medium text-[var(--dn-fg)] tracking-[-0.01em]">
                {t("included.food.items")}
              </span>
            </li>
            <li className="grid gap-1 pt-[14px] border-t border-[var(--dn-line)]">
              <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-[var(--dn-fg-faint)]">
                {t("included.drinks.label")}
              </span>
              <span className="font-serif text-[clamp(1.6rem,1.7vw,1.9rem)] font-medium text-[var(--dn-fg)] tracking-[-0.01em]">
                {t("included.drinks.items")}
              </span>
            </li>
          </ul>
          {/* Cookout moodboard — smash burgers + ambient food vibes.
              The polaroid cluster lives in the right portion of the
              act, parallaxed around the Cookout anchor (0.279). */}
          <PolaroidGroup className="hidden lg:flex lg:gap-7 lg:absolute lg:top-[24%] lg:right-[6vw] lg:z-[4] lg:pointer-events-none">
            <Polaroid
              src="/assets/day-n-night/DraggedImage.png"
              alt="Smash burgers off the grill"
              caption="smash, off the grill"
              captionStyle="serif"
              width={240}
              aspect={1.05}
              angle={-4}
              depth={0.7}
              anchor={ANCHOR_COOKOUT}
            />
            <Polaroid
              src="/assets/day-n-night/IMG_8543.png"
              alt="Cookout vibes"
              caption="rooftop, late sun"
              captionStyle="marker"
              width={210}
              aspect={1.2}
              angle={5}
              depth={-0.4}
              anchor={ANCHOR_COOKOUT}
            />
            <Polaroid
              src="/assets/day-n-night/IMG_9520.png"
              alt="Cookout vibes"
              width={200}
              aspect={1}
              angle={-2}
              depth={1.0}
              anchor={ANCHOR_COOKOUT}
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
        style={{ "--act-w": 1.1 } as React.CSSProperties}
        aria-label={t("dressCode.heading")}
        aria-hidden={ariaHidden || undefined}
        className="flex-none relative overflow-hidden flex justify-center items-stretch h-full max-lg:w-full max-lg:min-h-dvh max-lg:h-auto"
      >
        <div className="flex-none w-screen max-w-screen h-full relative grid grid-rows-[auto_auto_1fr_auto] gap-5 pt-16 px-6 pb-[84px] md:pt-[88px] md:px-12 md:pb-24 xl:pt-[104px] xl:px-20 xl:pb-28 max-lg:w-full max-lg:max-w-full">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] xl:text-[11px] tracking-[0.28em] uppercase text-[var(--dn-fg-mute)] whitespace-nowrap">
            <span className="font-serif italic font-medium text-[1.4em] tracking-normal normal-case text-[var(--dn-fg)]">
              III
            </span>
            <span>{t("dressCode.heading")}</span>
          </span>
          {/* Two staged reveals: intro fires first (as the user enters Dress),
              then the two columns share a second stage so they cascade in
              together. Splitting the stage means the intro doesn't have to
              wait for the columns to be 55%-visible before triggering. */}
          <RevealStage as="div">
            <RevealItem as="p" className="mt-8 max-w-[50ch] font-serif italic text-[clamp(1.3rem,1.4vw,1.55rem)] leading-[1.4] text-[var(--dn-fg-mute)]">
              {t("dressCode.intro")}
            </RevealItem>
          </RevealStage>
          <RevealStage as="div" className="grid grid-cols-1 gap-9 content-end max-w-[980px] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-x-14">
            <div className="grid gap-[14px] max-w-[38ch]">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--dn-fg-faint)]">01</span>
              <RevealItem as="h3" className="font-serif font-bold text-[clamp(1.8rem,2.4vw,2.4rem)] leading-[1.1] text-[var(--dn-fg)]">
                {t("dressCode.option1.label")}
              </RevealItem>
              <RevealItem as="p" className="text-[1.4rem] leading-[1.55] text-[var(--dn-fg-mute)] max-w-[42ch] font-light">
                {t("dressCode.option1.body")}
              </RevealItem>
            </div>
            <div aria-hidden className="hidden lg:block w-px bg-[var(--dn-line)] self-stretch" />
            <div className="grid gap-[14px] max-w-[38ch]">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--dn-fg-faint)]">02</span>
              <RevealItem as="h3" className="font-serif font-bold text-[clamp(1.8rem,2.4vw,2.4rem)] leading-[1.1] text-[var(--dn-fg)]">
                {t("dressCode.option2.label")}
              </RevealItem>
              <RevealItem as="p" className="text-[1.4rem] leading-[1.55] text-[var(--dn-fg-mute)] max-w-[42ch] font-light">
                {t("dressCode.option2.body")}
              </RevealItem>
            </div>
          </RevealStage>
          {/* Dress moodboard — outfit references pulled straight from the
              dev doc's pop-culture stills. Mixed serif + marker captions
              so the cluster feels like a film-club mood wall instead of
              a polished catalog. Parallaxed around the Dress anchor. */}
          <PolaroidGroup className="hidden lg:flex lg:gap-6 lg:absolute lg:top-[8%] lg:right-[4vw] lg:z-[4] lg:pointer-events-none lg:max-w-[46vw] lg:flex-wrap lg:justify-end">
            <Polaroid
              src="/assets/day-n-night/DraggedImage-1.png"
              alt="Romeo and Juliet — period costume reference"
              caption="still love. soon too old."
              captionStyle="serif"
              width={220}
              aspect={0.78}
              angle={-6}
              depth={0.5}
              anchor={ANCHOR_DRESS}
            />
            <Polaroid
              src="/assets/day-n-night/DraggedImage-2.png"
              alt="All the pink — the next emo girl"
              caption="all the pink"
              captionStyle="marker"
              width={200}
              aspect={1.1}
              angle={4}
              depth={-0.7}
              anchor={ANCHOR_DRESS}
            />
            <Polaroid
              src="/assets/day-n-night/DraggedImage-3.png"
              alt="Steve Carrell, Crazy Stupid Love — dad fit"
              caption="the dad. unbothered."
              captionStyle="serif"
              width={210}
              aspect={1.15}
              angle={-3}
              depth={0.9}
              anchor={ANCHOR_DRESS}
            />
            <Polaroid
              src="/assets/day-n-night/DraggedImage-4.png"
              alt="Pulp Fiction — they're not dads"
              caption="(they're not dads)"
              captionStyle="marker"
              width={200}
              aspect={1.4}
              angle={6}
              depth={-0.3}
              anchor={ANCHOR_DRESS}
            />
            <Polaroid
              src="/assets/day-n-night/DraggedImage-5.png"
              alt="The Dude — Big Lebowski"
              caption="the dude."
              captionStyle="serif"
              width={190}
              aspect={1}
              angle={-7}
              depth={0.6}
              anchor={ANCHOR_DRESS}
            />
          </PolaroidGroup>
          <span className="block font-serif italic text-[clamp(1.1rem,1.3vw,1.3rem)] text-[var(--dn-fg-mute)] max-w-[44ch] leading-[1.45]">
            {t("secret")}
          </span>
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
        style={{ "--act-w": 1 } as React.CSSProperties}
        aria-label={t("act.night.label")}
        aria-hidden={ariaHidden || undefined}
        className="flex-none relative overflow-hidden flex justify-center items-stretch h-full max-lg:w-full max-lg:min-h-dvh max-lg:h-auto"
      >
        <div className="flex-none w-screen max-w-screen h-full relative grid grid-rows-[auto_1fr_auto] grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-x-12 pt-16 px-6 pb-[84px] md:pt-[88px] md:px-12 md:pb-24 xl:pt-[104px] xl:px-20 xl:pb-28 max-lg:w-full max-lg:max-w-full">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] xl:text-[11px] tracking-[0.28em] uppercase text-[var(--dn-fg-mute)] whitespace-nowrap col-span-full">
            <span className="font-serif italic font-medium text-[1.4em] tracking-normal normal-case text-[var(--dn-fg)]">
              IV
            </span>
            <span>{t("act.night.label")}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("act.night.time")}</span>
          </span>
          <RevealStage as="div" className="col-start-1 col-end-2 row-start-2 row-end-3 self-end grid gap-5 max-w-[42ch]">
            <RevealItem as="h2" className="font-serif font-bold text-[clamp(3rem,6vw,5.4rem)] leading-[1.02] tracking-[-0.02em] text-[var(--dn-fg)] max-w-[11ch]">
              {t("act.night.heading")}
            </RevealItem>
            <RevealItem as="p" className="text-[clamp(1.4rem,1.65vw,1.75rem)] leading-[1.45] font-light text-[var(--dn-fg-mute)] max-w-[38ch] tracking-[-0.005em]">
              {t("act.night.body")}
            </RevealItem>
          </RevealStage>
          <div className="col-start-2 col-end-3 row-start-3 row-end-4 self-end justify-self-end grid gap-2 min-w-[240px] max-w-[320px]">
            <span aria-hidden className="block w-14 h-px bg-[var(--dn-fg)] mb-[10px] opacity-60" />
            <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-[var(--dn-fg-faint)]">
              {t("tribute.heading")}
            </span>
            <span className="font-serif italic text-[clamp(1.3rem,1.4vw,1.55rem)] leading-[1.4] text-[var(--dn-fg-mute)]">
              {t("tribute.body")}
            </span>
          </div>
          {/* Night moodboard — the cocktail/suit/jacket references. */}
          <PolaroidGroup className="hidden lg:flex lg:gap-[26px] lg:absolute lg:top-[14%] lg:right-[5vw] lg:z-[4] lg:pointer-events-none lg:max-w-[38vw]">
            <Polaroid
              src="/assets/day-n-night/DraggedImage-6.png"
              alt="Pulp Fiction — suit, dressed up"
              caption="won't stop you"
              captionStyle="serif"
              width={220}
              aspect={1.35}
              angle={-5}
              depth={0.6}
              anchor={ANCHOR_NIGHT}
            />
            <Polaroid
              src="/assets/day-n-night/DraggedImage-7.png"
              alt="Jackets that walk into a quiet bar"
              caption="a layer helps."
              captionStyle="marker"
              width={200}
              aspect={1.1}
              angle={4}
              depth={-0.5}
              anchor={ANCHOR_NIGHT}
            />
          </PolaroidGroup>
        </div>
      </section>

      {/* Act 5 — Closing / RSVP.
          Climax of the loop. Heading scale matches the opening so the
          loop reads bookended. Eyebrow + serif title + lede + fee
          block + CTA stack at center-left; hosts + closing line
          anchored bottom-right as the final word. */}
      <section
        data-dn-act
        style={{ "--act-w": 1.4 } as React.CSSProperties}
        aria-label={t("rsvpCta.primary")}
        aria-hidden={ariaHidden || undefined}
        className="flex-none relative overflow-hidden flex justify-center items-stretch h-full max-lg:w-full max-lg:min-h-dvh max-lg:h-auto"
      >
        <div className="flex-none w-screen max-w-screen h-full relative grid grid-rows-[auto_1fr_auto] grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-x-12 pt-16 px-6 pb-[84px] md:pt-[88px] md:px-12 md:pb-24 xl:pt-[104px] xl:px-20 xl:pb-28 max-lg:w-full max-lg:max-w-full">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] xl:text-[11px] tracking-[0.28em] uppercase text-[var(--dn-fg-mute)] whitespace-nowrap col-span-full">
            <span className="font-serif italic font-medium text-[1.4em] tracking-normal normal-case text-[var(--dn-fg)]">
              V
            </span>
            <span>{t("entry.heading")}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("date.short")}</span>
          </span>
          <RevealStage
            as="div"
            className="col-start-1 col-end-2 row-start-2 row-end-3 grid gap-4 justify-items-start content-center max-w-[720px]"
          >
            <RevealItem as="p" className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--dn-fg-mute)]">
              {t("closing.kicker")}
            </RevealItem>
            <RevealItem as="h2" className="font-serif font-bold text-[clamp(4rem,9vw,8.4rem)] leading-[0.94] tracking-[-0.02em] text-[var(--dn-fg)]">
              {t("title")}
            </RevealItem>
            <RevealItem as="p" className="text-[clamp(1.4rem,1.7vw,1.8rem)] leading-[1.4] font-light text-[var(--dn-fg-mute)] max-w-[42ch] tracking-[-0.005em]">
              {t("closing.lede")}
            </RevealItem>
            <RevealItem as="div" className="mt-2 grid gap-1.5 font-mono text-xs text-[var(--dn-fg-mute)]">
              <span className="font-wide font-black text-[2.4rem] tracking-[0.04em] text-[var(--dn-fg)]">
                {t("entry.amount")}
              </span>
              <span>{t("entry.method")}</span>
              <span>
                {t("entry.bank")} · {t("entry.accountHolder")}
              </span>
            </RevealItem>
            <RevealItem as="div">
              <Link
                href="/tickets/day-n-night"
                className="inline-flex items-baseline gap-[18px] py-[18px] pb-4 mt-3 border-0 border-b border-[var(--dn-fg)] bg-transparent text-[var(--dn-fg)] font-mono text-[13px] tracking-[0.32em] uppercase no-underline cursor-pointer transition-[gap,padding] duration-300 ease hover:gap-7 hover:pr-3 md:text-sm"
                tabIndex={ariaHidden ? -1 : undefined}
              >
                <span>{t("rsvpCta.primary")}</span>
                <span aria-hidden className="text-[1.2em] leading-none">
                  →
                </span>
              </Link>
            </RevealItem>
          </RevealStage>
          <div className="col-start-2 col-end-3 row-start-3 row-end-4 self-end justify-self-end grid gap-1.5 text-right max-w-[280px]">
            <span aria-hidden className="block w-14 h-px bg-[var(--dn-fg)] ml-auto mb-2 opacity-60" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--dn-fg-mute)] leading-[1.6]">
              {t("footer.hosts")}
            </span>
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--dn-fg-mute)] leading-[1.6]">
              {t("footer.rsvpClosesAt")}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
