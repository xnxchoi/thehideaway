"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import {
  TicketCard,
  type TicketStatus
} from "@/components/UX/Ticket/TicketCard";
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

const STATUS_LABEL: Record<TicketStatus, string> = {
  pending: "Awaiting payment",
  active: "Active",
  used: "Used",
  canceled: "Canceled"
};

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

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
  const dateLong = formatLongDate(eventDate);

  return (
    <RPage type="me" slug={["tickets", ticketId]}>
      <div className={ticketFontVariables}>
        {/* Top rail — back link only. The page header used to repeat
            "Ticket · No. 0004 / Hideaway Test Salon" right above a
            ticket that already says exactly that. The artifact is the
            H1; chrome stays out of its way. */}
        <div className="mx-auto w-full max-w-7xl px-6 pt-6 xl:px-10 xl:pt-10">
          <Link
            href="/tickets/my"
            className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
          >
            ← All tickets
          </Link>
        </div>

        {/* ── Hero — landscape ticket centred ────────────────────── */}
        <section className="mx-auto w-full max-w-7xl px-6 pt-10 pb-16 xl:px-10 xl:pt-16 xl:pb-20">
          <div className="flex justify-center">
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
        </section>

        {/* ── Status / payment / actions ─────────────────────────── */}
        {/* Sub-content under the artifact — long-form metadata that
            wouldn't fit cleanly on the ticket itself. The ticket above
            already shows event/date/location/holder/serial. */}
        <section className="mx-auto w-full max-w-2xl px-6 pb-32 xl:pb-40">
          <dl className="grid grid-cols-2 gap-x-10 gap-y-5 border-t border-border/20 pt-8 sm:grid-cols-3">
            <Field
              label="Status"
              value={`${STATUS_LABEL[status]}${checkedIn ? " · Checked in" : ""}`}
              mono
            />
            {dateLong ? <Field label="When" value={dateLong} /> : null}
            {status === "pending" ? (
              <Field label="Price" value={formatKRW(ticketPrice)} mono />
            ) : null}
          </dl>

          {/* Payment instructions — only when pending + unpaid */}
          {status === "pending" && !paid ? (
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
                  The host will reach out with payment details. Your ticket
                  activates the moment we confirm receipt.
                </p>
              )}
            </div>
          ) : null}

          {/* Terminal-state copy — used / canceled */}
          {status === "used" ? (
            <p className="mt-10 font-mono text-[11px] leading-relaxed text-muted-foreground/60">
              This ticket has been used. Thanks for being there.
            </p>
          ) : status === "canceled" ? (
            <p className="mt-10 font-mono text-[11px] leading-relaxed text-muted-foreground/60">
              This ticket was canceled. If you think this is a mistake, reach
              out to the host.
            </p>
          ) : null}

          {checkedIn && eventSlug ? (
            <Link
              href={`/tickets/${eventSlug}/exclusive`}
              className="mt-10 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
            >
              View exclusive content →
            </Link>
          ) : null}
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
