"use client";

import { useEffect, useRef } from "react";
import { useDayNNightScene, sampleSky, sampleCelestial } from "../store";
import s from "../styles.module.scss";

/**
 * Day n Night scene — pure CSS/HTML implementation.
 *
 * The site's global R3F Canvas is `position: fixed; z-index: 40` and clears
 * to its scene contents (sky shader would render opaque sky-fills over all
 * page content). To keep the celestial scene compatible with the site's
 * stacking architecture, we render sky + sun + moon as DOM elements behind
 * the timeline content (z-index < 40), driven by the same `progress` store
 * we'd have used for the R3F version.
 *
 * The sun is also the loader's centerpiece: during the `loading` / `loaded`
 * phases it's pinned to a centered, slightly enlarged "preloader" position;
 * once the loader hands off (phase = `playing`), it smoothly migrates to
 * its scroll-driven scene position via a CSS transition on `left/bottom`.
 * One element, one continuous motion — no swap, no flash.
 */
export function SceneView() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
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

      // Sun positioning — phase-aware.
      //
      //   loading / loaded: the sun rises into a centered "preloader" spot
      //   from below the viewport. The CSS `loaderBackdrop` is opaque dark
      //   over the rest of the screen, so the sun is the only thing the
      //   user sees emerging.
      //
      //   playing: the sun follows the celestial sampler. A CSS transition
      //   on left/bottom carries it smoothly from the loader spot to its
      //   scene-arc start as the loader backdrop fades out.
      if (sunRef.current) {
        let leftPct: number;
        let bottomPct: number;
        let opacity: number;
        let sunColor: [number, number, number];
        let scale: number;

        if (phase === "loading" || phase === "loaded") {
          // Loader rise: progress 0 → 0.05 drives the sun from below the
          // viewport (bottom: -10%) up to the preloader spot at bottom: 52%.
          const riseT = Math.min(1, progress / 0.05);
          const eased = 1 - Math.pow(1 - riseT, 2.5);
          leftPct = 50;
          bottomPct = -10 + eased * 62;
          opacity = eased;
          sunColor = [1, 0.92, 0.65];
          scale = 1.3;
        } else {
          const c = sampleCelestial(progress);
          leftPct = 50 + c.sun.x * 40;
          bottomPct = 22 + c.sun.y * 56;
          opacity = c.sun.opacity;
          sunColor = c.sun.color;
          scale = c.sun.size / 0.085;
        }

        sunRef.current.style.left = `${leftPct}%`;
        sunRef.current.style.bottom = `${bottomPct}%`;
        sunRef.current.style.opacity = String(opacity);
        sunRef.current.style.setProperty("--body-color", rgb(sunColor));
        sunRef.current.style.setProperty("--body-scale", String(scale));

        // Mirror the sun's screen position onto the wrap so the loader
        // backdrop's spotlight reveal can follow it without a second
        // subscription.
        if (wrapRef.current) {
          wrapRef.current.style.setProperty("--reveal-x", `${leftPct}%`);
          wrapRef.current.style.setProperty(
            "--reveal-y",
            `${100 - bottomPct}%`
          );
        }
      }

      if (moonRef.current) {
        const c = sampleCelestial(progress);
        const leftPct = 50 + c.moon.x * 40;
        const bottomPct = 22 + c.moon.y * 56;
        // Hide the moon entirely until the scene takes over — keeps the
        // loader visually about the sun alone.
        const showMoon = phase === "playing";
        moonRef.current.style.left = `${leftPct}%`;
        moonRef.current.style.bottom = `${bottomPct}%`;
        moonRef.current.style.opacity = String(showMoon ? c.moon.opacity : 0);
        moonRef.current.style.setProperty("--body-color", rgb(c.moon.color));
        moonRef.current.style.setProperty(
          "--body-scale",
          String(c.moon.size / 0.075)
        );
      }

      raf = requestAnimationFrame(apply);
    };

    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className={s.sceneWrap} aria-hidden>
      <div ref={skyRef} className={s.sky} />
      <div ref={sunRef} className={s.body} data-kind="sun" />
      <div ref={moonRef} className={s.body} data-kind="moon" />
    </div>
  );
}
