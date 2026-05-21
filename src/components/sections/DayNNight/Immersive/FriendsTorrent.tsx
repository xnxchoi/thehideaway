"use client";

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

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
  /** Opacity of the dark base layer behind the photos (0..1). */
  darkenOpacity?: number;
  /** Seconds per row cycle. Order: back, mid, front. Deeper = slower. */
  rowSpeeds?: [number, number, number];
  /** CSS top values for each row. Order: back, mid, front. */
  rowYOffsets?: [string, string, string];
  /** CSS scale per row. Order: back, mid, front. */
  rowScales?: [number, number, number];
  /** Opacity per row. Order: back, mid, front. */
  rowOpacities?: [number, number, number];
  /** Direction. Default "left" — photos flow right→left (counter-scroll). */
  direction?: "left" | "right";
  /** When true, atmospheric warm→cool gradient + grain replace flat black. */
  atmosphere?: boolean;
  className?: string;
}

const DEFAULT_SPEEDS: [number, number, number] = [105, 68, 44];
const DEFAULT_Y: [string, string, string] = ["8%", "40%", "70%"];
const DEFAULT_SCALES: [number, number, number] = [0.6, 0.9, 1.2];
const DEFAULT_OPACITIES: [number, number, number] = [0.65, 0.88, 1.0];

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
 * Multi-z-depth horizontal photo torrent.
 *
 * Three layered rows of photos scrolling horizontally at independent
 * speeds — back row slowest + smallest + most transparent, front row
 * fastest + largest + opaque. The depth illusion is purely
 * compositional (no perspective transform); deeper rows just drift
 * less and sit fainter.
 *
 * Photos vary in width/aspect per a seeded profile assignment so the
 * torrent reads like a real photo set, not a thumbnail grid. A subtle
 * per-photo Y-bob (CSS animation, 2–4px sine) keeps motion from
 * feeling mechanical.
 *
 * Layout is absolute to the parent — consumer is responsible for
 * sizing the container. The component fills `inset-0`.
 *
 * Reference patterns:
 *  - GSAP horizontal infinite-marquee (forum "Infinite Floating
 *    Staggered Image Grid")
 *  - Fancy Components `parallax-floating` (per-element depth)
 *  - Framer "Floating Gallery" (three-layer aesthetic)
 *
 * Built isolated; see `/dev/dn-friends-torrent` for the dev harness.
 */
export function FriendsTorrent({
  photos,
  active = true,
  darkenOpacity = 0.5,
  rowSpeeds = DEFAULT_SPEEDS,
  rowYOffsets = DEFAULT_Y,
  rowScales = DEFAULT_SCALES,
  rowOpacities = DEFAULT_OPACITIES,
  direction = "left",
  atmosphere = true,
  className
}: FriendsTorrentProps) {
  const row1 = useRef<HTMLDivElement>(null);
  const row2 = useRef<HTMLDivElement>(null);
  const row3 = useRef<HTMLDivElement>(null);

  const rowRefs = [row1, row2, row3] as const;

  // Seeded shuffle for variety. The photo order in the input array is
  // typically alphabetical from the filesystem, which clusters
  // visually-similar shots together. A deterministic shuffle (LCG)
  // breaks those clusters without changing the rendered output across
  // renders.
  const shuffled = useMemo(() => shuffleDeterministic(photos, 1729), [photos]);

  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];

    rowRefs.forEach((ref, i) => {
      const row = ref.current;
      if (!row) return;
      const setWidth = row.scrollWidth / 2;
      if (setWidth <= 0) return;

      const fromX = direction === "left" ? 0 : -setWidth;
      const toX = direction === "left" ? -setWidth : 0;

      gsap.set(row, { x: fromX });
      const tween = gsap.to(row, {
        x: toX,
        duration: rowSpeeds[i],
        ease: "none",
        repeat: -1
      });
      tweens.push(tween);
    });

    return () => {
      tweens.forEach((t) => t.kill());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSpeeds, shuffled, direction]);

  // Distribute shuffled photos across the three rows.
  const rowSets: FriendsTorrentPhoto[][] = [[], [], []];
  shuffled.forEach((p, i) => {
    rowSets[i % 3].push(p);
  });

  return (
    <div
      className={cn(
        `pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-300`,
        className
      )}
      style={{ opacity: active ? 1 : 0 }}
      aria-hidden
    >
      {/* Atmospheric base — sunset spillover top, indigo night bottom.
          Replaces flat black so the canvas reads as part of the
          day→night arc, not a separate surface. */}
      {atmosphere ? (
        <div
          className="absolute inset-0"
          style={{
            background: [
              // warm spill top, deep indigo bottom
              "linear-gradient(180deg, oklch(22% 0.08 45) 0%, oklch(14% 0.06 290) 45%, oklch(8% 0.04 280) 100%)",
              // dim it under photos
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

      {/* Grain overlay — subtle, sells "memory" feel. Static paper
          texture from /assets/papier.png. */}
      {atmosphere ? (
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage: `url(${GRAIN_BG})`,
            backgroundSize: "200px 200px"
          }}
        />
      ) : null}

      {/* Three layered rows.

          Two-element wrapper structure: the OUTER div owns
          React-controlled scale + opacity + Y position; the INNER div
          is the GSAP target for the x-translate marquee. Separating
          them prevents React re-renders from clobbering GSAP's
          inline transform — the two transforms live on different
          elements and never collide. */}
      {rowSets.map((set, i) => {
        if (set.length === 0) return null;
        return (
          <div
            key={i}
            className="absolute left-0"
            style={{
              top: rowYOffsets[i],
              opacity: rowOpacities[i],
              transform: `scale(${rowScales[i]})`,
              transformOrigin: "left center"
            }}
          >
            <div
              ref={rowRefs[i]}
              className="flex items-center"
              style={{ willChange: "transform" }}
            >
              {/* Duplicate set for the seamless marquee wrap. */}
              {[...set, ...set].map((photo, idx) => {
                const inFirstHalf = idx < set.length;
                const localIdx = idx % set.length;
                const profile =
                  PHOTO_PROFILES[
                    hash32(i * 7919 + localIdx) % PHOTO_PROFILES.length
                  ];
                const w = photo.width ?? profile.width;
                const aspect = photo.aspectRatio ?? profile.aspect;
                // Per-photo Y-bob: 3–5s period, ±2–4px, random phase.
                // Seeded on localIdx so the duplicate copy bobs in
                // sync with its original — keeps the wrap seamless.

                const photoStyle = {
                  width: `${w}px`,
                  aspectRatio: `${aspect}`,
                  boxShadow: "0 16px 38px -12px rgba(0,0,0,0.7)"
                } as React.CSSProperties;

                return (
                  <div
                    key={`${i}-${inFirstHalf ? "a" : "b"}-${photo.src}-${localIdx}`}
                    className="mr-[clamp(28px,2.8vw,56px)] shrink-0 overflow-hidden"
                    style={photoStyle}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.src}
                      alt={photo.alt ?? ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Edge vignette — refined.
          Top/bottom 12% (softer, doesn't compete with photos).
          Sides 20% with a warm-tint right edge and cool-tint left
          edge — so photos appear to enter cool/dim and exit into
          warmer light, riding the sunset arc. */}
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

// Tiny deterministic hash → 32-bit unsigned int.
function hash32(n: number): number {
  let x = n | 0;
  x = x ^ 61 ^ (x >>> 16);
  x = x + (x << 3);
  x = x ^ (x >>> 4);
  x = Math.imul(x, 0x27d4eb2d);
  x = x ^ (x >>> 15);
  return x >>> 0;
}

// Deterministic Fisher–Yates with a seeded LCG. Same input + seed
// always yields the same output order.
function shuffleDeterministic<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  let state = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    // LCG step (Numerical Recipes parameters)
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
