"use client";

// LazyMotion wraps the app at the provider level — top-level `motion.*`
// breaks tree-shaking. Use the `m.*` alias from motion/react-m.
import * as m from "motion/react-m";
import { QRCodeSVG } from "qrcode.react";

export type TicketStatus = "pending" | "active" | "used" | "canceled";

export interface TicketCardProps {
  ticketNumber: number | null;
  status: TicketStatus;
  paid: boolean;
  checkedIn: boolean;
  eventName: string;
  eventDate: string | null;
  eventLocation: string | null;
  holderName: string | null;
  /** URL encoded into the QR code; rendered when status === "active". */
  checkInUrl: string;
  ticketPrice: number;
  /** Free-form payment instructions (the page's metadata column owns this). */
  paymentInstructions?: string | null;
}

const padNumber = (n: number | null): string => {
  if (n === null || n === undefined) return "0000";
  return String(n).padStart(4, "0");
};

/**
 * Inline SVG noise — long-fibre paper grain (lower frequency, higher
 * contrast than the previous version, so the texture actually reads on
 * screen instead of disappearing as JPEG-style static).
 */
const NOISE_BG =
  'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 320%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.5%22 numOctaves=%223%22 stitchTiles=%22stitch%22/><feColorMatrix values=%220 0 0 0 0.18 0 0 0 0 0.13 0 0 0 0 0.09 0 0 0 0.55 0%22/></filter><rect width=%22320%22 height=%22320%22 filter=%22url(%23n)%22 opacity=%220.7%22/></svg>")';

const PAPER_INK = "oklch(0.18 0.012 30)";

const STATUS_TINT: Record<TicketStatus, string> = {
  pending: "oklch(0.55 0.16 70)",
  active: PAPER_INK,
  used: "oklch(0.55 0.01 30)",
  canceled: "oklch(0.55 0.2 30)"
};

/**
 * Hash a string into a small integer — used to derive deterministic
 * per-ticket personalisation (paper hue micro-shift). Same input always
 * yields the same output; output range is small so the variation never
 * drifts into "different colours".
 */
