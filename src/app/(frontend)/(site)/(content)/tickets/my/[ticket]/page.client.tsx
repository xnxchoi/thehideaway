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

/**
 * Ticket detail page.
 *
 * The TicketCard already carries the event name, date, location, holder,
 * status, and serial. So the page chrome stays minimal — just a small
 * top rail with a back link, and (when relevant) a single CTA below the
 * card. No metadata column, no sticky h1 — those duplicated everything
 * the card already shows.
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
  return (
    <RPage type="me" slug={["tickets", ticketId]}>
      {/* ── Top rail: back link only. ────────────────────────────────── */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-6 xl:px-10 xl:pt-10">
        <Link
          href="/tickets/my"
          className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
        >
          ← All tickets
        </Link>
      </div>

      {/* ── The artifact, centred. ───────────────────────────────────── */}
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 pt-10 pb-20 xl:px-10 xl:pt-16 xl:pb-32">
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

        {checkedIn && eventSlug ? (
          <Link
            href={`/tickets/${eventSlug}/exclusive`}
            className="mt-12 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
          >
            View exclusive content →
          </Link>
        ) : null}
      </section>
    </RPage>
  );
}
