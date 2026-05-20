"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/components/core/Link/Link";
import { useTransitionRouter } from "next-transition-router";
import { RPage } from "@/components/UX/Transition";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";
import { authClient } from "@/lib/auth/client";

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
  payment_instructions: string | null;
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
  sessionEmail: string | null;
  sessionName: string | null;
}

/**
 * Slug that opts into the 4-step purchase flow (P4C-1). All other event
 * slugs keep the legacy single-screen gated reserve panel so we don't
 * change behavior for unrelated events.
 */
const STEP_FLOW_SLUG = "day-n-night";

/** Steps in the 4-step purchase flow. `welcome` is the entry; `purchased`
 * is the terminal success view. `otp` is skipped when the user already
 * has an authenticated session. */
type FlowStep = "welcome" | "otp" | "name" | "reserve" | "purchased";

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
  isAuthenticated,
  sessionEmail,
  sessionName
}: Props) {
  const router = useTransitionRouter();
  const t = useTranslations("Event.Rsvp.steps");
  const tGate = useTranslations("Event.Rsvp.gate");
  const tStatus = useTranslations("Event.Rsvp.status");
  const tBar = useTranslations("Event.Rsvp.bar");

  // ── Password gate (unchanged) ────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  // ── Step state (4-step flow only) ────────────────────────────────────
  const useStepFlow = event.slug === STEP_FLOW_SLUG;
  const [step, setStep] = useState<FlowStep>("welcome");

  // OTP sub-state
  const [otpEmail, setOtpEmail] = useState(sessionEmail ?? "");
  const [otpCodeSent, setOtpCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Purchaser display name (stamped on `ticket-orders.purchaser_name`).
  // `nameTouched` flips on the first user edit so we don't clobber typed
  // input when the live session arrives mid-flow (see effect below).
  const [purchaserName, setPurchaserNameInternal] = useState(sessionName ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const setPurchaserName = useCallback((value: string) => {
    setNameTouched(true);
    setPurchaserNameInternal(value);
  }, []);

  // Live session — Better Auth flips this after `signIn.emailOtp` succeeds,
  // which lets us treat the OTP step as "done" without a page reload.
  const { data: liveSession } = authClient.useSession();
  const isAuthedNow =
    isAuthenticated || Boolean((liveSession?.user as { id?: string })?.id);

  // ── Purchase state ───────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<PurchaseResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Restore cached gate password on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem(SS_KEY(event.slug));
    if (cached) {
      setStoredPassword(cached);
      setGateOpen(true);
    }
  }, [event.slug]);

  // Sync purchaser name from the live session when an OTP sign-in lands
  // mid-flow. We only overwrite when the user hasn't typed yet
  // (`nameTouched === false`), so a user who edited their name during
  // the OTP step keeps their input. Idempotent: re-runs are no-ops when
  // the value is already in sync.
  const liveSessionName = (
    liveSession?.user as { name?: string | null } | undefined
  )?.name;
  useEffect(() => {
    if (nameTouched) return;
    if (!liveSessionName) return;
    if (liveSessionName === purchaserName) return;
    setPurchaserNameInternal(liveSessionName);
  }, [liveSessionName, nameTouched, purchaserName]);

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
        setGateError(tGate("errors.invalid"));
        setGateBusy(false);
        return;
      }
      sessionStorage.setItem(SS_KEY(event.slug), password.trim());
      setStoredPassword(password.trim());
      setGateOpen(true);
    } catch {
      setGateError(tGate("errors.network"));
    } finally {
      setGateBusy(false);
    }
  };

  // Step transitions for the 4-step flow. When the user is already
  // authed we skip OTP because the session already proves email control.
  const advanceFromWelcome = useCallback(() => {
    setStep(isAuthedNow ? "name" : "otp");
  }, [isAuthedNow]);

  const sendOtp = async () => {
    if (otpBusy || !otpEmail.trim()) return;
    setOtpBusy(true);
    setOtpError(null);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: otpEmail.trim(),
        type: "sign-in",
        fetchOptions: { throw: true }
      });
      setOtpCodeSent(true);
    } catch {
      setOtpError(t("otp.error"));
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (otpBusy || otpCode.trim().length < 6) return;
    setOtpBusy(true);
    setOtpError(null);
    try {
      await authClient.signIn.emailOtp({
        email: otpEmail.trim(),
        otp: otpCode.trim(),
        fetchOptions: { throw: true }
      });
      // `useSession` updates asynchronously after sign-in. We advance
      // optimistically: by the time the user fills in `name`, the
      // session cookie is set and the purchase POST will succeed.
      setStep("name");
    } catch {
      setOtpError(t("otp.error"));
      setOtpCode("");
    } finally {
      setOtpBusy(false);
    }
  };

  const advanceFromName = () => {
    if (!purchaserName.trim()) return;
    setStep("reserve");
  };

  const submitPurchase = async () => {
    if (purchaseBusy || !storedPassword) return;
    if (!isAuthedNow) {
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
          password: storedPassword,
          // Only send when explicitly collected — legacy single-screen
          // callers omit this and the server falls back to session name.
          ...(useStepFlow && purchaserName.trim()
            ? { purchaser_name: purchaserName.trim() }
            : {})
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
      if (useStepFlow) setStep("purchased");
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

  // ── Render ───────────────────────────────────────────────────────────
  // Right-column step panel for the 4-step flow. Legacy single-screen
  // events just go straight to ReserveView / PurchasedView like before.
  const stepPanel = (() => {
    if (!isOpen) {
      return (
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
          {event.state === "ended" ? tStatus("ended") : tStatus("closed")}
        </p>
      );
    }
    if (soldOut) {
      return (
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
          {tStatus("soldOut")}
        </p>
      );
    }
    // The `purchased` early-return covers BOTH flows: the step machine's
    // terminal state and the legacy single-screen path converge here, so
    // we don't need a separate `case "purchased"` branch in the switch
    // below. `step === "purchased"` exists only to make the state
    // sequence legible to readers — it never renders.
    if (purchased) {
      return (
        <PurchasedView
          purchased={purchased}
          paymentInstructions={event.payment_instructions}
          copied={copied}
          onCopy={copyClaim}
        />
      );
    }
    if (useStepFlow) {
      switch (step) {
        case "welcome":
          return <WelcomeStep onStart={advanceFromWelcome} />;
        case "otp":
          return (
            <OtpStep
              email={otpEmail}
              setEmail={setOtpEmail}
              codeSent={otpCodeSent}
              code={otpCode}
              setCode={setOtpCode}
              busy={otpBusy}
              error={otpError}
              onSend={sendOtp}
              onVerify={verifyOtp}
              onResend={() => {
                setOtpCodeSent(false);
                setOtpCode("");
                setOtpError(null);
              }}
            />
          );
        case "name":
          return (
            <NameStep
              name={purchaserName}
              setName={setPurchaserName}
              onContinue={advanceFromName}
            />
          );
        case "reserve":
        case "purchased":
          return (
            <ReserveView
              quantity={quantity}
              setQuantity={setQuantity}
              maxAllowed={maxAllowed}
              totalDisplay={totalDisplay}
              purchaseError={purchaseError}
              purchaseBusy={purchaseBusy}
              isAuthenticated={isAuthedNow}
              onSubmit={submitPurchase}
            />
          );
      }
    }
    return (
      <ReserveView
        quantity={quantity}
        setQuantity={setQuantity}
        maxAllowed={maxAllowed}
        totalDisplay={totalDisplay}
        purchaseError={purchaseError}
        purchaseBusy={purchaseBusy}
        isAuthenticated={isAuthedNow}
        onSubmit={submitPurchase}
      />
    );
  })();

  return (
    <RPage type="pages" slug={["tickets", event.slug]}>
      <section className="mx-auto w-full max-w-7xl px-6 pt-32 pb-32 xl:px-10 xl:pt-40 xl:pb-40">
        {!gateOpen ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                {tGate("eyebrow")}
              </p>
              <h2 className="mt-3 text-xl font-light tracking-tight xl:text-2xl">
                {tGate("title")}
              </h2>
              <p className="mt-3 max-w-md font-mono text-[11px] text-muted-foreground/60">
                {tGate("body")}
              </p>
            </div>

            <form
              className="flex max-w-md flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitGate();
              }}
            >
              <label htmlFor="gate-passcode" className="sr-only">
                {tGate("passcodeLabel")}
              </label>
              <input
                id="gate-passcode"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tGate("passcodeLabel")}
                aria-label={tGate("passcodeLabel")}
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
                {gateBusy ? tGate("submitting") : tGate("submit")}
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 xl:gap-20">
            {/* Event hero — constant anchor across all steps */}
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

            {/* Right panel: step-aware (4-step flow) or reserve/purchased
                (legacy single-screen). */}
            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="border-t border-border/20 pt-8">{stepPanel}</div>
            </aside>
          </div>
        )}
      </section>

      <TicketBottomBar
        eyebrow={gateOpen ? tBar("eyebrowOpen") : tBar("eyebrowLocked")}
        title={event.name}
        rightAction={
          isAuthedNow
            ? { label: tBar("myTickets"), href: "/tickets/my" }
            : { label: tBar("backHome"), href: "/" }
        }
      />
    </RPage>
  );
}

