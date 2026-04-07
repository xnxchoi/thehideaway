"use client";

import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useRef } from "react";
import { useRadioMode } from "../RadioModeContext";

/**
 * Closing section: artist social links + return to Station mode.
 */
export function ShowcaseConnect() {
  const sectionRef = useRef<HTMLElement>(null);
  const { setMode } = useRadioMode();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 80%", "start 40%"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], ["2rem", "0rem"]);

  return (
    <section ref={sectionRef} className="relative py-32 xl:py-40">
      <m.div
        style={{ opacity, y }}
        className="mx-auto max-w-7xl px-6 xl:px-10"
      >
        {/* Section divider */}
        <div className="border-border/20 mb-16 h-px w-full border-t" />

        <div className="flex flex-col items-center text-center">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 xl:text-xs">
            Connect
          </p>

          <h2 className="mb-8 text-2xl font-light tracking-tight xl:text-3xl">
            {/* CONTENT SLOT: Artist name */}
            Follow the Artist
          </h2>

          <p className="mb-12 max-w-md font-mono text-[11px] leading-relaxed text-muted-foreground/60 xl:text-xs">
            {/* CONTENT SLOT: Brief CTA copy */}
            Discover more of their work and follow the journey.
          </p>

          {/* Instagram link */}
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 border-b border-border/30 pb-1 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-foreground/50"
          >
            <span>Follow on Instagram</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            >
              <path
                d="M2 10L10 2M10 2H4M10 2V8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        {/* Return to Station */}
        <div className="mt-24 flex justify-center">
          <button
            onClick={() => setMode("station")}
            className="border-border/40 text-foreground/60 hover:border-border hover:text-foreground cursor-pointer border px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors"
          >
            Back to Station
          </button>
        </div>
      </m.div>
    </section>
  );
}
