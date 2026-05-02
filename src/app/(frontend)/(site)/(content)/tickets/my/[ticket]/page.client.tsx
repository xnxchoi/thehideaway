"use client";

import Link from "next/link";
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
    <>
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
        <div className="mt-10 flex justify-center">
          <Link
            href={`/tickets/${eventSlug}/exclusive`}
            className="inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
          >
            View exclusive content →
          </Link>
        </div>
      ) : null}
    </>
  );
}
