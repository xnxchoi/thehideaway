"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import NextImage from "next/image";

export interface FriendsTorrentPhoto {
  src: string;
  alt?: string;
  /** Optional intrinsic width hint, in px. Used to vary the torrent's
   *  rhythm. Falls back to a seeded width-profile based on index. */
  width?: number;
  /** Optional intrinsic aspect ratio (w/h). Falls back to the seeded
   *  aspect-profile based on index. */
  aspectRatio?: number;
}

export interface FriendsTorrentProps {
  photos: FriendsTorrentPhoto[];
  /** When false, the whole layer fades out (still mounted). */
  active?: boolean;
  /**
   * Caption cue gate. The layer only shows once this is true — both the
   * desktop (`active`) and mobile (`sentinelRef`) visibility paths are
   * AND-ed with it, so the torrent never appears before the dress
   * caption sequence has finished introducing it. Defaults to `true`
   * (ungated) for callers that don't sequence a caption run.
   */
  cued?: boolean;
  /** Opacity of the dark base layer behind the photos (0..1). */
  darkenOpacity?: number;
  /** Seconds per row cycle. Order: back, mid, front. Deeper = slower. */
  rowSpeeds?: [number, number, number];
  /** CSS top values for each row (desktop horizontal mode). Order: back, mid, front. */
  rowYOffsets?: [string, string, string];
  /** CSS scale per row. Order: back, mid, front. */
  rowScales?: [number, number, number];
  /** Opacity per row. Order: back, mid, front. */
  rowOpacities?: [number, number, number];
  /** Direction. Default "left" — photos flow right→left (counter-scroll). */
  direction?: "left" | "right";
  /** When true, atmospheric warm→cool gradient + grain replace flat black. */
  atmosphere?: boolean;
  /**
   * Ref to the sentinel sizing element placed in document flow alongside
   * the fixed FriendsTorrent layer. On mobile, when this element scrolls
   * through the viewport, FriendsTorrent becomes visible independent of
   * the desktop GSAP layout-aware `active` gate (which is always false on
   * mobile because `layout` is never measured). On desktop the sentinel
   * has `display:none` via `lg:hidden`, so scrollYProgress stays ≈ 0 and
   * this path is inert.
   */
  sentinelRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

const DEFAULT_SPEEDS: [number, number, number] = [105, 68, 44];
const DEFAULT_Y: [string, string, string] = ["8%", "40%", "70%"];
const DEFAULT_SCALES: [number, number, number] = [0.6, 0.9, 1.2];
const DEFAULT_OPACITIES: [number, number, number] = [0.65, 0.88, 1.0];

// Mobile column left positions (left edge of each 1/3-width column).
const MOBILE_COL_X: [string, string, string] = ["0%", "33.33%", "66.67%"];

// Inline SVG noise for the grain overlay. Defined once at module
// scope — the encoded data URL never changes per render.
const GRAIN_BG = "/assets/papier.png";

// Width/aspect profiles. Deterministic variety: each photo gets one
// of these by hashing its index. The mix favors landscape but reserves
// space for portrait + square so the torrent feels like a real photo
// set, not a thumbnail grid.
const PHOTO_PROFILES = [
  { width: 240, aspect: 1.5 }, // landscape, mid
  { width: 200, aspect: 1.0 }, // square, small
  { width: 300, aspect: 1.33 }, // landscape, large
  { width: 180, aspect: 0.75 }, // portrait, small
  { width: 260, aspect: 1.78 }, // 16:9, mid
  { width: 220, aspect: 0.9 }, // near-square, mid
  { width: 320, aspect: 1.6 }, // landscape, hero
  { width: 190, aspect: 0.8 } // portrait, mid
] as const;

/**
 * Multi-z-depth photo torrent. Desktop: three horizontal rows scrolling
 * at independent speeds. Mobile: three vertical columns scrolling at
 * independent speeds (alternating up/down for parallax depth).
 *
 * Visibility:
 *   - Desktop: driven by the `active` prop (GSAP layout-aware gate from
 *     the parent via `dressWindow.active`).
 *   - Mobile: driven by `sentinelRef` — a tall sizing div placed in
 *     document flow inside the dress act. `useScroll` tracks when it
 *     enters the viewport and flips `sentinelActive` true, bypassing the
 *     GSAP gate that is always false on mobile.
 *
 * Both paths use the same `isVisible = active || sentinelActive` merge so
 * the component renders correctly on all breakpoints without branching in
 * the parent.
 */
export function FriendsTorrent({
  photos,
  active = true,
  cued = true,
  darkenOpacity = 0.5,
  rowSpeeds = DEFAULT_SPEEDS,
  rowYOffsets = DEFAULT_Y,
  rowScales = DEFAULT_SCALES,
  rowOpacities = DEFAULT_OPACITIES,
  direction = "left",
  atmosphere = true,
  sentinelRef,
  className
}: FriendsTorrentProps) {
  const row1 = useRef<HTMLDivElement>(null);
  const row2 = useRef<HTMLDivElement>(null);
  const row3 = useRef<HTMLDivElement>(null);
  const rowRefs = [row1, row2, row3];

  const [sentinelActive, setSentinelActive] = useState(false);
  const sentinelActiveRef = useRef(false);
  useEffect(() => {
    const node = sentinelRef?.current;
    if (!node) return;

    const update = (next: boolean) => {
      if (sentinelActiveRef.current === next) return;
      sentinelActiveRef.current = next;
      setSentinelActive(next);
    };
    const observer = new IntersectionObserver(
      ([entry]) => update(Boolean(entry?.isIntersecting)),
      { rootMargin: "-2% 0px -2% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sentinelRef]);

  const isVisible = (active || sentinelActive) && cued;

  // Desktop/mobile layout switch. Initialized false to avoid SSR mismatch
  // (safe: FriendsTorrent is hidden until the dress window is active, so
  // the brief pre-hydration mobile-first paint is never visible).
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Seeded shuffle for variety. Deterministic Fisher–Yates with a seeded
  // LCG so the same input + seed always yields the same output order.
  const shuffled = useMemo(() => shuffleDeterministic(photos, 1729), [photos]);

  // GSAP marquee — gsap.matchMedia() switches between:
  //   Desktop: horizontal x-translate (three rows at different Y, same as before)
  //   Mobile:  vertical y-translate (three columns side by side, alternating
  //            up/down for a parallax depth effect)
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const tweens: gsap.core.Tween[] = [];
      rowRefs.forEach((ref, i) => {
        const row = ref.current;
        if (!row) return;
        const setWidth = row.scrollWidth / 2;
        if (setWidth <= 0) return;
        const fromX = direction === "left" ? 0 : -setWidth;
        const toX = direction === "left" ? -setWidth : 0;
        gsap.set(row, { x: fromX, y: 0 });
        tweens.push(
          gsap.to(row, {
            x: toX,
            duration: rowSpeeds[i],
            ease: "none",
            repeat: -1
          })
        );
      });
      return () => tweens.forEach((t) => t.kill());
    });

    mm.add("(max-width: 1023px)", () => {
      const tweens: gsap.core.Tween[] = [];
      // Alternating vertical directions: col 0 = up, col 1 = down, col 2 = up.
      // This creates a parallax-column depth feel similar to the horizontal
      // row depth on desktop.
      const dirs = [1, -1, 1] as const;
      rowRefs.forEach((ref, i) => {
        const row = ref.current;
        if (!row) return;
        const setHeight = row.scrollHeight / 2;
        if (setHeight <= 0) return;
        const fromY = dirs[i] > 0 ? 0 : -setHeight;
        const toY = dirs[i] > 0 ? -setHeight : 0;
        gsap.set(row, { y: fromY, x: 0 });
        tweens.push(
          gsap.to(row, {
            y: toY,
            // Mobile columns are narrower, so photos are smaller — scale
            // the duration proportionally so speed perception matches
            // the desktop rows.
            duration: rowSpeeds[i] * 1.5,
            ease: "none",
            repeat: -1
          })
        );
      });
      return () => tweens.forEach((t) => t.kill());
    });

    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSpeeds, shuffled, direction]);

  // Distribute shuffled photos across the three rows/columns.
  const rowSets = useMemo(() => {
    const a: FriendsTorrentPhoto[][] = [[], [], []];
    shuffled.forEach((p, i) => {
      a[i % 3].push(p);
    });
    return a;
  }, [shuffled]);

  return (
    <div
      className={cn(
        `pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-300`,
        className
      )}
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden
    >
      {/* Atmospheric base — sunset spillover top, indigo night bottom. */}
      {atmosphere ? (
        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(180deg, oklch(22% 0.08 45) 0%, oklch(14% 0.06 290) 45%, oklch(8% 0.04 280) 100%)",
              `linear-gradient(180deg, rgba(0,0,0,${darkenOpacity * 0.6}), rgba(0,0,0,${darkenOpacity}))`
            ].join(", ")
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${darkenOpacity})` }}
        />
      )}

      {/* Grain overlay — subtle, sells "memory" feel. */}
      {atmosphere && (
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `url(${GRAIN_BG})`,
            backgroundSize: "200px 200px"
          }}
        />
      )}

      {/* Three layered rows (desktop) / columns (mobile).
          Two-element wrapper structure: OUTER div owns scale + opacity + position;
          INNER div is the GSAP translate target. Separating them prevents React
          re-renders from clobbering GSAP's inline transform. */}
      {rowSets.map((set, i) => {
        if (set.length === 0) return null;

        const outerStyle: React.CSSProperties = isDesktop
          ? {
              top: rowYOffsets[i],
              opacity: rowOpacities[i],
              transform: `scale(${rowScales[i]})`,
              transformOrigin: "left center"
            }
          : {
              left: MOBILE_COL_X[i],
              width: "33.33%",
              height: "100%",
              opacity: rowOpacities[i]
            };

        return (
          <div
            key={i}
            className={
              isDesktop ? "absolute left-0" : "absolute top-0 overflow-hidden"
            }
            style={outerStyle}
          >
            <div
              ref={rowRefs[i]}
              className={isDesktop ? "flex items-center" : "flex flex-col"}
              style={{ willChange: "transform" }}
            >
              {/* First copy */}
              {set.map((photo, idx) => (
                <PhotoCard
                  key={`${i}-a-${photo.src}-${idx}`}
                  photo={photo}
                  rowIndex={i}
                  localIdx={idx}
                  isDesktop={isDesktop}
                />
              ))}
              {/* Duplicate copy for the seamless marquee wrap */}
              {set.map((photo, idx) => (
                <PhotoCard
                  key={`${i}-b-${photo.src}-${idx}`}
                  photo={photo}
                  rowIndex={i}
                  localIdx={idx}
                  isDesktop={isDesktop}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.55) 100%)",
            "linear-gradient(to right, oklch(10% 0.04 280 / 0.85) 0%, transparent 18%, transparent 82%, oklch(18% 0.08 40 / 0.7) 100%)"
          ].join(", ")
        }}
      />
    </div>
  );
}

// ─── PhotoCard — single photo tile ──────────────────────────────────────────

interface PhotoCardProps {
  photo: FriendsTorrentPhoto;
  rowIndex: number;
  localIdx: number;
  isDesktop: boolean;
}

function PhotoCard({ photo, rowIndex, localIdx, isDesktop }: PhotoCardProps) {
  const profile =
    PHOTO_PROFILES[hash32(rowIndex * 7919 + localIdx) % PHOTO_PROFILES.length];
  const w = photo.width ?? profile.width;
  const aspect = photo.aspectRatio ?? profile.aspect;

  const photoStyle: React.CSSProperties = isDesktop
    ? {
        width: `${w}px`,
        aspectRatio: `${aspect}`,
        boxShadow: "0 16px 38px -12px rgba(0,0,0,0.7)"
      }
    : {
        width: "100%",
        aspectRatio: `${aspect}`,
        boxShadow: "0 8px 20px -6px rgba(0,0,0,0.5)"
      };

  const wrapClass = isDesktop
    ? "relative mr-[clamp(28px,2.8vw,56px)] shrink-0 overflow-hidden"
    : "relative mb-[clamp(8px,1.5vw,16px)] shrink-0 overflow-hidden w-full";

  // Tell the optimizer the real painted size so it doesn't pick a
  // full-viewport srcset candidate. Desktop: `w` px, padded by the
  // largest row scale (1.2, front row). Mobile: a 33.33%-width column,
  // 34vw with slack. Media-query form so it's correct pre-hydration,
  // independent of the JS `isDesktop` state.
  const displayW = Math.ceil(w * 1.2);

  return (
    <div className={wrapClass} style={photoStyle}>
      <NextImage
        fill={true}
        src={photo.src}
        alt={photo.alt ?? ""}
        className="object-cover"
        sizes={`(min-width: 1024px) ${displayW}px, 34vw`}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function hash32(n: number): number {
  let x = n | 0;
  x = x ^ 61 ^ (x >>> 16);
  x = x + (x << 3);
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return x >>> 0;
}

function shuffleDeterministic<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  let state = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
