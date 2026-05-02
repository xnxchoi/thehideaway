"use client";

import { useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";

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
      <section className="mx-auto w-full max-w-7xl px-6 pt-16 pb-32 xl:px-10 xl:pt-20 xl:pb-40">
        {state === "forbidden" ? (
          <ForbiddenView />
        ) : state === "not_found" ? (
          <NotFoundView />
        ) : (
          <ReadyView
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
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-4 font-mono text-5xl opacity-10">○</span>
      <p className="text-base font-light text-foreground/70">
        Only staff can check in attendees.
      </p>
      <p className="mt-1.5 max-w-md font-mono text-[11px] text-muted-foreground/50">
        If you&apos;re trying to use your own ticket, scroll down to the QR code
        on your ticket page — staff will scan it from there.
      </p>
      <Link
        href="/tickets/my"
        className="mt-7 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
      >
        ← My tickets
      </Link>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-4 font-mono text-5xl opacity-10">○</span>
      <p className="text-base font-light text-foreground/70">
        No ticket matches this code.
      </p>
    </div>
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
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <dl className="space-y-5 border-t border-border/20 pt-8">
        <Field label="Ticket" value={`#${ticketNumber ?? "—"}`} mono />
        <Field label="Holder" value={userName} />
        <Field label="Status" value={status} mono />
      </dl>

      <div className="border-t border-border/20 pt-8 lg:border-t-0 lg:pt-0">
        {done ? (
          <div>
            <p className="font-mono text-[11px] tracking-widest text-[oklch(0.65_0.18_150)] uppercase">
              Checked in {alreadyCheckedIn ? "(already)" : ""}
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
              You can close this page, or scan the next ticket.
            </p>
          </div>
        ) : (
          <>
            {status !== "active" ? (
              <p className="mb-4 font-mono text-[11px] tracking-widest text-[oklch(0.7_0.18_30)] uppercase">
                Ticket not active — confirm anyway?
              </p>
            ) : null}
            {err ? (
              <p
                role="alert"
                className="mb-4 font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
              >
                {err}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="w-full border border-border/40 px-5 py-4 font-mono text-[12px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
            >
              {busy ? "Confirming…" : "Confirm check-in"}
            </button>
          </>
        )}
      </div>
    </div>
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
    <div className="flex items-baseline justify-between gap-4">
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
