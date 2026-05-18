"use client";

import Link from "next/link";
import { useRef } from "react";
import type { useTranslations as UseTranslationsType } from "next-intl";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDayNNightScene, SECTION_KEYS, type ActLayout } from "../store";
import { Reveal } from "./Reveal";
import { SceneView } from "./SceneView";
import s from "../styles.module.scss";

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
    <div ref={wrap} className={s.timelineWrap}>
      {/* Scene lives inside the pinned wrap so its `position: fixed` pieces
          remain anchored to the viewport throughout the pin. The site's
          smooth-scroll wrapper breaks raw fixed-positioning mid-scroll;
          nesting under the pinned element side-steps that. */}
      <SceneView />
      <div className={s.grain} aria-hidden />
      <div ref={track} className={s.timelineTrack}>
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
  // act keeps the same outer `.act` flex-item width but gets its own
  // internal layout class so it doesn't read as another stamp of the same
  // header/body/footer template (see compsych.konpo.co for the
  // methodology — every section there is a bespoke composition).
  return (
    <>
      {/* Act 1 — Opening / Daybreak.
          Centered hero. Eyebrow above, serif title below, tagline below
          that, with a thin date+location strip anchored at the bottom. */}
      <section
        className={`${s.act} ${s.actOpening}`}
        aria-label={t("opening.label")}
        aria-hidden={ariaHidden || undefined}
      >
        <div className={s.actInner}>
          <span className={s.actEyebrow}>
            <span className={s.actEyebrowRoman}>I</span>
            <span>{t("opening.label")}</span>
            <span className={s.actEyebrowDot} aria-hidden>
              ·
            </span>
            <span>{t("opening.time")}</span>
          </span>
          <div className={s.openingStack}>
            <Reveal as="p" className={s.openingKicker} delay={0.05}>
              {t("opening.kicker")}
            </Reveal>
            <Reveal as="h2" className={s.openingTitle} delay={0.15}>
              {t("title")}
            </Reveal>
            <Reveal as="p" className={s.openingLede} delay={0.3}>
              {t("opening.lede")}
            </Reveal>
          </div>
          <div className={s.openingFoot}>
            <span className={s.openingFootItem}>
              <span className={s.actFooterItemKey}>{t("date.weekday")}</span>
              <span className={s.actFooterItemVal}>{t("date.full")}</span>
            </span>
            <span className={s.openingFootItem}>
              <span className={s.actFooterItemKey}>{t("location.label")}</span>
              <span className={s.actFooterItemVal}>
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
        className={`${s.act} ${s.actCookout}`}
        aria-label={t("act.day.heading")}
        aria-hidden={ariaHidden || undefined}
      >
        <div className={s.actInner}>
          <span className={`${s.actEyebrow} ${s.actEyebrowTopLeft}`}>
            <span className={s.actEyebrowRoman}>II</span>
            <span>{t("included.heading")}</span>
            <span className={s.actEyebrowDot} aria-hidden>
              ·
            </span>
            <span>{t("act.day.time")}</span>
          </span>
          <div className={s.cookoutHead}>
            <Reveal as="h2" className={s.actHeading} delay={0.05}>
              {t("act.day.heading")}
            </Reveal>
            <Reveal as="p" className={s.cookoutLede} delay={0.2}>
              {t("act.day.body")}
            </Reveal>
          </div>
          <ul className={s.cookoutList} aria-label={t("included.heading")}>
            <li className={s.cookoutListItem}>
              <span className={s.cookoutListLabel}>
                {t("included.food.label")}
              </span>
              <span className={s.cookoutListValue}>
                {t("included.food.items")}
              </span>
            </li>
            <li className={s.cookoutListItem}>
              <span className={s.cookoutListLabel}>
                {t("included.drinks.label")}
              </span>
              <span className={s.cookoutListValue}>
                {t("included.drinks.items")}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Act 3 — Dress code.
          The two options are the content; the heading is chrome. Caps
          mono eyebrow up top, the two columns as a split-screen with a
          thin vertical rule between them, and the secret line in italic
          serif as a quiet aside anchored bottom-left. */}
      <section
        className={`${s.act} ${s.actDress}`}
        aria-label={t("dressCode.heading")}
        aria-hidden={ariaHidden || undefined}
      >
        <div className={s.actInner}>
          <span className={`${s.actEyebrow} ${s.actEyebrowTopLeft}`}>
            <span className={s.actEyebrowRoman}>III</span>
            <span>{t("dressCode.heading")}</span>
          </span>
          <Reveal as="p" className={s.dressIntro} delay={0.05}>
            {t("dressCode.intro")}
          </Reveal>
          <div className={s.dressColsBespoke}>
            <div className={s.dressColBespoke}>
              <span className={s.dressColLabel}>01</span>
              <Reveal as="h3" className={s.dressColHeading} delay={0.15}>
                {t("dressCode.option1.label")}
              </Reveal>
              <Reveal as="p" className={s.dressColBody} delay={0.28}>
                {t("dressCode.option1.body")}
              </Reveal>
            </div>
            <div className={s.dressDivider} aria-hidden />
            <div className={s.dressColBespoke}>
              <span className={s.dressColLabel}>02</span>
              <Reveal as="h3" className={s.dressColHeading} delay={0.2}>
                {t("dressCode.option2.label")}
              </Reveal>
              <Reveal as="p" className={s.dressColBody} delay={0.33}>
                {t("dressCode.option2.body")}
              </Reveal>
            </div>
          </div>
          <span className={s.actSecret}>{t("secret")}</span>
        </div>
      </section>

      {/* Act 4 — Night.
          Heading takes the upper-left quadrant in a wide serif scale.
          Lede sits beneath. YM.FM credit is anchored bottom-right as a
          small "stamp" — caps label above a body line, with a thin
          rule overhead. The asymmetry is the point: the night side of
          the loop weighs differently than the cookout side. */}
      <section
        className={`${s.act} ${s.actNight}`}
        aria-label={t("act.night.label")}
        aria-hidden={ariaHidden || undefined}
      >
        <div className={s.actInner}>
          <span className={`${s.actEyebrow} ${s.actEyebrowTopLeft}`}>
            <span className={s.actEyebrowRoman}>IV</span>
            <span>{t("act.night.label")}</span>
            <span className={s.actEyebrowDot} aria-hidden>
              ·
            </span>
            <span>{t("act.night.time")}</span>
          </span>
          <div className={s.nightHead}>
            <Reveal as="h2" className={s.actHeading} delay={0.05}>
              {t("act.night.heading")}
            </Reveal>
            <Reveal as="p" className={s.nightLede} delay={0.2}>
              {t("act.night.body")}
            </Reveal>
          </div>
          <div className={s.nightStamp}>
            <span className={s.nightStampRule} aria-hidden />
            <span className={s.nightStampKey}>{t("tribute.heading")}</span>
            <span className={s.nightStampVal}>{t("tribute.body")}</span>
          </div>
        </div>
      </section>

      {/* Act 5 — Closing / RSVP.
          Climax of the loop. Heading scale matches the opening so the
          loop reads bookended. Eyebrow + serif title + lede + fee
          block + CTA stack at center-left; hosts + closing line
          anchored bottom-right as the final word. */}
      <section
        className={`${s.act} ${s.actClosing}`}
        aria-label={t("rsvpCta.primary")}
        aria-hidden={ariaHidden || undefined}
      >
        <div className={s.actInner}>
          <span className={`${s.actEyebrow} ${s.actEyebrowTopLeft}`}>
            <span className={s.actEyebrowRoman}>V</span>
            <span>{t("entry.heading")}</span>
            <span className={s.actEyebrowDot} aria-hidden>
              ·
            </span>
            <span>{t("date.short")}</span>
          </span>
          <div className={s.closingStack}>
            <Reveal as="p" className={s.closingEyebrow} delay={0.05}>
              {t("closing.kicker")}
            </Reveal>
            <Reveal as="h2" className={s.closingTitle} delay={0.15}>
              {t("title")}
            </Reveal>
            <Reveal as="p" className={s.closingLede} delay={0.3}>
              {t("closing.lede")}
            </Reveal>
            <div className={s.closingFee}>
              <span className={s.closingFeeAmount}>{t("entry.amount")}</span>
              <span>{t("entry.method")}</span>
              <span>
                {t("entry.bank")} · {t("entry.accountHolder")}
              </span>
            </div>
            <Link
              href="/tickets/day-n-night"
              className={s.ctaImmersive}
              tabIndex={ariaHidden ? -1 : undefined}
            >
              <span>{t("rsvpCta.primary")}</span>
              <span aria-hidden className={s.ctaImmersiveArrow}>
                →
              </span>
            </Link>
          </div>
          <div className={s.closingFoot}>
            <span className={s.closingFootRule} aria-hidden />
            <span className={s.closingFootLine}>{t("footer.hosts")}</span>
            <span className={s.closingFootLine}>
              {t("footer.rsvpClosesAt")}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
