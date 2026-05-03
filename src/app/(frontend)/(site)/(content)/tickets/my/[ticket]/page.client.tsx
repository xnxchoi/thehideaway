"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { TicketPaper } from "@/components/UX/Ticket/TicketPaper";
import { TicketQR } from "@/components/UX/Ticket/TicketQR";
import { ticketFontVariables } from "@/components/UX/Ticket/fonts";

export type TicketStatus = "pending" | "active" | "used" | "canceled";

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

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: "Awaiting payment",
  active: "Active",
  used: "Used",
  canceled: "Canceled"
};

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

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

/**
 * Ticket detail page.
 *
 * **Architecture: two tracks.**
 *   1. The visual artifact (`TicketPaper`) — bone paper, vermilion seal,
 *      brand vocabulary. Pure decorative object. Personalised only via
 *      the serial number on the stub. Sits on the LEFT.
 *   2. The information — event name as h1, when/where/holder dl,
 *      status, price + payment instructions, QR if active. Editorial
 *      typography. Sits on the RIGHT.
 *
 * The two tracks share the page but never mix: the visual is the
 * brand object, the information is the data. Each does its own job.
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
  const dateLong = formatLongDate(eventDate);
  const time = formatTime(eventDate);

  return (
    <RPage type="me" slug={["tickets", ticketId]}>
      <div className={ticketFontVariables}>
        {/* ── Top rail: back link only. ─────────────────────────────── */}
        <div className="mx-auto w-full max-w-7xl px-6 pt-6 xl:px-10 xl:pt-10">
          <Link
            href="/tickets/my"
            className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
          >
            ← All tickets
          </Link>
        </div>

        {/* ── Two-track content ─────────────────────────────────────── */}
        <section className="mx-auto w-full max-w-7xl px-6 pt-12 pb-32 xl:px-10 xl:pt-20 xl:pb-40">
          <div className="grid grid-cols-1 items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:gap-x-24">
            {/* TRACK 1 — visual artifact */}
            <div>
              <TicketPaper ticketNumber={ticketNumber} />
            </div>

            {/* TRACK 2 — information */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground/55 uppercase">
                {STATUS_LABEL[status]}
                {checkedIn ? " · Checked in" : ""}
              </p>

              <h1 className="mt-4 text-3xl leading-[1.04] font-light tracking-tight text-balance xl:text-5xl 2xl:text-6xl">
                {eventName}
              </h1>

              <dl className="mt-10 space-y-5 border-t border-border/20 pt-8">
                {dateLong ? (
                  <Field
                    label="When"
                    value={time ? `${dateLong} · ${time}` : dateLong}
                  />
                ) : null}
                {eventLocation ? (
                  <Field label="Where" value={eventLocation} />
                ) : null}
                {holderName ? (
                  <Field label="Holder" value={holderName} />
                ) : null}
                <Field
                  label="Price"
                  value={
                    ticketPrice > 0 ? formatKRW(ticketPrice) : "Complimentary"
                  }
                  mono
                />
              </dl>

              {/* Conditional panels — QR / payment / status copy */}
              {status === "active" && checkInUrl ? (
                <div className="mt-10 border-t border-border/20 pt-8">
                  <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground/55 uppercase">
                    At the door
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                    Show this code to staff at check-in.
                  </p>
                  <div className="mt-6">
                    <TicketQR value={checkInUrl} size={200} />
                  </div>
                </div>
              ) : status === "pending" && !paid ? (
                <div className="mt-10 border-t border-border/20 pt-8">
                  <p className="font-mono text-[10px] tracking-[0.32em] text-muted-foreground/55 uppercase">
                    Payment
                  </p>
                  {paymentInstructions ? (
                    <p className="mt-4 font-mono text-[11px] leading-relaxed whitespace-pre-line text-foreground/80 xl:text-xs">
                      {paymentInstructions}
                    </p>
                  ) : (
                    <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground/65 xl:text-xs">
                      The host will reach out with payment details. Your
                      ticket activates the moment we confirm receipt.
                    </p>
                  )}
                </div>
              ) : null}

              {checkedIn && eventSlug ? (
                <Link
                  href={`/tickets/${eventSlug}/exclusive`}
                  className="mt-10 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
                >
                  View exclusive content →
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </RPage>
  );
}

function Field({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-6">
      <dt className="w-20 shrink-0 font-mono text-[10px] tracking-[0.32em] text-muted-foreground/55 uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "font-mono text-sm text-foreground/85 tabular-nums"
            : "text-sm font-light text-foreground/85"
        }
      >
        {value}
      </dd>
    </div>
  );
}
