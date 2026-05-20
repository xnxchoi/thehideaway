"use client";

import type { ReactNode } from "react";
import { type Variants } from "motion/react";
import * as m from "motion/react-m";
import { useDayNNightScene } from "../store";

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
  /**
   * When provided, gates the reveal on a scene-state boolean instead of
   * viewport intersection. Use this for choreographed entrances tied to
   * something other than scroll — e.g. the Opening copy waits for
   * `phase === "playing"` so it animates AFTER the loader has fully
   * transitioned out, not while it's still on screen.
   *
   * When omitted, the stage falls back to the default whileInView
   * trigger (used by Cookout, Dress, Night, Closing).
   */
  active?: boolean;
  children: ReactNode;
}

export function RevealStage({
  as = "div",
  className,
  amount,
  stagger,
  delay,
  active,
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
  // Two trigger modes: when `active` is provided, the stage's variant is
  // driven by that boolean (controlled). Otherwise fall back to the
  // default whileInView behaviour (scroll-position-driven). Both modes
  // share the same children stagger.
  const motionProps =
    active !== undefined
      ? ({
          initial: "hidden" as const,
          animate: active ? ("visible" as const) : ("hidden" as const)
        } as const)
      : ({
          initial: "hidden" as const,
          whileInView: "visible" as const,
          viewport
        } as const);
  return (
    <Tag className={className} {...motionProps} variants={variants}>
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

export function RevealItem({
  as = "div",
  className,
  children
}: RevealItemProps) {
  const Tag = MOTION_MAP[as];
  return (
    <Tag className={className} variants={ITEM_VARIANTS}>
      {children}
    </Tag>
  );
}

// ─── LoaderReveal — loader-progress-driven reveal ────────────────────────────
//
// For copy that must transition IN SYNC with the loader, not after it
// (ComPsych-style choreography). Each item declares a `threshold` in
// loaderProgress space [0, 1]; when the store's `loaderProgress` crosses
// that threshold the item animates from hidden → visible using the same
// soft blur-in motion as RevealItem.
//
// Once loaderProgress reaches 1 it stays there for the rest of the
// session, so scrolling back to the Opening doesn't re-trigger the
// reveal — the item stays visible. On Immersive unmount index.tsx
// resets loaderProgress to 0 so a fresh mount replays the choreography.

interface LoaderRevealProps {
  /** Loader progress (in [0, 1]) at which this item becomes visible. */
  threshold: number;
  as?: RevealTag;
  className?: string;
  children: ReactNode;
}

export function LoaderReveal({
  threshold,
  as = "div",
  className,
  children
}: LoaderRevealProps) {
  const Tag = MOTION_MAP[as];
  // Selector returns a boolean — Zustand only re-renders when the
  // crossing point flips, not on every loaderProgress write.
  const visible = useDayNNightScene((r) => r.loaderProgress >= threshold);
  return (
    <Tag
      className={className}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      variants={ITEM_VARIANTS}
    >
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
