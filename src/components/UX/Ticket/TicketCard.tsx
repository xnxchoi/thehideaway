"use client";

// LazyMotion wraps the app at the provider level — top-level `motion.*`
// breaks tree-shaking. Use the `m.*` alias from motion/react-m.
import type { CSSProperties } from "react";
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
  finish?: "paper" | "metallic";
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

type TicketSurface = {
  bodyBackground: string;
  bodyShadow: string;
  stubBackground: string;
  stubShadow: string;
};

function getTicketSurface({
  finish,
  paper,
  seed,
  checkedIn
}: {
  finish: TicketCardProps["finish"];
  paper: string;
  seed: number;
  checkedIn: boolean;
}): TicketSurface {
  if (finish !== "metallic") {
    return {
      bodyBackground: paper,
      bodyShadow:
        "0 30px 60px -20px rgba(0,0,0,0.55), 0 8px 18px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)",
      stubBackground: paper,
      stubShadow:
        "0 30px 60px -20px rgba(0,0,0,0.55), 0 8px 18px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)"
    };
  }

  const warmStop = 44 + (seed % 18);
  const coolStop = 235 + (seed % 26);
  const bodyBackground = [
    `radial-gradient(circle at 18% 12%, oklch(0.92 0.075 ${warmStop} / 0.92), transparent 32%)`,
    `radial-gradient(circle at 88% 8%, oklch(0.72 0.07 ${coolStop} / 0.82), transparent 36%)`,
    "linear-gradient(118deg, oklch(0.42 0.028 252) 0%, oklch(0.74 0.048 72) 22%, oklch(0.93 0.034 90) 38%, oklch(0.62 0.045 248) 55%, oklch(0.88 0.052 54) 76%, oklch(0.36 0.026 254) 100%)",
    "repeating-linear-gradient(104deg, oklch(1 0 0 / 0.13) 0 1px, transparent 1px 7px)"
  ].join(", ");
  const stubBackground = [
    `radial-gradient(circle at 72% 18%, oklch(0.95 0.07 ${warmStop} / 0.8), transparent 38%)`,
    "linear-gradient(155deg, oklch(0.34 0.028 252), oklch(0.86 0.045 70) 42%, oklch(0.5 0.038 246) 72%, oklch(0.92 0.055 58))",
    "repeating-linear-gradient(96deg, oklch(1 0 0 / 0.16) 0 1px, transparent 1px 6px)"
  ].join(", ");
  const bodyShadow = checkedIn
    ? "0 30px 64px -24px rgba(0,0,0,0.66), 0 0 0 1px oklch(0.98 0.03 80 / 0.22)"
    : "0 38px 86px -28px rgba(0,0,0,0.76), 0 16px 34px -26px oklch(0.62 0.08 255 / 0.65), 0 0 0 1px oklch(0.98 0.03 80 / 0.2), inset 0 1px 0 oklch(1 0 0 / 0.45)";

  return {
    bodyBackground,
    bodyShadow,
    stubBackground,
    stubShadow:
      "0 38px 86px -28px rgba(0,0,0,0.72), 0 16px 34px -26px oklch(0.72 0.09 54 / 0.5), 0 0 0 1px oklch(0.98 0.03 80 / 0.2), inset 0 1px 0 oklch(1 0 0 / 0.42)"
  };
}

function MetallicOverlays({
  seed,
  compact = false
}: {
  seed: number;
  compact?: boolean;
}) {
  return (
    <>
      <span
        aria-hidden
        className="ticket-metal-sweep pointer-events-none absolute inset-0 z-[8]"
        style={
          {
            ["--ticket-metal-delay" as string]: `${-(seed % 9) * 0.4}s`,
            opacity: compact ? 0.44 : 0.52
          } as CSSProperties
        }
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[9] mix-blend-overlay"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, oklch(1 0 0 / 0.2) 18%, transparent 31%, oklch(0.82 0.11 55 / 0.18) 48%, transparent 62%, oklch(0.62 0.09 255 / 0.16) 78%, transparent 100%)",
          opacity: compact ? 0.34 : 0.44
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[9]"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 0 34%, oklch(1 0 0 / 0.3) 35%, transparent 36% 100%)",
          backgroundSize: compact ? "98px 100%" : "132px 100%",
          opacity: compact ? 0.16 : 0.2
        }}
      />
    </>
  );
}

