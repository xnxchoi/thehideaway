"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/components/core/Link/Link";
import { useTransitionRouter } from "next-transition-router";
import { RPage } from "@/components/UX/Transition";
import { TicketBottomBar } from "@/components/UX/Ticket/TicketBottomBar";
import { authClient } from "@/lib/auth/client";
import { AnimatePresence, Variants } from "motion/react";
import * as m from "motion/react-m";
import { TextBlurIn } from "@/components/UX/Tour/TextBlurIn";
import { MotionPillButton } from "@/components/core/Button";
import { SPRING_EASE } from "@/constants/animations";
import { signInRedirectPath } from "@/lib/routes/auth";
import { cn } from "@/lib/utils";

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

const slideVariants: Variants = {
  initial: (dir: number) => ({
    y: dir > 0 ? "105%" : "-50%",
    opacity: 0,
    filter: "blur(6px)"
  }),
  animate: {
    y: "0%",
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      ...SPRING_EASE.power3.out,
      visualDuration: 0.6
    }
  },
  exit: (dir: number) => ({
    y: dir > 0 ? "-40%" : "90%",
    opacity: 0,
    filter: "blur(3px)",
    transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }
  })
};

/** Ordered indicator steps (skips welcome and purchased). */
const INDICATOR_STEPS: FlowStep[] = ["otp", "name", "reserve"];

