"use client";

/**
 * Floating word scatter — sparse italic-serif words drifting across the
 * page background. Each word reads `--cursor-dx`/`--cursor-dy` from the
 * <html> root (written by DemimondeCursor) and parallaxes via a per-
 * element multiplier — pure CSS, no JS in the render loop.
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
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {WORDS.map((w, i) => {
        const isKo = w.lang === "ko";
        return (
          <span
            key={`${w.text}-${i}`}
            lang={w.lang}
            className={`absolute font-serif font-normal tracking-[-0.03em] whitespace-nowrap italic will-change-transform select-none max-sm:opacity-[0.05] ${
              isKo
                ? "text-[var(--tomato)] opacity-[0.06] max-sm:opacity-[0.04]"
                : "text-[var(--ink)] opacity-[0.07]"
            }`}
            style={{
              top: `${w.top}%`,
              left: `${w.left}%`,
              fontSize: `${w.size}px`,
              transform: `translate3d(calc(var(--cursor-dx) * ${w.parallax} * 1px), calc(var(--cursor-dy) * ${w.parallax} * 1px), 0) rotate(${w.rotate}deg)`,
              transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
