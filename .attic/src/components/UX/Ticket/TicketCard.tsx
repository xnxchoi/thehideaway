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
   * Free-form payment instructions written by the host (bank transfer
   * details, contact). Replaces the old Toss button.
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
    const parsed = new Date(d);
    if (parsed.getHours() === 0 && parsed.getMinutes() === 0) return null;
    return parsed.toLocaleTimeString("en-US", {
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

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

// Inline SVG noise — gives the paper a faint mechanical-press texture.
const NOISE_BG =
  'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 240 240%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22240%22 height=%22240%22 filter=%22url(%23n)%22 opacity=%220.45%22/></svg>")';

// Fixed paper palette — the ticket is intentionally NOT theme-adaptive.
const PAPER = "oklch(0.965 0.008 80)";
const PAPER_INK = "oklch(0.18 0.012 30)";

const STATUS_TINT: Record<TicketStatus, string> = {
  pending: "oklch(0.55 0.16 70)",
  active: PAPER_INK,
  used: "oklch(0.55 0.01 30)",
  canceled: "oklch(0.55 0.2 30)"
};

/**
 * TicketCard — a single horizontal paper-and-ink ticket.
 *
 * Single panel, no body/stub combo, no vertical perforation. The
 * stub-and-body split was reading as kitsch on a PC page. Now: one
 * clean rectangle, header rail at top, content in the middle, foot
 * rail at the bottom.
 */
export function TicketCard({
  ticketNumber,
  status,
  paid,
  checkedIn,
  eventName,
  eventDate,
  eventLocation,
  holderName,
  checkInUrl,
  ticketPrice,
  paymentInstructions
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
      className="relative isolate w-full select-none"
      style={{ color: PAPER_INK, maxWidth: "min(56rem, 100%)" }}
    >
      {/* Paper card — single panel */}
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

        <div className="relative flex flex-col gap-10 p-9 sm:flex-row sm:items-stretch sm:gap-12 sm:p-12">
          {/* ── Body — event + meta + payment/status ────────────────── */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Top rail */}
            <header className="flex items-start justify-between gap-4">
              <div>
                <span
                  className="block font-mono text-[9px] uppercase"
                  style={{ letterSpacing: "0.32em", opacity: 0.5 }}
                >
                  Admit One · No. {num}
                </span>
                <span
                  className="mt-1 block font-mono text-[11px]"
                  style={{ letterSpacing: "0.18em", opacity: 0.7 }}
                >
                  The Hideaway · Seoul
                </span>
              </div>
              <StatusFlag status={status} paid={paid} checkedIn={checkedIn} />
            </header>

            {/* Event name */}
            <h1
              className="mt-8 text-[2rem] leading-[1.04] font-light tracking-tight sm:text-[2.4rem]"
              style={{ wordBreak: "break-word" }}
            >
              {eventName}
            </h1>

            {/* When / Where */}
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-1">
              <Field label="When">
                {date ?? "—"}
                {time ? (
                  <span className="ml-2 opacity-60">· {time}</span>
                ) : null}
              </Field>
              <Field label="Where">{eventLocation ?? "—"}</Field>
              {holderName ? <Field label="Holder">{holderName}</Field> : null}
            </dl>

            {/* Status copy / payment instructions */}
            {status === "pending" ? (
              <div className="mt-8">
                <p
                  className="font-light tracking-tight"
                  style={{ fontSize: "1.5rem", lineHeight: 1.1 }}
                >
                  {formatKRW(ticketPrice)}
                  <span
                    className="ml-3 font-mono text-[9px] uppercase"
                    style={{ letterSpacing: "0.32em", opacity: 0.45 }}
                  >
                    Awaiting payment
                  </span>
                </p>
                {paymentInstructions ? (
                  <p
                    className="mt-4 font-mono text-[11px] leading-relaxed whitespace-pre-line"
                    style={{ opacity: 0.78, maxWidth: "44ch" }}
                  >
                    {paymentInstructions}
                  </p>
                ) : (
                  <p
                    className="mt-4 font-mono text-[11px] leading-relaxed"
                    style={{ opacity: 0.65, maxWidth: "44ch" }}
                  >
                    The host will reach out with payment details. Your ticket
                    activates the moment we confirm receipt.
                  </p>
                )}
              </div>
            ) : status === "used" ? (
              <p
                className="mt-8 font-mono text-[11px] uppercase"
                style={{ letterSpacing: "0.18em", opacity: 0.45 }}
              >
                This ticket has been used
              </p>
            ) : status === "canceled" ? (
              <p
                className="mt-8 font-mono text-[11px] uppercase"
                style={{ letterSpacing: "0.18em", opacity: 0.45 }}
              >
                This ticket is canceled
              </p>
            ) : null}

            {/* Foot rail */}
            <div
              aria-hidden="true"
              className="mt-auto pt-8 font-mono text-[8px]"
              style={{ letterSpacing: "0.5em", opacity: 0.45 }}
            >
              {`HW · ${num} · ${(eventDate ?? "").slice(0, 10).replace(/-/g, "·") || "—"}`}
            </div>
          </div>

          {/* ── QR (active state only) — sits to the right of the body ── */}
          {status === "active" && checkInUrl ? (
            <div className="flex flex-col items-center justify-center gap-3 sm:items-end sm:justify-start">
              <div
                className="rounded-[2px] p-2.5"
                style={{
                  background: "white",
                  boxShadow:
                    "inset 0 0 0 1px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6)"
                }}
              >
                <QRCodeSVG
                  value={checkInUrl}
                  size={150}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1a1410"
                  includeMargin={false}
                />
              </div>
              <span
                className="font-mono text-[9px] uppercase"
                style={{ letterSpacing: "0.32em", opacity: 0.5 }}
              >
                Scan at the door
              </span>
            </div>
          ) : null}
        </div>

        {/* Stamps overlay the whole card */}
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

interface StatusFlagProps {
  status: TicketStatus;
  paid: boolean;
  checkedIn: boolean;
}

function StatusFlag({ status, paid, checkedIn }: StatusFlagProps) {
  const label = checkedIn
    ? "On site"
    : !paid && status === "pending"
      ? "Hold"
      : status;
  const tint = checkedIn
    ? "oklch(0.45 0.16 150)"
    : (STATUS_TINT[status] ?? PAPER_INK);
  return (
    <div
      className="rounded-full border px-3 py-1"
      style={{
        borderColor: tint,
        color: tint
      }}
    >
      <span
        className="font-mono text-[9px] uppercase"
        style={{ letterSpacing: "0.22em" }}
      >
        {label}
      </span>
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
      className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
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
