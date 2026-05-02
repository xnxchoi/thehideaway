"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { RP_Btn } from "@/components/core/Button";
import {
  TicketCard,
  type TicketStatus
} from "@/components/UX/Ticket/TicketCard";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

export type MyTicketDoc = {
  id: string;
  ticket_number?: number | null;
  status?: string | null;
  paid?: boolean | null;
  checked_in?: boolean | null;
  check_in_code?: string | null;
  event?:
    | {
        id?: string;
        name?: string;
        slug?: string;
        date?: string | null;
        location?: string | null;
        ticket_price?: number | null;
        toss_payment_id?: string | null;
      }
    | string;
};

interface Props {
  tickets: MyTicketDoc[];
  holderName: string | null;
  baseUrl: string;
}

const padIndex = (n: number): string => String(n).padStart(2, "0");

export default function MyTicketsPageClient({
  tickets,
  holderName,
  baseUrl
}: Props) {
  const total = tickets.length;
  const [index, setIndex] = useState(0);

  // Clamp if data shrinks underneath us.
  useEffect(() => {
    if (index >= total && total > 0) setIndex(0);
  }, [total, index]);

  const prev = useCallback(
    () => setIndex((i) => (i === 0 ? total - 1 : i - 1)),
    [total]
  );
  const next = useCallback(
    () => setIndex((i) => (i === total - 1 ? 0 : i + 1)),
    [total]
  );

  // Arrow-key navigation.
  useEffect(() => {
    if (total <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, prev, next]);

  return (
    <RPage type="me" slug={["tickets"]}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                Tickets
              </p>
              <h1 className="mt-0.5 text-2xl font-light tracking-tight xl:text-3xl">
                My tickets
                {total > 0 && (
                  <span className="ml-2.5 font-mono text-sm text-muted-foreground/50 tabular-nums">
                    {total}
                  </span>
                )}
              </h1>
            </div>
            <Link
              href="/me/library/saved"
              className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
            >
              Library →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-12 xl:px-10 xl:py-20">
        <AnimatePresence mode="wait">
          {total === 0 ? (
            <EmptyState key="empty" />
          ) : (
            <div
              key="pager"
              className="flex flex-col items-center"
              style={{ ["--ticket-page-bg" as string]: "var(--background)" }}
            >
              <Pager
                tickets={tickets}
                index={index}
                holderName={holderName}
                baseUrl={baseUrl}
              />

              {total > 1 ? (
                <PagerControls
                  total={total}
                  index={index}
                  onPrev={prev}
                  onNext={next}
                  onJump={setIndex}
                />
              ) : null}
            </div>
          )}
        </AnimatePresence>
      </section>
    </RPage>
  );
}

// ── Pager card ─────────────────────────────────────────────────────────────

function Pager({
  tickets,
  index,
  holderName,
  baseUrl
}: {
  tickets: MyTicketDoc[];
  index: number;
  holderName: string | null;
  baseUrl: string;
}) {
  const ticket = tickets[index];
  if (!ticket) return null;

  const ev =
    typeof ticket.event === "object" && ticket.event ? ticket.event : null;
  const status = (ticket.status ?? "pending") as TicketStatus;
  const checkInUrl = ticket.check_in_code
    ? `${baseUrl}/tickets/check-in/${ticket.check_in_code}`
    : "";

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={ticket.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
        className="w-full"
        style={{ width: "min(28rem, 100%)" }}
      >
        <Link
          href={`/tickets/my/${ticket.id}`}
          className="block focus:outline-none"
          aria-label={`Open ticket #${ticket.ticket_number ?? ""} for ${ev?.name ?? "Event"}`}
        >
          <TicketCard
            ticketNumber={ticket.ticket_number ?? null}
            status={status}
            paid={Boolean(ticket.paid)}
            checkedIn={Boolean(ticket.checked_in)}
            eventName={ev?.name ?? "Event"}
            eventDate={ev?.date ?? null}
            eventLocation={ev?.location ?? null}
            holderName={holderName}
            checkInUrl={checkInUrl}
            ticketPrice={ev?.ticket_price ?? 0}
            tossId={ev?.toss_payment_id ?? null}
          />
        </Link>
      </m.div>
    </AnimatePresence>
  );
}

// ── Pager controls ─────────────────────────────────────────────────────────

function PagerControls({
  total,
  index,
  onPrev,
  onNext,
  onJump
}: {
  total: number;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
}) {
  return (
    <div className="mt-12 flex flex-col items-center gap-5">
      <div className="flex items-center gap-8">
        <RP_Btn
          onClick={onPrev}
          aria-label="Previous ticket"
          className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
        >
          ← Prev
        </RP_Btn>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70 xl:text-xs">
          {padIndex(index + 1)}{" "}
          <span className="text-muted-foreground/30">/</span>{" "}
          {padIndex(total)}
        </span>
        <RP_Btn
          onClick={onNext}
          aria-label="Next ticket"
          className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
        >
          Next →
        </RP_Btn>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <RP_Btn
            key={i}
            onClick={() => onJump(i)}
            aria-label={`Go to ticket ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={
              i === index
                ? "h-1.5 w-6 rounded-full bg-foreground/80 transition-all"
                : "h-1.5 w-1.5 rounded-full bg-foreground/15 transition-all hover:bg-foreground/40"
            }
          />
        ))}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <span className="mb-4 font-mono text-5xl opacity-10">○</span>
      <p className="text-base font-light text-foreground/70">No tickets yet.</p>
      <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
        Tickets arrive here once you purchase one through a private event link
        or claim a gift sent to you.
      </p>
    </m.div>
  );
}
