"use client";

import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface TicketPaperProps {
  /**
   * Serial number — drives the personalisation. Used as both the visual
   * hero (large foil numerals) and as a seed for the per-ticket warm
   * gradient sweep, so every ticket's panel has a slightly different
   * tonal cast.
   */
  ticketNumber: number | null;
  className?: string;
  style?: CSSProperties;
}

const padNumber = (n: number | null): string => {
  if (n === null || n === undefined) return "0000";
  return String(n).padStart(4, "0");
};

/**
 * TicketPaper — the brand artifact. Dark luxe panel, NOT a paper-ticket
 * simulation. No perforation, no stub, no stamp, no bone substrate.
 *
 * **Aesthetic:** charcoal ground, warm metallic gradient sweep keyed
 * to the ticket's own number, big foil serial as the typographic hero,
 * and a thin engraved frame. Closer to a private members' card than a
 * cinema stub. Each ticket reads as the same artifact with a slightly
 * different tonal cast.
 *
 * **Pure visual.** No event name / date / holder / status. The detail
 * page's information track carries those — this is just the brand
 * object on the page.
 */
export function TicketPaper({
  ticketNumber,
  className,
  style
}: TicketPaperProps) {
  const num = padNumber(ticketNumber);

  // Per-ticket tonal sweep — derive a hue offset from the serial so
  // every ticket reads slightly different. Constrained to warm range
  // (deep amber → ember → bronze) so we don't drift into rave territory.
  const seed = ticketNumber ?? 0;
  const hue = 28 + (seed * 7) % 24; // 28°–52°, warm only
  const sweepStart = `oklch(0.32 0.07 ${hue})`;
  const sweepEnd = `oklch(0.13 0.02 ${hue + 6})`;

  return (
    <div
      className={cn(
        "relative isolate aspect-[3/2] w-full select-none overflow-hidden rounded-[6px]",
        className
      )}
      style={{
        containerType: "inline-size",
        background: `radial-gradient(circle at 22% 28%, ${sweepStart} 0%, ${sweepEnd} 70%)`,
        boxShadow:
          "0 40px 80px -30px rgba(0,0,0,0.7), 0 14px 28px -8px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,224,170,0.07)",
        ...style
      }}
    >
      {/* Concentric guilloché lines — luxury-card security-pattern feel.
          Drawn in low-opacity warm-foil so they only catch the eye on
          close inspection. SVG not CSS so the lines stay crisp. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="ticket-guilloche-fade" cx="22%" cy="28%" r="80%">
            <stop offset="0%" stopColor="rgba(232, 196, 132, 0.35)" />
            <stop offset="60%" stopColor="rgba(232, 196, 132, 0.06)" />
            <stop offset="100%" stopColor="rgba(232, 196, 132, 0)" />
          </radialGradient>
        </defs>
        <g
          stroke="url(#ticket-guilloche-fade)"
          strokeWidth="0.3"
          fill="none"
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <ellipse
              key={i}
              cx={66}
              cy={56}
              rx={20 + i * 18}
              ry={14 + i * 12}
              transform={`rotate(${seed % 17} 66 56)`}
            />
          ))}
        </g>
      </svg>

      {/* Subtle film-grain — gives the dark surface tooth */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full mix-blend-overlay"
        style={{ opacity: 0.18 }}
      >
        <filter id="ticket-card-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 0.92
                    0 0 0 0 0.78
                    0 0 0 0.6 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#ticket-card-grain)" />
      </svg>

      {/* Engraved hairline frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[3.5%] rounded-[3px]"
        style={{
          border: "1px solid rgba(232, 196, 132, 0.18)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)"
        }}
      />

      {/* ── Top rail ─────────────────────────────────────────────────── */}
      <div
        className="absolute top-[7%] right-[6%] left-[6%] flex items-baseline justify-between"
        style={{ color: "rgba(232, 196, 132, 0.78)" }}
      >
        <span
          className="font-mono font-medium uppercase"
          style={{
            letterSpacing: "0.36em",
            fontSize: "clamp(0.6rem,1.4cqw,0.95rem)"
          }}
        >
          The&nbsp;&nbsp;Hideaway
        </span>
        <span
          className="font-mono uppercase"
          style={{
            letterSpacing: "0.36em",
            opacity: 0.6,
            fontSize: "clamp(0.55rem,1.25cqw,0.82rem)"
          }}
        >
          Membership · 입장
        </span>
      </div>

      {/* ── Hero serial — the typographic anchor ─────────────────────── */}
      {/* Big foil-gradient numerals, centred. The single moment of
          chromatic warmth on the panel. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          aria-label={`Ticket number ${num}`}
          style={{
            fontFamily:
              "var(--font-ticket-serif), 'Playfair Display', Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(3.6rem,16cqw,11rem)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            background:
              "linear-gradient(140deg, #d8a85e 0%, #fbe6a8 30%, #b78248 65%, #f0d28a 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.6))"
          }}
        >
          {num}
        </span>
      </div>

      {/* ── Foot rail ────────────────────────────────────────────────── */}
      <div
        className="absolute right-[6%] bottom-[7%] left-[6%] flex items-baseline justify-between"
        style={{ color: "rgba(232, 196, 132, 0.6)" }}
      >
        <span
          className="font-mono uppercase"
          style={{
            letterSpacing: "0.32em",
            fontSize: "clamp(0.55rem,1.2cqw,0.78rem)"
          }}
        >
          hideawayseoul.com
        </span>
        <span
          className="font-mono uppercase"
          style={{
            letterSpacing: "0.32em",
            fontSize: "clamp(0.5rem,1.05cqw,0.7rem)",
            opacity: 0.7
          }}
        >
          Admit&nbsp;&nbsp;One
        </span>
      </div>
    </div>
  );
}
