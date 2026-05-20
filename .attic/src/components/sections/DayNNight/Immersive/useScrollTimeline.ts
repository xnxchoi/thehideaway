"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * useScrollTimeline — declare scroll-progress-driven reveal keyframes
 * inside a horizontally-pinned section.
 *
 * The parent timeline (Timeline.tsx) is pinned and translates horizontally
 * with vertical scroll. IntersectionObserver-based `whileInView` does not
 * fire reliably inside a pinned section, so per-room reveals must be tied
 * to GSAP scroll progress directly.
 *
 * Each keyframe declares a target selector (queried inside the trigger's
 * scope), a `to` GSAP tween, and a position (`at`) + `duration` in the
 * timeline's progress units (0..1).
 *
 * Reduced motion: when `reducedMotion` is true, every keyframe's `to`
 * state is applied immediately as a static `gsap.set` and the timeline
 * is skipped entirely.
 */
export interface ScrollKeyframe {
  /** Where in [0,1] of the scrub range the tween starts. */
  at: number;
  /** Selector matched via `el.querySelectorAll(...)` inside the trigger scope. */
  selector: string;
  /** GSAP tween vars (excluding `duration` — set separately). */
  to: gsap.TweenVars;
  /** Tween length, in progress units (also 0..1). */
  duration: number;
  /** Optional stagger when the selector matches multiple elements, in progress units. */
  stagger?: number;
  /** Optional GSAP `from` values applied via `gsap.set` before the tween. */
  from?: gsap.TweenVars;
}

interface UseScrollTimelineOptions {
  /** Ref to the scope element. The element is the ScrollTrigger trigger
   *  AND the scope for `querySelectorAll`. */
  trigger: RefObject<HTMLElement | null>;
  /** Ordered list of reveal keyframes. */
  keyframes: ScrollKeyframe[];
  /** ScrollTrigger start; default `"left 90%"` for horizontal-pinned tracks. */
  start?: string;
  /** ScrollTrigger end; default `"right 10%"`. */
  end?: string;
  /** When true, apply each keyframe's `to` immediately and skip the timeline. */
  reducedMotion?: boolean;
}

export function useScrollTimeline({
  trigger,
  keyframes,
  start = "left 90%",
  end = "right 10%",
  reducedMotion = false
}: UseScrollTimelineOptions) {
  useEffect(() => {
    const el = trigger.current;
    if (!el) return;

    // Reduced motion: jump every target to its final state, no timeline.
    if (reducedMotion) {
      for (const kf of keyframes) {
        const targets = el.querySelectorAll(kf.selector);
        if (kf.from) gsap.set(targets, kf.from);
        gsap.set(targets, kf.to);
      }
      return;
    }

    const ctx = gsap.context(() => {
      // Seed every `from` state synchronously so the first frame matches
      // the "hidden" pose (no flash of post-reveal state during mount).
      for (const kf of keyframes) {
        if (kf.from) gsap.set(kf.selector, kf.from);
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: true,
          horizontal: true
        }
      });
      for (const kf of keyframes) {
        tl.to(
          kf.selector,
          {
            ...kf.to,
            duration: kf.duration,
            stagger: kf.stagger,
            ease: kf.to.ease ?? "power2.out"
          },
          kf.at
        );
      }
    }, el);

    return () => ctx.revert();
  }, [trigger, keyframes, start, end, reducedMotion]);
}

// Re-export so callers can register the plugin lazily — but in this
// codebase ScrollTrigger is registered globally in TransitionProvider,
// so most callers don't need this. Exposed for completeness.
export { ScrollTrigger };
