"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/components/core/Link/Link";
import { useTransitionRouter } from "next-transition-router";
import { RPage } from "@/components/UX/Transition";
import { TossPayButton } from "@/components/UX/Ticket/TossPayButton";

interface EventLite {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  date: string | null;
  end_date: string | null;
  location: string | null;
  capacity: number;
  max_per_user: number;
  ticket_price: number;
  toss_payment_id: string | null;
  state: string;
}

interface PurchasedTicket {
  id: string;
  ticket_number: number;
  claim_token: string | null;
  claim_url: string | null;
}

interface PurchaseResult {
  tickets: PurchasedTicket[];
  total_amount: number;
}

interface Props {
  event: EventLite;
  remaining: number | null;
  isAuthenticated: boolean;
}

const SS_KEY = (slug: string) => `tickets:gate:${slug}`;

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

export function TicketEventClient({
  event,
  remaining,
  isAuthenticated
}: Props) {
  const router = useTransitionRouter();
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<PurchaseResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem(SS_KEY(event.slug));
    if (cached) {
      setStoredPassword(cached);
      setGateOpen(true);
    }
  }, [event.slug]);

  const isOpen = event.state === "open";
  const soldOut = remaining !== null && remaining <= 0;
  const maxAllowed = useMemo(() => {
    const cap = event.max_per_user;
    if (remaining === null) return cap;
    return Math.max(1, Math.min(cap, remaining));
  }, [event.max_per_user, remaining]);

  const totalDisplay = useMemo(
    () => formatKRW(event.ticket_price * quantity),
    [event.ticket_price, quantity]
  );

  const dateDisplay = useMemo(() => {
    if (!event.date) return "";
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
  }, [event.date]);

  const submitGate = async () => {
    if (gateBusy || !password.trim()) return;
    setGateBusy(true);
    setGateError(null);
    try {
      const res = await fetch("/api/tickets/validate-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_slug: event.slug,
          password: password.trim()
        })
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setGateError("That code didn't match.");
        setGateBusy(false);
        return;
      }
      sessionStorage.setItem(SS_KEY(event.slug), password.trim());
      setStoredPassword(password.trim());
      setGateOpen(true);
    } catch {
      setGateError("Network error.");
    } finally {
      setGateBusy(false);
    }
  };

  const submitPurchase = async () => {
    if (purchaseBusy || !storedPassword) return;
    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/tickets/${event.slug}`)}`
      );
      return;
    }
    setPurchaseBusy(true);
    setPurchaseError(null);
    try {
      const res = await fetch("/api/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_slug: event.slug,
          quantity,
          password: storedPassword
        })
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setPurchaseError(`Purchase failed: ${out.error ?? res.status}`);
        setPurchaseBusy(false);
        return;
      }
      setPurchased({
        tickets: out.tickets,
        total_amount: out.total_amount
      });
    } catch (e) {
      setPurchaseError((e as Error).message);
    } finally {
      setPurchaseBusy(false);
    }
  };

  const copyClaim = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <RPage type="pages" slug={["tickets", event.slug]}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div
        className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                Tickets {gateOpen ? "" : "· Private"}
              </p>
              <h1 className="mt-0.5 line-clamp-1 text-2xl font-light tracking-tight xl:text-3xl">
                {event.name}
              </h1>
            </div>
            {isAuthenticated ? (
              <Link
                href="/tickets/my"
                className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
              >
                My tickets →
              </Link>
            ) : (
              <Link
                href="/"
                className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
              >
                ← Hideaway
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-6 py-8 xl:px-10 xl:py-12">
        {!gateOpen ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                Locked
              </p>
              <h2 className="mt-3 text-xl font-light tracking-tight xl:text-2xl">
                Enter the passcode to continue.
              </h2>
              <p className="mt-3 max-w-md font-mono text-[11px] text-muted-foreground/60">
                This page is gated. Use the code shared with you privately.
              </p>
            </div>

            <form
              className="flex max-w-md flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitGate();
              }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access code"
                autoComplete="off"
                spellCheck={false}
                className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
              />
              {gateError ? (
                <p
                  role="alert"
                  className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
                >
                  {gateError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={gateBusy || !password.trim()}
                className="mt-2 self-start border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
              >
                {gateBusy ? "Checking…" : "Enter"}
              </button>
            </form>
          </div>
        ) : (
    <div
      className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 xl:gap-20">
            {/* Event hero */}
            <div>
              {dateDisplay ? (
                <p className="font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs">
                  {dateDisplay}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              ) : null}
              {event.description ? (
                <p className="mt-7 max-w-prose text-sm leading-relaxed text-foreground/80 xl:text-base">
                  {event.description}
                </p>
              ) : null}
            </div>

            {/* Purchase / status panel */}
            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="border-t border-border/20 pt-8">
                {!isOpen ? (
                  <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
                    {event.state === "ended"
                      ? "This event has ended."
                      : "Tickets are not currently on sale."}
                  </p>
                ) : soldOut ? (
                  <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
                    Sold out
                  </p>
                ) : purchased ? (
                  <PurchasedView
                    purchased={purchased}
                    tossId={event.toss_payment_id}
                    copied={copied}
                    onCopy={copyClaim}
                  />
                ) : (
                  <ReserveView
                    quantity={quantity}
                    setQuantity={setQuantity}
                    maxAllowed={maxAllowed}
                    totalDisplay={totalDisplay}
                    purchaseError={purchaseError}
                    purchaseBusy={purchaseBusy}
                    isAuthenticated={isAuthenticated}
                    onSubmit={submitPurchase}
                  />
                )}
              </div>
            </aside>
          </div>
        )}
      </section>
    </RPage>
  );
}

function PurchasedView({
  purchased,
  tossId,
  copied,
  onCopy
}: {
  purchased: PurchaseResult;
  tossId: string | null;
  copied: string | null;
  onCopy: (url: string) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Pending payment
      </p>
      <h2 className="mt-3 text-xl font-light tracking-tight xl:text-2xl">
        {purchased.tickets.length} ticket
        {purchased.tickets.length > 1 ? "s" : ""} reserved.
      </h2>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
        Send {formatKRW(purchased.total_amount)} via Toss. Your tickets activate
        the moment we confirm receipt.
      </p>

      <div className="mt-6">
        <TossPayButton
          amount={purchased.total_amount}
          tossId={tossId ?? undefined}
        />
      </div>

      {purchased.tickets.some((t) => t.claim_url) ? (
        <div className="mt-10 border-t border-border/20 pt-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            Gift links
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
            Share these privately. Each link can be claimed once.
          </p>
          <ul className="mt-4 space-y-2">
            {purchased.tickets
              .filter((t) => t.claim_url)
              .map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border/20 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-[11px] text-foreground/70">
                    Ticket #{t.ticket_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(t.claim_url!)}
                    className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase hover:text-foreground"
                  >
                    {copied === t.claim_url ? "Copied" : "Copy link"}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10">
        <Link
          href="/tickets/my"
          className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase hover:text-foreground"
        >
          View my tickets →
        </Link>
      </div>
    </div>
  );
}

function ReserveView({
  quantity,
  setQuantity,
  maxAllowed,
  totalDisplay,
  purchaseError,
  purchaseBusy,
  isAuthenticated,
  onSubmit
}: {
  quantity: number;
  setQuantity: (n: number) => void;
  maxAllowed: number;
  totalDisplay: string;
  purchaseError: string | null;
  purchaseBusy: boolean;
  isAuthenticated: boolean;
  onSubmit: () => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Reserve · {totalDisplay}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <span className="font-mono text-[11px] text-muted-foreground/60">
          Quantity
        </span>
        <div className="flex gap-2">
          {Array.from({ length: maxAllowed }).map((_, i) => {
            const n = i + 1;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setQuantity(n)}
                aria-pressed={quantity === n}
                className={`border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                  quantity === n
                    ? "border-foreground text-foreground"
                    : "border-border/30 text-foreground/60 hover:border-border/60"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {purchaseError ? (
        <p
          role="alert"
          className="mt-6 font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
        >
          {purchaseError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={purchaseBusy}
        className="mt-8 w-full border border-border/40 px-5 py-3 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
      >
        {purchaseBusy
          ? "Reserving…"
          : !isAuthenticated
            ? "Sign in to continue"
            : `Request ${quantity} · ${totalDisplay}`}
      </button>

      {!isAuthenticated ? (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
          You&apos;ll be redirected to sign in.
        </p>
      ) : null}
    </div>
  );
}
