"use client";

import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useRef } from "react";

/**
 * Full-bleed hero section for the Showcase editorial mode.
 * Large title with parallax drift, setting the mood before the story.
 */
export function ShowcaseHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const titleY = useTransform(scrollYProgress, [0, 1], ["0vh", "-15vh"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0]);
  const subtitleY = useTransform(scrollYProgress, [0, 1], ["0vh", "-8vh"]);
  const subtitleOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8],
    [0, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[120vh] w-full items-center justify-center overflow-hidden"
    >
      {/* Background initial letter — decorative */}
      <div
        className="text-foreground/[0.03] pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <span className="font-mono text-[30vw] leading-none font-light">
          YM
        </span>
      </div>

      {/* Title block */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 xl:px-10">
        <m.div style={{ y: titleY, opacity: titleOpacity }}>
          <p className="text-muted-foreground/50 mb-6 font-mono text-[10px] uppercase tracking-[0.2em] xl:text-xs">
            The Hideaway Sessions
          </p>
          <h1 className="max-w-4xl text-3xl font-light tracking-tight sm:text-4xl md:text-5xl xl:text-4xl 2xl:text-7xl">
            {/* CONTENT SLOT: Creator name / headline */}
            Behind the Sound
          </h1>
        </m.div>

        <m.div
          style={{ y: subtitleY, opacity: subtitleOpacity }}
          className="mt-8"
        >
          <p className="max-w-lg font-mono text-[11px] leading-relaxed text-muted-foreground/60 xl:text-xs">
            {/* CONTENT SLOT: Subheadline / intro teaser */}
            A collaboration between The Hideaway and YM.FM — an exploration
            of sound, memory, and the spaces between.
          </p>
        </m.div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <m.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40"
        >
          Scroll
        </m.div>
      </div>
    </section>
  );
}
