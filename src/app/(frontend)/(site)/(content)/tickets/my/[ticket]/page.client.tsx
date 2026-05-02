"use client";

import { Link } from "@/components/core/Link/Link";
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
  tossId: string | null;
  holderName: string | null;
}

export function TicketDetailClient({
  status,
  paid,
  checkedIn,
  checkInUrl,
  ticketNumber,
  eventName,
  eventSlug,
  eventDate,
  eventLocation,
  ticketPrice,
  tossId,
  holderName
}: Props) {
  return (
    <div
      className="flex w-full flex-col items-center gap-10 lg:items-start"
      style={{ width: "min(34rem, 100%)" }}
    >
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
        tossId={tossId}
      />

      {checkedIn && eventSlug ? (
        <Link
          href={`/tickets/${eventSlug}/exclusive`}
          className="self-stretch border border-border/40 px-5 py-3 text-center font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
        >
          View exclusive content →
        </Link>
      ) : null}
    </div>
  );
}
