"use client";

import { Link } from "@/components/core/Link/Link";
import {
  TicketCard,
  type TicketStatus
} from "@/components/UX/Ticket/TicketCard";
import { ticketFontVariables } from "@/components/UX/Ticket/fonts";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export type DayNNightWalletTicket = {
  id: string;
  ticketNumber: number | null;
  status: TicketStatus;
  paid: boolean;
  checkedIn: boolean;
  checkInUrl: string;
  eventName: string;
  eventDate: string | null;
  eventLocation: string | null;
  ticketPrice: number;
  paymentInstructions: string | null;
  holderName: string | null;
};

type Props = {
  tickets: DayNNightWalletTicket[];
};

export function TicketWallet({ tickets }: Props) {
  const t = useTranslations("Event.Rsvp.my");

  if (tickets.length === 0) {
    return (
      <section className="mt-10 border-t border-off-white/10 pt-8">
        <h2 className="font-mono text-[10px] tracking-[0.32em] text-off-white/65 uppercase">
          {t("walletTitle")}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed font-light text-off-white/70">
          {t("walletEmpty")}
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "mt-10 border-t border-off-white/10 pt-8",
        ticketFontVariables
      )}
    >
      <div className="mb-8 flex flex-col gap-3">
        <h2 className="font-mono text-[10px] tracking-[0.32em] text-off-white/65 uppercase">
          {t("walletTitle")}
        </h2>
        <p className="max-w-md text-sm leading-relaxed font-light text-off-white/70">
          {t("walletBody")}
        </p>
      </div>

      <ul className="flex flex-col gap-8">
        {tickets.map((ticket) => {
          const hasEntryQr = ticket.status === "active" && ticket.checkInUrl;
          return (
            <li key={ticket.id} className="grid gap-4">
              <TicketCard
                ticketNumber={ticket.ticketNumber}
                status={ticket.status}
                paid={ticket.paid}
                checkedIn={ticket.checkedIn}
                eventName={ticket.eventName}
                eventDate={ticket.eventDate}
                eventLocation={ticket.eventLocation}
                holderName={ticket.holderName}
                checkInUrl={ticket.checkInUrl}
                ticketPrice={ticket.ticketPrice}
                paymentInstructions={ticket.paymentInstructions}
              />
              <div className="flex flex-col gap-3 border-t border-off-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md font-mono text-[10px] leading-relaxed tracking-widest text-off-white/65 uppercase">
                  {ticket.checkedIn
                    ? t("checkedInHint")
                    : hasEntryQr
                      ? t("qrHint")
                      : t("pendingTicketHint")}
                </p>
                <Link
                  href={`/tickets/my/${ticket.id}`}
                  className="font-mono text-[10px] tracking-[0.24em] text-off-white/70 uppercase transition-colors hover:text-off-white"
                >
                  {t("openTicket")}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
