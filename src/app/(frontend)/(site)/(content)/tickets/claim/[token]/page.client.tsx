"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  token: string;
  ticketId: string;
  event: {
    name: string;
    slug: string;
    date: string | null;
    location: string | null;
  };
  isAuthenticated: boolean;
  alreadyMine: boolean;
  emailRestricted: boolean;
  emailMismatch: boolean;
}

export function ClaimClient({
  token,
  ticketId,
  event,
  isAuthenticated,
  alreadyMine,
  emailRestricted,
  emailMismatch
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dateDisplay = event.date
    ? (() => {
        try {
          return new Date(event.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          });
        } catch {
          return event.date;
        }
      })()
    : null;

  const claim = async () => {
    if (busy) return;
    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/tickets/claim/${token}`)}`
      );
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tickets/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setErr(`Claim failed: ${out.error ?? res.status}`);
        setBusy(false);
        return;
      }
      router.push(`/tickets/my/${out.ticket_id ?? ticketId}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <main
      className="px-6 py-32 sm:px-10 lg:px-16 2xl:px-24"
      data-theme="dark"
    >
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Gift ticket
      </p>
      <h1 className="mt-3 text-3xl font-light tracking-tight xl:text-4xl">
        {event.name}
      </h1>
      {dateDisplay ? (
        <p className="mt-4 font-mono text-[11px] tracking-widest text-foreground/70 uppercase">
          {dateDisplay}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      ) : null}

      <div className="mt-12 border-t border-border/20 pt-8">
        {alreadyMine ? (
          <div>
            <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
              Already yours
            </p>
            <p className="mt-3 text-sm text-foreground/80">
              This ticket is already linked to your account.
            </p>
            <Link
              href={`/tickets/my/${ticketId}`}
              className="mt-6 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase hover:border-border hover:text-foreground"
            >
              View ticket →
            </Link>
          </div>
        ) : emailMismatch ? (
          <div>
            <p className="font-mono text-[11px] tracking-widest text-[oklch(0.7_0.18_30)] uppercase">
              Wrong account
            </p>
            <p className="mt-3 text-sm text-foreground/80">
              This gift link is restricted to a different email address. Sign in
              with the intended account to claim it.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/tickets/claim/${token}`)}`}
                className="inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
              >
                Sign in with another account
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
          <div>
            <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
              Claim this ticket
            </p>
            <p className="mt-3 text-sm text-foreground/80">
              Someone shared this with you. Once you claim it, the ticket binds
              to your account and the link becomes unusable.
            </p>
            {emailRestricted ? (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
                Email restriction is in effect — only the intended recipient can
                claim.
              </p>
            ) : null}

            {err ? (
              <p
                role="alert"
                className="mt-6 font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
              >
                {err}
              </p>
            ) : null}

            <button
              type="button"
              onClick={claim}
              disabled={busy}
              className="mt-8 border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
            >
              {busy
                ? "Claiming…"
                : isAuthenticated
                  ? "Claim ticket"
                  : "Sign in to claim"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
