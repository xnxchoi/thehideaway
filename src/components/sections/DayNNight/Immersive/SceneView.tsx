"use client";

import { useEffect, useRef } from "react";
import {
  useDayNNightScene,
  sampleSky,
  sampleCelestial,
  HORIZON_Y
} from "../store";
import s from "../styles.module.scss";

/**
 * Day n Night scene — pure CSS/HTML implementation.
 *
 * Three layers:
 *   1. Sky gradient (full-bleed)
 *   2. Horizon glow band at the horizon line — visible during the loader
 *      as a wide horizontal stream of light before the sun appears, and
 *      held at low opacity during the scene as atmospheric warmth.
 *   3. The sun — a glowing disk whose position is driven by:
 *        - `phase === "loading" | "loaded"`: loader-stage math, spanning
 *          scene-progress [0, horizonLoop] (horizonLoop = anchor-act
 *          center; live-measured). Stage 1 (progress < 0.4·horizonLoop)
 *          keeps the sun below the horizon while the glow band fades in.
 *          Stage 2 (≥ 0.4·horizonLoop) rises the sun to exactly HORIZON_Y.
 *        - `phase === "playing"`: the celestial sampler. The sun continues
 *          rising vertically through the viewport. At loop boundaries it's
 *          off-screen on both sides, so the modulo wrap is invisible.
 *
 * Scene-progress IS loopProgress directly — there's no longer a 0.05
 * offset between loader and scene. The loop wraps 1.0 → 0.0 at
 * pre-dawn (SKY_STOPS[0] === SKY_STOPS[last]) so there's no jerk.
 *
 * The sun is one DOM element across phases — only its position values
 * change. Combined with a CSS transition on `left/bottom`, this gives a
 * single continuous motion through the loader and into the scene.
 */
