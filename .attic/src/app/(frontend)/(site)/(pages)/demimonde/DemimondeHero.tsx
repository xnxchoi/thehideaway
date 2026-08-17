"use client";

import { useRef } from "react";
import * as m from "motion/react-m";
import { useScroll, useTransform } from "motion/react";
import { HERO } from "./content";
import { HERO_IMAGES, stockImage } from "./images";
import { FrontImage } from "../../../../../../../src/components/core/Media/FrontImage";

/**
 * Hero — text-first per Athens-26 reference, with one summer-tone
 * banner image off to the right to set the cookout temperature.
 * Scroll parallax is a soft enhancement.
 */
export function DemimondeHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);

  const banner = HERO_IMAGES[0];

  return (
    <section
      ref={ref}
      className="relative z-[1] overflow-hidden px-8 pt-24 pb-20 max-sm:px-6 max-sm:pt-20 max-sm:pb-14 sm:px-8"
      aria-labelledby="demimonde-hero"
    >
      <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-end gap-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-20">
        <m.div className="min-w-0" style={{ y: titleY }}>
          <p className="m-0 mb-6 inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.34em] text-[var(--tomato)] uppercase before:h-px before:w-7 before:bg-[var(--tomato)] before:content-['']">
            {HERO.eyebrow}
          </p>
          <h1
            id="demimonde-hero"
            className="m-0 font-serif text-[clamp(56px,11vw,168px)] leading-[0.88] tracking-[-0.035em] text-balance text-[var(--ink)] italic"
          >
            {HERO.titleLead}
            <br />
            <em className="font-normal text-[var(--tomato)] italic">
              {HERO.titleAccent}
            </em>
          </h1>
          <p className="mt-7 mb-0 max-w-[46ch] text-[clamp(15px,1.4vw,19px)] leading-[1.6] text-[var(--ink-soft)]">
            {HERO.sub}
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-[var(--rule)] pt-7 max-sm:grid-cols-1 max-sm:gap-4">
            {HERO.meta.map((item) => (
              <div key={item.label} className="m-0 flex flex-col gap-1.5">
                <dt className="font-mono text-[10px] tracking-[0.28em] text-[var(--ink-muted)] uppercase">
                  {item.label}
                </dt>
                <dd className="m-0 text-[15px] leading-[1.4] font-medium text-[var(--ink)]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </m.div>

        <m.figure
          className="relative m-0 hidden self-stretch justify-self-end border border-[oklch(0.86_0.03_80)] bg-[var(--paper)] p-3.5 pb-11 shadow-[0_2px_4px_oklch(0.3_0.04_60/0.18),0_22px_38px_-18px_oklch(0.3_0.04_60/0.35)] lg:block lg:max-w-[420px] lg:rotate-[1.5deg]"
          style={{ y: bannerY }}
          aria-hidden
        >
          <FrontImage
            src={stockImage(banner.seed, 900, 1200)}
            loading="eager"
            imgClassName="block w-full bg-[var(--paper-deep)] object-cover"
            aspectRatio={3 / 4}
          />
          <figcaption className="absolute right-3.5 bottom-3.5 left-3.5 text-center font-mono text-[10px] tracking-[0.22em] text-[var(--ink-muted)] uppercase">
            {banner.tag}
          </figcaption>
        </m.figure>
      </div>
    </section>
  );
}