/**
 * Welcome step — first screen after the password gate clears. Sets the
 * expectation ("two minutes, no account required") and primes the user
 * for the OTP step that follows.
 */
function WelcomeStep({ onStart }: { onStart: () => void }) {
  const t = useTranslations("Event.Rsvp.steps.welcome");
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {t("eyebrow")}
      </p>
      <h2 className="mt-3 text-xl font-light tracking-tight xl:text-2xl">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-prose font-mono text-[11px] leading-relaxed text-foreground/70">
        {t("body")}
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 self-start border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
      >
        {t("cta")}
      </button>
    </div>
  );
}

/**
 * OTP step — collects the user's email, sends a 6-digit Better Auth code,
 * and verifies it. On verify success, advances to the name step;
 * `authClient.useSession()` flips the parent's `isAuthedNow` derivation.
 */
function OtpStep({
  email,
  setEmail,
  codeSent,
  code,
  setCode,
  busy,
  error,
  onSend,
  onVerify,
  onResend
}: {
  email: string;
  setEmail: (v: string) => void;
  codeSent: boolean;
  code: string;
  setCode: (v: string) => void;
  busy: boolean;
  error: string | null;
  onSend: () => void;
  onVerify: () => void;
  onResend: () => void;
}) {
  const t = useTranslations("Event.Rsvp.steps.otp");
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {t("eyebrow")}
      </p>
      <h2 className="mt-3 text-xl font-light tracking-tight xl:text-2xl">
        {t("title")}
      </h2>

      {!codeSent ? (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <label htmlFor="otp-email" className="sr-only">
            {t("emailPlaceholder")}
          </label>
          <input
            id="otp-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            aria-label={t("emailPlaceholder")}
            autoComplete="email"
            spellCheck={false}
            inputMode="email"
            className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
          />
          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
            >
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="mt-2 self-start border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
          >
            {busy ? "…" : t("sendCode")}
          </button>
        </form>
      ) : (
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onVerify();
          }}
        >
          <label htmlFor="otp-code" className="sr-only">
            {t("codePlaceholder")}
          </label>
          <input
            id="otp-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder={t("codePlaceholder")}
            aria-label={t("codePlaceholder")}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight tabular-nums placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
          />
          {error ? (
            <p
              role="alert"
              className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
            >
              {error}
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-4">
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
            >
              {busy ? "…" : t("submit")}
            </button>
            <button
              type="button"
              onClick={onResend}
              className="font-mono text-[11px] tracking-widest text-foreground/60 uppercase transition-colors hover:text-foreground"
            >
              {t("resend")}
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
            {email}
          </p>
        </form>
      )}
    </div>
  );
}

