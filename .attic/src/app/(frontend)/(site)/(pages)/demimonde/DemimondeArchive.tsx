"use client";

import { useEffect, useRef, useState } from "react";
import * as m from "motion/react-m";
import {
  animate,
  LayoutGroup,
  useMotionValue,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue
} from "motion/react";
import s from "./Demimonde.module.scss";
import { PHOTOS, type Photo } from "./photos";
import { DemimondeBackdrop } from "./DemimondeBackdrop";

const DEPTH_SPEED: Record<Photo["depth"], number> = {
  background: -0.15,
  far: 0.25,
  mid: 0.6,
  close: 1.1
};

const DEPTH_SCALE: Record<Photo["depth"], number> = {
  background: 0.78,
  far: 0.88,
  mid: 0.96,
  close: 1.04
};

const DEPTH_BLUR: Record<Photo["depth"], string> = {
  background: "blur(2.4px)",
  far: "blur(1.4px)",
  mid: "blur(0.4px)",
  close: "blur(0px)"
};

const DEPTH_OPACITY: Record<Photo["depth"], number> = {
  background: 0.55,
  far: 0.78,
  mid: 0.92,
  close: 1
};

const DEPTH_ZINDEX: Record<Photo["depth"], number> = {
  background: 0,
  far: 1,
  mid: 2,
  close: 3
};

const ASPECT_RATIO: Record<Photo["aspect"], string> = {
  portrait: "3 / 4",
  landscape: "4 / 3",
  square: "1 / 1"
};

type ViewMode = "parallax" | "grid";

const LAYOUT_TRANSITION = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
};

const DEPTH_TRANSITION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
};

function PhotoCard({
  photo,
  mode,
  scrollProgress,
  reduced
}: {
  photo: Photo;
  mode: ViewMode;
  scrollProgress: MotionValue<number>;
  reduced: boolean | null;
}) {
  const isParallax = mode === "parallax";
  const speed = DEPTH_SPEED[photo.depth];
  // Range in pixels each photo travels relative to natural scroll. Tuned
  // small enough that close-tier photos don't fly across the viewport but
  // large enough that the depth tiers separate visually.
  const range = 360 * speed;

  // modeFactor eases between 1 (parallax) and 0 (grid) so the scroll-driven
  // y can ramp to zero during a mode transition instead of snapping.
  const modeFactor = useMotionValue(isParallax ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      modeFactor.set(isParallax ? 1 : 0);
      return;
    }
    const controls = animate(modeFactor, isParallax ? 1 : 0, DEPTH_TRANSITION);
    return () => controls.stop();
  }, [isParallax, modeFactor, reduced]);

  const y = useTransform(
    () => modeFactor.get() * (range - 2 * range * scrollProgress.get())
  );

  // Layout-style only includes positional/sizing values that differ between
  // modes. Motion's `layout` prop measures the delta and animates transform.
  const layoutStyle = isParallax
    ? {
        position: "absolute" as const,
        top: `${photo.baseTop}%`,
        left: `${photo.baseLeft}%`,
        width: photo.width,
        zIndex: DEPTH_ZINDEX[photo.depth]
      }
    : {
        position: "relative" as const,
        width: "100%",
        zIndex: 1
      };

  return (
    <m.figure
      layout
      layoutDependency={mode}
      className={`${s.photo} ${s[`tone${photo.tone.toUpperCase()}`]} ${s[`depth_${photo.depth}`]}`}
      style={layoutStyle}
      transition={reduced ? { duration: 0 } : { layout: LAYOUT_TRANSITION }}
    >
      <m.div className={s.photoBody} style={reduced ? undefined : { y }}>
        <m.div
          className={s.photoImage}
          style={{ aspectRatio: ASPECT_RATIO[photo.aspect] }}
          initial={false}
          animate={
            isParallax
              ? {
                  scale: DEPTH_SCALE[photo.depth],
                  opacity: DEPTH_OPACITY[photo.depth],
                  filter: DEPTH_BLUR[photo.depth]
                }
              : { scale: 1, opacity: 1, filter: "blur(0px)" }
          }
          transition={reduced ? { duration: 0 } : DEPTH_TRANSITION}
        >
          <span className={s.photoFrame} aria-hidden />
          <span className={s.photoGrain} aria-hidden />
        </m.div>
        <figcaption className={s.caption}>
          <span className={s.captionTitle}>{photo.title}</span>
          <span className={s.captionMeta}>
            {photo.occasion} · {photo.date}
          </span>
        </figcaption>
      </m.div>
    </m.figure>
  );
}

function ViewToggle({
  mode,
  onChange
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div className={s.viewToggle} role="group" aria-label="View mode">
      <button
        type="button"
        className={s.viewToggleBtn}
        data-active={mode === "parallax"}
        onClick={() => onChange("parallax")}
        aria-label="Parallax view"
        aria-pressed={mode === "parallax"}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <rect
            x="2"
            y="3"
            width="9"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
          <rect
            x="5"
            y="6"
            width="9"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.85"
          />
          <rect
            x="3.5"
            y="4.5"
            width="9"
            height="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </button>
      <button
        type="button"
        className={s.viewToggleBtn}
        data-active={mode === "grid"}
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={mode === "grid"}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
          <rect
            x="2"
            y="2"
            width="5"
            height="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="9"
            y="2"
            width="5"
            height="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="2"
            y="9"
            width="5"
            height="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect
            x="9"
            y="9"
            width="5"
            height="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </button>
    </div>
  );
}

export function DemimondeArchive() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<ViewMode>("parallax");

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const dustY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  // Backdrop is fixed-positioned (covers viewport), so we have to fade it in
  // only while the archive section is on screen — otherwise it would bleed
  // into the hero above and footer below.
  const backdropOpacity = useTransform(
    scrollYProgress,
    [0, 0.05, 0.95, 1],
    [0, 1, 1, 0]
  );

  return (
    <section ref={ref} className={s.archive} aria-label="Archive">
      <DemimondeBackdrop dustY={dustY} opacity={backdropOpacity} />

      <ViewToggle mode={mode} onChange={setMode} />

      <LayoutGroup>
        <div className={mode === "parallax" ? s.archiveStage : s.gridStage}>
          {PHOTOS.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              mode={mode}
              scrollProgress={scrollYProgress}
              reduced={reduced}
            />
          ))}
        </div>
      </LayoutGroup>

      <footer className={s.archiveFoot}>
        <span className={s.archiveFootLabel}>Archive · five volumes</span>
        <span className={s.archiveFootLine}>
          Patrons see the next set before this scroll updates.
        </span>
      </footer>
    </section>
  );
}
