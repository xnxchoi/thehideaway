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

/** Long-fibre paper grain — visible at low opacity, ink-toned. */
const NOISE_BG =
  'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 320%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.5%22 numOctaves=%223%22 stitchTiles=%22stitch%22/><feColorMatrix values=%220 0 0 0 0.18 0 0 0 0 0.13 0 0 0 0 0.09 0 0 0 0.55 0%22/></filter><rect width=%22320%22 height=%22320%22 filter=%22url(%23n)%22 opacity=%220.7%22/></svg>")';

const PAPER_INK = "oklch(0.18 0.012 30)";

// Font stacks. Display serif comes from next/font (variable on the
// page wrapper); mono is Inconsolata Variable, already loaded globally
// via src/styles/__rp_plate.scss.
const FONT_SERIF =
  "var(--font-ticket-serif), 'Instrument Serif', 'Didot', Georgia, serif";
const FONT_MONO =
  "'Inconsolata Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const STATUS_TINT: Record<TicketStatus, string> = {
  pending: "oklch(0.55 0.16 70)",
  active: PAPER_INK,
  used: "oklch(0.55 0.01 30)",
  canceled: "oklch(0.55 0.2 30)"
};

function hashSeed(s: string | number | null): number {
  const str = String(s ?? "0");
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

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
 * Body (left, ~70%) + perforation column + stub (right, ~30%).
 *
 * Post-check-in, the stub visually tears off: the stub group translates
 * to the right and rotates a few degrees, the perforation reveals a
 * jagged torn edge on the body side, and a soft cast shadow appears
 * under the lifted stub. The `Admitted` stamp lands on the body.
 *
 * Per-ticket personalisation: paper hue micro-shifts deterministically
 * by ticket number; holder-initials sigil watermarks the body.
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

  const paperHue = 60 + (seed % 40);
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
        ["--ticket-page-bg" as string]: "var(--background, #0a0a0a)"
      }}
    >
      {/* Paper card — landscape, body+perf+stub via CSS grid */}
      <div
        className="relative grid rounded-[3px]"
        style={{
          gridTemplateColumns: "minmax(0,1fr) auto minmax(13rem,0.45fr)"
        }}
      >
        {/* ── Body (left column) ───────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-l-[3px]"
          style={{
            background: paper,
            boxShadow:
              "0 30px 60px -20px rgba(0,0,0,0.55), 0 8px 18px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)",
            // Torn-edge clip on the right side, only when checkedIn —
            // this is the visual "rip" on the body side of the perforation.
            clipPath: checkedIn ? TORN_EDGE_RIGHT : "none"
          }}
        >
          {/* Long-fibre paper grain */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
            style={{
              backgroundImage: NOISE_BG,
              backgroundSize: "320px 320px",
              opacity: 0.32
            }}
          />

          <div className="relative flex min-h-[19rem] flex-col p-7 sm:p-9">
            {/* Holder-initials watermark */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 bottom-0 italic select-none"
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "clamp(8rem, 22cqw, 14rem)",
                lineHeight: 0.85,
                color: "rgba(14, 10, 6, 0.06)",
                letterSpacing: "-0.04em"
              }}
            >
              {initials}
            </span>

            {/* Top rail — brand masthead + date stack */}
            <header className="relative flex items-start justify-between gap-6">
              <div>
                <span
                  className="block font-semibold uppercase"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "clamp(0.78rem, 1.25cqw, 0.95rem)",
                    letterSpacing: "0.36em"
                  }}
                >
                  The&nbsp;Hideaway
                </span>
                <span
                  className="mt-1.5 block uppercase"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "clamp(0.65rem, 1cqw, 0.78rem)",
                    letterSpacing: "0.32em",
                    opacity: 0.62
                  }}
                >
                  Member · 입장
                </span>
              </div>
              {dateValid ? (
                <div className="text-right">
                  <span
                    className="block font-semibold uppercase"
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: "clamp(0.65rem, 1cqw, 0.78rem)",
                      letterSpacing: "0.32em",
                      opacity: 0.62
                    }}
                  >
                    {dayCaps}
                  </span>
                  <span
                    className="block leading-none"
                    style={{
                      fontFamily: FONT_SERIF,
                      fontSize: "clamp(2.8rem, 5.6cqw, 4.2rem)"
                    }}
                  >
                    {dayNum}
                  </span>
                  <span
                    className="mt-1.5 block uppercase"
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: "clamp(0.65rem, 1cqw, 0.78rem)",
                      letterSpacing: "0.32em",
                      opacity: 0.7
                    }}
                  >
                    {monthCaps} · {yearStr}
                  </span>
                </div>
              ) : null}
            </header>

            <div
              className="mt-5"
              style={{ height: 1, background: "rgba(14,10,6,0.28)" }}
            />

            {/* Event name */}
            <h2
              className="relative mt-6"
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "clamp(1.9rem, 4cqw, 2.9rem)",
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

            {/* Foot block — venue + holder, bumped legibility */}
            <div className="relative mt-auto grid grid-cols-2 gap-x-8 pt-8">
              <div>
                <span
                  className="block uppercase"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "clamp(0.65rem, 1cqw, 0.78rem)",
                    letterSpacing: "0.32em",
                    opacity: 0.6
                  }}
                >
                  Where
                </span>
                <span
                  className="mt-1.5 block"
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: "clamp(1.15rem, 1.95cqw, 1.4rem)",
                    lineHeight: 1.2
                  }}
                >
                  {eventLocation ?? "—"}
                  {timeStr ? (
                    <span
                      className="ml-2 italic opacity-60"
                      style={{ fontSize: "0.78em" }}
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
                    fontFamily: FONT_MONO,
                    fontSize: "clamp(0.65rem, 1cqw, 0.78rem)",
                    letterSpacing: "0.32em",
                    opacity: 0.6
                  }}
                >
                  Holder
                </span>
                <span
                  className="mt-1.5 block italic"
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: "clamp(1.2rem, 2.1cqw, 1.5rem)",
                    lineHeight: 1.2
                  }}
                >
                  {holderName ?? "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Admitted stamp — only on the body, only when checkedIn.
              Sits over the body content rather than across the seam,
              because the stub has visually torn away. */}
          {checkedIn ? (
            <Stamp label="Admitted" tone="green" rotate={-7} />
          ) : null}
        </div>

        {/* ── Vertical perforation column ──────────────────────────── */}
        <VerticalPerforation torn={checkedIn} />

        {/* ── Stub (right column) ──────────────────────────────────── */}
        {/* Wrapped in m.div so it can translate + rotate when checkedIn —
            the rip animation. Also gets a torn-edge clip on its left
            side so the perforation seam looks ripped, not cut. */}
        <m.div
          animate={
            checkedIn
              ? { x: 18, rotate: 2.4, y: 4 }
              : { x: 0, rotate: 0, y: 0 }
          }
          transition={{ type: "spring", bounce: 0.32, duration: 0.7 }}
          className="relative overflow-hidden rounded-r-[3px]"
          style={{
            background: paper,
            boxShadow: checkedIn
              ? "0 22px 42px -14px rgba(0,0,0,0.6), 0 6px 14px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)"
              : "0 30px 60px -20px rgba(0,0,0,0.55), 0 8px 18px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)",
            clipPath: checkedIn ? TORN_EDGE_LEFT : "none",
            transformOrigin: "left center"
          }}
        >
          {/* Grain */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
            style={{
              backgroundImage: NOISE_BG,
              backgroundSize: "320px 320px",
              opacity: 0.32
            }}
          />

          <div className="relative flex h-full flex-col items-center justify-between p-6 text-center sm:p-7">
            <div>
              <span
                className="block uppercase"
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "clamp(0.7rem, 1.05cqw, 0.85rem)",
                  letterSpacing: "0.32em",
                  opacity: 0.62
                }}
              >
                Ticket
              </span>
              <span
                className="mt-1 block uppercase"
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "clamp(0.6rem, 0.85cqw, 0.7rem)",
                  letterSpacing: "0.32em",
                  opacity: 0.45
                }}
              >
                №
              </span>
            </div>

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
                  fontFamily: FONT_SERIF,
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
                fontFamily: FONT_MONO,
                fontSize: "clamp(0.6rem, 0.9cqw, 0.74rem)",
                letterSpacing: "0.4em",
                opacity: 0.55,
                textTransform: "uppercase"
              }}
            >
              HW · {num}
            </span>
          </div>

          {/* Void stamp lands on the stub */}
          {status === "canceled" ? (
            <Stamp label="Void" tone="red" rotate={-11} large />
          ) : null}
        </m.div>
      </div>
    </m.article>
  );
}

