"use client";

import { cn } from "@/lib/utils";
import { TapePlayer } from "@/components/UX/TapePlayer";
import { Tape3DScene } from "@/components/UX/TapePlayer/visuals/Tape3DScene";
import * as m from "motion/react-m";
import { useScroll, useTransform } from "motion/react";
import { useRef } from "react";

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
export function StationHideawayHero({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);

  // Tracks scroll progress across the full 250vh section height
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // ── "HIDDEN" billboard (top-left) ─────────────────────────────────────────
  const topTextY = useTransform(scrollYProgress, [0, 1], ["0vh", "-70vh"]);
  const topTextOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.45, 0.6],
    [0, 1, 1, 0]
  );

  // ── "· Radio" label (top-right) ───────────────────────────────────────────
  const labelY = useTransform(scrollYProgress, [0, 1], ["0vh", "-50vh"]);
  const labelOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.5, 0.65],
    [0, 1, 1, 0]
  );

  // ── Tape3DScene — float in, LINGER, drift away ────────────────────────────
  const sceneY = useTransform(
    scrollYProgress,
    [0, 0.25, 0.55, 0.75, 1],
    ["0vh", "-15vh", "-20vh", "-22vh", "-55vh"]
  );
  const sceneOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.6, 0.85, 1],
    [0, 1, 1, 0.8, 0]
  );

  // ── TapePlayer — nearly static, grounded ─────────────────────────────────
  const playerY = useTransform(scrollYProgress, [0, 1], ["0vh", "-5vh"]);
  const playerOpacity = useTransform(scrollYProgress, [0, 0.15, 1], [0, 1, 1]);

  // ── "SOUNDS" billboard (bottom-right) ────────────────────────────────────
  const bottomTextY = useTransform(scrollYProgress, [0, 1], ["20vh", "-40vh"]);
  const bottomTextOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.5, 0.8, 1],
    [0, 0, 1, 1, 0]
  );

  return (
    <section
      ref={sectionRef}
      id="station-hideaway-hero"
      className={cn("relative w-full", className)}
      style={{ minHeight: "250vh" }}
    >
      {/* ── Sticky viewport container ──────────────────────────────────────── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Background glow — subtle, matches HeroPlayer's bleu-400 palette */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 60% 50%, oklch(from var(--bleu-400) l c h / 0.05) 0%, transparent 65%)",
          }}
          aria-hidden="true"
        />

        {/* ── z-10: TapePlayer — grounded, nearly static ───────────────────── */}
        {/*
         * HeroPlayer returns null when !hasRadio — the 3D scene and text
         * remain visible regardless. min-h-0 overrides HeroPlayer's internal
         * min-h-[70vh]; the sticky container controls all layout sizing.
         */}
        <m.div
          style={{ y: playerY, opacity: playerOpacity }}
          className="absolute inset-x-0 bottom-0 z-[10] flex justify-center pb-8 md:pb-16"
        >
          <TapePlayer
            variant="hero"
            scrollHint={false}
            className="min-h-0 w-full max-w-sm"
          />
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
          <Tape3DScene
            scrollTriggerId="station-hideaway-hero"
            className="absolute inset-0 !h-full"
            style={{ aspectRatio: "unset" }}
          />
        </m.div>

        {/* ── z-30: Billboard text ─────────────────────────────────────────── */}

        {/* "HIDDEN" — top-left, bleeds off left edge */}
        <m.div
          style={{ y: topTextY, opacity: topTextOpacity }}
          className="pointer-events-none absolute top-6 left-[-0.02em] z-[30] select-none font-sans font-black uppercase leading-none tracking-[-0.04em] text-[clamp(8rem,18vw,22rem)] text-fg/[0.07]"
          aria-hidden="true"
        >
          HIDDEN
        </m.div>

        {/* "· Radio" label — top-right */}
        <m.div
          style={{ y: labelY, opacity: labelOpacity }}
          className="pointer-events-none absolute top-6 right-6 z-[30] flex select-none flex-col items-end gap-0.5 text-right"
          aria-hidden="true"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-faded-fg/50">
            · Radio
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-faded-fg/25">
            Station Hideaway
          </span>
        </m.div>

        {/* "SOUNDS" — bottom-right, bleeds off right edge */}
        <m.div
          style={{ y: bottomTextY, opacity: bottomTextOpacity }}
          className="pointer-events-none absolute bottom-4 right-[-0.02em] z-[30] select-none text-right font-sans font-black uppercase leading-none tracking-[-0.04em] text-[clamp(8rem,18vw,22rem)] text-fg/[0.07]"
          aria-hidden="true"
        >
          SOUNDS
        </m.div>

        {/* Decorative signal line between the two billboard text anchors */}
        <div
          className="pointer-events-none absolute inset-x-6 bottom-[calc(4vh+clamp(8rem,18vw,22rem))] z-[30] h-px bg-gradient-to-r from-transparent via-fg/10 to-transparent"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
