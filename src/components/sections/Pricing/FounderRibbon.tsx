"use client";

import { cn } from "@/lib/utils";
import { useRef } from "react";
import * as m from "motion/react-m";
import { useScroll, useTransform, useReducedMotion } from "motion/react";
import { Link } from "@/components/core/Link/Link";
import { StarlinerMotion } from "@/components/sections/Starliner/StarlinerMotion";
import s from "./FounderRibbon.module.scss";

export type FounderRibbonProps = {
  planId: string;
  priceDisplay: string;
  validityLabel: string;
  features: { label: string; included: boolean }[];
  seatsRemaining: number;
  seatsTotal: number;
  soldOut: boolean;
};

export function FounderRibbon({
  planId,
  priceDisplay,
  validityLabel,
  features,
  seatsRemaining,
  seatsTotal,
  soldOut
}: FounderRibbonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Warm bg eases in only while the section dominates the viewport.
  // Outside that window, bg is transparent and matches the surrounding
  // pricing shell so the founder beat fades in/out seamlessly.
  const warmOpacity = useTransform(
    scrollYProgress,
    [0, 0.32, 0.68, 1],
    [0, 1, 1, 0]
  );
  const warmScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.04, 1, 1.04]);

  const headlineY = useTransform(scrollYProgress, [0, 1], ["14%", "-14%"]);
  const headlineOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.85, 1],
    [0, 1, 1, 0.6]
  );
  const cardY = useTransform(scrollYProgress, [0, 1], ["28%", "-6%"]);
  const cardOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.85, 1],
    [0, 1, 1, 0.7]
  );
  const starsOpacity = useTransform(
    scrollYProgress,
    [0, 0.32, 0.68, 1],
    [0, 1, 1, 0]
  );

  return (
    <section
      className={cn(s.section, "relative")}
      aria-labelledby="founder-ribbon"
    >
      <m.div className="absolute inset-0 -z-10" ref={ref} />
      <m.div
        className={s.warmBg}
        style={reduced ? undefined : { opacity: warmOpacity, scale: warmScale }}
        aria-hidden
      />
      <m.div
        className={s.grain}
        style={reduced ? undefined : { opacity: warmOpacity }}
        aria-hidden
      />

      <div className={s.contentWrap}>
        <m.div
          className={s.content}
          style={
            reduced ? undefined : { y: headlineY, opacity: headlineOpacity }
          }
        >
          <p className={s.eyebrow}>Founder</p>
          <h2 id="founder-ribbon" className={s.headline}>
            <span>
              <em className={s.fiveAccent}>Five</em> seats.
            </span>
            <span>Lifetime.</span>
            <span className={s.headlineQuiet}>
              After that, the door doesn't open this way again.
            </span>
          </h2>
        </m.div>

        <m.aside
          className={s.card}
          style={reduced ? undefined : { y: cardY, opacity: cardOpacity }}
          aria-label="Patron tier details"
        >
          <m.div
            className={s.cardStarsLayer}
            style={reduced ? undefined : { opacity: starsOpacity }}
            aria-hidden
          >
            <StarlinerMotion tint="warm" />
          </m.div>

          <header className={s.cardHead}>
            <span className={s.cardLabel}>Patron · Founder</span>
            <span className={s.cardSeats}>
              {soldOut ? "Closed" : `${seatsRemaining} of ${seatsTotal} remain`}
            </span>
          </header>

          <div className={s.cardPriceRow}>
            <span className={s.cardPrice} data-strike={soldOut}>
              {priceDisplay}
            </span>
            <span className={s.cardValidity}>{validityLabel}</span>
          </div>

          <ul className={s.cardFeatures}>
            {features.map((f, i) => (
              <li
                key={`founder-feature-${i}`}
                className={s.cardFeatureRow}
                data-included={f.included}
              >
                <span className={s.cardFeatureMark} aria-hidden>
                  {f.included ? "·" : "—"}
                </span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>

          {!soldOut ? (
            <Link
              href={`/checkout?plan=${encodeURIComponent(planId)}`}
              className={s.cta}
              prefetch={false}
            >
              Take one
            </Link>
          ) : (
            <span className={s.ctaDisabled} aria-disabled>
              Closed — all five claimed
            </span>
          )}
        </m.aside>
      </div>
    </section>
  );
}