/**
 * Name step — captures the display name that will be stamped on the
 * `ticket-orders.purchaser_name` column and surfaced on /day-n-night/my.
 * Pre-filled from the session name when available so signed-in users
 * just confirm rather than retype.
 */
function NameStep({
  name,
  setName,
  onContinue
}: {
  name: string;
  setName: (v: string) => void;
  onContinue: () => void;
}) {
  const t = useTranslations("Event.Rsvp.steps.name");
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {t("eyebrow")}
      </p>
      <h2 className="mt-3 text-xl font-light tracking-tight xl:text-2xl">
        {t("title")}
      </h2>
      <form
        className="mt-8 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onContinue();
        }}
      >
        <label htmlFor="purchaser-name" className="sr-only">
          {t("placeholder")}
        </label>
        <input
          id="purchaser-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          autoComplete="name"
          maxLength={120}
          className="w-full border-b border-border/30 bg-transparent pb-2 text-sm font-light tracking-tight placeholder:text-muted-foreground/30 focus:border-foreground/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-2 self-start border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}

function PurchasedView({
  purchased,
  paymentInstructions,
  copied,
  onCopy
}: {
  purchased: PurchaseResult;
  paymentInstructions: string | null;
  copied: string | null;
  onCopy: (url: string) => void;
}) {
  const t = useTranslations("Event.Rsvp.purchased");
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {t("eyebrow")}
      </p>
      <h2 className="mt-3 text-xl font-light tracking-tight xl:text-2xl">
        {t("reserved", {
          quantity: purchased.tickets.length,
          total: formatKRW(purchased.total_amount)
        })}
      </h2>

      {paymentInstructions ? (
        <p className="mt-5 max-w-prose font-mono text-[11px] leading-relaxed whitespace-pre-line text-foreground/75 xl:text-xs">
          {paymentInstructions}
        </p>
      ) : (
        <p className="mt-5 max-w-prose font-mono text-[11px] text-muted-foreground/60">
          {t("instructionsFallback")}
        </p>
      )}

      {purchased.tickets.some((tx) => tx.claim_url) ? (
        <div className="mt-10 border-t border-border/20 pt-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
            {t("giftLinks.eyebrow")}
          </p>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
            {t("giftLinks.body")}
          </p>
          <ul className="mt-4 space-y-2">
            {purchased.tickets
              .filter((tx) => tx.claim_url)
              .map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-sm border border-border/20 px-4 py-3 text-sm"
                >
                  <span className="font-mono text-[11px] text-foreground/70">
                    {t("giftLinks.ticketNumber", { number: tx.ticket_number })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(tx.claim_url!)}
                    className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase hover:text-foreground"
                  >
                    {copied === tx.claim_url
                      ? t("giftLinks.copied")
                      : t("giftLinks.copy")}
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
          {t("viewMy")}
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
  const t = useTranslations("Event.Rsvp.reserve");
  return (
    <div>
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {t("eyebrow", { total: totalDisplay })}
      </p>
      <div
        className="mt-4 flex items-center gap-3"
        role="group"
        aria-label={t("quantityGroupLabel")}
      >
        <span className="font-mono text-[11px] text-muted-foreground/60">
          {t("quantityLabel")}
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
                aria-label={String(n)}
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
          ? t("submitting")
          : !isAuthenticated
            ? t("signInRequired")
            : t("submit", { quantity, total: totalDisplay })}
      </button>

      {!isAuthenticated ? (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
          {t("signInRedirectHint")}
        </p>
      ) : null}
    </div>
  );
}
