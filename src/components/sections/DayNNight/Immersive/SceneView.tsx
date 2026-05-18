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
 *        - `phase === "loading" | "loaded"`: loader-stage math. Stage 1
 *          (progress 0 → 0.02) keeps the sun below the horizon while the
 *          glow band fades in. Stage 2 (progress 0.02 → 0.05) rises the
 *          sun up to exactly the horizon (HORIZON_Y).
 *        - `phase === "playing"`: the celestial sampler. The sun continues
 *          rising vertically through the viewport. At loop boundaries it's
 *          off-screen on both sides, so the modulo wrap is invisible.
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

      // Sun: phase-aware position. The loader owns progress 0 → 0.05; the
      // scene takes over from 0.05 onward.
      if (sunRef.current) {
        let leftPct: number;
        let bottomPct: number;
        let opacity: number;
        let sunColor: [number, number, number];
        let scale: number;

        if (phase === "loading" || phase === "loaded") {
          // Stage 1 (progress < 0.02): sun is kept well below the horizon
          // while the glow band fades in above it.
          // Stage 2 (progress 0.02 → 0.05): sun rises through the horizon
          // band, ending at exactly HORIZON_Y for the seamless handoff.
          let sunY: number;
          if (progress < 0.02) {
            sunY = -0.25; // tucked well below the horizon, invisible
          } else {
            const stage2T = Math.min(1, (progress - 0.02) / 0.03);
            const eased = 1 - Math.pow(1 - stage2T, 2.5);
            sunY = -0.2 + eased * (HORIZON_Y + 0.2); // -0.2 → 0.5
          }
          leftPct = 50;
          bottomPct = sunY * 100;
          opacity = Math.max(0, Math.min(1, (sunY + 0.05) / 0.2));
          sunColor = [1, 0.85, 0.55];
          scale = 1.15;
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
          // Stage 1: fade in to full. Stage 2: stay at full while sun rises.
          if (progress < 0.02) {
            horizonOpacity = progress / 0.02;
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
    return () => cancelAnimationFrame(raf);
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
