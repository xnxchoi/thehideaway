"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { TicketPaper } from "@/components/UX/Ticket/TicketPaper";
import {
  StatusChip,
  type TicketStatus
} from "@/components/UX/Ticket/StatusChip";
import { TicketQR } from "@/components/UX/Ticket/TicketQR";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";
import { ticketFontVariables } from "@/components/UX/Ticket/fonts";

interface Props {
  ticketId: string;
  ticketNumber: number | null;
  status: TicketStatus;
  paid: boolean;
  checkedIn: boolean;
  checkInUrl: string;
  eventName: string;
  eventSlug: string;
  eventDate: string | null;
  eventLocation: string | null;
  ticketPrice: number;
  paymentInstructions: string | null;
  holderName: string | null;
}

const formatLongDate = (d: string | null): string | null => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return d;
  }
};

/**
 * Compact eyebrow for the ticket paper — `"THU · 7 MAY 2026"`.
 * Suppressed entirely (returns null) when the date doesn't parse so
 * the ticket doesn't print "INVALID DATE" on its face.
 */
const formatTicketEyebrow = (d: string | null): string | null => {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  const dow = parsed
    .toLocaleString("en-US", { weekday: "short" })
    .toUpperCase();
  const day = parsed.getDate();
  const month = parsed
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const year = parsed.getFullYear();
  return `${dow} · ${day} ${month} ${year}`;
};

/** "20:00" if the source date carries a real time, otherwise null. */
const formatTicketTime = (d: string | null): string | null => {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  if (parsed.getHours() === 0 && parsed.getMinutes() === 0) return null;
  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

/**
 * Ticket detail page.
 *
 * **Architectural rule (per the brand owner):**
 *   The visual artifact (`TicketPaper`) is *purely decorative* — bone
 *   paper, vermilion seal, brand vocabulary only. No event/date/holder/
 *   serial data is stamped onto it.
 *
 *   The actual information is presented as editorial typography on the
 *   page proper: the event name as the page h1, date/location as a
 *   tracked-caps eyebrow, ticket number/holder/price/status as a
 *   metadata grid, and the QR or payment panel in its own column.
 *
 *   This separation keeps the ticket as a brand object that always looks
 *   the same, while the data lives in the page where editorial typography
 *   can do its job.
 */
export function TicketDetailClient({
  ticketId,
  ticketNumber,
  status,
  paid,
  checkedIn,
  checkInUrl,
  eventName,
  eventSlug,
  eventDate,
  eventLocation,
  ticketPrice,
  paymentInstructions,
  holderName
}: Props) {
  const num = String(ticketNumber ?? 0).padStart(4, "0");
  const dateLong = formatLongDate(eventDate);
  const ticketEyebrow = formatTicketEyebrow(eventDate);
  const ticketTime = formatTicketTime(eventDate);

  return (
    <RPage type="me" slug={["tickets", ticketId]}>
      {/* The font variables wrapper supplies Playfair Display for the
          ticket paper's editorial type and seal monogram. */}
      <div className={ticketFontVariables}>
        {/* ── Hero stage — the personalised artifact ───────────────────── */}
        <section className="px-6 pt-14 pb-12 sm:px-10 xl:px-12 xl:pt-20 xl:pb-16">
          <div className="mx-auto" style={{ width: "min(58rem, 100%)" }}>
            <TicketPaper
              eventName={eventName}
              ticketNumber={ticketNumber}
              dateLabel={ticketEyebrow}
              location={eventLocation}
              time={ticketTime}
              holderName={holderName}
            />
          </div>
        </section>

        {/* ── Information ──────────────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-32 xl:px-10 xl:pb-40">
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12 lg:gap-x-16 xl:gap-x-20">
            {/* Title block — cols 1–7 */}
            <header className="lg:col-span-7">
              <StatusChip status={status} checkedIn={checkedIn} />
              <h1 className="mt-5 text-3xl leading-[1.02] font-light tracking-tight text-balance xl:text-6xl 2xl:text-7xl">
                {eventName}
              </h1>
              {dateLong ? (
                <p className="mt-6 font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
                  {dateLong}
                  {eventLocation ? ` · ${eventLocation}` : ""}
                </p>
              ) : null}
            </header>

            {/* Status panel — cols 9–11 (real gutter, no symmetric 6/3/3) */}
            <div className="lg:col-span-3 lg:col-start-9">
              {status === "active" && checkInUrl ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                    At the door
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                    Show this code to staff at check-in.
                  </p>
                  <div className="mt-6 flex justify-center sm:justify-start">
                    <TicketQR value={checkInUrl} size={200} />
                  </div>
                </div>
              ) : status === "pending" && !paid ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                    Awaiting payment
                  </p>
                  <p className="mt-3 text-2xl font-light tracking-tight xl:text-3xl">
                    {formatKRW(ticketPrice)}
                  </p>
                  {paymentInstructions ? (
                    <p className="mt-5 font-mono text-[11px] leading-relaxed whitespace-pre-line text-foreground/75 xl:text-xs">
                      {paymentInstructions}
                    </p>
                  ) : (
                    <p className="mt-5 font-mono text-[11px] text-muted-foreground/60">
                      The host will reach out with payment details. Your ticket
                      activates the moment we confirm receipt.
                    </p>
                  )}
                </div>
              ) : status === "used" ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                    Past
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                    This ticket has been used. Thanks for being there.
                  </p>
                </div>
              ) : status === "canceled" ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-[oklch(0.7_0.18_30)] uppercase">
                    Canceled
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                    This ticket was canceled. If you think this is a mistake,
                    reach out to the host.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Metadata + actions — cols 1–4 under the title */}
            <div className="lg:col-span-4 lg:col-start-1">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Number" value={`#${num}`} mono />
                <Field label="Holder" value={holderName ?? "—"} fallback="—" />
                <Field
                  label="Price"
                  value={ticketPrice > 0 ? formatKRW(ticketPrice) : "Free"}
                  mono
                />
                <Field
                  label="Paid"
                  value={paid ? "Confirmed" : "Pending"}
                  mono
                />
              </dl>

              {checkedIn && eventSlug ? (
                <Link
                  href={`/tickets/${eventSlug}/exclusive`}
                  className="mt-8 inline-block border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
                >
                  View exclusive content →
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <TicketBottomBar
          eyebrow={`Ticket · No. ${num}`}
          title={eventName}
          rightAction={{ label: "← All tickets", href: "/tickets/my" }}
        />
      </div>
    </RPage>
  );
}

function Field({
  label,
  value,
  mono = false,
  fallback
}: {
  label: string;
  value: string;
  mono?: boolean;
  fallback?: string;
}) {
  const display = value || fallback || "";
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 font-mono text-sm text-foreground/85 tabular-nums"
            : "mt-1 text-sm font-light text-foreground/85"
        }
      >
        {display}
      </dd>
    </div>
  );
}
