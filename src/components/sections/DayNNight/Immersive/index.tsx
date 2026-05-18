"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useDayNNightScene } from "../store";
import { Scrubber } from "./Scrubber";
import { SunLoader } from "./SunLoader";
import { Timeline } from "./Timeline";
import s from "../styles.module.scss";

/**
 * Immersive view orchestrator.
 *
 * Layers (back → front):
 *
 *   1. SceneView (R3F portal)   — sky shader + sun/moon meshes (fixed)
 *   2. .grain                   — atmospheric noise overlay
 *   3. Timeline                 — HTML content, horizontally scrolled
 *   4. ScrollHint               — fades out on first scroll
 *   5. SunLoader                — covers everything during load
 */
export function ImmersiveView() {
  const t = useTranslations("Event.DayNNight");
  const phase = useDayNNightScene((r) => r.phase);
  const [hintHidden, setHintHidden] = useState(false);

  // Hide the scroll hint on first scroll.
  useEffect(() => {
    if (phase !== "playing") return;
    const onScroll = () => setHintHidden(true);
    window.addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase]);

  // Reset progress to 0 on mount so a re-entry replays the loader handoff.
  useEffect(() => {
    return () => {
      useDayNNightScene.getState().setProgress(0);
      useDayNNightScene.getState().setPhase("loading");
    };
  }, []);

  return (
    <div className={s.immersive}>
      {/* Timeline owns the pinned scroll context; SceneView (sky + sun + moon)
          and the grain overlay live inside it so they share the pin. */}
      <Timeline />
      <div
        className={s.scrollHint}
        data-hidden={hintHidden || phase !== "playing"}
        aria-hidden
      >
        <span className={s.scrollHintLine} />
        <span>{t("scrollHint")}</span>
      </div>
      <Scrubber />
      {phase !== "playing" ? <SunLoader /> : null}
    </div>
  );
}