// SVG path data for torn-paper edges. Used as clip-path values on body
// (right side torn) and stub (left side torn) when the ticket has been
// checked in, so the perforation seam reads as ripped rather than cut.
// Coordinates are in `polygon()` percentages.
const TORN_EDGE_RIGHT =
  "polygon(0% 0%, 100% 0%, 99% 4%, 100% 9%, 98% 14%, 100% 20%, 99% 26%, 100% 31%, 98% 37%, 100% 43%, 99% 49%, 100% 55%, 98% 61%, 100% 66%, 99% 72%, 100% 78%, 98% 84%, 100% 90%, 99% 96%, 100% 100%, 0% 100%)";

const TORN_EDGE_LEFT =
  "polygon(1% 0%, 100% 0%, 100% 100%, 1% 100%, 2% 96%, 0% 90%, 2% 84%, 0% 78%, 1% 72%, 0% 66%, 2% 61%, 0% 55%, 1% 49%, 0% 43%, 2% 37%, 0% 31%, 1% 26%, 0% 20%, 2% 14%, 0% 9%, 1% 4%)";

/**
 * Vertical perforation column. Pre-rip: a dotted vertical tear line
 * with two notch divots top + bottom. Post-rip: dots fade out and the
 * notches deepen/expand slightly, reading as a torn seam.
 */
function VerticalPerforation({ torn }: { torn: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="relative w-3"
      style={{ minHeight: "100%" }}
    >
      <span
        className="absolute -top-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full transition-all duration-500"
        style={{
          background: "var(--ticket-page-bg, #0a0a0a)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
          transform: torn
            ? "translate(-50%, -45%) scale(1.15)"
            : "translate(-50%, -50%) scale(1)"
        }}
      />
      <span
        className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full transition-all duration-500"
        style={{
          background: "var(--ticket-page-bg, #0a0a0a)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
          transform: torn
            ? "translate(-50%, 45%) scale(1.15)"
            : "translate(-50%, 50%) scale(1)"
        }}
      />
      <span
        className="absolute inset-y-4 left-1/2 -translate-x-1/2 transition-opacity duration-500"
        style={{
          width: 2,
          opacity: torn ? 0 : 1,
          backgroundImage:
            "radial-gradient(circle, oklch(0.18 0.012 30 / 0.45) 1px, transparent 1.5px)",
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
      className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
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
            fontFamily: FONT_MONO
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export { STATUS_TINT };
