"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { RP_Btn } from "@/components/core/Button";
import { Ticket3D } from "@/components/UX/Ticket/Ticket3D";
import {
  StatusChip,
  type TicketStatus
} from "@/components/UX/Ticket/StatusChip";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

export type MyTicketDoc = {
  id: string;
  ticket_number?: number | null;
  status?: string | null;
  paid?: boolean | null;
  checked_in?: boolean | null;
  event?:
    | {
        id?: string;
        name?: string;
        slug?: string;
        date?: string | null;
        location?: string | null;
      }
    | string;
};

interface Props {
  tickets: MyTicketDoc[];
}

const padIndex = (n: number): string => String(n).padStart(2, "0");

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

const formatDow = (d: string | null): string | null => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", { weekday: "long" });
  } catch {
    return null;
  }
};

export default function MyTicketsPageClient({ tickets }: Props) {
  const total = tickets.length;
  const [index, setIndex] = useState(0);

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

      <section className="mx-auto w-full max-w-7xl px-6 py-12 xl:px-10 xl:py-20">
        <AnimatePresence mode="wait">
          {total === 0 ? (
            <EmptyState key="empty" />
          ) : (
            <div key="pager" className="flex flex-col items-center gap-12">
              <PagerCard ticket={tickets[index]} />
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

function PagerCard({ ticket }: { ticket: MyTicketDoc }) {
  const ev =
    typeof ticket.event === "object" && ticket.event ? ticket.event : null;
  const status = (ticket.status ?? "pending") as TicketStatus;
  const dateShort = formatShortDate(ev?.date ?? null);
  const dow = formatDow(ev?.date ?? null);

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={ticket.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
        className="flex w-full flex-col items-center gap-8"
        style={{ width: "min(38rem, 100%)" }}
      >
        {/* The 3D artifact — visual presence only. */}
        <Ticket3D
          eventName={ev?.name ?? "Event"}
          ticketNumber={ticket.ticket_number ?? null}
          date={dateShort}
          location={ev?.location ?? null}
        />

        {/* Information block — typography-driven, lives outside the card. */}
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <StatusChip status={status} checkedIn={Boolean(ticket.checked_in)} />

          <h2 className="text-3xl leading-[1.05] font-light tracking-tight text-balance xl:text-5xl">
            {ev?.name ?? "Event"}
          </h2>

          {dateShort ? (
            <p className="font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
              {dow ? `${dow} · ` : ""}
              {dateShort}
              {ev?.location ? ` · ${ev.location}` : ""}
            </p>
          ) : null}

          <Link
            href={`/tickets/my/${ticket.id}`}
            className="mt-2 font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
          >
            View details →
          </Link>
        </div>
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
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-center gap-8">
        <RP_Btn
          onClick={onPrev}
          aria-label="Previous ticket"
          className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
        >
          ← Prev
        </RP_Btn>
        <span className="font-mono text-[11px] text-muted-foreground/70 tabular-nums xl:text-xs">
          {padIndex(index + 1)}{" "}
          <span className="text-muted-foreground/30">/</span> {padIndex(total)}
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
