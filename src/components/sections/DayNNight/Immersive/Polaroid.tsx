"use client";

import { useEffect, type ReactNode } from "react";
import { useMotionValue } from "motion/react";
import * as m from "motion/react-m";
import { useDayNNightScene } from "../store";
import s from "../styles.module.scss";

/**
 * Polaroid + PolaroidGroup — textured moodboard tiles for the immersive
 * scene. Each tile is a paper-card frame around an image, with optional
 * caption rendered in one of two voices (serif italic or marker-pen).
 *
 * Behaviour
 * ─────────
 *  1. Horizontal parallax — each tile has a `depth` in roughly [-1, 1]
 *     and an `anchor` (loopProgress where this tile "sits at rest").
 *     A rAF reads the live scene progress, computes the loop-wrapped
 *     distance from `anchor`, and writes the result into a MotionValue
 *     bound to the OUTER tile's `x`. Higher |depth| = faster apparent
 *     drift = stronger foreground feel. depth=0 disables the rAF.
 *
 *  2. Static angle — the INNER tile has `style.rotate: angleDeg`, set
 *     once at mount. The two motion layers are nested so Motion's
 *     transform composition handles parallax (translateX) and tilt
 *     (rotate) without fighting each other or the static CSS transform
 *     on the frame.
 *
 *  3. Reveal entry — variants picked up by an outer PolaroidGroup. When
 *     used outside a Group the polaroid renders without an entry stage
 *     (variants are inert without a `whileInView` ancestor).
 *
 * Captions
 * ────────
 *   - `serif` (default) — printed italic serif, BELOW the image on the
 *     polaroid's bottom margin. Reads as a one-line photo label.
 *   - `marker` — handwritten-feel sans, tilted slightly against the
 *     polaroid's own rotation, warm marker ink.
 *
 * Omit `caption` for an image-only tile.
 */

// ─── Polaroid ────────────────────────────────────────────────────────────────

interface PolaroidProps {
  src: string;
  alt?: string;
  caption?: ReactNode;
  captionStyle?: "serif" | "marker";
  /** Tile width in px. Defaults to 220px (a comfortable polaroid scale). */
  width?: number;
  /** Aspect ratio of the photo area (width / height). Defaults to 1 (square). */
  aspect?: number;
  /** Rotation in degrees. Negative tilts left, positive tilts right. */
  angle?: number;
  /**
   * Parallax depth, roughly [-1, 1]. 0 = sits with the section; positive
   * drifts right of the section as the scroll passes through; negative
   * drifts left. Higher absolute value = faster apparent depth layering.
   */
  depth?: number;
  /** Section center in loopProgress to anchor the parallax window around. */
  anchor?: number;
  /** Range in px the tile can drift horizontally. Default 90. */
  range?: number;
}

export function Polaroid({
  src,
  alt = "",
  caption,
  captionStyle = "serif",
  width = 220,
  aspect = 1,
  angle = 0,
  depth = 0,
  anchor = 0.5,
  range = 90
}: PolaroidProps) {
  // Motion-aware translateX for parallax. Motion will compose this with
  // any other transforms on the same element (none, in our case — the
  // inner element owns rotate).
  const paraX = useMotionValue(0);

  useEffect(() => {
    if (depth === 0) return; // no work; paraX stays at 0
    let raf = 0;
    let active = true;
    const tick = () => {
      if (!active) return;
      const p = useDayNNightScene.getState().progress;
      // Wrap distance from anchor along the shorter direction so
      // parallax doesn't snap at the 1 → 0 loop boundary.
      let d = p - anchor;
      if (d > 0.5) d -= 1;
      if (d < -0.5) d += 1;
      paraX.set(d * depth * range);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
  }, [depth, anchor, range, paraX]);

  return (
    <m.div
      className={s.polaroidPara}
      style={{ x: paraX, width }}
      variants={{
        hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 1.0,
            ease: [0.25, 0.46, 0.45, 0.94]
          }
        }
      }}
    >
      <m.div className={s.polaroid} style={{ rotate: angle }}>
        <div className={s.polaroidFrame}>
          <div className={s.polaroidPhoto} style={{ aspectRatio: aspect }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} loading="lazy" decoding="async" />
          </div>
          {caption ? (
            <figcaption
              className={
                captionStyle === "marker" ? s.polaroidMarker : s.polaroidSerif
              }
            >
              {caption}
            </figcaption>
          ) : null}
        </div>
      </m.div>
    </m.div>
  );
}

// ─── PolaroidGroup ──────────────────────────────────────────────────────────

interface PolaroidGroupProps {
  className?: string;
  /** Override the in-view trigger threshold. Default 0.4 — slightly looser
   *  than text RevealStage so the polaroids settle before the heading finishes. */
  amount?: number;
  /** Override the stagger between polaroids. Default 0.12s — tighter than
   *  text reveals so the cluster feels like one breathy entrance. */
  stagger?: number;
  children: ReactNode;
}

export function PolaroidGroup({
  className,
  amount = 0.4,
  stagger = 0.12,
  children
}: PolaroidGroupProps) {
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: 0.1 }
        }
      }}
    >
      {children}
    </m.div>
  );
}
