"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { TicketStub } from "@/components/UX/Ticket/TicketStub";
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

export default function MyTicketsPageClient({ tickets }: Props) {
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
                {tickets.length > 0 && (
                  <span className="ml-2.5 font-mono text-sm text-muted-foreground/50 tabular-nums">
                    {tickets.length}
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
      <section className="mx-auto w-full max-w-7xl px-6 py-8 xl:px-10 xl:py-12">
        <AnimatePresence mode="wait">
          {tickets.length === 0 ? (
            <EmptyState key="empty" />
          ) : (
            <m.ul
              key="grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6"
            >
              {tickets.map((t, i) => {
                const ev =
                  typeof t.event === "object" && t.event
                    ? t.event
                    : { name: "Event", slug: "", date: null, location: null };
                const status = (t.status ?? "pending") as
                  | "pending"
                  | "active"
                  | "used"
                  | "canceled";
                return (
                  <TicketStub
                    key={t.id}
                    href={`/tickets/my/${t.id}`}
                    ticketNumber={t.ticket_number ?? null}
                    status={status}
                    checkedIn={Boolean(t.checked_in)}
                    eventName={ev.name ?? "Event"}
                    eventDate={ev.date ?? null}
                    eventLocation={ev.location ?? null}
                    index={i}
                  />
                );
              })}
            </m.ul>
          )}
        </AnimatePresence>
      </section>
    </RPage>
  );
}

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
