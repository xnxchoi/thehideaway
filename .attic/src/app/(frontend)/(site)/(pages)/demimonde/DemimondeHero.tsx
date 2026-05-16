"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useScroll, useTransform, useReducedMotion } from "motion/react";
import s from "./Demimonde.module.scss";

export function DemimondeHero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const eyebrowY = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <section ref={ref} className={s.hero} aria-labelledby="demimonde-hero">
      <div className={s.heroGrain} aria-hidden />

      <m.p
        className={s.heroEyebrow}
        style={reduced ? undefined : { y: eyebrowY }}
      >
        An archive · Vol. I — V
      </m.p>

      <m.h1
        id="demimonde-hero"
        className={s.heroTitle}
        style={reduced ? undefined : { y: titleY }}
      >
        Demimonde
      </m.h1>

      <p className={s.heroSub}>
        Five nights, on the record. Names off, locations omitted.
      </p>
    </section>
  );
}
