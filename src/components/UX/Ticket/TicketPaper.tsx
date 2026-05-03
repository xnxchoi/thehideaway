"use client";

import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface TicketPaperProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * TicketPaper — the brand artifact, drawn as paper-and-ink HTML/CSS.
 *
 * **Strict rule: no event/date/holder/serial data appears here.**
 * This component is the *visual identity* of a Hideaway ticket — bone
 * paper, vermilion seal, champagne foil rules, brand vocabulary only.
 * The page that hosts it shows the actual information as editorial
 * typography around the artifact, not stamped onto it.
 *
 * Aesthetic reference: museum admission stub, letterpress invitation,
 * Cereal magazine event collateral. Nothing should look "rendered" —
 * everything should look *printed*.
 */
export function TicketPaper({ className, style }: TicketPaperProps) {
  return (
    <div
      className={cn(
        "relative isolate aspect-[2/1] w-full select-none",
        className
      )}
      style={{
        // Container-type lets all `cqw` (container-query-width) units inside
        // this artifact size relative to the ticket's own width — so type
        // and seal scale with the ticket regardless of viewport breakpoints.
        containerType: "inline-size",
        // Paper drop-shadow biased to match a single warm front-right key.
        filter:
          "drop-shadow(-12px 28px 36px rgba(14, 10, 6, 0.28)) drop-shadow(0 2px 4px rgba(14, 10, 6, 0.30))",
        ...style
      }}
    >
      {/* ── Paper substrate ──────────────────────────────────────────────
          Diagonal bone gradient + radial edge oxidation + grain. */}
      <div
        className="absolute inset-0 rounded-[3px]"
        style={{
          background:
            "linear-gradient(135deg, #fbf3dc 0%, #fbf3dc 55%, #eee2c2 100%)"
        }}
      />
      <div
        className="absolute inset-0 rounded-[3px]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(40, 24, 12, 0.16) 100%)"
        }}
      />
      {/* SVG grain layer — cheap fbm noise, ink-toned, low alpha */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full rounded-[3px] mix-blend-multiply"
        style={{ opacity: 0.5 }}
      >
        <filter id="ticket-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.16
                    0 0 0 0 0.10
                    0 0 0 0 0.05
                    0 0 0 0.18 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#ticket-grain)" />
      </svg>

      {/* ── Inner hairline frame (Vignelli discipline) ──────────────────── */}
      <div
        aria-hidden
        className="absolute inset-[3.5%] rounded-[1px]"
        style={{ border: "1px solid rgba(14, 10, 6, 0.32)" }}
      />

      {/* ── Vertical perforation, ~63% across (matches stub convention) ── */}
      <div
        aria-hidden
        className="absolute top-[6%] bottom-[6%]"
        style={{
          left: "63%",
          width: 1,
          backgroundImage:
            "linear-gradient(to bottom, rgba(14,10,6,0.42) 50%, transparent 50%)",
          backgroundSize: "1px 14px",
          backgroundRepeat: "repeat-y"
        }}
      />
      {/* Notches — semicircular punches at top and bottom of the perforation */}
      <div
        aria-hidden
        className="absolute top-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: "63%",
          width: "3.2%",
          height: "6.4%",
          background: "var(--background, #0a0a0a)",
          boxShadow: "inset 0 0 0 1px rgba(14,10,6,0.22)"
        }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 rounded-full"
        style={{
          left: "63%",
          width: "3.2%",
          height: "6.4%",
          background: "var(--background, #0a0a0a)",
          boxShadow: "inset 0 0 0 1px rgba(14,10,6,0.22)"
        }}
      />

      {/* ── Body content (left of perforation): brand vocabulary only ──── */}
      <div
        className="absolute"
        style={{ inset: "6.5% 38% 6.5% 5%", color: "rgba(14,10,6,0.88)" }}
      >
        {/* Top rail */}
        <div className="flex items-baseline justify-between">
          <span
            className="font-mono text-[clamp(0.62rem,1.4cqw,0.95rem)] font-semibold uppercase"
            style={{ letterSpacing: "0.32em" }}
          >
            The&nbsp;&nbsp;Hideaway
          </span>
          <span
            className="font-mono text-[clamp(0.6rem,1.3cqw,0.9rem)] font-semibold uppercase"
            style={{ letterSpacing: "0.32em", opacity: 0.7 }}
          >
            Admit&nbsp;&nbsp;One
          </span>
        </div>
        <div
          className="mt-3"
          style={{ height: 1, background: "rgba(14,10,6,0.28)" }}
        />

        {/* Centre: a single vermilion seal — the iconic moment.
            Clean concentric rings + a serif "H" monogram. Nothing
            distressed; the paper texture above provides the aged feel. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Seal />
        </div>

        {/* Foot */}
        <div className="absolute right-0 bottom-0 left-0">
          <div
            className="mb-3"
            style={{ height: 1, background: "rgba(14,10,6,0.28)" }}
          />
          <div className="flex items-baseline justify-between">
            <span
              className="font-mono text-[clamp(0.5rem,1.05cqw,0.78rem)] uppercase"
              style={{ letterSpacing: "0.28em", opacity: 0.7 }}
            >
              hideawayseoul.com
            </span>
            <span
              className="text-[clamp(0.55rem,1.15cqw,0.82rem)]"
              style={{ opacity: 0.7 }}
            >
              입장권
            </span>
          </div>
        </div>
      </div>

      {/* ── Stub (right of perforation): brand vocabulary only ──────────── */}
      <div
        className="absolute flex flex-col items-center justify-between"
        style={{ inset: "6.5% 4% 6.5% 65%", color: "rgba(14,10,6,0.88)" }}
      >
        <span
          className="font-mono text-[clamp(0.55rem,1.1cqw,0.78rem)] font-semibold uppercase"
          style={{ letterSpacing: "0.32em", opacity: 0.7 }}
        >
          Ticket
        </span>

        {/* Foil monogram H — drawn in CSS gradient so it has a hint of
            actual metallic depth without baking a static gold colour. */}
        <span
          aria-hidden
          className="leading-none"
          style={{
            fontFamily:
              "var(--font-ticket-serif), 'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.4rem, 6.4cqw, 4.4rem)",
            fontWeight: 400,
            background:
              "linear-gradient(140deg, #d9b873 0%, #f0d597 35%, #b78e4e 70%, #e6c585 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent"
          }}
        >
          H
        </span>

        <span
          className="font-mono text-[clamp(0.55rem,1.1cqw,0.78rem)] font-semibold uppercase"
          style={{ letterSpacing: "0.32em", opacity: 0.7 }}
        >
          Admit&nbsp;One
        </span>
      </div>
    </div>
  );
}

/**
 * Vermilion seal — clean concentric rings with a serif "H" monogram.
 * No noise displacement, no distress dabs — the paper grain above
 * already gives the surface its age. This is just confident ink on paper.
 */
function Seal() {
  return (
    <div
      aria-hidden
      className="relative aspect-square"
      style={{ width: "32%", transform: "rotate(-4deg)" }}
    >
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "0.45cqw solid #c0241a",
          boxShadow:
            "inset 0 0 0 0.18cqw rgba(120, 18, 12, 0.6), 0 0 36px rgba(192, 36, 26, 0.18)"
        }}
      />
      {/* Soft red bloom around the seal */}
      <div
        className="absolute -inset-[18%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(192,36,26,0.16) 35%, transparent 60%)"
        }}
      />
      {/* Centre H monogram in vermilion */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          style={{
            fontFamily:
              "var(--font-ticket-serif), 'Playfair Display', Georgia, serif",
            fontSize: "16cqw",
            fontWeight: 400,
            color: "#a01a14",
            lineHeight: 1
          }}
        >
          H
        </span>
      </div>
    </div>
  );
}
