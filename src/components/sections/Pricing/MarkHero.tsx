"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useRef } from "react";
import s from "./Pricing.module.scss";

gsap.registerPlugin(ScrollTrigger, CustomEase);
if (!CustomEase.get("aaa24")) {
  CustomEase.create("aaa24", ".12,.23,.5,1");
}

/**
 * MarkHero — the brand mark as a kinetic hero element.
 *
 * Embeds the favicon SVG inline (two paths: white wordmark + crimson
 * 8-point starburst) so GSAP can target individual paths. Three motion
 * layers compose the feel:
 *
 *   1. Entrance — wordmark fades up, starburst follows, the single mono-cap
 *      label settles. Plays once on mount.
 *   2. Perpetual — starburst rotates ~32s/turn with a subtle scale pulse on
 *      a sine ease. Repeats indefinitely.
 *   3. Scroll-driven — ScrollTrigger pins the section and scrubs a timeline
 *      that scales the mark down and dims the label as the user scrolls,
 *      then releases the pin into TheRoom below.
 *
 * `prefers-reduced-motion` users get a static mark with the entrance only:
 * the perpetual rotation and the scrub timeline are skipped via gsap.matchMedia.
 *
 * The wordmark uses `fill="currentColor"` and inherits the mounting CSS color
 * (`--pricing-fg`); the starburst is filled via the `.markStarburst` class so
 * it can carry the `--pricing-crimson` token. Color stays in CSS.
 */
export function MarkHero() {
  const container = useRef<HTMLDivElement>(null!);
  const wordmark = useRef<SVGPathElement>(null!);
  const starburst = useRef<SVGPathElement>(null!);
  const label = useRef<HTMLParagraphElement>(null!);

  useGSAP(
    () => {
      // Entrance — plays once for everyone (motion-safe).
      const intro = gsap.timeline({ defaults: { ease: "aaa24" } });
      intro
        .from(wordmark.current, { opacity: 0, y: 24, duration: 1.2 })
        .from(
          starburst.current,
          {
            opacity: 0,
            scale: 0.7,
            transformOrigin: "50% 50%",
            duration: 1.0
          },
          "-=0.6"
        )
        .from(label.current, { opacity: 0, y: 8, duration: 0.6 }, "-=0.3");

      // Reduced-motion users stop here. matchMedia scopes the perpetual +
      // scroll layers behind a (prefers-reduced-motion: no-preference) query.
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Perpetual — starburst rotates slowly + breathes on a sine pulse.
        gsap.to(starburst.current, {
          rotate: 360,
          transformOrigin: "50% 50%",
          duration: 32,
          ease: "none",
          repeat: -1
        });
        gsap.to(starburst.current, {
          scale: 1.04,
          transformOrigin: "50% 50%",
          duration: 4.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });

        // Scroll-driven — pin the hero, scale the mark down as scroll
        // progresses, dim the label, then release into TheRoom.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: container.current,
              start: "top top",
              end: "+=80%",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1
            }
          })
          // overwrite: "auto" — the perpetual scale-pulse on the starburst
          // (and any latent transform tween) targets the same property; without
          // explicit overwrite, GSAP stacks them additively and the scrub fights
          // the perpetual frame-by-frame at mid-scroll. "auto" lets the scrub
          // assert priority while it's active.
          .to(
            wordmark.current,
            { scale: 0.78, transformOrigin: "50% 50%", overwrite: "auto" },
            0
          )
          .to(
            starburst.current,
            { scale: 0.78, transformOrigin: "50% 50%", overwrite: "auto" },
            0
          )
          .to(label.current, { opacity: 0, y: -12, overwrite: "auto" }, 0);
      });

      return () => {
        mm.revert();
      };
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      aria-label="The Hideaway · Membership"
      className={s.markHero}
    >
      <div className={s.markStage}>
        <svg
          className={s.markSvg}
          viewBox="0 0 1243.01 601.76"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="The Hideaway"
        >
          <path
            ref={wordmark}
            className={s.markWordmark}
            d="m929,311.76c-10.88-1.12-21.19,11.08-31,20l-114,242c-11.48,22.63.45,10.59-2,27.65h-222.35c13.63-14.62,22.23-27.5,34.42-51.52l34.28-67.54h-348.51l-34.28,67.54c-11.48,22.63-16.13,35.86-17.88,51.52l-227.69.35c13.45-14.27,26-24,26-24l127-254s-2.05,2.97-.65-12h250.48c-3.42,3.86-27.82,8-27.82,8l-16.67,5.29-18.07,38.23-29.33,57.79h348.51l29.33-57.79c12.19-24.02,17.19-37.95,17.88-51.52h222.35Z"
            fill="currentColor"
          />
          <path
            ref={starburst}
            className={s.markStarburst}
            d="m1210.61,184.55c-67.81-8.17-103.89-15.7-125.49-36.44-21.47-20.61-29.57-55.36-38.64-120.77l-3.79-27.34-3.54,27.38c-8.47,65.51-16.25,100.35-37.53,121.19-21.41,20.97-57.41,28.9-125.15,37.81l-32.37,4.26,32.41,3.9c67.81,8.17,103.89,15.7,125.49,36.44,21.47,20.61,29.57,55.36,38.64,120.77l3.79,27.34,3.54-27.38c8.47-65.51,16.25-100.35,37.53-121.19,21.41-20.97,57.41-28.9,125.15-37.81l32.37-4.26-32.41-3.9Z"
          />
        </svg>
      </div>
      <p ref={label} className={s.markLabel}>
        Membership
      </p>
    </section>
  );
}
