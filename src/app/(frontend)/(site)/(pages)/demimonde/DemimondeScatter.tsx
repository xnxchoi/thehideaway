"use client";

import s from "./Demimonde.module.scss";

/**
 * Floating word scatter — Athens-26 has 60+ "Yassou/Γιασού/Hello/Vase/shaker"
 * elements floating in 3D across the whole page. We use ~6, sparingly, so
 * they punctuate the editorial layout rather than dominate it.
 *
 * Each word has fixed-percentage placement, a per-element parallax
 * multiplier, and an italic-serif character. They use the shell's
 * `--cursor-dx`/`--cursor-dy` CSS variables (written by DemimondeCursor)
 * to translate themselves — pure CSS, no JS in the render loop here.
 */
const WORDS = [
  {
    text: "여름",
    top: 6,
    left: 4,
    size: 64,
    parallax: 18,
    rotate: -8,
    lang: "ko"
  },
  {
    text: "summer",
    top: 22,
    left: 88,
    size: 48,
    parallax: -22,
    rotate: 5,
    lang: "en"
  },
  {
    text: "안녕",
    top: 48,
    left: 2,
    size: 92,
    parallax: 28,
    rotate: -3,
    lang: "ko"
  },
  {
    text: "yum",
    top: 64,
    left: 92,
    size: 56,
    parallax: -16,
    rotate: 8,
    lang: "en"
  },
  {
    text: "garden",
    top: 82,
    left: 6,
    size: 72,
    parallax: 22,
    rotate: -5,
    lang: "en"
  },
  {
    text: "sunday",
    top: 92,
    left: 70,
    size: 60,
    parallax: -14,
    rotate: 3,
    lang: "en"
  }
];

export function DemimondeScatter() {
  return (
    <div className={s.scatter} aria-hidden>
      {WORDS.map((w, i) => (
        <span
          key={`${w.text}-${i}`}
          className={s.scatterWord}
          lang={w.lang}
          style={
            {
              top: `${w.top}%`,
              left: `${w.left}%`,
              fontSize: `${w.size}px`,
              "--scatter-parallax": w.parallax,
              "--scatter-rotate": `${w.rotate}deg`
            } as React.CSSProperties
          }
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
