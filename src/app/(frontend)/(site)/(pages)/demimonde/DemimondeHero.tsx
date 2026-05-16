"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useScroll, useTransform, useReducedMotion } from "motion/react";
import s from "./Demimonde.module.scss";
import { HERO } from "./content";
import { HERO_IMAGES, stockImage } from "./images";

/**
 * Hero — text-first per Athens-26 reference, but with one summer-tone
 * banner image off to the right to set the cookout temperature.
 * Scroll parallax is a soft enhancement; reduced-motion users get
 * the static composition.
 */
export function DemimondeHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);

  const banner = HERO_IMAGES[0];

  return (
    <section ref={ref} className={s.hero} aria-labelledby="demimonde-hero">
      <div className={s.heroInner}>
        <m.div
          className={s.heroText}
          style={reduced ? undefined : { y: titleY }}
        >
          <p className={s.heroEyebrow}>{HERO.eyebrow}</p>
          <h1 id="demimonde-hero" className={s.heroTitle}>
            {HERO.titleLead}
            <br />
            <em>{HERO.titleAccent}</em>
          </h1>
          <p className={s.heroSub}>{HERO.sub}</p>

          <dl className={s.heroMeta}>
            {HERO.meta.map((item) => (
              <div key={item.label} className={s.heroMetaItem}>
                <dt className={s.heroMetaLabel}>{item.label}</dt>
                <dd className={s.heroMetaValue}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </m.div>

        <m.figure
          className={s.heroBanner}
          style={reduced ? undefined : { y: bannerY }}
          aria-hidden
        >
          <img
            src={stockImage(banner.seed, 900, 1200)}
            alt=""
            loading="eager"
          />
          <figcaption className={s.heroBannerCaption}>{banner.tag}</figcaption>
        </m.figure>
      </div>
    </section>
  );
}
