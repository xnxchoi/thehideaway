"use client";

import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface TicketPaperProps {
  /**
   * Serial number — printed on the stub as the only personalisation
   * on an otherwise constant brand artifact. Each ticket's paper looks
   * the same EXCEPT for this number.
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
 * TicketPaper — the brand artifact, paper-and-ink HTML/CSS.
 *
 * **Pure visual.** No event name, no date, no holder, no status. This
 * is one of two tracks on the detail page; the other track shows the
 * actual information as editorial typography. The only ticket-specific
 * personalisation here is the serial number on the stub — every other
 * mark is brand vocabulary that's identical across all tickets.
 *
 * Composition: bone paper + ink rules + vertical perforation + stub.
 * Top rail prints the wordmark. Centre carries the vermilion seal.
 * Stub carries the serial. Foot prints the URL + 입장권.
 */
export function TicketPaper({
  ticketNumber,
  className,
  style
}: TicketPaperProps) {
  const num = padNumber(ticketNumber);

  return (
    <div
      className={cn(
        "relative isolate aspect-[2/1] w-full select-none",
        className
      )}
      style={{
        // Container query lets every `cqw` unit inside size relative to
        // the artifact's own width.
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
      {/* fbm grain — ink-toned, low alpha */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full rounded-[3px] mix-blend-multiply"
        style={{ opacity: 0.5 }}
      >
        <filter id="ticket-paper-grain">
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
        <rect width="100%" height="100%" filter="url(#ticket-paper-grain)" />
      </svg>

      {/* Inner hairline frame */}
      <div
        aria-hidden
        className="absolute inset-[3.5%] rounded-[1px]"
        style={{ border: "1px solid rgba(14, 10, 6, 0.32)" }}
      />

      {/* Vertical perforation, ~63% across */}
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
      <Notch position="top" />
      <Notch position="bottom" />

      {/* ── Body (left of perforation) — brand vocabulary only ──────── */}
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

        {/* Vermilion seal — centred in the body */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Seal />
        </div>

        {/* Foot rail */}
        <div className="absolute right-0 bottom-0 left-0">
          <div
            className="mb-3"
            style={{ height: 1, background: "rgba(14,10,6,0.28)" }}
          />
          <div className="flex items-baseline justify-between">
            <span
              className="font-mono uppercase"
              style={{
                letterSpacing: "0.28em",
                opacity: 0.55,
                fontSize: "clamp(0.55rem,1.25cqw,0.82rem)"
              }}
            >
              hideawayseoul.com
            </span>
            <span
              style={{
                fontSize: "clamp(0.6rem,1.4cqw,0.95rem)",
                opacity: 0.7
              }}
            >
              입장권
            </span>
          </div>
        </div>
      </div>

      {/* ── Stub (right of perforation) — serial only ───────────────── */}
      <div
        className="absolute flex flex-col items-center justify-between text-center"
        style={{ inset: "6.5% 4% 6.5% 65%", color: "rgba(14,10,6,0.92)" }}
      >
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

        {/* Serial — champagne foil gradient text. The one personalisation. */}
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
 * Vermilion seal — clean concentric ring + serif "H" monogram.
 * No noise displacement, no distress dabs — paper grain above carries
 * any aged feel; the seal itself is just confident ink on paper.
 */
function Seal() {
  return (
    <div
      aria-hidden
      className="relative aspect-square"
      style={{ width: "32%", transform: "rotate(-4deg)" }}
    >
      <div
        className="absolute -inset-[20%] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(192,36,26,0.18) 35%, transparent 62%)"
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: "0.5cqw solid #c0241a",
          boxShadow: "inset 0 0 0 0.18cqw rgba(120, 18, 12, 0.5)"
        }}
      />
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
