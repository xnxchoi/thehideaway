"use client";

import { Suspense, useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { useTransitionRouter } from "next-transition-router";
import { RPage } from "@/components/UX/Transition";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";
import { VGradientModule } from "@/components/UX/Gradient/Gradient_M";
import { TextBlurIn } from "@/components/UX/Tour/TextBlurIn";
import { MotionPillButton } from "@/components/core/Button";
import { SPRING_EASE } from "@/constants/animations";
import { signInRedirectPath } from "@/lib/routes/auth";
import { cn } from "@/lib/utils";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";

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
      router.push(signInRedirectPath(`/tickets/claim/${token}`));
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
      {invalid ? (
        /* ── Invalid: centered empty state ── */
        <div className="relative z-[100] flex min-h-svh flex-col items-center justify-center p-9 md:p-16">
          <div className="pointer-events-none absolute inset-[35px] z-[1] rounded-[35px] bg-opaque-background/55 backdrop-blur-[54px]" />
          <InvalidView />
          <Suspense>
            <VGradientModule />
          </Suspense>
        </div>
      ) : (
        /* ── Valid: glass panel centered ── */
        <div className="relative z-[100] flex min-h-svh flex-col items-center justify-center p-19 py-29 md:p-26">
          <div className="pointer-events-none absolute inset-[35px] z-[1] rounded-[35px] bg-opaque-background/55 backdrop-blur-[54px]" />

          <m.div
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              type: "spring",
              ...SPRING_EASE.power3.out,
              visualDuration: 0.55
            }}
            className="relative z-[10] flex w-full max-w-[420px] flex-col gap-7"
          >
            {/* Event meta */}
            <div>
              {dateDisplay ? (
                <p className="font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
                  {dateDisplay}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              ) : null}
              <TextBlurIn
                as="h1"
                text={event.name}
                style={{ fontSize: "clamp(3rem, 5.5vw, 4.5rem)" }}
                className="mt-3 leading-[1.1] font-light tracking-tight"
                stagger={0.04}
                delay={0.2}
                yOffset={6}
                blurAmount={6}
                duration={0.75}
              />
            </div>

            {/* State-aware panel */}
            <div
              className={cn(
                "relative rounded-2xl p-6",
                "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
                "before:absolute before:inset-x-0 before:top-0 before:h-px",
                "before:bg-gradient-to-r before:from-transparent before:via-foreground/20 before:to-transparent",
                "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.4)] dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]"
              )}
            >
              <AnimatePresence mode="wait">
                {alreadyMine ? (
                  <AlreadyMineView key="mine" ticketId={ticketId} />
                ) : emailMismatch ? (
                  <EmailMismatchView key="mismatch" token={token} />
                ) : (
                  <ClaimView
                    key="claim"
                    emailRestricted={emailRestricted}
                    err={err}
                    busy={busy}
                    isAuthenticated={isAuthenticated}
                    onClaim={claim}
                  />
                )}
              </AnimatePresence>
            </div>
          </m.div>

          <Suspense>
            <VGradientModule />
          </Suspense>
        </div>
      )}

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
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative z-[10] flex flex-col items-center justify-center py-24 text-center"
    >
      <m.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-4 block font-mono text-5xl"
      >
        ○
      </m.span>
      <p className="text-base font-light text-foreground/70">
        Link is invalid or already claimed.
      </p>
      <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
        If you think this is a mistake, ask the sender to resend.
      </p>
    </m.div>
  );
}

function AlreadyMineView({ ticketId }: { ticketId: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
        Already yours
      </p>
      <p className="text-sm font-light text-foreground/80">
        This ticket is already linked to your account.
      </p>
      <Link href={`/tickets/my/${ticketId}`}>
        <MotionPillButton
          type="button"
          size="md"
          className="bg-foreground text-[13px] font-medium text-background"
        >
          View ticket →
        </MotionPillButton>
      </Link>
    </m.div>
  );
}

function EmailMismatchView({ token }: { token: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      <p className="font-mono text-[11px] tracking-widest text-[oklch(0.7_0.18_30)] uppercase">
        Wrong account
      </p>
      <p className="text-sm font-light text-foreground/80">
        This gift link is restricted to a different email address. Sign in with
        the intended account to claim it.
      </p>
      <Link href={signInRedirectPath(`/tickets/claim/${token}`)}>
        <MotionPillButton
          type="button"
          size="md"
          className="text-[13px] text-foreground/80"
        >
          Sign in with another account
        </MotionPillButton>
      </Link>
    </m.div>
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
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-5"
    >
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          Gift ticket
        </p>
        <p className="mt-3 text-sm font-light text-foreground/80">
          Someone shared this with you. Once you claim it, the ticket binds to
          your account and the link becomes unusable.
        </p>
        {emailRestricted ? (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
            Email restriction is in effect — only the intended recipient can
            claim.
          </p>
        ) : null}
      </div>

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
        onClick={onClaim}
        disabled={busy}
        className="w-full bg-foreground text-[13px] font-medium text-background disabled:opacity-40"
      >
        {busy
          ? "Claiming…"
          : isAuthenticated
            ? "Claim ticket"
            : "Sign in to claim"}
      </MotionPillButton>
    </m.div>
  );
}
