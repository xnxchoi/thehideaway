"use client";

import type { ReactNode } from "react";
import { type Variants } from "motion/react";
import * as m from "motion/react-m";

/**
 * Reveal — slow, soft, choreographed text reveal for the immersive
 * Day n Night scene.
 *
 * Design direction
 * ────────────────
 * Calibrated against `src/components/UX/Tour/RegistrationTour.tsx`'s
 * blur-in feel (the closest tonal cousin already in the codebase):
 *
 *   - y offset: 6px (was 16 — too far)
 *   - blur:     6px (was 12 — too strong)
 *   - duration: 0.85s (longer, smoother)
 *   - ease:     [0.25, 0.46, 0.45, 0.94] — cubic ease-out, gentler than the
 *               prior expo-out [0.16, 1, 0.3, 1] that felt "jerky"
 *
 * Trigger semantics
 * ─────────────────
 *   - `once: true` — fires the FIRST time the element enters viewport,
 *     then stays in place. Avoids the 8×-re-trigger problem caused by
 *     the loop's duplicate ActSet pattern + viewport re-entries.
 *   - `amount: 0.55` — the element must be ~55% visible before firing,
 *     not the prior 0.35 which fired at the viewport edge.
 *
 * Choreography
 * ────────────
 * Use the two-component pattern for a coordinated section reveal:
 *
 *   <RevealStage>
 *     <RevealItem as="p"  className={s.kicker}>kicker</RevealItem>
 *     <RevealItem as="h2" className={s.title}>title</RevealItem>
 *     <RevealItem as="p"  className={s.lede}>lede</RevealItem>
 *   </RevealStage>
 *
 * The Stage observes the viewport ONCE; on the trigger it dispatches its
 * `visible` variant down the tree. The Stage's `staggerChildren` paces
 * the Items so they cascade — kicker → title → lede — instead of all
 * popping at once. Result: each section reads as a single composed
 * gesture, not a pile of independently-triggered elements.
 *
 * The legacy `<Reveal>` helper is kept as a single-shot wrapper for
 * callers that need a one-element reveal without a Stage; it uses the
 * same easing + offset values.
 */

// ─── Animation primitives ────────────────────────────────────────────────────

const EASE_SOFT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 6, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE_SOFT }
  }
};

/**
 * Choreography defaults — picked to feel like a calm exhale rather
 * than a fast pop. The Stage waits a beat (`delayChildren: 0.15`)
 * after the trigger fires, then cascades children at `0.18s` intervals.
 * For sections with many items, this stretches the reveal into a
 * coherent ~1.0s gesture before the last child settles.
 */
// Stage variants intentionally carry a no-op `opacity: 1` on both
// states. Motion's `whileInView` short-circuits when the target variant
// has no animatable properties, which would prevent the variant label
// from propagating to children and break the choreography. The opacity
// is benign (always 1) but its presence ensures Motion processes the
// hidden → visible swap and dispatches `staggerChildren` to descendants.
const STAGE_VARIANTS: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.15 }
  }
};

const STAGE_VIEWPORT = { once: true, amount: 0.55 } as const;

// ─── Tag mapping (polymorphic without `as any`) ──────────────────────────────

const MOTION_MAP = {
  div: m.div,
  section: m.section,
  header: m.header,
  h1: m.h1,
  h2: m.h2,
  h3: m.h3,
  p: m.p,
  span: m.span
} as const;

type RevealTag = keyof typeof MOTION_MAP;

// ─── RevealStage — the choreographer ─────────────────────────────────────────

interface RevealStageProps {
  as?: RevealTag;
  className?: string;
  /** Override the viewport intersection threshold (0–1). Default 0.55. */
  amount?: number;
  /** Override the stagger interval between children. Default 0.18s. */
  stagger?: number;
  /** Override the initial delay before the first child fires. Default 0.15s. */
  delay?: number;
  children: ReactNode;
}

export function RevealStage({
  as = "div",
  className,
  amount,
  stagger,
  delay,
  children
}: RevealStageProps) {
  const Tag = MOTION_MAP[as];
  const viewport =
    amount === undefined ? STAGE_VIEWPORT : { once: true, amount };
  const variants =
    stagger === undefined && delay === undefined
      ? STAGE_VARIANTS
      : {
          hidden: { opacity: 1 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: stagger ?? 0.18,
              delayChildren: delay ?? 0.15
            }
          }
        };
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={variants}
    >
      {children}
    </Tag>
  );
}

// ─── RevealItem — animates as part of the parent Stage's stagger ─────────────

interface RevealItemProps {
  as?: RevealTag;
  className?: string;
  children: ReactNode;
}

export function RevealItem({ as = "div", className, children }: RevealItemProps) {
  const Tag = MOTION_MAP[as];
  return (
    <Tag className={className} variants={ITEM_VARIANTS}>
      {children}
    </Tag>
  );
}

// ─── Reveal — legacy single-shot helper ─────────────────────────────────────

interface RevealProps {
  as?: RevealTag;
  /** Extra delay before this item's reveal fires (seconds). */
  delay?: number;
  /** Override the in-view intersection threshold (0–1). Default 0.55. */
  amount?: number;
  className?: string;
  children: ReactNode;
}

export function Reveal({
  as = "div",
  delay = 0,
  amount,
  className,
  children
}: RevealProps) {
  const Tag = MOTION_MAP[as];
  const viewport =
    amount === undefined ? STAGE_VIEWPORT : { once: true, amount };
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.85, ease: EASE_SOFT, delay }
      }}
      viewport={viewport}
    >
      {children}
    </Tag>
  );
}
