"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  code: string;
  ticketNumber: number | null;
  eventName: string;
  userName: string;
  status: string;
  alreadyCheckedIn: boolean;
}

export function CheckInClient({
  code,
  ticketNumber,
  eventName,
  userName,
  status,
  alreadyCheckedIn
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
    <main
      className="px-6 py-24 sm:px-10 lg:px-16 2xl:px-24"
      data-theme="dark"
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Check in
      </p>
      <h1 className="mt-3 text-2xl font-light tracking-tight">{eventName}</h1>

      <div className="mt-10 space-y-3 border-t border-border/20 pt-8">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
            Ticket
          </span>
          <span className="font-mono text-sm">#{ticketNumber ?? "—"}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
            Holder
          </span>
          <span className="text-sm">{userName}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase">
            Status
          </span>
          <span className="font-mono text-sm">{status}</span>
        </div>
      </div>

      <div className="mt-10">
        {done ? (
          <div>
            <p className="font-mono text-[11px] tracking-widest text-[oklch(0.65_0.18_150)] uppercase">
              Checked in {alreadyCheckedIn ? "(already)" : ""}
            </p>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
              You can close this page, or scan the next ticket.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/vault/collections/tickets"
                className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase hover:text-foreground"
              >
                Open Vault → Tickets
              </Link>
              <Link
                href="/tickets/my"
                className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
              >
                ← My tickets
              </Link>
            </div>
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
              onClick={confirm}
              disabled={busy}
              className="w-full border border-border/40 px-5 py-4 font-mono text-[12px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
            >
              {busy ? "Confirming…" : "Confirm check-in"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
