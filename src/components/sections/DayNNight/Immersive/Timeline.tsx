"use client";

import Link from "next/link";
import { useRef } from "react";
import type { useTranslations as UseTranslationsType } from "next-intl";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useShallow } from "zustand/shallow";
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
  const setPhase = useDayNNightScene((r) => r.setPhase);
  const setLayout = useDayNNightScene((r) => r.setLayout);
  const readLayout = useDayNNightScene(useShallow((r) => r.layout));
  const initialLoopPos = useDayNNightScene((r) => r.initialLoopPosition);
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
      className="relative z-[3] h-dvh w-full overflow-hidden max-lg:h-auto max-lg:overflow-visible"
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
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-rows-[auto_1fr_auto] justify-items-center px-6 pt-16 pb-[84px] text-center max-lg:w-full max-lg:max-w-full md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[1.4em] font-medium tracking-normal text-[var(--dn-fg)] normal-case italic">
              I
            </span>
            <span>{t("opening.label")}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("opening.time")}</span>
          </span>
          <RevealStage
            as="div"
            className="m-auto grid max-w-[880px] justify-items-center gap-4"
          >
            <RevealItem
              as="p"
              className="font-mono text-[11px] tracking-[0.32em] text-[var(--dn-fg-mute)] uppercase"
            >
              {t("opening.kicker")}
            </RevealItem>
            <RevealItem
              as="h2"
              className="font-serif text-[clamp(4rem,9vw,9rem)] leading-[0.94] font-bold tracking-[-0.022em] text-[var(--dn-fg)]"
            >
              {t("title")}
            </RevealItem>
            <RevealItem
              as="p"
              className="max-w-[32ch] text-[clamp(1.4rem,1.7vw,1.8rem)] leading-[1.4] font-light tracking-[-0.005em] text-[var(--dn-fg-mute)]"
            >
              {t("opening.lede")}
            </RevealItem>
          </RevealStage>
          <div className="flex gap-12 font-mono text-[11px] tracking-[0.18em] text-[var(--dn-fg-faint)] uppercase">
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
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-cols-[minmax(0,7fr)_minmax(0,5fr)] grid-rows-[auto_1fr_auto] gap-x-12 px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="col-span-full inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[1.4em] font-medium tracking-normal text-[var(--dn-fg)] normal-case italic">
              II
            </span>
            <span>{t("included.heading")}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("act.day.time")}</span>
          </span>
          <RevealStage
            as="div"
            className="col-start-1 col-end-2 row-start-2 row-end-3 grid max-w-[56ch] gap-[22px] self-end"
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
              act, parallaxed around the Cookout anchor (0.279). */}
          <PolaroidGroup className="hidden lg:pointer-events-none lg:absolute lg:top-[24%] lg:right-[6vw] lg:z-[4] lg:flex lg:gap-7">
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
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-rows-[auto_auto_1fr_auto] gap-5 px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[1.4em] font-medium tracking-normal text-[var(--dn-fg)] normal-case italic">
              III
            </span>
            <span>{t("dressCode.heading")}</span>
          </span>
          {/* Two staged reveals: intro fires first (as the user enters Dress),
              then the two columns share a second stage so they cascade in
              together. Splitting the stage means the intro doesn't have to
              wait for the columns to be 55%-visible before triggering. */}
          <RevealStage as="div">
            <RevealItem
              as="p"
              className="mt-8 max-w-[50ch] font-serif text-[clamp(1.3rem,1.4vw,1.55rem)] leading-[1.4] text-[var(--dn-fg-mute)] italic"
            >
              {t("dressCode.intro")}
            </RevealItem>
          </RevealStage>
          <RevealStage
            as="div"
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
          <span className="block max-w-[44ch] font-serif text-[clamp(1.1rem,1.3vw,1.3rem)] leading-[1.45] text-[var(--dn-fg-mute)] italic">
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
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-cols-[minmax(0,8fr)_minmax(0,4fr)] grid-rows-[auto_1fr_auto] gap-x-12 px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="col-span-full inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[1.4em] font-medium tracking-normal text-[var(--dn-fg)] normal-case italic">
              IV
            </span>
            <span>{t("act.night.label")}</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{t("act.night.time")}</span>
          </span>
          <RevealStage
            as="div"
            className="col-start-1 col-end-2 row-start-2 row-end-3 grid max-w-[42ch] gap-5 self-end"
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
          <div className="col-start-2 col-end-3 row-start-3 row-end-4 grid max-w-[320px] min-w-[240px] gap-2 self-end justify-self-end">
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
        className="relative flex h-full flex-none items-stretch justify-center overflow-hidden max-lg:h-auto max-lg:min-h-dvh max-lg:w-full"
      >
        <div className="relative grid h-full w-screen max-w-screen flex-none grid-cols-[minmax(0,8fr)_minmax(0,4fr)] grid-rows-[auto_1fr_auto] gap-x-12 px-6 pt-16 pb-[84px] max-lg:w-full max-lg:max-w-full md:px-12 md:pt-[88px] md:pb-24 xl:px-20 xl:pt-[104px] xl:pb-28">
          <span className="col-span-full inline-flex items-baseline gap-[10px] font-mono text-[10px] tracking-[0.28em] whitespace-nowrap text-[var(--dn-fg-mute)] uppercase xl:text-[11px]">
            <span className="font-serif text-[1.4em] font-medium tracking-normal text-[var(--dn-fg)] normal-case italic">
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
            className="col-start-1 col-end-2 row-start-2 row-end-3 grid max-w-[720px] content-center justify-items-start gap-4"
          >
            <RevealItem
              as="p"
              className="font-mono text-[11px] tracking-[0.22em] text-[var(--dn-fg-mute)] uppercase"
            >
              {t("closing.kicker")}
            </RevealItem>
            <RevealItem
              as="h2"
              className="font-serif text-[clamp(4rem,9vw,8.4rem)] leading-[0.94] font-bold tracking-[-0.02em] text-[var(--dn-fg)]"
            >
              {t("title")}
            </RevealItem>
            <RevealItem
              as="p"
              className="max-w-[42ch] text-[clamp(1.4rem,1.7vw,1.8rem)] leading-[1.4] font-light tracking-[-0.005em] text-[var(--dn-fg-mute)]"
            >
              {t("closing.lede")}
            </RevealItem>
            <RevealItem
              as="div"
              className="mt-2 grid gap-1.5 font-mono text-xs text-[var(--dn-fg-mute)]"
            >
              <span className="font-wide text-[2.4rem] font-black tracking-[0.04em] text-[var(--dn-fg)]">
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
          <div className="col-start-2 col-end-3 row-start-3 row-end-4 grid max-w-[280px] gap-1.5 self-end justify-self-end text-right">
            <span
              aria-hidden
              className="mb-2 ml-auto block h-px w-14 bg-[var(--dn-fg)] opacity-60"
            />
            <span className="font-mono text-[11px] leading-[1.6] tracking-[0.18em] text-[var(--dn-fg-mute)] uppercase">
              {t("footer.hosts")}
            </span>
            <span className="font-mono text-[11px] leading-[1.6] tracking-[0.18em] text-[var(--dn-fg-mute)] uppercase">
              {t("footer.rsvpClosesAt")}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
