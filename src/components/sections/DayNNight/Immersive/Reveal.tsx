"use client";

import type { ReactNode } from "react";
import * as m from "motion/react-m";

/**
 * Page-local reveal: titles and lead text blur + float in as they enter
 * the viewport, blur + float out as they leave. Driven by Motion's
 * `whileInView` (IntersectionObserver under the hood) — re-triggers on
 * every entry, so each pass of the horizontal scroll loop feels fresh
 * without manual progress wiring.
 *
 * Polymorphic via the `as` prop so callers can wrap the right semantic
 * element (h2 / p / span / ...) directly — no extra wrapper div that
 * would change the document outline.
 *
 * `viewport.amount: 0.35` means at least 35% of the element must be
 * inside the viewport before "in view" fires; this keeps headings from
 * popping while they're still half-clipped at the edge of the act.
 */
const REVEAL_INITIAL = { opacity: 0, filter: "blur(12px)", y: 16 };
const REVEAL_VISIBLE = { opacity: 1, filter: "blur(0px)", y: 0 };
const REVEAL_TRANSITION = {
  duration: 0.85,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number]
};
const REVEAL_VIEWPORT = { amount: 0.35, once: false } as const;

// Map the allow-list of semantic tags to their motion-component
// counterparts. Keeping this explicit gives TS the right element type
// at each call site without any `as any`.
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

interface RevealProps {
  as?: RevealTag;
  delay?: number;
  /** Override the in-view intersection threshold (0–1). */
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
    amount === undefined ? REVEAL_VIEWPORT : { amount, once: false };
  return (
    <Tag
      className={className}
      initial={REVEAL_INITIAL}
      whileInView={REVEAL_VISIBLE}
      viewport={viewport}
      transition={{ ...REVEAL_TRANSITION, delay }}
    >
      {children}
    </Tag>
  );
}
