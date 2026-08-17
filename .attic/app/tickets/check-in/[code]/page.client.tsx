"use client";

import { useState } from "react";
import { Link } from "src/components/core/Link/Link";
import { RPage } from "src/components/UX/Transition";
import { TicketBottomBar } from "src/components/UX/Ticket/TicketBottomBar";
import { MotionPillButton } from "src/components/core/Button";
import { SPRING_EASE } from "src/constants/animations";
import { cn } from "src/lib/utils";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";

type State = "ready" | "forbidden" | "not_found";

interface Props {
  code: string;
  state: State;
  ticketNumber?: number | null;
  eventName?: string;
  userName?: string;
  status?: string;
  alreadyCheckedIn?: boolean;
}

export function CheckInClient({
  code,
  state,
  ticketNumber = null,
  eventName = "Event",
  userName = "—",
  status = "pending",
  alreadyCheckedIn = false
}: Props) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(alreadyCheckedIn);
  const [err, setErr] = useState<string | null>(null);

  const confirm = async () => {
    if (busy || done) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tickets/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ check_in_code: code })
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setErr(`Check-in failed: ${out.error ?? res.status}`);
        setBusy(false);
        return;
      }
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <RPage type="me" slug={["tickets", "check-in"]}>
      <section className="relative z-[100] mx-auto w-full max-w-2xl px-6 pt-16 pb-32 xl:px-10 xl:pt-20 xl:pb-40">
        <AnimatePresence mode="wait">
          {state === "forbidden" ? (
            <ForbiddenView key="forbidden" />
          ) : state === "not_found" ? (
            <NotFoundView key="not_found" />
          ) : (
            <ReadyView
              key="ready"
              ticketNumber={ticketNumber}
              userName={userName}
              status={status}
              alreadyCheckedIn={alreadyCheckedIn}
              done={done}
              busy={busy}
              err={err}
              onConfirm={confirm}
            />
          )}
        </AnimatePresence>
      </section>

      <TicketBottomBar
        eyebrow="Check in"
        title={state === "ready" ? eventName : "Scan ticket"}
        rightAction={{ label: "Vault →", href: "/vault/collections/tickets" }}
      />
    </RPage>
  );
}

function ForbiddenView() {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <m.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="mb-4 block font-mono text-5xl"
      >
        ○
      </m.span>
      <p className="text-base font-light text-foreground/70">
        Only staff can check in attendees.
      </p>
      <p className="mt-1.5 max-w-md font-mono text-[11px] text-muted-foreground/50">
        If you&apos;re trying to use your own ticket, scroll down to the QR code
        on your ticket page — staff will scan it from there.
      </p>
      <Link href="/tickets/my">
        <MotionPillButton
          type="button"
          size="sm"
          className="mt-7 text-[11px] tracking-widest uppercase"
        >
          ← My tickets
        </MotionPillButton>
      </Link>
    </m.div>
  );
}

function NotFoundView() {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <m.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="mb-4 block font-mono text-5xl"
      >
        ○
      </m.span>
      <p className="text-base font-light text-foreground/70">
        No ticket matches this code.
      </p>
    </m.div>
  );
}

function ReadyView({
  ticketNumber,
  userName,
  status,
  alreadyCheckedIn,
  done,
  busy,
  err,
  onConfirm
}: {
  ticketNumber: number | null;
  userName: string;
  status: string;
  alreadyCheckedIn: boolean;
  done: boolean;
  busy: boolean;
  err: string | null;
  onConfirm: () => void;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{
        type: "spring",
        ...SPRING_EASE.power3.out,
        visualDuration: 0.55
      }}
      className="flex flex-col gap-5"
    >
      {/* Ticket info panel */}
      <div
        className={cn(
          "relative rounded-2xl p-6 xl:p-8",
          "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
          "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]"
        )}
      >
        <p className="mb-5 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/55 uppercase">
          Ticket details
        </p>
        <dl className="flex flex-col gap-2">
          <Field label="Ticket" value={`#${ticketNumber ?? "—"}`} mono />
          <Field label="Holder" value={userName} />
          <Field label="Status" value={status} mono />
        </dl>
      </div>

      {/* Action panel */}
      <div
        className={cn(
          "relative rounded-2xl p-6 xl:p-8",
          "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
          "before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
          "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]"
        )}
      >
        <AnimatePresence mode="wait">
          {done ? (
            <m.div
              key="done"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              <p className="font-mono text-[11px] tracking-widest text-[oklch(0.65_0.18_150)] uppercase">
                Checked in{alreadyCheckedIn ? " (already)" : ""}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground/60">
                You can close this page, or scan the next ticket.
              </p>
            </m.div>
          ) : (
            <m.div
              key="confirm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              {status !== "active" ? (
                <p className="font-mono text-[11px] tracking-widest text-[oklch(0.7_0.18_30)] uppercase">
                  Ticket not active — confirm anyway?
                </p>
              ) : null}
              {err ? (
                <m.p
                  role="alert"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
                >
                  {err}
                </m.p>
              ) : null}
              <MotionPillButton
                type="button"
                size="md"
                onClick={onConfirm}
                disabled={busy}
                className="w-full bg-foreground text-[13px] font-medium text-background disabled:opacity-40"
              >
                {busy ? "Confirming…" : "Confirm check-in"}
              </MotionPillButton>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
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
        "relative flex items-center justify-between gap-4 rounded-lg px-4 py-3",
        "bg-foreground/[0.025] dark:bg-foreground/[0.03]"
      )}
    >
      <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "font-mono text-sm text-foreground/80 tabular-nums"
            : "text-sm font-light text-foreground/80"
        }
      >
        {value}
      </dd>
    </div>
  );
}
