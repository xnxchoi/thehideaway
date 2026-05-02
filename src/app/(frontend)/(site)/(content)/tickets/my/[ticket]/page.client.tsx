"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { Ticket3D } from "@/components/UX/Ticket/Ticket3D";
import {
  StatusChip,
  type TicketStatus
} from "@/components/UX/Ticket/StatusChip";
import { TicketQR } from "@/components/UX/Ticket/TicketQR";

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

const formatShortDate = (d: string | null): string | null => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return d;
  }
};

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

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
  const dateShort = formatShortDate(eventDate);

  return (
    <RPage type="me" slug={["tickets", ticketId]}>
      <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                Ticket · No. {num}
              </p>
              <h1 className="mt-0.5 line-clamp-1 text-2xl font-light tracking-tight xl:text-3xl">
                {eventName}
              </h1>
            </div>
            <Link
              href="/tickets/my"
              className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
            >
              ← All tickets
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-6 py-12 xl:px-10 xl:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24">
          {/* ── Visual artifact ─────────────────────────────────────── */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <Ticket3D
              eventName={eventName}
              ticketNumber={ticketNumber}
              date={dateShort}
              location={eventLocation}
            />
            <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-muted-foreground/40 uppercase xl:text-[11px]">
              Hover or drag to rotate
            </p>
          </div>

          {/* ── Information ────────────────────────────────────────── */}
          <div className="flex flex-col gap-12">
            <header>
              <StatusChip status={status} checkedIn={checkedIn} />
              <h2 className="mt-4 text-3xl leading-[1.05] font-light tracking-tight text-balance xl:text-5xl 2xl:text-6xl">
                {eventName}
              </h2>
              {dateLong ? (
                <p className="mt-5 font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
                  {dateLong}
                  {eventLocation ? ` · ${eventLocation}` : ""}
                </p>
              ) : null}
            </header>

            {/* Active → QR for staff to scan */}
            {status === "active" && checkInUrl ? (
              <div className="border-t border-border/20 pt-8">
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                  At the door
                </p>
                <p className="mt-2 max-w-prose font-mono text-[11px] text-muted-foreground/60">
                  Show this code to staff at check-in.
                </p>
                <div className="mt-6 flex justify-center sm:justify-start">
                  <TicketQR value={checkInUrl} size={220} />
                </div>
              </div>
            ) : null}

            {/* Pending → manual payment instructions */}
            {status === "pending" && !paid ? (
              <div className="border-t border-border/20 pt-8">
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Awaiting payment
                </p>
                <p className="mt-3 text-2xl font-light tracking-tight xl:text-3xl">
                  {formatKRW(ticketPrice)}
                </p>
                {paymentInstructions ? (
                  <p className="mt-5 max-w-prose font-mono text-[11px] leading-relaxed whitespace-pre-line text-foreground/75 xl:text-xs">
                    {paymentInstructions}
                  </p>
                ) : (
                  <p className="mt-5 max-w-prose font-mono text-[11px] text-muted-foreground/60">
                    The host will reach out with payment details. Your ticket
                    activates the moment we confirm receipt.
                  </p>
                )}
              </div>
            ) : null}

            {/* Used / canceled → terminal note */}
            {status === "used" ? (
              <div className="border-t border-border/20 pt-8">
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                  Past
                </p>
                <p className="mt-2 max-w-prose font-mono text-[11px] text-muted-foreground/60">
                  This ticket has been used. Thanks for being there.
                </p>
              </div>
            ) : null}
            {status === "canceled" ? (
              <div className="border-t border-border/20 pt-8">
                <p className="font-mono text-[10px] tracking-[0.2em] text-[oklch(0.7_0.18_30)] uppercase">
                  Canceled
                </p>
                <p className="mt-2 max-w-prose font-mono text-[11px] text-muted-foreground/60">
                  This ticket was canceled. If you think this is a mistake,
                  reach out to the host.
                </p>
              </div>
            ) : null}

            {/* Always-visible metadata */}
            <dl className="grid grid-cols-1 gap-x-8 gap-y-5 border-t border-border/20 pt-8 sm:grid-cols-2">
              <Field label="Number" value={`#${num}`} mono />
              <Field label="Holder" value={holderName ?? "—"} fallback="—" />
              <Field
                label="Price"
                value={ticketPrice > 0 ? formatKRW(ticketPrice) : "Free"}
                mono
              />
              <Field label="Paid" value={paid ? "Confirmed" : "Pending"} mono />
            </dl>

            {checkedIn && eventSlug ? (
              <Link
                href={`/tickets/${eventSlug}/exclusive`}
                className="self-start border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
              >
                View exclusive content →
              </Link>
            ) : null}
          </div>
        </div>
      </section>
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
