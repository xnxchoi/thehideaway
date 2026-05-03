"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import {
  TicketCard,
  type TicketStatus
} from "@/components/UX/Ticket/TicketCard";

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

  return (
    <RPage type="me" slug={["tickets", ticketId]}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-[5.5rem] z-20 border-b border-border/30 bg-background/90 backdrop-blur-md lg:top-[8rem]">
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

      {/* ── Content ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-8 xl:px-10 xl:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16 xl:gap-20">
          {/* Metadata rail */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <dl className="space-y-5 border-t border-border/20 pt-8">
              {dateLong ? <Field label="When" value={dateLong} /> : null}
              {eventLocation ? (
                <Field label="Where" value={eventLocation} />
              ) : null}
              {holderName ? <Field label="Holder" value={holderName} /> : null}
              <Field
                label="Status"
                value={`${STATUS_LABEL[status]}${checkedIn ? " · Checked in" : ""}`}
                mono
              />
            </dl>

            {checkedIn && eventSlug ? (
              <Link
                href={`/tickets/${eventSlug}/exclusive`}
                className="mt-8 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
              >
                View exclusive content →
              </Link>
            ) : null}
          </aside>

          {/* Ticket artifact */}
          <div className="flex justify-center lg:justify-start">
            <TicketCard
              ticketNumber={ticketNumber}
              status={status}
              paid={paid}
              checkedIn={checkedIn}
              eventName={eventName}
              eventDate={eventDate}
              eventLocation={eventLocation}
              holderName={holderName}
              checkInUrl={checkInUrl}
              ticketPrice={ticketPrice}
              paymentInstructions={paymentInstructions}
            />
          </div>
        </div>
      </section>
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
    <div>
      <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 font-mono text-sm text-foreground/80 tabular-nums"
            : "mt-1 text-sm font-light text-foreground/80"
        }
      >
        {value}
      </dd>
    </div>
  );
}