function hashSeed(s: string | number | null): number {
  const str = String(s ?? "0");
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Holder initials for the watermark sigil — up to 2 letters from the
 * holder name. Falls back to the ticket number's first two digits.
 */
function holderInitials(name: string | null, fallback: string): string {
  if (!name) return fallback.slice(0, 2);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback.slice(0, 2);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * TicketCard — landscape paper ticket with a single vertical perforation.
 *
 * Geometry follows the canonical admit-one / boarding-pass / cloakroom
 * form: body on the left (~70%), perforation column, stub on the right
 * (~30%). One tear line, not three. The previous portrait + two-
 * perforation silhouette read as an invitation card rather than a
 * ticket; landscape with vertical perforation is the form real-world
 * tickets actually take.
 *
 * Typography: Instrument Serif for editorial moments (event name, date,
 * holder, large serial), JetBrains Mono for labels and serials. System
 * fonts removed — every visitor sees the same artifact.
 *
 * Personalisation: paper hue micro-shifts deterministically by ticket
 * number (a stack of tickets reads as a stack of distinct objects); a
 * holder-initials sigil watermarks the body when there's no QR.
 */
export function TicketCard({
  ticketNumber,
  status,
  checkedIn,
  eventName,
  eventDate,
  eventLocation,
  holderName,
  checkInUrl
}: TicketCardProps) {
  const num = padNumber(ticketNumber);
  const seed = hashSeed(ticketNumber);
  const initials = holderInitials(holderName, num);

  // Per-ticket warm-cream hue micro-shift in OKLCH (chroma kept tiny so
  // the variation stays in "different sheets of bone stock" territory,
  // never crosses into chromatic accent).
  const paperHue = 60 + (seed % 40); // 60°–100°, warm/yellow neutral
  const paper = `oklch(0.965 0.012 ${paperHue})`;

  const date = eventDate ? new Date(eventDate) : null;
  const dateValid = date && !isNaN(date.getTime());
  const dayCaps = dateValid
    ? date.toLocaleString("en-US", { weekday: "short" }).toUpperCase()
    : "";
  const dayNum = dateValid ? String(date.getDate()).padStart(2, "0") : "—";
  const monthCaps = dateValid
    ? date.toLocaleString("en-US", { month: "short" }).toUpperCase()
    : "";
  const yearStr = dateValid ? String(date.getFullYear()) : "";
  const isMidnight =
    dateValid && date.getHours() === 0 && date.getMinutes() === 0;
  const timeStr =
    dateValid && !isMidnight
      ? date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit"
        })
      : "";

  return (
    <m.article
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
      aria-label={`Ticket #${num} for ${eventName}`}
      className="relative isolate w-full select-none"
      style={{
        color: PAPER_INK,
        maxWidth: "min(52rem, 100%)",
        // Establish a known "page background" so the perforation notches
        // can punch through cleanly. Without this, transparent notches
        // showed whatever happened to be behind, which on the dark page
        // made them invisible.
        ["--ticket-page-bg" as string]: "var(--background, #0a0a0a)"
      }}
    >
      {/* Paper card — landscape, body+stub via CSS grid */}
      <div
        className="relative grid overflow-hidden rounded-[3px]"
        style={{
          gridTemplateColumns: "minmax(0,1fr) auto minmax(13rem,0.45fr)",
          background: paper,
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.55), 0 8px 18px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)"
        }}
      >
        {/* Long-fibre paper grain — global overlay above grid columns */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
          style={{
            backgroundImage: NOISE_BG,
            backgroundSize: "320px 320px",
            opacity: 0.32
          }}
        />

        {/* ── Body (left column) ───────────────────────────────────── */}
        <div className="relative flex min-h-[18rem] flex-col p-7 sm:p-9">
          {/* Holder-initials watermark — visible everywhere but quietest
              behind the QR area. Acts as the body's typographic anchor
              and provides the "personalised" hit even on pending. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 bottom-0 select-none italic"
            style={{
              fontFamily:
                "var(--font-ticket-serif), 'Instrument Serif', 'Didot', Georgia, serif",
              fontSize: "clamp(8rem, 22cqw, 14rem)",
              lineHeight: 0.85,
              color: "rgba(14, 10, 6, 0.06)",
              letterSpacing: "-0.04em"
            }}
          >
            {initials}
          </span>

          {/* Top rail — brand masthead. "ADMIT ONE" is gone; the brand
              owns the masthead instead. */}
          <header className="relative flex items-start justify-between gap-6">
            <div>
              <span
                className="block font-medium uppercase"
                style={{
                  fontFamily:
                    "var(--font-ticket-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "clamp(0.7rem, 1.1cqw, 0.85rem)",
                  letterSpacing: "0.36em"
                }}
              >
                The&nbsp;Hideaway
              </span>
              <span
                className="mt-1 block uppercase"
                style={{
                  fontFamily:
                    "var(--font-ticket-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: "clamp(0.55rem, 0.85cqw, 0.7rem)",
                  letterSpacing: "0.32em",
                  opacity: 0.55
                }}
              >
                Member · 입장
              </span>
            </div>
            {/* Right-side meta — date stack, the typographic event */}
            {dateValid ? (
              <div className="text-right">
                <span
                  className="block font-medium uppercase"
                  style={{
                    fontFamily:
                      "var(--font-ticket-mono), ui-monospace, monospace",
                    fontSize: "clamp(0.55rem, 0.85cqw, 0.7rem)",
                    letterSpacing: "0.32em",
                    opacity: 0.55
                  }}
                >
                  {dayCaps}
                </span>
                <span
                  className="block leading-none"
                  style={{
                    fontFamily:
                      "var(--font-ticket-serif), 'Instrument Serif', Georgia, serif",
                    fontSize: "clamp(2.6rem, 5.4cqw, 4rem)"
                  }}
                >
                  {dayNum}
                </span>
                <span
                  className="mt-1 block uppercase"
                  style={{
                    fontFamily:
                      "var(--font-ticket-mono), ui-monospace, monospace",
                    fontSize: "clamp(0.55rem, 0.85cqw, 0.7rem)",
                    letterSpacing: "0.32em",
                    opacity: 0.6
                  }}
                >
                  {monthCaps} · {yearStr}
                </span>
              </div>
            ) : null}
          </header>

          {/* Hairline rule under the masthead */}
          <div
            className="mt-5"
            style={{ height: 1, background: "rgba(14,10,6,0.22)" }}
          />

          {/* Event name — display serif, the editorial centrepiece */}
          <h2
            className="relative mt-6"
            style={{
              fontFamily:
                "var(--font-ticket-serif), 'Instrument Serif', 'Didot', Georgia, serif",
              fontSize: "clamp(1.7rem, 3.6cqw, 2.6rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              wordBreak: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {eventName}
          </h2>

          {/* Foot block — venue + holder, two-up */}
          <div className="relative mt-auto grid grid-cols-2 gap-x-8 pt-8">
            <div>
              <span
                className="block uppercase"
                style={{
                  fontFamily:
                    "var(--font-ticket-mono), ui-monospace, monospace",
                  fontSize: "clamp(0.55rem, 0.85cqw, 0.68rem)",
                  letterSpacing: "0.32em",
                  opacity: 0.5
                }}
              >
                Where
              </span>
              <span
                className="mt-1 block"
                style={{
                  fontFamily:
                    "var(--font-ticket-serif), 'Instrument Serif', serif",
                  fontSize: "clamp(0.95rem, 1.6cqw, 1.15rem)",
                  lineHeight: 1.2
                }}
              >
                {eventLocation ?? "—"}
                {timeStr ? (
                  <span
                    className="ml-2 italic opacity-60"
                    style={{ fontSize: "0.85em" }}
                  >
                    · {timeStr}
                  </span>
                ) : null}
              </span>
            </div>
            <div>
              <span
                className="block uppercase"
                style={{
                  fontFamily:
                    "var(--font-ticket-mono), ui-monospace, monospace",
                  fontSize: "clamp(0.55rem, 0.85cqw, 0.68rem)",
                  letterSpacing: "0.32em",
                  opacity: 0.5
                }}
              >
                Holder
              </span>
              <span
                className="mt-1 block italic"
                style={{
                  fontFamily:
                    "var(--font-ticket-serif), 'Instrument Serif', serif",
                  fontSize: "clamp(1rem, 1.7cqw, 1.25rem)",
                  lineHeight: 1.2
                }}
              >
                {holderName ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Vertical perforation (middle column) ─────────────────── */}
        <VerticalPerforation />

        {/* ── Stub (right column) ──────────────────────────────────── */}
        <div className="relative flex flex-col items-center justify-between p-6 text-center sm:p-7">
          <div>
            <span
              className="block uppercase"
              style={{
                fontFamily:
                  "var(--font-ticket-mono), ui-monospace, monospace",
                fontSize: "clamp(0.55rem, 0.85cqw, 0.7rem)",
                letterSpacing: "0.32em",
                opacity: 0.55
              }}
            >
              Ticket
            </span>
            <span
              className="mt-1 block uppercase"
              style={{
                fontFamily:
                  "var(--font-ticket-mono), ui-monospace, monospace",
                fontSize: "clamp(0.5rem, 0.7cqw, 0.6rem)",
                letterSpacing: "0.32em",
                opacity: 0.4
              }}
            >
              №
            </span>
          </div>

          {/* Centre — large display-serif serial OR QR (active state).
              The serial IS the stub's editorial moment; QR replaces it
              when the ticket is live. */}
          {status === "active" && checkInUrl ? (
            <div
              className="rounded-[2px] p-2"
              style={{
                background: "white",
                boxShadow:
                  "inset 0 0 0 1px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6)"
              }}
            >
              <QRCodeSVG
                value={checkInUrl}
                size={120}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a1410"
                includeMargin={false}
              />
            </div>
          ) : (
            <span
              aria-label={`Ticket number ${num}`}
              className="leading-none"
              style={{
                fontFamily:
                  "var(--font-ticket-serif), 'Instrument Serif', 'Didot', Georgia, serif",
                fontSize: "clamp(2.8rem, 6cqw, 4.6rem)",
                letterSpacing: "-0.02em"
              }}
            >
              {num}
            </span>
          )}

          <span
            className="block"
            style={{
              fontFamily:
                "var(--font-ticket-mono), ui-monospace, monospace",
              fontSize: "clamp(0.5rem, 0.75cqw, 0.65rem)",
              letterSpacing: "0.4em",
              opacity: 0.45,
              textTransform: "uppercase"
            }}
          >
            HW · {num}
          </span>
        </div>

        {/* Stamps overlay the whole card */}
        {checkedIn ? (
          <Stamp label="Admitted" tone="green" rotate={-7} />
        ) : null}
        {status === "canceled" ? (
          <Stamp label="Void" tone="red" rotate={-11} large />
        ) : null}
      </div>

      {/* Cast shadow halo — paper depth on dark page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          filter: "blur(28px)",
          background: "rgba(0,0,0,0.45)",
          transform: "translateY(18px) scale(0.96)"
        }}
      />
    </m.article>
  );
}

/**
 * Vertical perforation column — single tear line between body and stub.
 * Two notch divots (top + bottom) that punch through using the parent's
 * --ticket-page-bg variable, so the punch-through reads on any page bg.
 */
function VerticalPerforation() {
  return (
    <div
      aria-hidden="true"
      className="relative w-3"
      style={{ minHeight: "100%" }}
    >
      {/* Top notch */}
      <span
        className="absolute -top-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full"
        style={{
          background: "var(--ticket-page-bg, #0a0a0a)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)"
        }}
      />
      {/* Bottom notch */}
      <span
        className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full"
        style={{
          background: "var(--ticket-page-bg, #0a0a0a)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)"
        }}
      />
      {/* Dotted vertical tear line */}
      <span
        className="absolute inset-y-4 left-1/2 -translate-x-1/2"
        style={{
          width: 2,
          backgroundImage:
            "radial-gradient(circle, oklch(0.18 0.012 30 / 0.4) 1px, transparent 1.5px)",
          backgroundSize: "2px 8px",
          backgroundRepeat: "repeat-y",
          backgroundPosition: "center"
        }}
      />
    </div>
  );
}

interface StampProps {
  label: string;
  tone: "green" | "red";
  rotate: number;
  large?: boolean;
}

function Stamp({ label, tone, rotate, large }: StampProps) {
  const color =
    tone === "green"
      ? "oklch(0.45 0.16 150 / 0.55)"
      : "oklch(0.55 0.2 30 / 0.55)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-[35%] z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ transform: `translate(-50%,-50%) rotate(${rotate}deg)` }}
    >
      <div
        className="border-[2.5px] px-5 py-1.5"
        style={{ borderColor: color, color }}
      >
        <span
          className={`uppercase ${large ? "text-3xl" : "text-xl"} font-semibold`}
          style={{
            letterSpacing: "0.12em",
            fontFamily:
              "var(--font-ticket-mono), ui-monospace, monospace"
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// Re-export for callers that previously read STATUS_TINT — kept to avoid
// breaking external imports.
export { STATUS_TINT };
