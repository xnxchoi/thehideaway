"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import s from "../styles.module.scss";
import { useScrollTimeline, type ScrollKeyframe } from "./useScrollTimeline";

/**
 * DressRoom — one option's "room" inside the Dress corridor.
 *
 * Layout
 * ──────
 * The room is 150vw wide and split into three positional bands:
 *   - Anchor (left 50vw) — the option marker (01/02) + heading
 *   - Cluster (mid 50vw) — polaroid scatter zone (children sit here)
 *   - Read   (right 50vw) — the body / explainer copy
 *
 * Reveal choreography
 * ───────────────────
 * Driven by `useScrollTimeline` against the room's own bounding box,
 * with horizontal scrub. Keyframes:
 *   - 0.00 → 0.15 : heading slides in from y:32 + opacity 0→1
 *   - 0.20 → 0.55 : polaroids cascade in from x:80 + opacity 0→1
 *                   (staggered across the cluster)
 *   - 0.55 → 0.85 : body slides in from y:24 + opacity 0→1
 *   - 0.85 → 1.00 : everything dims to opacity 0.6 as the room exits left
 *
 * Children contract
 * ─────────────────
 * Each child polaroid should be wrapped in a `<div data-dr-tile>` so
 * `useScrollTimeline` can pick it up via querySelectorAll. The wrapper
 * also gives us a stable target for the parallax/rotation that the
 * Polaroid component already provides on its own root — we just add
 * the data attribute and let GSAP tween opacity + x on it.
 */
interface DressRoomProps {
  /** "01" or "02" — drives the option marker text + `data-room` attribute. */
  number: string;
  /** The option heading (large display serif). */
  heading: string;
  /** The body / explainer copy that reveals after the polaroids. */
  body: string;
  /** Polaroid scatter — each child should be wrapped in a `<div data-dr-tile>`. */
  children: ReactNode;
}

export function DressRoom({ number, heading, body, children }: DressRoomProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  // Stable keyframe identity so useScrollTimeline's deps don't re-fire
  // every render. Memoized — these never change after mount.
  const keyframes = useMemo<ScrollKeyframe[]>(
    () => [
      {
        at: 0,
        selector: "[data-dr-heading]",
        from: { opacity: 0, y: 32 },
        to: { opacity: 1, y: 0 },
        duration: 0.15
      },
      {
        at: 0.2,
        selector: "[data-dr-tile]",
        from: { opacity: 0, x: 80 },
        to: { opacity: 1, x: 0 },
        duration: 0.35,
        stagger: 0.06
      },
      {
        at: 0.55,
        selector: "[data-dr-body]",
        from: { opacity: 0, y: 24 },
        to: { opacity: 1, y: 0 },
        duration: 0.3
      },
      {
        at: 0.85,
        selector: "[data-dr-heading], [data-dr-body], [data-dr-tile]",
        to: { opacity: 0.6 },
        duration: 0.15
      }
    ],
    []
  );

  useScrollTimeline({
    trigger: ref,
    keyframes,
    reducedMotion
  });

  return (
    <div ref={ref} className={s.dressRoom} data-room={number}>
      <div className={s.dressRoomAnchor}>
        <div className={s.dressOptionMarker}>
          <span className={s.dressOptionMarkerRule} aria-hidden />
          <span>{number}</span>
        </div>
        <h3 data-dr-heading className={s.dressOptionHeading}>
          {heading}
        </h3>
      </div>

      <div className={s.dressRoomCluster}>{children}</div>

      <div className={s.dressRoomRead}>
        <p data-dr-body className={s.dressOptionBody}>
          {body}
        </p>
      </div>
    </div>
  );
}
