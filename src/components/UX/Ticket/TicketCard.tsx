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
  /**
   * Free-form payment instructions written by the host. Replaces the
   * old Toss button — payment is arranged off-platform and confirmed
   * manually now.
   */
  paymentInstructions?: string | null;
}

const formatDate = (d: string | null): string | null => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return d;
  }
};

const formatTime = (d: string | null): string | null => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return null;
  }
};

const padNumber = (n: number | null): string => {
  if (n === null || n === undefined) return "0000";
  return String(n).padStart(4, "0");
};

// Inline SVG noise — gives the paper a faint mechanical-press texture.
const NOISE_BG =
  'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 240 240%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22240%22 height=%22240%22 filter=%22url(%23n)%22 opacity=%220.45%22/></svg>")';

// Fixed paper palette — the ticket is intentionally NOT theme-adaptive. It
// reads as an artifact sitting on the page, not a UI surface.
const PAPER = "oklch(0.965 0.008 80)";
const PAPER_INK = "oklch(0.18 0.012 30)";
const PAPER_LINE = "oklch(0.18 0.012 30 / 0.18)";

const STATUS_TINT: Record<TicketStatus, string> = {
  pending: "oklch(0.55 0.16 70)",
  active: PAPER_INK,
  used: "oklch(0.55 0.01 30)",
  canceled: "oklch(0.55 0.2 30)"
};

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
  const date = formatDate(eventDate);
  const time = formatTime(eventDate);
  const num = padNumber(ticketNumber);

  return (
    <m.article
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.18, duration: 0.55 }}
      aria-label={`Ticket #${num} for ${eventName}`}
      className="relative select-none"
      style={{ color: PAPER_INK, width: "min(28rem, 100%)" }}
    >
      {/* Paper card */}
      <div
        className="relative overflow-hidden rounded-[3px]"
        style={{
          background: PAPER,
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.55), 0 8px 18px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)"
        }}
      >
        {/* Faint paper grain */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-multiply"
          style={{
            backgroundImage: NOISE_BG,
            backgroundSize: "240px 240px",
            opacity: 0.06
          }}
        />

        {/* Header */}
        <header className="relative px-7 pt-9 pb-7">
          <div>
            <span
              className="block font-mono text-[9px] uppercase"
              style={{ letterSpacing: "0.32em", opacity: 0.5 }}
            >
              Admit One
            </span>
            <span
              className="mt-1 block font-mono text-[11px]"
              style={{ letterSpacing: "0.18em" }}
            >
              No. {num}
            </span>
          </div>

          <h1
            className="mt-9 text-[1.9rem] leading-[1.04] font-light tracking-tight"
            style={{ wordBreak: "break-word" }}
          >
            {eventName}
          </h1>

          <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-1">
            <Field label="When">
              {date ?? "—"}
              {time ? <span className="ml-2 opacity-60">· {time}</span> : null}
            </Field>
            <Field label="Where">{eventLocation ?? "—"}</Field>
          </dl>
        </header>

        {/* Body: QR only — and only when the ticket is active. Status
            copy ("awaiting payment", "used", "canceled"), the price,
            and payment instructions all live in the page's metadata
            column now. The ticket is the ticket regardless of state. */}
        {status === "active" && checkInUrl ? (
          <>
            <Perforation />
            <section className="relative flex flex-col items-center px-7 pt-9 pb-9">
              <div
                className="rounded-[2px] p-3"
                style={{
                  background: "white",
                  boxShadow:
                    "inset 0 0 0 1px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6)"
                }}
              >
                <QRCodeSVG
                  value={checkInUrl}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1a1410"
                  includeMargin={false}
                />
              </div>
            </section>
          </>
        ) : null}

        <Perforation />

        {/* Footer / stub — Holder only. Status duplicated the page's
            metadata column. */}
        <footer className="relative px-7 py-5">
          <div>
            <span
              className="block font-mono text-[9px] uppercase"
              style={{ letterSpacing: "0.32em", opacity: 0.4 }}
            >
              Holder
            </span>
            <span className="mt-1 block text-sm tracking-tight">
              {holderName ?? "—"}
            </span>
          </div>
        </footer>

        {/* Decorative serial-number strip */}
        <div
          aria-hidden="true"
          className="relative px-7 pt-0 pb-4"
          style={{ opacity: 0.5 }}
        >
          <span
            className="block font-mono text-[8px]"
            style={{ letterSpacing: "0.5em" }}
          >
            {`HW · ${num} · ${(eventDate ?? "").slice(0, 10).replace(/-/g, "·") || "—"}`}
          </span>
        </div>

        {/* Stamps over the whole card */}
        {checkedIn ? (
          <Stamp label="Checked In" tone="green" rotate={-8} />
        ) : null}
        {status === "canceled" ? (
          <Stamp label="Void" tone="red" rotate={-12} large />
        ) : null}
      </div>

      {/* Cast shadow halo for paper depth on dark page */}
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

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <dt
        className="font-mono text-[9px] uppercase"
        style={{ letterSpacing: "0.32em", opacity: 0.4 }}
      >
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[11px]">{children}</dd>
    </div>
  );
}

function Perforation() {
  return (
    <div className="relative h-3" aria-hidden="true">
      {/* Side semicircle notches */}
      <span
        className="absolute top-1/2 -left-[7px] h-3.5 w-3.5 -translate-y-1/2 rounded-full"
        style={{
          background: "var(--ticket-page-bg, transparent)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)"
        }}
      />
      <span
        className="absolute top-1/2 -right-[7px] h-3.5 w-3.5 -translate-y-1/2 rounded-full"
        style={{
          background: "var(--ticket-page-bg, transparent)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)"
        }}
      />
      {/* Dotted center line */}
      <span
        className="absolute inset-x-4 top-1/2 -translate-y-1/2"
        style={{
          height: 2,
          backgroundImage:
            "radial-gradient(circle, oklch(0.18 0.012 30 / 0.35) 1px, transparent 1.5px)",
          backgroundSize: "8px 2px",
          backgroundRepeat: "repeat-x",
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
      ? "oklch(0.45 0.16 150 / 0.5)"
      : "oklch(0.55 0.2 30 / 0.5)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[42%] left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ transform: `translate(-50%,-50%) rotate(${rotate}deg)` }}
    >
      <div
        className="border-[3px] px-5 py-1.5"
        style={{ borderColor: color, color }}
      >
        <span
          className={`font-mono uppercase ${large ? "text-3xl" : "text-xl"} font-bold`}
          style={{ letterSpacing: "0.18em" }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
