"use client";

import Link from "next/link";
import { TicketQR } from "@/components/UX/Ticket/TicketQR";
import { TossPayButton } from "@/components/UX/Ticket/TossPayButton";

interface Props {
  ticketId: string;
  status: string;
  paid: boolean;
  checkedIn: boolean;
  checkInUrl: string;
  eventSlug: string;
  eventDate: string | null;
  eventLocation: string | null;
  ticketPrice: number;
  tossId: string | null;
}

export function TicketDetailClient({
  ticketId,
  status,
  paid,
  checkedIn,
  checkInUrl,
  eventSlug,
  eventDate,
  eventLocation,
  ticketPrice,
  tossId
}: Props) {
  const dateDisplay = eventDate
    ? (() => {
        try {
          return new Date(eventDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        } catch {
          return eventDate;
        }
      })()
    : null;

  return (
    <>
      {dateDisplay ? (
        <p className="mt-4 font-mono text-[11px] tracking-widest text-foreground/70 uppercase">
          {dateDisplay}
          {eventLocation ? ` · ${eventLocation}` : ""}
        </p>
      ) : null}

      <div className="mt-10 border-t border-border/20 pt-8">
        <div className="flex items-center justify-between">
          <span
            className={`font-mono text-[10px] tracking-widest uppercase ${
              status === "active"
                ? "text-foreground/80"
                : status === "pending"
                  ? "text-[oklch(0.7_0.15_85)]"
                  : "text-muted-foreground/50"
            }`}
          >
            Status · {status}
          </span>
          {checkedIn ? (
            <span className="font-mono text-[10px] tracking-widest text-[oklch(0.65_0.18_150)] uppercase">
              Checked in
            </span>
          ) : null}
        </div>

        {!paid && status === "pending" ? (
          <div className="mt-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              Pending payment
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
              Send{" "}
              {Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: "KRW",
                maximumFractionDigits: 0
              }).format(ticketPrice)}{" "}
              via Toss. Your ticket activates the moment we confirm receipt.
            </p>
            <div className="mt-6">
              <TossPayButton
                amount={ticketPrice}
                tossId={tossId ?? undefined}
              />
            </div>
          </div>
        ) : null}

        {status === "active" && checkInUrl ? (
          <div className="mt-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              At the door
            </p>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
              Show this code to the host. They'll scan it to check you in.
            </p>
            <div className="mt-6 flex justify-center">
              <TicketQR
                value={checkInUrl}
                size={240}
                label="Scan to check in"
              />
            </div>
          </div>
        ) : null}

        {checkedIn && eventSlug ? (
          <div className="mt-10 border-t border-border/20 pt-6">
            <Link
              href={`/tickets/${eventSlug}/exclusive`}
              className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase hover:text-foreground"
            >
              View exclusive content →
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
