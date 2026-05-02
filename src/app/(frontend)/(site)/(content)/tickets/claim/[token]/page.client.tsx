"use client";

import { useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { useTransitionRouter } from "next-transition-router";
import { RPage } from "@/components/UX/Transition";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";

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
  /** When true, the claim token did not resolve to a ticket. */
  invalid?: boolean;
}

export function ClaimClient({
  token,
  ticketId,
  event,
  isAuthenticated,
  alreadyMine,
  emailRestricted,
  emailMismatch,
  invalid = false
}: Props) {
  const router = useTransitionRouter();
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
    <RPage type="pages" slug={["tickets", "claim", token]}>
      <section className="mx-auto w-full max-w-7xl px-6 pt-16 pb-32 xl:px-10 xl:pt-20 xl:pb-40">
        {invalid ? (
          <InvalidView />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              {dateDisplay ? (
                <p className="font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
                  {dateDisplay}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/20 pt-8 lg:border-t-0 lg:pt-0">
              {alreadyMine ? (
                <AlreadyMineView ticketId={ticketId} />
              ) : emailMismatch ? (
                <EmailMismatchView token={token} />
              ) : (
                <ClaimView
                  emailRestricted={emailRestricted}
                  err={err}
                  busy={busy}
                  isAuthenticated={isAuthenticated}
                  onClaim={claim}
                />
              )}
            </div>
          </div>
        )}
      </section>

      <TicketBottomBar
        eyebrow="Gift ticket"
        title={invalid ? "Invalid link" : event.name}
        rightAction={
          isAuthenticated
            ? { label: "My tickets →", href: "/tickets/my" }
            : { label: "← Hideaway", href: "/" }
        }
      />
    </RPage>
  );
}

function InvalidView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="mb-4 font-mono text-5xl opacity-10">○</span>
      <p className="text-base font-light text-foreground/70">
        Link is invalid or already claimed.
      </p>
      <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
        If you think this is a mistake, ask the sender to resend.
      </p>
    </div>
  );
}

function AlreadyMineView({ ticketId }: { ticketId: string }) {
  return (
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
  );
}

function EmailMismatchView({ token }: { token: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-widest text-[oklch(0.7_0.18_30)] uppercase">
        Wrong account
      </p>
      <p className="mt-3 text-sm text-foreground/80">
        This gift link is restricted to a different email address. Sign in with
        the intended account to claim it.
      </p>
      <div className="mt-6 flex flex-col items-start gap-3">
        <Link
          href={`/login?redirect=${encodeURIComponent(`/tickets/claim/${token}`)}`}
          className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
        >
          Sign in with another account
        </Link>
      </div>
    </div>
  );
}

function ClaimView({
  emailRestricted,
  err,
  busy,
  isAuthenticated,
  onClaim
}: {
  emailRestricted: boolean;
  err: string | null;
  busy: boolean;
  isAuthenticated: boolean;
  onClaim: () => void;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
        Claim this ticket
      </p>
      <p className="mt-3 text-sm text-foreground/80">
        Someone shared this with you. Once you claim it, the ticket binds to
        your account and the link becomes unusable.
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
        onClick={onClaim}
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
  );
}
