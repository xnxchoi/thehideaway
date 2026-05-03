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
   * details, contact, etc.). Replaces the old Toss button — payment
   * is arranged off-platform and confirmed manually.
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

// Fixed paper palette — the ticket reads as an artifact, not a UI surface.
const PAPER = "oklch(0.965 0.008 80)";
const PAPER_INK = "oklch(0.18 0.012 30)";

const STATUS_TINT: Record<TicketStatus, string> = {
  pending: "oklch(0.55 0.16 70)",
  active: PAPER_INK,
  used: "oklch(0.55 0.01 30)",
  canceled: "oklch(0.55 0.2 30)"
};

/**
 * TicketCard — landscape paper-and-ink ticket.
 *
 * Layout: body (left ~63%) + vertical perforation + stub (right ~37%).
 * The previous portrait card looked like a phone-shaped artifact in the
 * middle of a desktop page; landscape is the natural form for boarding
 * passes, concert stubs, and museum tickets and uses PC width.
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
      {/* Paper card */}
      <div
        className="relative grid overflow-hidden rounded-[3px]"
        style={{
          gridTemplateColumns: "minmax(0,1.7fr) auto minmax(0,1fr)",
          background: PAPER,
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.55), 0 8px 18px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)"
        }}
      >
        {/* Faint paper grain — global overlay above grid columns */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 mix-blend-multiply"
          style={{
            backgroundImage: NOISE_BG,
            backgroundSize: "240px 240px",
            opacity: 0.06
          }}
        />

        {/* ── Body (left column) ───────────────────────────────────── */}
        <div className="relative flex min-h-[19rem] flex-col p-7 sm:p-9">
          {/* Top rail */}
          <header className="flex items-start justify-between gap-4">
            <div>
              <span
                className="block font-mono text-[9px] uppercase"
                style={{ letterSpacing: "0.32em", opacity: 0.5 }}
              >
                Admit One
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

          {/* Event name — the editorial anchor */}
          <h1
            className="mt-8 text-[2rem] leading-[1.04] font-light tracking-tight sm:text-[2.4rem]"
            style={{ wordBreak: "break-word" }}
          >
            {eventName}
          </h1>

          {/* When / Where */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1">
            <Field label="When">
              {date ?? "—"}
              {time ? <span className="ml-2 opacity-60">· {time}</span> : null}
            </Field>
            <Field label="Where">{eventLocation ?? "—"}</Field>
          </dl>

          {/* Status copy / payment instructions — only when relevant */}
          {status === "pending" ? (
            <div className="mt-auto pt-8">
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
              className="mt-auto pt-8 font-mono text-[11px] uppercase"
              style={{ letterSpacing: "0.18em", opacity: 0.45 }}
            >
              This ticket has been used
            </p>
          ) : status === "canceled" ? (
            <p
              className="mt-auto pt-8 font-mono text-[11px] uppercase"
              style={{ letterSpacing: "0.18em", opacity: 0.45 }}
            >
              This ticket is canceled
            </p>
          ) : (
            // Active ticket: scan instruction lives on the body
            <p
              className="mt-auto pt-8 font-mono text-[11px] uppercase"
              style={{ letterSpacing: "0.32em", opacity: 0.5 }}
            >
              Scan at the door →
            </p>
          )}

          {/* Decorative serial strip — bottom of body */}
          <div
            aria-hidden="true"
            className="mt-6 pt-4 font-mono text-[8px]"
            style={{ letterSpacing: "0.5em", opacity: 0.45 }}
          >
            {`HW · ${num} · ${(eventDate ?? "").slice(0, 10).replace(/-/g, "·") || "—"}`}
          </div>
        </div>

        {/* ── Vertical perforation (middle column) ─────────────────── */}
        <VerticalPerforation />

        {/* ── Stub (right column) ──────────────────────────────────── */}
        <div className="relative flex flex-col items-center justify-between p-6 text-center sm:p-8">
          {/* Top: "TICKET No." */}
          <div className="flex flex-col items-center gap-1">
            <span
              className="font-mono text-[9px] uppercase"
              style={{ letterSpacing: "0.32em", opacity: 0.5 }}
            >
              Ticket
            </span>
            <span
              className="font-mono text-[8px] uppercase"
              style={{ letterSpacing: "0.32em", opacity: 0.4 }}
            >
              №
            </span>
          </div>

          {/* Centre: large serial OR QR (active state) */}
          {status === "active" && checkInUrl ? (
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
                size={140}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a1410"
                includeMargin={false}
              />
            </div>
          ) : (
            <span
              className="font-light tracking-tight tabular-nums"
              style={{ fontSize: "3.4rem", lineHeight: 1 }}
            >
              {num}
            </span>
          )}

          {/* Bottom: holder + status */}
          <div className="flex w-full flex-col items-center gap-1">
            {holderName ? (
              <span
                className="block max-w-full truncate text-sm tracking-tight"
                style={{ opacity: 0.85 }}
              >
                {holderName}
              </span>
            ) : null}
            <span
              className="font-mono text-[9px] uppercase"
              style={{
                letterSpacing: "0.22em",
                color: STATUS_TINT[status]
              }}
            >
              {status}
            </span>
          </div>
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

/**
 * Vertical perforation between body and stub. A thin column with
 * dotted dashes down the middle and notch divots top + bottom that
 * "punch" through the page background using the parent surface colour.
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
          background: "var(--ticket-page-bg, transparent)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)"
        }}
      />
      {/* Bottom notch */}
      <span
        className="absolute -bottom-[7px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full"
        style={{
          background: "var(--ticket-page-bg, transparent)",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)"
        }}
      />
      {/* Dotted vertical line */}
      <span
        className="absolute inset-y-4 left-1/2 -translate-x-1/2"
        style={{
          width: 2,
          backgroundImage:
            "radial-gradient(circle, oklch(0.18 0.012 30 / 0.35) 1px, transparent 1.5px)",
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
