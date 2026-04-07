"use client";

import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useRef } from "react";

/**
 * Scroll-pinned storytelling sections for the Showcase editorial mode.
 * Each block reveals on scroll with staggered text and image parallax.
 *
 * GSAP ScrollTrigger can be layered in later for more complex pin/scrub
 * animations once real content populates these slots.
 */

function StoryBlock({
  eyebrow,
  heading,
  body,
  index
}: {
  eyebrow: string;
  heading: string;
  body: string;
  index: number;
}) {
  const blockRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: blockRef,
    offset: ["start 85%", "start 30%"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["3rem", "0rem"]);

  return (
    <m.div
      ref={blockRef}
      style={{ opacity, y }}
      className="mx-auto max-w-7xl px-6 py-24 xl:px-10 xl:py-32"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-24">
        {/* Text column */}
        <div className={index % 2 === 1 ? "lg:order-2" : ""}>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 xl:text-xs">
            {eyebrow}
          </p>
          <h2 className="mb-6 text-xl font-light tracking-tight xl:text-2xl 2xl:text-3xl">
            {heading}
          </h2>
          <p className="max-w-lg font-mono text-[11px] leading-relaxed text-muted-foreground/60 xl:text-xs">
            {body}
          </p>
        </div>

        {/* Image placeholder column */}
        <div
          className={`bg-muted/10 flex aspect-[4/3] items-center justify-center rounded-sm border border-border/20 ${index % 2 === 1 ? "lg:order-1" : ""}`}
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/30">
            [Image placeholder]
          </span>
        </div>
      </div>
    </m.div>
  );
}

const STORY_BLOCKS = [
  {
    eyebrow: "The Artist",
    heading: "[Content placeholder: Artist name and background]",
    body: "[Content placeholder: A brief introduction to the artist — their journey, influences, and signature sound. This section sets the stage for the collaboration narrative.]"
  },
  {
    eyebrow: "The Meeting",
    heading: "[Content placeholder: How the collaboration began]",
    body: "[Content placeholder: The story of how the creator and The Hideaway connected — the initial conversation, shared vision, and the spark that started the project.]"
  },
  {
    eyebrow: "The Process",
    heading: "[Content placeholder: Creating the sessions]",
    body: "[Content placeholder: Behind the scenes of the creative process — studio sessions, sonic experiments, the back-and-forth that shaped the final mix. What makes these tracks unique.]"
  },
  {
    eyebrow: "The Sound",
    heading: "[Content placeholder: About the music]",
    body: "[Content placeholder: A deeper look at the musical direction — genres, moods, and intentions. What the listener should feel and discover across the tracklist.]"
  }
];

export function ShowcaseStory() {
  return (
    <div className="relative">
      {/* Section divider */}
      <div className="mx-auto max-w-7xl px-6 xl:px-10">
        <div className="border-border/20 h-px w-full border-t" />
      </div>

      {STORY_BLOCKS.map((block, i) => (
        <StoryBlock key={block.eyebrow} index={i} {...block} />
      ))}
    </div>
  );
}
