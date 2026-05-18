"use client";

import Link from "next/link";
import { useRef } from "react";
import type { useTranslations as UseTranslationsType } from "next-intl";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDayNNightScene } from "../store";
import { SceneView } from "./SceneView";
import s from "../styles.module.scss";

if (typeof window !== "undefined" && !gsap.plugins?.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
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
          const setWidth = () => trackEl.scrollWidth / 2;
          const LOOPS = 14; // how many cycles before the user hits the page bottom
          // 0.2 == start of the Cookout act. Reload lands the user there
          // with the sun at the horizon (matched in the celestial sampler
          // and in SunLoader's final setProgress call).
          const INITIAL_LOOP_POSITION = 0.2;
          const pinDistance = () => setWidth() * LOOPS;

          // Shared updater — same math for initial paint and every scroll
          // tick. Pulling it out so we can seed the initial state on
          // ScrollTrigger creation; otherwise the loader's progress=0.05
          // would leak into the scene math and render the sun below the
          // viewport instead of at the horizon hand-off position.
          const update = (selfProgress: number) => {
            const sw = setWidth();
            const totalScrolled = selfProgress * pinDistance();
            const loopPos = (INITIAL_LOOP_POSITION * sw + totalScrolled) % sw;
            const loopProgress = loopPos / sw;
            gsap.set(trackEl, { x: -loopProgress * sw });
            setProgress(0.05 + loopProgress * 0.95);
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

          return () => st.kill();
        }
      );

      // Reduced-motion desktop — show all acts in a vertical stack, no scrub.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: reduce)", () => {
        if (!track.current) return;
        gsap.set(track.current, { x: 0 });
        // Advance the sky to mid-day so the scene reads correctly.
        setProgress(0.5);
      });

      // Mobile/tablet — vertical scroll, progress driven by document scroll.
      mm.add("(max-width: 1023px)", () => {
        if (!wrap.current) return;
        const st = ScrollTrigger.create({
          trigger: wrap.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.4,
          onUpdate: (self) => {
            setProgress(0.05 + self.progress * 0.95);
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
  // direct flex children — important because GSAP measures scrollWidth.
  return (
    <>
      {/* Act 1 — Daybreak / opening */}
      <section
        className={s.act}
        aria-label={t("act.day.label")}
        aria-hidden={ariaHidden || undefined}
      >
        <header className={s.actHeader}>
          <span className={s.actLabelStrong}>{t("act.day.label")}</span>
          <span className={s.actTime}>{t("act.day.time")}</span>
        </header>
        <div className={s.actBody}>
          <p className={s.actLabel}>{t("subtitle")}</p>
          <h2 className={s.actHeading}>{t("title")}</h2>
          <p className={s.actLede}>{t("tagline")}</p>
        </div>
        <footer className={s.actFooter}>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemKey}>{t("date.weekday")}</span>
            <span className={s.actFooterItemVal}>{t("date.full")}</span>
          </span>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemKey}>{t("location.label")}</span>
            <span className={s.actFooterItemVal}>
              {t("location.neighborhood")}
            </span>
          </span>
        </footer>
      </section>

      {/* Act 2 — Cookout */}
      <section
        className={s.act}
        aria-label={t("act.day.heading")}
        aria-hidden={ariaHidden || undefined}
      >
        <header className={s.actHeader}>
          <span className={s.actLabel}>{t("included.heading")}</span>
          <span className={s.actTime}>{t("act.day.time")}</span>
        </header>
        <div className={s.actBody}>
          <h2 className={s.actHeading}>{t("act.day.heading")}</h2>
          <p className={s.actLede}>{t("act.day.body")}</p>
        </div>
        <footer className={s.actFooter}>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemKey}>
              {t("included.food.label")}
            </span>
            <span className={s.actFooterItemVal}>
              {t("included.food.items")}
            </span>
          </span>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemKey}>
              {t("included.drinks.label")}
            </span>
            <span className={s.actFooterItemVal}>
              {t("included.drinks.items")}
            </span>
          </span>
        </footer>
      </section>

      {/* Act 3 — Dress code */}
      <section
        className={s.act}
        aria-label={t("dressCode.heading")}
        aria-hidden={ariaHidden || undefined}
      >
        <header className={s.actHeader}>
          <span className={s.actLabel}>{t("dressCode.heading")}</span>
          <span className={s.actTime}>{t("dressCode.intro")}</span>
        </header>
        <div className={s.actBody}>
          <h2 className={s.actHeading}>{t("dressCode.heading")}</h2>
          <div className={s.dressCols}>
            <div className={s.dressCol}>
              <span className={s.dressColLabel}>01</span>
              <h3 className={s.dressColHeading}>
                {t("dressCode.option1.label")}
              </h3>
              <p className={s.dressColBody}>{t("dressCode.option1.body")}</p>
            </div>
            <div className={s.dressCol}>
              <span className={s.dressColLabel}>02</span>
              <h3 className={s.dressColHeading}>
                {t("dressCode.option2.label")}
              </h3>
              <p className={s.dressColBody}>{t("dressCode.option2.body")}</p>
            </div>
          </div>
        </div>
        <footer className={s.actFooter}>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemVal}>{t("secret")}</span>
          </span>
        </footer>
      </section>

      {/* Act 4 — Night / Music */}
      <section
        className={s.act}
        aria-label={t("act.night.label")}
        aria-hidden={ariaHidden || undefined}
      >
        <header className={s.actHeader}>
          <span className={s.actLabelStrong}>{t("act.night.label")}</span>
          <span className={s.actTime}>{t("act.night.time")}</span>
        </header>
        <div className={s.actBody}>
          <h2 className={s.actHeading}>{t("act.night.heading")}</h2>
          <p className={s.actLede}>{t("act.night.body")}</p>
        </div>
        <footer className={s.actFooter}>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemKey}>{t("ymfm.heading")}</span>
            <span className={s.actFooterItemVal}>{t("ymfm.body")}</span>
          </span>
        </footer>
      </section>

      {/* Act 5 — Closing / RSVP */}
      <section
        className={s.act}
        aria-label={t("rsvpCta.primary")}
        aria-hidden={ariaHidden || undefined}
      >
        <header className={s.actHeader}>
          <span className={s.actLabel}>{t("entry.heading")}</span>
          <span className={s.actTime}>{t("date.short")}</span>
        </header>
        <div className={s.closingStack}>
          <p className={s.closingEyebrow}>{t("rsvpCta.secondary")}</p>
          <h2 className={s.closingTitle}>{t("title")}</h2>
          <p className={s.actLede}>{t("subtitle")}</p>
          <div className={s.closingFee}>
            <span className={s.closingFeeAmount}>{t("entry.amount")}</span>
            <span>{t("entry.method")}</span>
            <span>
              {t("entry.bank")} · {t("entry.accountHolder")}
            </span>
          </div>
          <Link
            href="/tickets/day-n-night"
            className={s.ctaPrimary}
            tabIndex={ariaHidden ? -1 : undefined}
          >
            <span>{t("rsvpCta.primary")}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
        <footer className={s.actFooter}>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemVal}>{t("footer.hosts")}</span>
          </span>
          <span className={s.actFooterItem}>
            <span className={s.actFooterItemVal}>
              {t("footer.rsvpClosesAt")}
            </span>
          </span>
        </footer>
      </section>
    </>
  );
}