export function SceneView() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const horizonRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  // Cached reference to the .shell ancestor — written by the rAF to
  // crossfade `--dn-fg` between cream and ink as the sky brightens or
  // darkens, so text floating on the sky stays legible across the loop.
  const shellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let raf = 0;

    const apply = () => {
      const { progress, phase } = useDayNNightScene.getState();
      const sky = sampleSky(progress);

      const rgb = (c: [number, number, number]) =>
        `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)})`;

      if (skyRef.current) {
        skyRef.current.style.setProperty("--sky-top", rgb(sky.top));
        skyRef.current.style.setProperty("--sky-mid", rgb(sky.mid));
        skyRef.current.style.setProperty("--sky-bottom", rgb(sky.bottom));
      }

      // Adaptive text color — find the .shell ancestor once, then write
      // `--dn-fg` each frame based on sky luminance. Mid sky (where most
      // act content sits vertically) is weighted heaviest. The result
      // crossfades between a warm cream (oklch 96% — needed when sky is
      // dark) and a deep editorial ink (oklch 22% — needed at golden
      // hour and morning when the sky brightens past readable cream).
      if (!shellRef.current && wrapRef.current) {
        shellRef.current = wrapRef.current.closest(
          '[class*="shell"]'
        ) as HTMLElement | null;
      }
      if (shellRef.current) {
        // Perceived luminance from linear sRGB sky stops (Rec. 709
        // weights). Stops are already in [0, 1].
        const lum = (c: [number, number, number]) =>
          0.21 * c[0] + 0.72 * c[1] + 0.07 * c[2];
        const skyLum =
          (lum(sky.top) + lum(sky.mid) * 1.5 + lum(sky.bottom)) / 3.5;
        // smoothstep(0.32 → 0.62) — below the band the sky is reliably
        // dark (cream is fine); above it the sky is reliably bright
        // (ink is fine); inside the band, blend smoothly.
        const x = Math.max(0, Math.min(1, (skyLum - 0.32) / 0.3));
        const inkT = x * x * (3 - 2 * x);
        const fg = `color-mix(in oklch, oklch(96% 0.005 80) ${Math.round(
          (1 - inkT) * 100
        )}%, oklch(22% 0.02 280) ${Math.round(inkT * 100)}%)`;
        shellRef.current.style.setProperty("--dn-fg", fg);
      }

      // Sun: phase-aware position. The loader owns progress [0, horizonLoop];
      // the scene takes over from horizonLoop onward — both use the same
      // continuous progress value, no offset.
      if (sunRef.current) {
        let leftPct: number;
        let bottomPct: number;
        let opacity: number;
        let sunColor: [number, number, number];
        let scale: number;

        if (phase === "loading" || phase === "loaded") {
          // Loader sun position. The classic "rise from below horizon"
          // gesture only makes sense when horizonLoop > 0 — i.e. when
          // there's scene-progress room between 0 and the handoff
          // target. With anchor=0 (Opening), horizonLoop collapses to
          // ~0 and we have no rise to stage; fall through to the same
          // sampler the playing phase uses so the sun sits at its
          // scene-resting position throughout the loader.
          const horizonLoop = useDayNNightScene.getState().horizonLoop;
          if (horizonLoop > 0.005) {
            // Staged rise (preserved for non-zero anchors).
            //   Stage 1 (progress < 0.4·horizonLoop): sun below horizon
            //     while the glow band fades in.
            //   Stage 2 (≥ 0.4·horizonLoop): sun rises through horizon
            //     and ends at exactly HORIZON_Y.
            const stage1End = 0.4 * horizonLoop;
            let sunY: number;
            if (progress < stage1End) {
              sunY = -0.25; // tucked well below the horizon, invisible
            } else {
              const stage2T = Math.min(
                1,
                (progress - stage1End) / (horizonLoop - stage1End)
              );
              const eased = 1 - Math.pow(1 - stage2T, 2.5);
              sunY = -0.2 + eased * (HORIZON_Y + 0.2); // -0.2 → 0.5
            }
            leftPct = 50;
            bottomPct = sunY * 100;
            opacity = Math.max(0, Math.min(1, (sunY + 0.05) / 0.2));
            sunColor = [1, 0.85, 0.55];
            scale = 1.15;
          } else {
            // Anchor at Opening: scene already at its resting state.
            // Drive the sun from sampleCelestial just like in playing.
            const c = sampleCelestial(progress);
            leftPct = 50 + c.sun.x * 40;
            bottomPct = c.sun.y * 100;
            opacity = c.sun.opacity;
            sunColor = c.sun.color;
            scale = c.sun.size / 0.085;
          }
        } else {
          const c = sampleCelestial(progress);
          leftPct = 50 + c.sun.x * 40;
          bottomPct = c.sun.y * 100;
          opacity = c.sun.opacity;
          sunColor = c.sun.color;
          scale = c.sun.size / 0.085;
        }

        sunRef.current.style.left = `${leftPct}%`;
        sunRef.current.style.bottom = `${bottomPct}%`;
        sunRef.current.style.opacity = String(opacity);
        sunRef.current.style.setProperty("--body-color", rgb(sunColor));
        sunRef.current.style.setProperty("--body-scale", String(scale));
      }

      // Horizon glow band — bright during the loader, dim during the scene.
      if (horizonRef.current) {
        let horizonOpacity: number;
        let horizonBrightness: number;
        if (phase === "loading" || phase === "loaded") {
          // Stage 1 fades in across [0, 0.4·horizonLoop]; stage 2 holds
          // at full while the sun rises.
          const horizonLoop = useDayNNightScene.getState().horizonLoop;
          const stage1End = 0.4 * horizonLoop;
          if (progress < stage1End && stage1End > 0) {
            horizonOpacity = progress / stage1End;
            horizonBrightness = 1;
          } else {
            horizonOpacity = 1;
            horizonBrightness = 1;
          }
        } else {
          // Subtle atmospheric trace as the sun continues rising.
          horizonOpacity = 0.35;
          horizonBrightness = 0.65;
        }
        horizonRef.current.style.opacity = String(horizonOpacity);
        horizonRef.current.style.setProperty(
          "--horizon-brightness",
          String(horizonBrightness)
        );
      }

      // Moon — currently hidden by the single-direction rule. Kept in the
      // DOM so the celestial sampler stays uniform.
      if (moonRef.current) {
        moonRef.current.style.opacity = "0";
      }

      raf = requestAnimationFrame(apply);
    };

    raf = requestAnimationFrame(apply);
    return () => {
      cancelAnimationFrame(raf);
      // Clear the inline `--dn-fg` we've been writing each frame so
      // that when the user switches to the simplified view (SceneView
      // unmounts), the simplified-view CSS override can take effect.
      // Without this, the last inline value persists on .shell forever.
      shellRef.current?.style.removeProperty("--dn-fg");
    };
  }, []);

  return (
    <div ref={wrapRef} className={s.sceneWrap} aria-hidden>
      <div ref={skyRef} className={s.sky} />
      <div ref={horizonRef} className={s.horizonGlow} />
      <div ref={sunRef} className={s.body} data-kind="sun" />
      <div ref={moonRef} className={s.body} data-kind="moon" />
    </div>
  );
}
