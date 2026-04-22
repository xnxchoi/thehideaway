"use client";

import { MotionPill } from "@/components/core/Button";
import { TapePlayer } from "@/components/UX/TapePlayer";
import { Tape3DScene } from "@/components/UX/TapePlayer/visuals/Tape3DScene";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { Suspense, useRef, useState } from "react";

/**
 * StationHideawayHero
 *
 * A tall (~250vh) scroll section with a sticky viewport. Each layer floats
 * at a different parallax rate to communicate hierarchy:
 *
 *   z-30  Billboard text        — fast drift (decorative / "fluff")
 *   z-20  Tape3DScene           — medium drift with linger (transitions)
 *   z-10  TapePlayer hero       — nearly static ("function" / weight)
 *
 * The 3D scene floats in, lingers over the TapePlayer so both are
 * simultaneously visible, then drifts upward to reveal the player fully.
 *
 * No scrolljacking — the section scrolls naturally; all motion is
 * Framer Motion scroll-linked transforms on the sticky layers.
 */
export function StationHideawayHero({
  className,
  onShowcaseActivate
}: {
  className?: string;
  onShowcaseActivate?: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const { isMobile } = useIsMobile();
  // Tracks scroll progress across the full 250vh section height
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end 15%"]
  });

  // ── "HIDDEN" billboard (top-left) ─────────────────────────────────────────
  const topTextY = useTransform(
    scrollYProgress,
    [0, 0.45, 1],
    ["30vh", "10vh", "-10vh"]
  );
  const topTextOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.45, 0.8],
    [0.2, 0.6, 1, 0.8]
  );

  // ── "· Radio" label (top-right) ───────────────────────────────────────────
  const labelY = useTransform(scrollYProgress, [0, 1], ["50vh", "-10vh"]);
  const labelOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.5, 0.65],
    [0, 1, 1, 0.5]
  );

  // ── Tape3DScene — float in, LINGER, drift away ────────────────────────────
  const sceneY = useTransform(
    scrollYProgress,
    [0, 0.25, 0.35, 0.5, 0.85, 1],
    ["100vh", "80vh", "15vh", "10vh", "-5vh", "-100vh"]
  );
  const sceneOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.6, 0.85, 1],
    [0, 1, 1, 0.8, 0]
  );
  const [sc, setSc] = useState(scrollYProgress.get());
  scrollYProgress.on("change", (v) => {
    setSc(v);
  });
  // ── TapePlayer — nearly static, grounded ─────────────────────────────────
  const playerY = useTransform(scrollYProgress, [0, 1], ["0vh", "-20vh"]);
  const playerOpacity = useTransform(scrollYProgress, [0, 0.15, 1], [0, 1, 1]);

  // ── "SOUNDS" billboard (bottom-right) ────────────────────────────────────
  const bottomTextY = useTransform(
    scrollYProgress,
    [0, 0.35, 0.6, 1],
    ["25vh", "0vh", "-10vh", "-20vh"]
  );
  const bottomTextOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.5, 0.8, 1],
    [0, 0, 1, 1, 1]
  );

  return (
    <section
      ref={sectionRef}
      id="station-hideaway-hero"
      className={cn("relative w-full min-w-screen", className)}
      style={{ minHeight: "250vh" }}
    >
      {/* ── Sticky viewport container ──────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ── z-10: TapePlayer — grounded, nearly static ───────────────────── */}
        <m.div
          style={{ y: playerY, opacity: playerOpacity }}
          className="absolute inset-0 z-[10] flex items-center justify-center"
        >
          <TapePlayer variant="hero" className="min-h-0" />
        </m.div>

        {/* ── z-20: Tape3DScene — floats in, lingers over player, drifts away ── */}
        {/*
         * scrollTriggerId="station-hideaway-hero" targets the outer <section>
         * (which has a real document height) rather than the sticky View element.
         * This gives GSAP ScrollTrigger a correct start/end scroll range so the
         * 3D model's internal rotation/material animations fire properly.
         *
         * Tape3DScene internally: className={cn("relative h-screen w-full", className)}
         * Override: "absolute inset-0 !h-full" — twMerge + ! ensures h-full wins.
         * style={{ aspectRatio: "unset" }} overrides useResponsiveAspectRatio.
         *
         * The shared R3F Canvas must have alpha: true for TapePlayer (z-10) to
         * be visible through it during the linger phase.
         */}
        <m.div
          style={{ y: sceneY, opacity: sceneOpacity }}
          className="absolute inset-0 z-[20]"
        >
          {!isMobile && (
            <Suspense>
              <Tape3DScene
                scrollTriggerId="station-hideaway-hero"
                className="absolute inset-0 !h-full"
                style={{ aspectRatio: "unset" }}
              />
            </Suspense>
          )}
        </m.div>

        {/* ── z-30: Billboard text ─────────────────────────────────────────── */}

        {/* "HIDDEN" — top-left, bleeds off left edge */}
        <m.div
          style={{ y: topTextY, opacity: topTextOpacity }}
          className="text-fg/[0.07] pointer-events-none absolute top-6 left-[-0.02em] z-[30] font-sans text-[clamp(8rem,18vw,22rem)] leading-none font-black tracking-[-0.04em] uppercase select-none"
          aria-hidden="true"
        >
          RP
        </m.div>

        {/* "· Radio" label — top-right */}
        <m.div
          style={{ y: labelY, opacity: labelOpacity }}
          className="pointer-events-none absolute top-6 right-6 z-[30] flex flex-col items-end gap-0.5 text-right select-none"
          aria-hidden="true"
        >
          <span className="text-faded-fg/80 text-md font-mono tracking-[0.2em] uppercase">
            · Radio
          </span>
          <span className="text-faded-fg/80 text-md font-mono tracking-[0.15em] uppercase">
            Station Hideaway
          </span>
        </m.div>

        {/* "SOUNDS" — bottom-right, bleeds off right edge */}
        <m.div
          style={{ y: bottomTextY, opacity: bottomTextOpacity }}
          className="text-fg/[0.07] pointer-events-none absolute right-[-0.02em] bottom-4 z-[30] text-right font-sans text-[clamp(8rem,18vw,22rem)] leading-none font-black tracking-[-0.04em] uppercase select-none"
          aria-hidden="true"
        >
          FM
        </m.div>

        {/* Decorative signal line between the two billboard text anchors */}
        <div
          className="via-fg/10 pointer-events-none absolute inset-x-6 bottom-[calc(4vh+clamp(8rem,18vw,22rem))] z-[30] h-px bg-gradient-to-r from-transparent to-transparent"
          aria-hidden="true"
        />

        {/* ── Showcase mode trigger ────────────────────────────────────────── */}
        {onShowcaseActivate && (
          <div className="absolute right-6 bottom-8 z-[40]">
            <MotionPill
              onClick={onShowcaseActivate}
              className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/60 uppercase transition-colors hover:border-border hover:text-foreground"
            >
              The Story
            </MotionPill>
          </div>
        )}
      </div>
    </section>
  );
}