function FlowStepIndicators({ current }: { current: FlowStep }) {
  const currentIdx = INDICATOR_STEPS.indexOf(current);
  if (currentIdx === -1) return null;
  return (
    <div className="flex items-center gap-2">
      {INDICATOR_STEPS.map((s, i) => {
        const isPast = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <m.div
            key={s}
            layout
            transition={{ type: "spring", ...SPRING_EASE.power2.out }}
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[10px] font-medium transition-colors",
              isPast
                ? "bg-foreground/20 text-foreground/50"
                : isActive
                  ? "bg-foreground text-background"
                  : "border border-border/30 text-foreground/30"
            )}
          >
            {isPast ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="text-foreground/70"
              >
                <path
                  d="M2 5.2L4.1 7.5L8 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span>{i + 1}</span>
            )}
          </m.div>
        );
      })}
    </div>
  );
}

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

  // ── Password gate ────────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  // ── Step state (4-step flow only) ────────────────────────────────────
  const useStepFlow = event.slug === STEP_FLOW_SLUG;
  const myTicketsHref = useStepFlow ? "/day-n-night/my" : "/tickets/my";
  const [step, setStep] = useState<FlowStep>("welcome");
  const [dir, setDir] = useState(1);

  const advanceTo = useCallback((next: FlowStep) => {
    setDir(1);
    setStep(next);
  }, []);

  // OTP sub-state
  const [otpEmail, setOtpEmail] = useState(sessionEmail ?? "");
  const [otpCodeSent, setOtpCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Purchaser display name
  const [purchaserName, setPurchaserNameInternal] = useState(sessionName ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const setPurchaserName = useCallback((value: string) => {
    setNameTouched(true);
    setPurchaserNameInternal(value);
  }, []);

  // Live session — Better Auth flips this after `signIn.emailOtp` succeeds.
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

  // Sync purchaser name from the live session when OTP sign-in lands mid-flow.
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

  const advanceFromWelcome = useCallback(() => {
    advanceTo(isAuthedNow ? "name" : "otp");
  }, [isAuthedNow, advanceTo]);

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
      advanceTo("name");
    } catch {
      setOtpError(t("otp.error"));
      setOtpCode("");
    } finally {
      setOtpBusy(false);
    }
  };

  const advanceFromName = () => {
    if (!purchaserName.trim()) return;
    advanceTo("reserve");
  };

  const submitPurchase = async () => {
    if (purchaseBusy || !storedPassword) return;
    if (!isAuthedNow) {
      router.push(signInRedirectPath(`/tickets/${event.slug}`));
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
      if (useStepFlow) advanceTo("purchased");
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

  // ── Step panel ───────────────────────────────────────────────────────
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
    if (purchased) {
      return (
        <PurchasedView
          purchased={purchased}
          paymentInstructions={event.payment_instructions}
          copied={copied}
          onCopy={copyClaim}
          myTicketsHref={myTicketsHref}
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

  const stepKey = purchased ? "purchased" : step;

  return (
    <RPage type="pages" slug={["tickets", event.slug]}>
      {!gateOpen ? (
        <EventGateScreen
          eventName={event.name}
          eventSlug={event.slug}
          dateDisplay={dateDisplay}
          location={event.location}
          password={password}
          setPassword={setPassword}
          gateBusy={gateBusy}
          gateError={gateError}
          onSubmit={submitGate}
        />
      ) : (
        /* ── Post-gate: event grid ── */
        <section className="relative z-[100] mx-auto w-full max-w-7xl px-6 pt-32 pb-32 xl:px-10 xl:pt-40 xl:pb-40">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 xl:gap-20">
            {/* Event hero */}
            <div>
              <m.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ fontSize: "clamp(3.5rem, 5vw, 5.5rem)" }}
                className="leading-[1.05] font-light tracking-tight"
              >
                {event.name}
              </m.h1>

              {dateDisplay ? (
                <m.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="mt-5 font-mono text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs"
                >
                  {dateDisplay}
                  {event.location ? ` · ${event.location}` : ""}
                </m.p>
              ) : null}

              {event.description ? (
                <m.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mt-7 max-w-prose text-sm leading-relaxed text-foreground/80 xl:text-base"
                >
                  {event.description}
                </m.p>
              ) : null}
            </div>

            {/* Right panel */}
            <aside className="lg:sticky lg:top-32 lg:self-start">
              {useStepFlow && !purchased && isOpen && !soldOut ? (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="mb-6"
                >
                  <FlowStepIndicators current={step} />
                </m.div>
              ) : null}

              <div className="overflow-hidden border-t border-border/20 pt-8">
                <AnimatePresence mode="wait" custom={dir}>
                  <m.div
                    key={stepKey}
                    data-step={stepKey}
                    data-testid="day-n-night-rsvp-step"
                    custom={dir}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {stepPanel}
                  </m.div>
                </AnimatePresence>
              </div>
            </aside>
          </div>
        </section>
      )}

      <TicketBottomBar
        eyebrow={gateOpen ? tBar("eyebrowOpen") : tBar("eyebrowLocked")}
        title={event.name}
        rightAction={
          isAuthedNow
            ? { label: tBar("myTickets"), href: myTicketsHref }
            : { label: tBar("backHome"), href: "/" }
        }
      />
    </RPage>
  );
}

function EventGateScreen({
  eventName,
  eventSlug,
  dateDisplay,
  location,
  password,
  setPassword,
  gateBusy,
  gateError,
  onSubmit
}: {
  eventName: string;
  eventSlug: string;
  dateDisplay: string;
  location: string | null;
  password: string;
  setPassword: (value: string) => void;
  gateBusy: boolean;
  gateError: string | null;
  onSubmit: () => void;
}) {
  const tGate = useTranslations("Event.Rsvp.gate");
  const isDayNNight = eventSlug === STEP_FLOW_SLUG;

  return (
    <section
      className={cn(
        "relative z-[100] min-h-svh overflow-hidden bg-[oklch(6%_0.04_260)] text-[oklch(96%_0.018_105)]",
        "[--event-blue:oklch(55%_0.25_255)] [--event-cyan:oklch(84%_0.16_190)] [--event-ink:oklch(6%_0.04_260)] [--event-line:oklch(96%_0.018_105_/_0.22)] [--event-pink:oklch(70%_0.25_335)] [--event-teal:oklch(72%_0.17_205)]",
        !isDayNNight &&
          "[--event-blue:oklch(62%_0.2_285)] [--event-cyan:oklch(82%_0.14_75)] [--event-pink:oklch(70%_0.21_30)] [--event-teal:oklch(72%_0.16_25)]"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-95"
        style={{
          background:
            "linear-gradient(120deg, oklch(4% 0.04 260) 0%, oklch(8% 0.07 250) 35%, oklch(5% 0.05 290) 68%, oklch(4% 0.04 230) 100%), conic-gradient(from 210deg at 18% 24%, oklch(0% 0 0 / 0) 0deg, oklch(72% 0.17 205 / 0.26) 70deg, oklch(70% 0.25 335 / 0.18) 115deg, oklch(0% 0 0 / 0) 165deg), linear-gradient(110deg, oklch(0% 0 0 / 0) 0 46%, oklch(84% 0.16 190 / 0.22) 46% 46.45%, oklch(0% 0 0 / 0) 46.45% 100%)"
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-screen"
        style={{ backgroundImage: "url('/assets/papier.png')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.24]"
        style={{
          background:
            "repeating-linear-gradient(0deg, oklch(100% 0 0 / 0.12) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, oklch(84% 0.16 190 / 0.09) 0 1px, transparent 1px 54px)"
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-18%] bottom-[-8%] h-[44svh] origin-bottom opacity-45"
        style={{
          transform: "perspective(720px) rotateX(62deg)",
          background:
            "repeating-linear-gradient(90deg, oklch(84% 0.16 190 / 0.2) 0 1px, transparent 1px 7%), repeating-linear-gradient(0deg, oklch(70% 0.25 335 / 0.18) 0 1px, transparent 1px 14%)"
        }}
      />
      <div className="relative grid min-h-svh grid-cols-1 gap-5 p-4 sm:p-5 md:p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.54fr)] lg:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(390px,0.48fr)] xl:gap-7 xl:p-8">
        <m.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            ...SPRING_EASE.power3.out,
            visualDuration: 0.55
          }}
          className="relative flex min-h-[52svh] min-w-0 flex-col justify-between overflow-hidden border border-[var(--event-line)] bg-[oklch(7%_0.05_260_/_0.58)] p-4 shadow-[0_26px_90px_-42px_var(--event-cyan),inset_0_1px_0_oklch(100%_0_0_/_0.14)] backdrop-blur-xl sm:p-6 md:p-8 lg:min-h-[calc(100svh-3rem)] xl:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-75"
            style={{
              background:
                "linear-gradient(145deg, oklch(84% 0.16 190 / 0.13), transparent 28%), linear-gradient(315deg, oklch(70% 0.25 335 / 0.12), transparent 42%)"
            }}
          />
          <div className="relative flex min-w-0 items-start justify-between gap-4 border-b border-white/15 pb-4">
            <p className="font-mono text-[11px] font-semibold tracking-[0.24em] text-[var(--event-cyan)] uppercase">
              {tGate("eyebrow")}
            </p>
            <p className="max-w-[12rem] text-right font-mono text-[10px] leading-relaxed font-medium tracking-[0.18em] text-white/65 uppercase sm:max-w-none">
              {dateDisplay || tGate("dateFallback")}
              {location ? (
                <>
                  <br />
                  {location}
                </>
              ) : null}
            </p>
          </div>

          <div className="relative grid min-w-0 gap-5 py-8 md:py-10 xl:py-12">
            <p className="font-mono text-[10px] font-semibold tracking-[0.28em] text-white/62 uppercase">
              {tGate("statusLine")}
            </p>
            <h1 className="max-w-[10ch] min-w-0 bg-[linear-gradient(100deg,oklch(98%_0.02_105),var(--event-cyan)_34%,var(--event-pink)_72%,oklch(92%_0.08_285))] bg-clip-text text-6xl leading-[0.86] font-black break-words text-transparent text-balance uppercase drop-shadow-[0_0_28px_oklch(84%_0.16_190_/_0.22)] sm:text-7xl md:text-8xl xl:text-9xl">
              {eventName}
            </h1>
            <div className="flex w-full max-w-[28rem] items-center gap-3">
              <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--event-cyan),transparent)]" />
              <span className="h-2 w-2 rotate-45 bg-[var(--event-pink)] shadow-[0_0_18px_var(--event-pink)]" />
              <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--event-teal))]" />
            </div>
          </div>

          <div className="relative grid grid-cols-2 border-t border-white/15 pt-4 font-mono text-[10px] font-semibold tracking-[0.2em] text-white/66 uppercase sm:grid-cols-4">
            <span className="border-r border-white/15 pr-3 text-[var(--event-cyan)]">
              {tGate("meta.private")}
            </span>
            <span className="border-r border-white/15 px-3">
              {tGate("meta.ticket")}
            </span>
            <span className="border-r border-white/15 px-3 max-sm:border-r-0">
              {tGate("meta.gate")}
            </span>
            <span className="pl-3 max-sm:pt-2">
              {tGate("meta.sequence")}
            </span>
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            ...SPRING_EASE.power3.out,
            visualDuration: 0.55,
            delay: 0.08
          }}
          className="relative flex min-w-0 flex-col justify-end overflow-hidden border border-white/20 bg-[oklch(98%_0.018_105_/_0.08)] p-4 text-white shadow-[0_26px_86px_-42px_var(--event-pink),inset_0_1px_0_oklch(100%_0_0_/_0.2)] backdrop-blur-2xl sm:p-6 lg:min-h-[calc(100svh-3rem)] xl:p-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "linear-gradient(180deg, oklch(100% 0 0 / 0.12), transparent 22%), repeating-linear-gradient(135deg, oklch(84% 0.16 190 / 0.08) 0 1px, transparent 1px 18px)"
            }}
          />
          <div className="relative grid gap-7">
            <div className="grid gap-3">
              <p className="font-mono text-[10px] font-semibold tracking-[0.24em] text-[var(--event-cyan)] uppercase">
                {tGate("consoleEyebrow")}
              </p>
              <h2 className="text-4xl leading-[0.96] font-semibold tracking-normal text-balance uppercase sm:text-5xl xl:text-6xl">
                {tGate("title")}
              </h2>
              <p className="max-w-[30rem] font-mono text-[12px] leading-relaxed font-medium text-white/68">
                {tGate("body")}
              </p>
            </div>

            <form
              className="grid min-w-0 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
              }}
            >
              <label
                htmlFor="gate-passcode"
                className="font-mono text-[10px] font-semibold tracking-[0.22em] text-white/72 uppercase"
              >
                {tGate("passcodeLabel")}
              </label>
              <input
                id="gate-passcode"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                aria-label={tGate("passcodeLabel")}
                autoComplete="off"
                spellCheck={false}
                className="min-h-16 w-full min-w-0 border border-white/22 bg-[oklch(4%_0.035_260_/_0.62)] px-4 font-mono text-2xl font-semibold tracking-[0.2em] text-[oklch(96%_0.018_105)] uppercase shadow-[inset_0_1px_0_oklch(100%_0_0_/_0.1),0_0_0_1px_oklch(84%_0.16_190_/_0.04)] outline-none transition-[border-color,box-shadow,background-color] duration-300 placeholder:text-white/25 focus:border-[var(--event-cyan)] focus:bg-[oklch(5%_0.045_255_/_0.78)] focus:shadow-[0_0_34px_oklch(84%_0.16_190_/_0.22),inset_0_1px_0_oklch(100%_0_0_/_0.14)] sm:text-3xl"
              />
              {gateError ? (
                <m.p
                  role="alert"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-[oklch(72%_0.25_25_/_0.65)] bg-[oklch(16%_0.08_25_/_0.74)] px-3 py-2 font-mono text-[11px] font-semibold tracking-[0.12em] text-[oklch(86%_0.18_35)] uppercase"
                >
                  {gateError}
                </m.p>
              ) : null}
              <button
                type="submit"
                disabled={gateBusy || !password.trim()}
                className="min-h-16 w-full border border-white/25 bg-[linear-gradient(100deg,var(--event-cyan),var(--event-teal)_48%,var(--event-pink))] px-5 text-left font-mono text-sm font-black tracking-[0.22em] text-[var(--event-ink)] uppercase shadow-[0_18px_44px_-24px_var(--event-cyan),0_0_34px_oklch(70%_0.25_335_/_0.18)] transition-[filter,transform,opacity] duration-300 hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:text-base"
              >
                {gateBusy ? tGate("submitting") : tGate("submit")}
              </button>
            </form>
          </div>
        </m.div>
      </div>
    </section>
  );
}

