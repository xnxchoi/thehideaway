"use client";

import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import {
  TicketCard,
  type TicketStatus
} from "@/components/UX/Ticket/TicketCard";
import { ticketFontVariables } from "@/components/UX/Ticket/fonts";
import { MotionPillButton } from "@/components/core/Button";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

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
      <div className={cn("relative z-[100] py-15", ticketFontVariables)}>
        {/* Back link */}
        <div className="mx-auto w-full max-w-11xl px-12 pt-16 xl:px-16 xl:pt-20">
          <m.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href="/tickets/my"
              className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
            >
              ← All tickets
            </Link>
          </m.div>
        </div>

        {/* ── Hero — landscape ticket centred ── */}
        <section className="mx-auto w-full max-w-7xl px-6 pt-10 pb-16 xl:px-10 xl:pt-16 xl:pb-20">
          <m.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 38,
              mass: 1,
              delay: 0.05
            }}
            className="flex justify-center"
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
              paymentInstructions={paymentInstructions}
              finish={eventSlug === "day-n-night" ? "metallic" : "paper"}
            />
          </m.div>
        </section>

        {/* ── Metadata & actions ── */}
        <m.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.45,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="mx-auto w-full max-w-2xl px-6 pb-32 xl:pb-40"
        >
          {/* Lifted metadata panel */}
          <div
            className={cn(
              "relative rounded-2xl p-6 xl:p-8",
              "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
              "before:absolute before:inset-x-0 before:top-0 before:h-px",
              "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
              "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]"
            )}
          >
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
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
          </div>

          {/* Payment instructions — only when pending + unpaid */}
          {status === "pending" && !paid ? (
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className={cn(
                "relative mt-4 rounded-2xl p-6 xl:p-8",
                "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
                "before:absolute before:inset-x-0 before:top-0 before:h-px",
                "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
                "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]"
              )}
            >
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
            </m.div>
          ) : null}

          {/* Terminal-state copy */}
          {status === "used" ? (
            <p className="mt-6 font-mono text-[11px] leading-relaxed text-muted-foreground/60">
              This ticket has been used. Thanks for being there.
            </p>
          ) : status === "canceled" ? (
            <p className="mt-6 font-mono text-[11px] leading-relaxed text-muted-foreground/60">
              This ticket was canceled. If you think this is a mistake, reach
              out to the host.
            </p>
          ) : null}

          {checkedIn && eventSlug ? (
            <m.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="mt-8"
            >
              <Link href={`/tickets/${eventSlug}/exclusive`}>
                <MotionPillButton
                  type="button"
                  size="md"
                  className="bg-foreground text-[13px] font-medium text-background"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  View exclusive content →
                </MotionPillButton>
              </Link>
            </m.div>
          ) : null}
        </m.section>
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
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg px-4 py-3",
        "bg-foreground/[0.025] dark:bg-foreground/[0.03]"
      )}
    >
      <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-0.5 font-mono text-sm text-foreground/80 tabular-nums"
            : "mt-0.5 text-sm font-light text-foreground/80"
        }
      >
        {value}
      </dd>
    </div>
  );
}
