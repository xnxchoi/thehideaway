"use client";

import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface TicketPaperProps {
  /** Event name printed as the editorial centrepiece. */
  eventName: string;
  /** Ticket serial — printed on the stub as `№ 0004`. */
  ticketNumber: number | null;
  /**
   * Pre-formatted date eyebrow, e.g. `"THU · 7 MAY 2026"`. Optional —
   * when omitted the eyebrow line is suppressed.
   */
  dateLabel?: string | null;
  /** Optional venue, appended to the foot rail. */
  location?: string | null;
  /** Optional time string (e.g. `"20:00"`), prepended to the foot rail. */
  time?: string | null;
  /**
   * Holder's display name. Printed in italic serif as an "inscribed"
   * line — the personal touch on an otherwise printed object. Omit
   * for unclaimed tickets.
   */
  holderName?: string | null;
  className?: string;
  style?: CSSProperties;
}

const padNumber = (n: number | null): string => {
  if (n === null || n === undefined) return "0000";
  return String(n).padStart(4, "0");
};

/**
 * TicketPaper — the brand artifact for a single ticket.
 *
 * **Architecture rule:** the component is *implementation-decoupled*
 * from the page that hosts it. It takes ticket-shaped props and renders
 * them; it does not fetch or know about Payload, sessions, or routes.
 * Hosts pass the data through and the same artifact appears the same
 * way wherever it's rendered.
 *
 * **Visual rule:** every piece of data on the paper is sized to read
 * confidently — never tiny "data stamped onto the canvas" texture. If
 * a value would be illegible at the rendered scale, suppress it
 * (e.g. holder name optional, date eyebrow optional). The paper is a
 * personalized artifact, not a data dump.
 *
 * Aesthetic reference: museum admission stub, letterpress invitation,
 * Cereal magazine event collateral. Bone paper, ink rules, vermilion
 * seal, champagne foil monogram on the stub.
 */