/**
 * Welcome step — first screen after the password gate clears.
 */
function WelcomeStep({ onStart }: { onStart: () => void }) {
  const t = useTranslations("Event.Rsvp.steps.welcome");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          {t("eyebrow")}
        </p>
        <TextBlurIn
          as="h2"
          text={t("title")}
          style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)" }}
          className="mt-3 leading-[1.1] font-light tracking-tight"
          stagger={0.05}
          delay={0.1}
          yOffset={6}
          blurAmount={5}
          duration={0.75}
        />
        <p className="mt-4 max-w-prose font-mono text-[11px] leading-relaxed text-foreground/70">
          {t("body")}
        </p>
      </div>
      <MotionPillButton
        type="button"
        size="md"
        onClick={onStart}
        className="self-start bg-foreground text-[13px] font-medium text-background"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {t("cta")}
      </MotionPillButton>
    </div>
  );
}

/**
 * OTP step — collects email, sends 6-digit code, verifies.
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
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          {t("eyebrow")}
        </p>
        <TextBlurIn
          as="h2"
          text={t("title")}
          style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)" }}
          className="mt-3 leading-[1.1] font-light tracking-tight"
          stagger={0.05}
          delay={0.05}
          yOffset={6}
          blurAmount={5}
          duration={0.7}
        />
      </div>

      <AnimatePresence mode="wait">
        {!codeSent ? (
          <m.form
            key="email-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
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
              <m.p
                role="alert"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
              >
                {error}
              </m.p>
            ) : null}
            <MotionPillButton
              type="submit"
              size="md"
              disabled={busy || !email.trim()}
              className="min-w-[7rem] self-start bg-foreground text-[13px] font-medium whitespace-nowrap text-background disabled:opacity-40"
            >
              {busy ? "…" : t("sendCode")}
            </MotionPillButton>
          </m.form>
        ) : (
          <m.form
            key="code-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
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
              <m.p
                role="alert"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
              >
                {error}
              </m.p>
            ) : null}
            <div className="flex items-center gap-4">
              <MotionPillButton
                type="submit"
                size="md"
                disabled={busy || code.length < 6}
                className="bg-foreground text-[13px] font-medium text-background disabled:opacity-40"
              >
                {busy ? "…" : t("submit")}
              </MotionPillButton>
              <MotionPillButton
                type="button"
                size="md"
                onClick={onResend}
                className="text-[13px] text-foreground/50"
              >
                {t("resend")}
              </MotionPillButton>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground/60">
              {email}
            </p>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Name step — captures the display name stamped on ticket-orders.purchaser_name.
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
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          {t("eyebrow")}
        </p>
        <TextBlurIn
          as="h2"
          text={t("title")}
          style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)" }}
          className="mt-3 leading-[1.1] font-light tracking-tight"
          stagger={0.05}
          delay={0.05}
          yOffset={6}
          blurAmount={5}
          duration={0.7}
        />
      </div>
      <form
        className="flex flex-col gap-4"
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
        <MotionPillButton
          type="submit"
          size="md"
          disabled={!name.trim()}
          className="self-start bg-foreground text-[13px] font-medium text-background disabled:opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {t("submit")}
        </MotionPillButton>
      </form>
    </div>
  );
}

function PurchasedView({
  purchased,
  paymentInstructions,
  copied,
  onCopy,
  myTicketsHref
}: {
  purchased: PurchaseResult;
  paymentInstructions: string | null;
  copied: string | null;
  onCopy: (url: string) => void;
  myTicketsHref: string;
}) {
  const t = useTranslations("Event.Rsvp.purchased");
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          {t("eyebrow")}
        </p>
        <TextBlurIn
          as="h2"
          text={t("reserved", {
            quantity: purchased.tickets.length,
            total: formatKRW(purchased.total_amount)
          })}
          style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)" }}
          className="mt-3 leading-[1.1] font-light tracking-tight"
          stagger={0.04}
          delay={0.1}
          yOffset={5}
          blurAmount={5}
          duration={0.75}
        />
      </div>

      {paymentInstructions ? (
        <p className="max-w-prose font-mono text-[11px] leading-relaxed whitespace-pre-line text-foreground/75 xl:text-xs">
          {paymentInstructions}
        </p>
      ) : (
        <p className="max-w-prose font-mono text-[11px] text-muted-foreground/60">
          {t("instructionsFallback")}
        </p>
      )}

      {purchased.tickets.some((tx) => tx.claim_url) ? (
        <div className="border-t border-border/20 pt-6">
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
                <m.li
                  key={tx.id}
                  data-testid="gift-claim-link"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/20 bg-foreground/[0.025] px-4 py-3"
                >
                  <span className="font-mono text-[11px] text-foreground/70">
                    {t("giftLinks.ticketNumber", { number: tx.ticket_number })}
                  </span>
                  <MotionPillButton
                    type="button"
                    size="sm"
                    onClick={() => onCopy(tx.claim_url!)}
                    className="text-[12px] text-foreground/80"
                  >
                    {copied === tx.claim_url
                      ? t("giftLinks.copied")
                      : t("giftLinks.copy")}
                  </MotionPillButton>
                </m.li>
              ))}
          </ul>
        </div>
      ) : null}

      <div>
        <Link
          href={myTicketsHref}
          data-testid="view-my-tickets"
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
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          {t("eyebrow", { total: totalDisplay })}
        </p>
        <TextBlurIn
          as="h2"
          text={totalDisplay}
          style={{ fontSize: "clamp(2.4rem, 4vw, 3.6rem)" }}
          className="mt-2 leading-[1.1] font-light tracking-tight tabular-nums"
          stagger={0.04}
          delay={0.05}
          yOffset={5}
          blurAmount={5}
          duration={0.7}
        />
      </div>

      <div
        className="flex items-center gap-3"
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
              <m.button
                key={n}
                type="button"
                onClick={() => setQuantity(n)}
                aria-pressed={quantity === n}
                aria-label={String(n)}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border font-mono text-[11px] transition-colors",
                  quantity === n
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/30 text-foreground/60 hover:border-border/60"
                )}
              >
                {n}
              </m.button>
            );
          })}
        </div>
      </div>

      {purchaseError ? (
        <m.p
          role="alert"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-[11px] text-[oklch(0.7_0.18_30)]"
        >
          {purchaseError}
        </m.p>
      ) : null}

      <MotionPillButton
        type="button"
        size="lg"
        onClick={onSubmit}
        disabled={purchaseBusy}
        className="w-full bg-foreground text-[13px] font-medium text-background disabled:opacity-40"
      >
        {purchaseBusy
          ? t("submitting")
          : !isAuthenticated
            ? t("signInRequired")
            : t("submit", { quantity, total: totalDisplay })}
      </MotionPillButton>

      {!isAuthenticated ? (
        <p className="font-mono text-[11px] text-muted-foreground/60">
          {t("signInRedirectHint")}
        </p>
      ) : null}
    </div>
  );
}