function FoilChip({ label, tone }: { label: string; tone: "warm" | "cool" }) {
  const background =
    tone === "warm"
      ? "linear-gradient(110deg, oklch(0.8 0.06 55), oklch(1 0.025 92), oklch(0.66 0.08 42))"
      : "linear-gradient(110deg, oklch(0.62 0.06 250), oklch(0.95 0.024 92), oklch(0.56 0.08 222))";
  return (
    <span
      className="inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[8px] font-semibold tracking-[0.22em] uppercase"
      style={{
        background,
        color: "oklch(0.15 0.016 250)",
        boxShadow:
          "inset 0 1px 0 oklch(1 0 0 / 0.5), inset 0 -1px 0 rgba(0,0,0,0.16), 0 8px 18px -14px rgba(0,0,0,0.72)"
      }}
    >
      {label}
    </span>
  );
}

function MetallicStyles() {
  return (
    <style>{`
      .ticket-metal-sweep {
        background:
          linear-gradient(
            112deg,
            transparent 0%,
            transparent 30%,
            oklch(1 0 0 / 0.22) 42%,
            oklch(0.96 0.06 82 / 0.48) 48%,
            oklch(0.55 0.08 255 / 0.2) 56%,
            transparent 70%,
            transparent 100%
          );
        transform: translateX(-54%) skewX(-10deg);
        animation: ticketMetalSweep 5.8s cubic-bezier(0.19, 1, 0.22, 1) infinite;
        animation-delay: var(--ticket-metal-delay, 0s);
        mix-blend-mode: screen;
      }

      .group\\/ticket:hover .ticket-metal-sweep {
        animation-duration: 3.2s;
      }

      @media (prefers-reduced-motion: reduce) {
        .ticket-metal-sweep {
          animation: none;
          transform: translateX(8%) skewX(-10deg);
        }
      }

      @keyframes ticketMetalSweep {
        0%, 42% {
          transform: translateX(-64%) skewX(-10deg);
        }
        72%, 100% {
          transform: translateX(72%) skewX(-10deg);
        }
      }
    `}</style>
  );
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
  checkInUrl,
  finish = "paper"
}: TicketCardProps) {
  const num = padNumber(ticketNumber);
  const seed = hashSeed(ticketNumber);
  const initials = holderInitials(holderName, num);

  const paperHue = 60 + (seed % 40);
  const paper = `oklch(0.965 0.012 ${paperHue})`;
  const isMetallic = finish === "metallic";
  const surface = getTicketSurface({ finish, paper, seed, checkedIn });
  const inkColor = isMetallic ? "oklch(0.15 0.018 250)" : PAPER_INK;

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
      className="group/ticket [container-type:inline-size] relative isolate w-full select-none"
      style={{
        color: inkColor,
        maxWidth: "min(52rem, 100%)",
        ["--ticket-page-bg" as string]: "var(--background, #0a0a0a)"
      }}
    >
      {/* Paper card — landscape, body+stub touch directly. The
          perforation is drawn INSIDE the body at its right edge (see
          PerforationLine below) so it inherits the body's elevation
          and shadow. Earlier the perforation lived in its own grid
          column with no background/shadow, which made it visually sit
          on the page floor while the body and stub floated above. */}
      <div
        className="relative grid rounded-[3px]"
        style={{
          gridTemplateColumns: "minmax(0,1fr) minmax(13rem,0.45fr)"
        }}
      >
        {/* ── Body (left column) ───────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-l-[3px]"
          style={{
            background: surface.bodyBackground,
            boxShadow: surface.bodyShadow,
            // Torn-edge clip on the right side, only when checkedIn —
            // this is the visual "rip" on the body side of the perforation.
            clipPath: checkedIn ? TORN_EDGE_RIGHT : "none"
          }}
        >
          {isMetallic ? <MetallicOverlays seed={seed} /> : null}

          {/* Long-fibre paper grain */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
            style={{
              backgroundImage: NOISE_BG,
              backgroundSize: "320px 320px",
              opacity: isMetallic ? 0.18 : 0.32
            }}
          />

          {/* Dimple bites — anchored to the body's right edge so they
              stay put when the stub tears off. */}
          <Dimple side="right" edge="top" />
          <Dimple side="right" edge="bottom" />

          {/* Perforation tear-line — drawn INSIDE the body at its right
              edge so it shares the body's paper substrate and shadow,
              not floating in a no-shadow gutter on the page. */}
          <PerforationLine torn={checkedIn} />

          <div className="relative flex min-h-[19rem] flex-col p-7 sm:p-9">
            {/* Holder-initials watermark */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 bottom-0 italic select-none"
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "clamp(8rem, 22cqw, 14rem)",
                lineHeight: 0.85,
                color: isMetallic
                  ? "oklch(0.96 0.035 84 / 0.16)"
                  : "rgba(14, 10, 6, 0.06)",
                letterSpacing: isMetallic ? "0" : "-0.04em",
                textShadow: isMetallic
                  ? "0 1px 0 rgba(255,255,255,0.18), 0 -1px 0 rgba(0,0,0,0.18)"
                  : "none"
              }}
            >
              {initials}
            </span>

            {/* Top rail — brand masthead + date stack.
                Single-line wordmark — the "Member · 입장" sub-label was
                semantically incoherent ("member" / "enter" don't match
                in tone). Time moved into the date stack. */}
            <header className="relative flex items-start justify-between gap-6">
              <div className="grid gap-3">
                <span
                  className="block font-semibold uppercase"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "clamp(0.85rem, 1.4cqw, 1.05rem)",
                    letterSpacing: "0.36em",
                    color: isMetallic ? "oklch(0.98 0.035 88)" : undefined,
                    textShadow: isMetallic
                      ? "0 1px 0 rgba(0,0,0,0.26), 0 0 22px oklch(0.78 0.1 54 / 0.32)"
                      : undefined
                  }}
                >
                  The&nbsp;Hideaway
                </span>
                {isMetallic ? (
                  <FoilChip label="Catalyst edition" tone="warm" />
                ) : null}
              </div>
              {dateValid ? (
                <div className="text-right">
                  <span
                    className="block font-semibold uppercase"
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: "clamp(0.7rem, 1.05cqw, 0.82rem)",
                      letterSpacing: "0.32em",
                      opacity: isMetallic ? 0.72 : 0.6
                    }}
                  >
                    {dayCaps}
                  </span>
                  <span
                    className="block leading-none"
                    style={{
                      fontFamily: FONT_SERIF,
                      fontSize: "clamp(3rem, 6cqw, 4.6rem)",
                      color: isMetallic ? "oklch(0.98 0.035 88)" : undefined,
                      textShadow: isMetallic
                        ? "0 1px 0 rgba(255,255,255,0.28), 0 -1px 0 rgba(0,0,0,0.28), 0 0 24px oklch(0.77 0.12 55 / 0.3)"
                        : undefined
                    }}
                  >
                    {dayNum}
                  </span>
                  <span
                    className="mt-1.5 block uppercase"
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: "clamp(0.7rem, 1.05cqw, 0.82rem)",
                      letterSpacing: "0.32em",
                      opacity: isMetallic ? 0.78 : 0.7
                    }}
                  >
                    {monthCaps} · {yearStr}
                    {timeStr ? (
                      <span className="ml-2 opacity-80">· {timeStr}</span>
                    ) : null}
                  </span>
                </div>
              ) : null}
            </header>

            <div
              className="mt-5"
              style={{
                height: 1,
                background: isMetallic
                  ? "linear-gradient(90deg, transparent, oklch(0.9 0.05 78 / 0.62), oklch(0.65 0.09 255 / 0.38), transparent)"
                  : "rgba(14,10,6,0.28)"
              }}
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
                overflow: "hidden",
                color: isMetallic ? "oklch(0.98 0.035 88)" : undefined,
                textShadow: isMetallic
                  ? "0 1px 0 rgba(255,255,255,0.25), 0 18px 34px rgba(0,0,0,0.24)"
                  : undefined
              }}
            >
              {eventName}
            </h2>

            {isMetallic ? (
              <div className="relative mt-5 flex flex-wrap gap-2">
                <FoilChip label="Night entry" tone="cool" />
                <FoilChip label={`No. ${num}`} tone="warm" />
              </div>
            ) : null}

            {/* Foot block — venue + holder. Time lives in the date
                stack at top-right; "Where" is just the venue. */}
            <div className="relative mt-auto grid grid-cols-2 gap-x-8 pt-8">
              <div>
                <span
                  className="block uppercase"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "clamp(0.7rem, 1.05cqw, 0.82rem)",
                    letterSpacing: "0.32em",
                    opacity: isMetallic ? 0.68 : 0.6
                  }}
                >
                  Where
                </span>
                <span
                  className="mt-1.5 block"
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: "clamp(1.4rem, 2.4cqw, 1.7rem)",
                    lineHeight: 1.2,
                    color: isMetallic ? "oklch(0.97 0.024 84)" : undefined
                  }}
                >
                  {eventLocation ?? "—"}
                </span>
              </div>
              <div>
                <span
                  className="block uppercase"
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "clamp(0.7rem, 1.05cqw, 0.82rem)",
                    letterSpacing: "0.32em",
                    opacity: isMetallic ? 0.68 : 0.6
                  }}
                >
                  Holder
                </span>
                <span
                  className="mt-1.5 block italic"
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: "clamp(1.5rem, 2.6cqw, 1.85rem)",
                    lineHeight: 1.2,
                    color: isMetallic ? "oklch(0.97 0.024 84)" : undefined
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

        {/* ── Stub (right column) ──────────────────────────────────── */}
        {/* Wrapped in m.div so it can translate + rotate when checkedIn —
            the rip animation. Also gets a torn-edge clip on its left
            side so the perforation seam looks ripped, not cut. */}
        <m.div
          animate={
            checkedIn ? { x: 18, rotate: 2.4, y: 4 } : { x: 0, rotate: 0, y: 0 }
          }
          transition={{ type: "spring", bounce: 0.32, duration: 0.7 }}
          className="relative overflow-hidden rounded-r-[3px]"
          style={{
            background: surface.stubBackground,
            boxShadow: checkedIn
              ? "0 22px 42px -14px rgba(0,0,0,0.6), 0 6px 14px -4px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)"
              : surface.stubShadow,
            clipPath: checkedIn ? TORN_EDGE_LEFT : "none",
            transformOrigin: "left center"
          }}
        >
          {isMetallic ? <MetallicOverlays seed={seed + 17} compact /> : null}

          {/* Grain */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
            style={{
              backgroundImage: NOISE_BG,
              backgroundSize: "320px 320px",
              opacity: isMetallic ? 0.14 : 0.32
            }}
          />

          {/* Dimple bites — anchored to the stub's left edge so they
              ride along when the stub tears off. */}
          <Dimple side="left" edge="top" />
          <Dimple side="left" edge="bottom" />

          <div className="relative flex h-full flex-col items-center justify-between p-6 text-center sm:p-7">
            {/* Top — combined "TICKET No." label, readable */}
            <span
              className="block uppercase"
              style={{
                fontFamily: FONT_MONO,
                fontSize: "clamp(0.78rem, 1.2cqw, 0.95rem)",
                letterSpacing: "0.32em",
                opacity: isMetallic ? 0.78 : 0.7,
                color: isMetallic ? "oklch(0.98 0.035 88)" : undefined,
                textShadow: isMetallic ? "0 1px 0 rgba(0,0,0,0.28)" : undefined
              }}
            >
              Ticket No.
            </span>

            {/* Middle — QR (active) or modest serial (otherwise).
                Serial bumped DOWN from clamp(2.8–4.6rem) to (2–3rem)
                so the number isn't shouting on the stub. */}
            {status === "active" && checkInUrl ? (
              <div
                className="relative rounded-[2px] p-2"
                style={{
                  background: "white",
                  boxShadow:
                    "inset 0 0 0 1px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6), 0 14px 28px -16px rgba(0,0,0,0.68)"
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
                  fontSize: "clamp(2.2rem, 4.2cqw, 3.2rem)",
                  letterSpacing: isMetallic ? "0" : "-0.02em",
                  color: isMetallic ? "oklch(0.98 0.035 88)" : undefined,
                  textShadow: isMetallic
                    ? "0 1px 0 rgba(255,255,255,0.24), 0 -1px 0 rgba(0,0,0,0.22)"
                    : undefined
                }}
              >
                {num}
              </span>
            )}

            {/* Bottom — date stamp in mono caps. Replaces the
                'HW · 0004' line (the brand isn't abbreviated, and the
                serial was redundant with the number above). */}
            <span
              className="block"
              style={{
                fontFamily: FONT_MONO,
                fontSize: "clamp(0.65rem, 0.95cqw, 0.78rem)",
                letterSpacing: "0.32em",
                opacity: isMetallic ? 0.68 : 0.55,
                textTransform: "uppercase"
              }}
            >
              {dateValid
                ? `${dayNum} · ${monthCaps} · ${yearStr.slice(-2)}`
                : `№ ${num}`}
            </span>
          </div>

          {/* Void stamp lands on the stub */}
          {status === "canceled" ? (
            <Stamp label="Void" tone="red" rotate={-11} large />
          ) : null}
        </m.div>
      </div>
      {isMetallic ? <MetallicStyles /> : null}
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
 * Dotted tear-line drawn INSIDE the body at its right edge — the
 * perforation that separates body from stub.
 *
 * Lives inside the body (not a separate grid column) so it inherits
 * the body's paper background and box-shadow elevation. Earlier the
 * perforation lived in its own gutter column with no shadow, which
 * made it visually sit on the page floor while the body and stub
 * floated above with their own shadows.
 *
 * Pre-rip: dots visible. Post-rip: fades to 0 and the body's torn
 * clip-path takes over the visual job of "this edge has been torn".
 */
function PerforationLine({ torn }: { torn: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-4 right-1.5 bottom-4 transition-opacity duration-500"
      style={{
        width: 2,
        opacity: torn ? 0 : 1,
        backgroundImage:
          "radial-gradient(circle, oklch(0.18 0.012 30 / 0.45) 1px, transparent 1.5px)",
        backgroundSize: "2px 8px",
        backgroundRepeat: "repeat-y",
        backgroundPosition: "center",
        zIndex: 12
      }}
    />
  );
}

/**
 * Half-circle dimple bite — cut into the inner edge of the body or
 * stub at the top or bottom. Sits inside the parent (which has
 * overflow-hidden), filled with the page-bg colour, half-overlapping
 * the edge so the visible half reads as a punched-out semicircle.
 *
 * Positioned `top-0` or `bottom-0` with `translate(-50%, -50%)` (or
 * `+50%` for bottom) so the dimple's centre lands exactly on the card
 * edge: half the circle is "inside" (clipped by overflow-hidden, but
 * filled with page-bg → reads as a cut) and the other half would be
 * outside the card (not rendered, since it's clipped by overflow).
 *
 * The result is a clean half-circle bite from the corner. When the
 * piece (body or stub) translates, its dimples move with it.
 */
function Dimple({
  side,
  edge
}: {
  /** Which inner side of the piece: "right" (body) or "left" (stub) */
  side: "right" | "left";
  /** Which edge of the piece: "top" or "bottom" */
  edge: "top" | "bottom";
}) {
  const horizPos = side === "right" ? { right: 0 } : { left: 0 };
  const vertPos = edge === "top" ? { top: 0 } : { bottom: 0 };
  const translate = `${side === "right" ? "translate(50%," : "translate(-50%,"} ${edge === "top" ? "-50%" : "50%"})`;
  return (
    <span
      aria-hidden
      className="absolute h-3.5 w-3.5 rounded-full"
      style={{
        ...horizPos,
        ...vertPos,
        background: "var(--ticket-page-bg, #0a0a0a)",
        transform: translate,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
        zIndex: 11
      }}
    />
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