export function TicketPaper({
  eventName,
  ticketNumber,
  dateLabel,
  location,
  time,
  holderName,
  className,
  style
}: TicketPaperProps) {
  const num = padNumber(ticketNumber);
  const venue = (location ?? "").toUpperCase();
  const footLeft = [time, venue].filter(Boolean).join("    ·    ");

  return (
    <div
      className={cn(
        "relative isolate aspect-[2/1] w-full select-none",
        className
      )}
      style={{
        // Container-type lets `cqw` (container-query-width) units inside
        // the artifact size relative to the ticket's own width.
        containerType: "inline-size",
        // Drop-shadow biased to a single warm front-right key.
        filter:
          "drop-shadow(-12px 28px 36px rgba(14, 10, 6, 0.28)) drop-shadow(0 2px 4px rgba(14, 10, 6, 0.30))",
        ...style
      }}
    >
      {/* ── Paper substrate ──────────────────────────────────────────── */}
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
      {/* SVG fbm grain — ink-toned, low alpha, multiplied */}
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

      {/* ── Inner hairline frame ─────────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute inset-[3.5%] rounded-[1px]"
        style={{ border: "1px solid rgba(14, 10, 6, 0.32)" }}
      />

      {/* ── Vertical perforation ─────────────────────────────────────── */}
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
      {/* Notches at top + bottom of the perforation */}
      <Notch position="top" />
      <Notch position="bottom" />

      {/* ── Body content (left of perforation) ───────────────────────── */}
      <div
        className="absolute"
        style={{ inset: "6.5% 38% 6.5% 5%", color: "rgba(14,10,6,0.92)" }}
      >
        {/* Top rail */}
        <div className="flex items-baseline justify-between">
          <span
            className="font-mono font-semibold uppercase"
            style={{
              letterSpacing: "0.32em",
              fontSize: "clamp(0.62rem,1.5cqw,1rem)"
            }}
          >
            The&nbsp;&nbsp;Hideaway
          </span>
          <span
            className="font-mono font-semibold uppercase"
            style={{
              letterSpacing: "0.32em",
              opacity: 0.7,
              fontSize: "clamp(0.6rem,1.4cqw,0.95rem)"
            }}
          >
            Admit&nbsp;&nbsp;One
          </span>
        </div>
        <div
          className="mt-3"
          style={{ height: 1, background: "rgba(14,10,6,0.28)" }}
        />

        {/* Editorial centrepiece — date eyebrow + event name + holder line.
            Absolutely-positioned block centred vertically in the body
            so the seal can sit beside it without knocking the rhythm. */}
        <div
          className="absolute"
          style={{ left: 0, right: "30%", top: "32%", bottom: "22%" }}
        >
          {dateLabel ? (
            <p
              className="font-mono uppercase"
              style={{
                letterSpacing: "0.28em",
                opacity: 0.72,
                fontSize: "clamp(0.65rem,1.55cqw,1rem)"
              }}
            >
              {dateLabel}
            </p>
          ) : null}

          <h2
            className="mt-2 italic"
            style={{
              fontFamily:
                "var(--font-ticket-serif), 'Playfair Display', Georgia, serif",
              fontWeight: 400,
              lineHeight: 1.04,
              letterSpacing: "-0.01em",
              fontSize: "clamp(1.4rem,5.6cqw,4rem)",
              color: "rgba(14,10,6,0.95)",
              // Ellipsis after 2 lines — the paper is fixed-aspect.
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {eventName}
          </h2>

          {holderName ? (
            <p
              className="mt-3 italic"
              style={{
                fontFamily:
                  "var(--font-ticket-serif), 'Playfair Display', Georgia, serif",
                fontWeight: 400,
                opacity: 0.72,
                fontSize: "clamp(0.85rem,1.85cqw,1.25rem)"
              }}
            >
              <span
                aria-hidden
                className="font-mono not-italic"
                style={{
                  letterSpacing: "0.28em",
                  fontSize: "clamp(0.55rem,1.2cqw,0.78rem)",
                  opacity: 0.6,
                  marginRight: "0.6em",
                  textTransform: "uppercase"
                }}
              >
                Issued&nbsp;to ·
              </span>
              {holderName}
            </p>
          ) : null}
        </div>

        {/* Vermilion seal — anchored bottom-right of the body, partly
            overlapping the editorial block. Brand mark, not data. */}
        <div
          className="absolute"
          style={{ right: "0%", bottom: "16%", width: "30%" }}
        >
          <Seal />
        </div>

        {/* Foot rail */}
        <div className="absolute right-0 bottom-0 left-0">
          <div
            className="mb-3"
            style={{ height: 1, background: "rgba(14,10,6,0.28)" }}
          />
          <div className="flex items-baseline justify-between gap-4">
            <span
              className="font-mono uppercase"
              style={{
                letterSpacing: "0.28em",
                opacity: 0.72,
                fontSize: "clamp(0.6rem,1.4cqw,0.92rem)"
              }}
            >
              {footLeft || "입장권 · ADMISSION"}
            </span>
            <span
              className="font-mono"
              style={{
                opacity: 0.55,
                fontSize: "clamp(0.55rem,1.25cqw,0.82rem)"
              }}
            >
              hideawayseoul.com
            </span>
          </div>
        </div>
      </div>

      {/* ── Stub (right of perforation) ──────────────────────────────── */}
      <div
        className="absolute flex flex-col items-center justify-between text-center"
        style={{ inset: "6.5% 4% 6.5% 65%", color: "rgba(14,10,6,0.92)" }}
      >
        {/* Top label */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="font-mono font-semibold uppercase"
            style={{
              letterSpacing: "0.32em",
              opacity: 0.7,
              fontSize: "clamp(0.55rem,1.25cqw,0.82rem)"
            }}
          >
            Ticket
          </span>
          <span
            className="font-mono uppercase"
            style={{
              letterSpacing: "0.28em",
              opacity: 0.5,
              fontSize: "clamp(0.5rem,1.05cqw,0.7rem)"
            }}
          >
            №
          </span>
        </div>

        {/* Serial — the stub's anchor. Display serif in champagne foil. */}
        <span
          aria-label={`Ticket number ${num}`}
          style={{
            fontFamily:
              "var(--font-ticket-serif), 'Playfair Display', Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(2.2rem,6.4cqw,4.4rem)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            background:
              "linear-gradient(140deg, #c19355 0%, #f0d597 35%, #b78e4e 70%, #e6c585 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent"
          }}
        >
          {num}
        </span>

        {/* Stub foot */}
        <span
          className="font-mono font-semibold uppercase"
          style={{
            letterSpacing: "0.32em",
            opacity: 0.7,
            fontSize: "clamp(0.55rem,1.2cqw,0.78rem)"
          }}
        >
          Admit&nbsp;One
        </span>
      </div>
    </div>
  );
}

function Notch({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden
      className="absolute -translate-x-1/2 rounded-full"
      style={{
        left: "63%",
        width: "3.2%",
        height: "6.4%",
        top: position === "top" ? 0 : undefined,
        bottom: position === "bottom" ? 0 : undefined,
        transform:
          position === "top"
            ? "translate(-50%, -50%)"
            : "translate(-50%, 50%)",
        background: "var(--background, #0a0a0a)",
        boxShadow: "inset 0 0 0 1px rgba(14,10,6,0.22)"
      }}
    />
  );
}

/**
 * Vermilion seal — clean concentric rings + a serif "H" monogram.
 * No noise displacement, no destination-out distress dabs. The paper
 * grain layer above provides any aged feel; the seal itself is just
 * confident ink on paper.
 */
function Seal() {
  return (
    <div
      aria-hidden
      className="relative aspect-square"
      style={{ width: "100%", transform: "rotate(-4deg)" }}
    >
      {/* Soft red bloom underneath */}
      <div
        className="absolute -inset-[20%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(192,36,26,0.18) 35%, transparent 62%)"
        }}
      />
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "0.5cqw solid #c0241a",
          boxShadow: "inset 0 0 0 0.18cqw rgba(120, 18, 12, 0.5)"
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
