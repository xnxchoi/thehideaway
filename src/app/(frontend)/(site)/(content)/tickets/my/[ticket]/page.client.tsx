"use client";

import { useCallback, useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { Ticket3D } from "@/components/UX/Ticket/Ticket3D";
import {
  StatusChip,
  type TicketStatus
} from "@/components/UX/Ticket/StatusChip";
import { TicketQR } from "@/components/UX/Ticket/TicketQR";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";
import { TicketSpotlight } from "@/components/UX/Ticket/TicketSpotlight";
import { RP_Btn } from "@/components/core/Button";
import { ticketFontVariables } from "@/components/UX/Ticket/Ticket3D/fonts";

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

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

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
  const dateShort = formatShortDate(eventDate);

  const [flipped, setFlipped] = useState(false);
  const toggleFlip = useCallback(() => setFlipped((v) => !v), []);

  const [focused, setFocused] = useState(false);

  return (
    <RPage type="me" slug={["tickets", ticketId]}>
      {/*
        Apply the ticket's webfont variables to the whole page subtree.
        next/font/google injects @font-face rules but the canvas2D draw
        in makeTicketTexture only sees them once they're requested by a
        real DOM node. The wrapper guarantees that.
      */}
      <div className={ticketFontVariables}>
        {/* ── Hero stage ────────────────────────────────────────────── */}
        {/*
        Wide enough that the ticket reads as the page's artifact, but not
        so wide it dominates. min(64rem, 100%) lands at ~50% of a 1920px
        screen, ~60% of a 16" laptop. Earlier 110rem was overwhelming.
      */}
        <section className="px-6 pt-14 pb-10 sm:px-10 xl:px-12 xl:pt-20 xl:pb-14">
          <div className="mx-auto" style={{ width: "min(76rem, 100%)" }}>
            <Ticket3D
              eventName={eventName}
              ticketNumber={ticketNumber}
              date={dateShort}
              location={eventLocation}
              flipped={flipped}
              onFlip={toggleFlip}
            />

            {/*
            One subtle affordance — spotlight only, anchored bottom-right.
            The "Tap to flip" label was removed: luxe doesn't label its
            interactions. The flip is rewarded by exploration, not signage.
          */}
            <div
              className="mx-auto mt-5 flex items-center justify-end px-2 xl:mt-6"
              style={{ width: "100%" }}
            >
              <RP_Btn
                onClick={() => setFocused(true)}
                aria-label="Open spotlight view"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground/40 uppercase transition-colors hover:text-foreground xl:text-[11px]"
              >
                <span aria-hidden>⤢</span>
                Spotlight
              </RP_Btn>
            </div>
          </div>
        </section>

        {/* ── Info ─────────────────────────────────────────────────── */}
        {/*
        12-column editorial grid below the hero.
          - Title block: cols 1–6 (desktop), full width on mobile.
          - Status panel (QR / payment / terminal note): cols 7–9.
          - Metadata + actions: cols 10–12.
        Each column is its own scannable zone — the eye doesn't have to
        pinball between sticky and scrolling areas like the old layout.
      */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-32 xl:px-10 xl:pb-40">
          {/*
          Asymmetric 12-col editorial grid:
            cols 1–7  → title block (room for long event names to breathe)
            cols 9–11 → status panel (offset start at col 9, never col 7,
                        so there's a true ventilation gap between zones —
                        symmetric 6/3/3 reads as default-ish)
            cols 1–4  → metadata + actions (anchored under the title)
          Field block lives on its own row beneath the title — keeps it
          out of the status panel's vertical column.
        */}
          <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-12 lg:gap-x-16 xl:gap-x-20">
            {/* Title block */}
            <header className="lg:col-span-7">
              <StatusChip status={status} checkedIn={checkedIn} />
              <h1 className="mt-5 text-3xl leading-[1.02] font-light tracking-tight text-balance xl:text-6xl 2xl:text-7xl">
                {eventName}
              </h1>
              {dateLong ? (
                <p className="mt-6 font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
                  {dateLong}
                  {eventLocation ? ` · ${eventLocation}` : ""}
                </p>
              ) : null}
            </header>

            {/* Status panel — offset to start at col 9 for a real gutter */}
            <div className="lg:col-span-3 lg:col-start-9">
              {status === "active" && checkInUrl ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                    At the door
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                    Show this code to staff at check-in.
                  </p>
                  <div className="mt-6 flex justify-center sm:justify-start">
                    <TicketQR value={checkInUrl} size={200} />
                  </div>
                </div>
              ) : status === "pending" && !paid ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                    Awaiting payment
                  </p>
                  <p className="mt-3 text-2xl font-light tracking-tight xl:text-3xl">
                    {formatKRW(ticketPrice)}
                  </p>
                  {paymentInstructions ? (
                    <p className="mt-5 font-mono text-[11px] leading-relaxed whitespace-pre-line text-foreground/75 xl:text-xs">
                      {paymentInstructions}
                    </p>
                  ) : (
                    <p className="mt-5 font-mono text-[11px] text-muted-foreground/60">
                      The host will reach out with payment details. Your ticket
                      activates the moment we confirm receipt.
                    </p>
                  )}
                </div>
              ) : status === "used" ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                    Past
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                    This ticket has been used. Thanks for being there.
                  </p>
                </div>
              ) : status === "canceled" ? (
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-[oklch(0.7_0.18_30)] uppercase">
                    Canceled
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                    This ticket was canceled. If you think this is a mistake,
                    reach out to the host.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Metadata + actions — anchored under the title block */}
            <div className="lg:col-span-4 lg:col-start-1">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Number" value={`#${num}`} mono />
                <Field label="Holder" value={holderName ?? "—"} fallback="—" />
                <Field
                  label="Price"
                  value={ticketPrice > 0 ? formatKRW(ticketPrice) : "Free"}
                  mono
                />
                <Field
                  label="Paid"
                  value={paid ? "Confirmed" : "Pending"}
                  mono
                />
              </dl>

              {checkedIn && eventSlug ? (
                <Link
                  href={`/tickets/${eventSlug}/exclusive`}
                  className="mt-8 inline-block border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
                >
                  View exclusive content →
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <TicketBottomBar
          eyebrow={`Ticket · No. ${num}`}
          title={eventName}
          rightAction={{ label: "← All tickets", href: "/tickets/my" }}
        />

        <TicketSpotlight
          open={focused}
          onClose={() => setFocused(false)}
          ticket={{
            eventName,
            ticketNumber,
            dateShort,
            dateLong,
            location: eventLocation,
            status,
            checkedIn,
            checkInUrl,
            ticketPrice,
            flipped,
            onFlip: toggleFlip
          }}
        />
      </div>
    </RPage>
  );
}

function Field({
  label,
  value,
  mono = false,
  fallback
}: {
  label: string;
  value: string;
  mono?: boolean;
  fallback?: string;
}) {
  const display = value || fallback || "";
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 font-mono text-sm text-foreground/85 tabular-nums"
            : "mt-1 text-sm font-light text-foreground/85"
        }
      >
        {display}
      </dd>
    </div>
  );
}
