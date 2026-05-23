"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
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
import { EventGateGradient } from "@/components/UX/Gradient/EventGateGradient";
import { useRPStore } from "@/providers/RP_Pro";
import { ViewportMask } from "@/components/sections/DayNNight/ViewportMask";
import { prepareDayNNightPurchaserAction } from "./actions";

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
  gateInitiallyOpen?: boolean;
}

/**
 * Slug that opts into the 4-step purchase flow (P4C-1). All other event
 * slugs keep the legacy single-screen gated reserve panel so we don't
 * change behavior for unrelated events.
 */
const STEP_FLOW_SLUG = "day-n-night";
const NOISE_TEXTURE_STYLE = { backgroundImage: "url('/assets/noise.png')" };
const PAPER_TEXTURE_STYLE = { backgroundImage: "url('/assets/papier.png')" };

/** Steps in the Day n Night purchase flow. `welcome` is the entry; `purchased`
 * is the terminal success view. `contact` silently provisions the ticket
 * purchaser session for invitees who are not already signed in. */
type FlowStep = "welcome" | "name" | "contact" | "reserve" | "purchased";

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

function FlowStepIndicators({
  current,
  steps
}: {
  current: FlowStep;
  steps: FlowStep[];
}) {
  const currentIdx = steps.indexOf(current);
  if (currentIdx === -1) return null;
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
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
  sessionName,
  gateInitiallyOpen = false
}: Props) {
  const router = useTransitionRouter();
  const t = useTranslations("Event.Rsvp.steps");
  const tGate = useTranslations("Event.Rsvp.gate");
  const tStatus = useTranslations("Event.Rsvp.status");
  const tBar = useTranslations("Event.Rsvp.bar");
  const tErrors = useTranslations("Event.Rsvp.errors");
  const setHeaderVisibility = useRPStore((r) => r.setHeaderVisibility);
  const setFXFrameVisibility = useRPStore((r) => r.setFXFrameVisibility);

  // ── Password gate ────────────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(gateInitiallyOpen);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateUnlocking, setGateUnlocking] = useState(false);

  // ── Step state (4-step flow only) ────────────────────────────────────
  const useStepFlow = event.slug === STEP_FLOW_SLUG;
  const myTicketsHref = useStepFlow ? "/day-n-night/my" : "/tickets/my";
  const signInHref = signInRedirectPath(`/tickets/${event.slug}`);
  const [step, setStep] = useState<FlowStep>("welcome");
  const [dir, setDir] = useState(1);
  const indicatorSteps = useMemo<FlowStep[]>(
    () => (isAuthenticated ? ["name", "reserve"] : ["name", "contact", "reserve"]),
    [isAuthenticated]
  );

  useEffect(() => {
    if (!useStepFlow) return;

    const header = document.getElementById("rp-header");
    setHeaderVisibility(false);
    setFXFrameVisibility(false);
    document.body.setAttribute("data-dn-rsvp", "true");
    header?.style.setProperty("display", "none", "important");

    return () => {
      setHeaderVisibility(true);
      setFXFrameVisibility(true);
      document.body.removeAttribute("data-dn-rsvp");
      header?.style.removeProperty("display");
    };
  }, [setFXFrameVisibility, setHeaderVisibility, useStepFlow]);

  const advanceTo = useCallback((next: FlowStep) => {
    setDir(1);
    setStep(next);
  }, []);

  // Contact step state
  const [contactEmail, setContactEmailInternal] = useState(sessionEmail ?? "");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactNeedsLogin, setContactNeedsLogin] = useState(false);
  const [sessionBootstrapped, setSessionBootstrapped] = useState(false);
  const updateContactEmail = useCallback((value: string) => {
    setContactError(null);
    setContactNeedsLogin(false);
    setContactEmailInternal(value);
  }, []);

  // Purchaser display name
  const [purchaserName, setPurchaserNameInternal] = useState(sessionName ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const setPurchaserName = useCallback((value: string) => {
    setNameTouched(true);
    setPurchaserNameInternal(value);
  }, []);

  // Live session — Better Auth flips this after the contact step or a
  // normal sign-in succeeds.
  const { data: liveSession } = authClient.useSession();
  const isAuthedNow =
    isAuthenticated ||
    sessionBootstrapped ||
    Boolean((liveSession?.user as { id?: string })?.id);

  // ── Purchase state ───────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<PurchaseResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Restore cached gate password on mount.
  useEffect(() => {
    if (gateInitiallyOpen) return;
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem(SS_KEY(event.slug));
    if (cached) {
      setStoredPassword(cached);
      setGateOpen(true);
    }
  }, [event.slug, gateInitiallyOpen]);

  // Sync purchaser name from the live session when sign-in lands mid-flow.
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
      setGateUnlocking(true);
      await new Promise((resolve) => setTimeout(resolve, 1550));
      setGateOpen(true);
    } catch {
      setGateError(tGate("errors.network"));
      setGateUnlocking(false);
    } finally {
      setGateBusy(false);
    }
  };

  const advanceFromWelcome = useCallback(() => {
    advanceTo("name");
  }, [advanceTo]);

  const advanceFromName = () => {
    if (!purchaserName.trim()) return;
    advanceTo(isAuthedNow ? "reserve" : "contact");
  };

  const continueFromContact = async () => {
    if (contactBusy || !contactEmail.trim() || !purchaserName.trim()) return;

    setContactBusy(true);
    setContactError(null);
    setContactNeedsLogin(false);

    try {
      const result = await prepareDayNNightPurchaserAction({
        email: contactEmail.trim(),
        name: purchaserName.trim()
      });

      if (result.ok) {
        setSessionBootstrapped(true);
        advanceTo("reserve");
        return;
      }

      if (result.reason === "existing-account-login-required") {
        setContactNeedsLogin(true);
        return;
      }

      setContactError(t("contact.continueError"));
    } catch {
      setContactError(t("contact.continueError"));
    } finally {
      setContactBusy(false);
    }
  };

  const mapPurchaseError = useCallback(
    (error?: string) => {
      switch (error) {
        case "unauthorized":
          return tErrors("unauthorized");
        case "invalid-password":
          return tErrors("invalidPassword");
        case "event-not-open":
          return tErrors("eventNotOpen");
        case "sold-out":
          return tErrors("soldOut");
        case "user-cap-reached":
          return tErrors("userCapReached");
        case "bad-request":
          return tErrors("badRequest");
        default:
          return tErrors("generic");
      }
    },
    [tErrors]
  );

  const submitPurchase = async () => {
    if (purchaseBusy || (!useStepFlow && !storedPassword)) return;
    if (!isAuthedNow) {
      router.push(signInHref);
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
          ...(storedPassword ? { password: storedPassword } : {}),
          ...(useStepFlow && purchaserName.trim()
            ? { purchaser_name: purchaserName.trim() }
            : {})
        })
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setPurchaseError(mapPurchaseError(out.error));
        setPurchaseBusy(false);
        return;
      }
      setPurchased({
        tickets: out.tickets,
        total_amount: out.total_amount
      });
      if (useStepFlow) advanceTo("purchased");
    } catch {
      setPurchaseError(tErrors("generic"));
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
        <p className="font-sans text-[11px] tracking-widest text-muted-foreground/60 uppercase">
          {event.state === "ended" ? tStatus("ended") : tStatus("closed")}
        </p>
      );
    }
    if (soldOut) {
      return (
        <p className="font-sans text-[11px] tracking-widest text-muted-foreground/60 uppercase">
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
        case "contact":
          return (
            <ContactStep
              email={contactEmail}
              setEmail={updateContactEmail}
              busy={contactBusy}
              error={contactError}
              needsLogin={contactNeedsLogin}
              signInHref={signInHref}
              onContinue={continueFromContact}
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
    <RPage
      type="pages"
      slug={["tickets", event.slug]}
      headerVisibility={!useStepFlow}
    >
      {!gateOpen ? (
        <EventGateScreen
          eventSlug={event.slug}
          password={password}
          setPassword={setPassword}
          gateBusy={gateBusy}
          gateUnlocking={gateUnlocking}
          gateError={gateError}
          onSubmit={submitGate}
        />
      ) : useStepFlow ? (
        <DayNNightRsvpStage
          step={step}
          stepKey={stepKey}
          dir={dir}
          indicatorSteps={indicatorSteps}
          isOpen={isOpen}
          soldOut={soldOut}
          purchased={Boolean(purchased)}
        >
          {stepPanel}
        </DayNNightRsvpStage>
      ) : (
        /* ── Legacy post-gate: event grid ── */
        <section className="relative z-[100] mx-auto w-full max-w-7xl px-6 pt-32 pb-32 xl:px-10 xl:pt-40 xl:pb-40">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16 xl:gap-20">
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
                  className="mt-5 font-sans text-[11px] tracking-widest text-foreground/70 uppercase xl:text-xs"
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

            <aside className="lg:sticky lg:top-32 lg:self-start">
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

      {!useStepFlow ? (
        <TicketBottomBar
          eyebrow={gateOpen ? tBar("eyebrowOpen") : tBar("eyebrowLocked")}
          title={event.name}
          rightAction={
            isAuthedNow
              ? { label: tBar("myTickets"), href: myTicketsHref }
              : { label: tBar("backHome"), href: "/" }
          }
        />
      ) : null}
    </RPage>
  );
}

function DayNNightRsvpStage({
  step,
  stepKey,
  dir,
  indicatorSteps,
  isOpen,
  soldOut,
  purchased,
  children
}: {
  step: FlowStep;
  stepKey: FlowStep;
  dir: number;
  indicatorSteps: FlowStep[];
  isOpen: boolean;
  soldOut: boolean;
  purchased: boolean;
  children: ReactNode;
}) {
  const tWelcome = useTranslations("Event.Rsvp.steps.welcome");
  const showProgress = !purchased && isOpen && !soldOut;

  return (
    <m.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed inset-0 z-[1000] flex h-svh w-screen flex-col overflow-hidden bg-background/5 px-4 py-8 text-foreground [--dn-bg:oklch(8%_0.02_280)] [--dn-fg:oklch(96%_0.005_80)] sm:px-10 sm:py-14"
    >
      <ViewportMask />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,oklch(from_var(--foreground)_l_c_h_/_0.08),transparent_34%)]"
      />
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-2 pt-2 sm:px-8 sm:pt-4 md:px-14">
        <span className="text-[11px] font-medium tracking-[0.12em] text-foreground/30 uppercase select-none">
          {tWelcome("eyebrow")}
        </span>
        {showProgress ? (
          <FlowStepIndicators current={step} steps={indicatorSteps} />
        ) : (
          <span className="h-6 w-6" aria-hidden />
        )}
      </header>

      <div
        className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-2 py-8 sm:px-8 md:px-14"
        style={{ perspective: "1500px" }}
      >
        <div className="w-full max-w-[460px]">
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
              className="relative flex w-full flex-col gap-8"
            >
              {children}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </m.section>
  );
}

const EventGateAtmosphere = memo(function EventGateAtmosphere({
  isDayNNight,
  unlocking
}: {
  isDayNNight: boolean;
  unlocking: boolean;
}) {
  return (
    <>
      <EventGateGradient
        className={cn(
          "pointer-events-none absolute inset-0 scale-110 opacity-45 brightness-[0.42] saturate-[0.72]",
          !isDayNNight && "hue-rotate-[28deg] saturate-[0.9]"
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,oklch(46%_0.08_228_/_0.16),transparent_34%),radial-gradient(ellipse_at_50%_39%,oklch(58%_0.07_74_/_0.08),transparent_28%),linear-gradient(180deg,oklch(2.5%_0.018_250)_0%,oklch(4%_0.04_252)_42%,black_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-[1] h-px w-[min(84vw,86rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible bg-[linear-gradient(90deg,transparent_0%,oklch(92%_0.012_76_/_0.12)_48%,oklch(96%_0.006_80_/_0.18)_50%,oklch(62%_0.03_240_/_0.04)_78%,transparent_100%)]"
      >
        <m.div
          className="absolute inset-0 origin-center bg-white/80"
          initial={false}
          animate={{
            scaleX: unlocking ? 1 : 0.18,
            opacity: unlocking ? 0.72 : 0.06
          }}
          transition={{
            duration: unlocking ? 1.35 : 0.45,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2] [clip-path:inset(0_0_50%_0)]"
      >
        <m.div
          className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,oklch(92%_0.12_75)_0%,oklch(85%_0.16_60)_40%,oklch(75%_0.18_45)_70%,oklch(65%_0.14_35_/_0)_100%)] shadow-[0_0_40px_0_oklch(85%_0.16_60_/_0.5),0_0_80px_0_oklch(80%_0.14_50_/_0.3)]"
          initial={false}
          animate={{
            y: unlocking ? 0 : 44,
            scale: unlocking ? 1.34 : 1.16,
            opacity: unlocking ? 1 : 0
          }}
          transition={{
            duration: unlocking ? 1.35 : 0.45,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/48"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-soft-light"
        style={NOISE_TEXTURE_STYLE}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={PAPER_TEXTURE_STYLE}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,black_0%,transparent_18%,transparent_78%,black_100%),linear-gradient(180deg,black_0%,transparent_22%,transparent_62%,black_100%)] opacity-80"
      />
    </>
  );
});

function EventGateScreen({
  eventSlug,
  password,
  setPassword,
  gateBusy,
  gateUnlocking,
  gateError,
  onSubmit
}: {
  eventSlug: string;
  password: string;
  setPassword: (value: string) => void;
  gateBusy: boolean;
  gateUnlocking: boolean;
  gateError: string | null;
  onSubmit: () => void;
}) {
  const tGate = useTranslations("Event.Rsvp.gate");
  const isDayNNight = eventSlug === STEP_FLOW_SLUG;
  const [gateLabel, setGateLabel] = useState<"idle" | "error">("idle");
  const [gateLabelMode, setGateLabelMode] = useState<"rotate" | "wipe">(
    "rotate"
  );
  const labelResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!gateError) return;
    if (labelResetTimer.current) clearTimeout(labelResetTimer.current);

    setGateLabelMode("rotate");
    setGateLabel("error");
    labelResetTimer.current = setTimeout(() => {
      setGateLabelMode("wipe");
      setGateLabel("idle");
      labelResetTimer.current = null;
    }, 2600);

    return () => {
      if (labelResetTimer.current) clearTimeout(labelResetTimer.current);
      labelResetTimer.current = null;
    };
  }, [gateError]);

  return (
    <section
      className={cn(
        "relative isolate z-[100] min-h-svh overflow-hidden bg-black text-white",
        "[--gate-accent:oklch(92%_0.012_80)] [--gate-ink:oklch(7%_0.02_250)] [--gate-paper:oklch(98%_0.008_95)]",
        !isDayNNight && "[--gate-accent:oklch(90%_0.018_75)]"
      )}
    >
      <EventGateAtmosphere
        isDayNNight={isDayNNight}
        unlocking={gateUnlocking}
      />

      <div className="relative z-10 grid min-h-dvh min-w-0 grid-rows-[auto_minmax(0,1fr)] px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7 sm:py-6 lg:px-9 xl:px-11">
        <header className="flex min-w-0 items-start justify-between gap-4 font-sans text-sm leading-none text-white/90">
          <span className="tracking-tight text-white/68">
            {tGate("statusLine")}
          </span>
          <span className="text-[10px] tracking-[0.16em] text-white/72 uppercase">
            {tGate("eyebrow")}
          </span>
        </header>

        <main className="relative min-h-0 min-w-0">
          <m.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              type: "spring",
              ...SPRING_EASE.power3.out,
              visualDuration: 0.45
            }}
            className="fixed right-[24px] bottom-[50vh] z-20 grid min-w-0 gap-2 sm:right-[36px] lg:right-[calc(2vw+48px)] xl:right-[calc(3vw+56px)]"
            style={{ width: "clamp(272px, 62vw, 400px)" }}
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="relative h-[44px] sm:h-[52px]">
              <label className="sr-only" htmlFor="gate-passcode">
                {tGate("passcodeLabel")}
              </label>
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-0 flex h-4 items-center overflow-hidden text-left text-[11px] leading-none tracking-[0.05em] text-white/56"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <m.div
                    key={`${gateLabel}-${gateLabelMode}`}
                    className="origin-bottom overflow-hidden"
                    initial={
                      gateLabelMode === "rotate"
                        ? { rotateX: -84, y: 4, opacity: 0 }
                        : { clipPath: "inset(0 100% 0 0)", opacity: 0.7 }
                    }
                    animate={{
                      rotateX: 0,
                      y: 0,
                      opacity: 1,
                      clipPath: "inset(0 0% 0 0)"
                    }}
                    exit={{
                      clipPath: "inset(0 0 0 100%)",
                      opacity: 0.35
                    }}
                    transition={{
                      duration: gateLabelMode === "rotate" ? 0.28 : 0.42,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  >
                    {gateLabel === "error"
                      ? tGate("label.wrongAction")
                      : tGate("label.enterAction")}
                  </m.div>
                </AnimatePresence>
                <span className="ml-1.5">{tGate("label.codeWord")}</span>
              </div>
              <input
                id="gate-passcode"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                aria-label={tGate("passcodeLabel")}
                autoComplete="off"
                spellCheck={false}
                disabled={gateUnlocking}
                className="absolute inset-0 h-full w-full min-w-0 border-0 bg-transparent px-[18px] pb-[4px] text-right font-sans text-[16px] font-normal tracking-[0.16em] text-white/78 caret-white/80 transition-none outline-none disabled:opacity-70 sm:text-[18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-[linear-gradient(90deg,transparent_0%,oklch(82%_0.008_80_/_0.18)_14%,oklch(94%_0.004_80_/_0.5)_68%,oklch(18%_0.02_250_/_0.1)_100%)] shadow-[0_0_14px_oklch(80%_0.05_220_/_0.16)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute right-5 bottom-0 h-[13px] w-px bg-white/46"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 bottom-0 h-px w-24 bg-[linear-gradient(90deg,transparent,oklch(96%_0.004_80_/_0.38)_58%,oklch(96%_0.004_80_/_0.2))]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 bottom-0 h-3 w-px bg-white/34"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute right-0 bottom-0 h-px w-5 bg-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={gateBusy || gateUnlocking || !password.trim()}
              className="sr-only"
            >
              {gateBusy ? tGate("submitting") : tGate("submit")}
            </button>
            {gateError ? <span className="sr-only">{gateError}</span> : null}
          </m.form>
        </main>
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
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <TextBlurIn
          as="h2"
          text={t("title")}
          style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
          className="leading-[0.95] font-extrabold tracking-[-0.025em] text-balance text-foreground"
          stagger={0.05}
          delay={0.1}
          yOffset={6}
          blurAmount={5}
          duration={0.75}
        />
        <p className="font-sans text-[15px] leading-relaxed text-muted-foreground">
          {t("body")}
        </p>
      </div>
      <MotionPillButton
        type="button"
        size="md"
        onClick={onStart}
        className="h-12 min-w-32 self-start bg-foreground px-7 text-sm font-medium text-background sm:h-14 sm:min-w-40"
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
 * Contact step — collects the email we will bind to the reservation.
 */
function ContactStep({
  email,
  setEmail,
  busy,
  error,
  needsLogin,
  signInHref,
  onContinue
}: {
  email: string;
  setEmail: (v: string) => void;
  busy: boolean;
  error: string | null;
  needsLogin: boolean;
  signInHref: string;
  onContinue: () => void;
}) {
  const t = useTranslations("Event.Rsvp.steps.contact");
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <p className="font-sans text-[15px] leading-relaxed text-muted-foreground">
          {t("eyebrow")}
        </p>
        <TextBlurIn
          as="h2"
          text={t("title")}
          style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
          className="leading-[0.95] font-extrabold tracking-[-0.025em] text-balance text-foreground"
          stagger={0.05}
          delay={0.05}
          yOffset={6}
          blurAmount={5}
          duration={0.7}
        />
        <p className="font-sans text-[15px] leading-relaxed text-muted-foreground">
          {needsLogin ? t("existingAccount") : t("body")}
        </p>
      </div>
      <m.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          onContinue();
        }}
      >
        <label htmlFor="contact-email" className="sr-only">
          {t("emailPlaceholder")}
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          aria-label={t("emailPlaceholder")}
          autoComplete="email"
          spellCheck={false}
          inputMode="email"
          className="h-16 w-full border-b border-border/50 bg-transparent text-lg font-light tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-foreground"
        />
        {error ? (
          <m.p
            role="alert"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-xs leading-relaxed text-destructive"
          >
            {error}
          </m.p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <MotionPillButton
            type="submit"
            size="md"
            disabled={busy || !email.trim()}
            className="h-12 min-w-36 self-start bg-foreground px-7 text-sm font-medium whitespace-nowrap text-background disabled:opacity-40 sm:h-14 sm:text-base"
          >
            {busy ? "…" : t("submit")}
          </MotionPillButton>
          {needsLogin ? (
            <Link
              href={signInHref}
              className="inline-flex h-12 items-center rounded-full border border-border/50 px-5 font-sans text-sm text-foreground transition-colors hover:border-foreground sm:h-14 sm:text-base"
            >
              {t("signIn")}
            </Link>
          ) : null}
        </div>
      </m.form>
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
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <p className="font-sans text-[15px] leading-relaxed text-muted-foreground">
          {t("eyebrow")}
        </p>
        <TextBlurIn
          as="h2"
          text={t("title")}
          style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
          className="leading-[0.95] font-extrabold tracking-[-0.025em] text-balance text-foreground"
          stagger={0.05}
          delay={0.05}
          yOffset={6}
          blurAmount={5}
          duration={0.7}
        />
      </div>
      <form
        className="flex flex-col gap-5"
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
          className="h-16 w-full border-b border-border/50 bg-transparent text-lg font-light tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-foreground"
        />
        <MotionPillButton
          type="submit"
          size="md"
          disabled={!name.trim()}
          className="h-12 min-w-36 self-start bg-foreground px-7 text-sm font-medium text-background disabled:opacity-40 sm:h-14 sm:text-base"
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
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <p className="font-sans text-[15px] leading-relaxed text-muted-foreground">
          {t("eyebrow")}
        </p>
        <TextBlurIn
          as="h2"
          text={t("reserved", {
            quantity: purchased.tickets.length,
            total: formatKRW(purchased.total_amount)
          })}
          style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
          className="leading-[0.95] font-extrabold tracking-[-0.025em] text-balance text-foreground"
          stagger={0.04}
          delay={0.1}
          yOffset={5}
          blurAmount={5}
          duration={0.75}
        />
      </div>

      <div className="grid gap-6">
        {paymentInstructions ? (
          <p className="font-sans text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {paymentInstructions}
          </p>
        ) : (
          <p className="font-sans text-sm text-muted-foreground">
            {t("instructionsFallback")}
          </p>
        )}

        {purchased.tickets.some((tx) => tx.claim_url) ? (
          <div className="border-t border-border/40 pt-6">
            <p className="font-sans text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              {t("giftLinks.eyebrow")}
            </p>
            <p className="mt-2 font-sans text-xs text-muted-foreground">
              {t("giftLinks.body")}
            </p>
            <ul className="mt-4 space-y-3">
              {purchased.tickets
                .filter((tx) => tx.claim_url)
                .map((tx) => (
                  <m.li
                    key={tx.id}
                    data-testid="gift-claim-link"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between gap-3 border-b border-border/30 py-3"
                  >
                    <span className="font-sans text-xs text-muted-foreground">
                      {t("giftLinks.ticketNumber", {
                        number: tx.ticket_number
                      })}
                    </span>
                    <MotionPillButton
                      type="button"
                      size="sm"
                      onClick={() => onCopy(tx.claim_url!)}
                      className="text-xs text-foreground"
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
            className="font-sans text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground"
          >
            {t("viewMy")}
          </Link>
        </div>
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
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2.5">
        <p className="font-sans text-[15px] leading-relaxed text-muted-foreground">
          {t("eyebrow", { total: totalDisplay })}
        </p>
        <TextBlurIn
          as="h2"
          text={totalDisplay}
          style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
          className="leading-[0.95] font-extrabold tracking-[-0.025em] text-foreground tabular-nums"
          stagger={0.04}
          delay={0.05}
          yOffset={5}
          blurAmount={5}
          duration={0.7}
        />
      </div>

      <div className="grid gap-6">
        <div
          className="grid gap-3"
          role="group"
          aria-label={t("quantityGroupLabel")}
        >
          <span className="font-sans text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {t("quantityLabel")}
          </span>
          <div className="flex flex-wrap gap-2.5">
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
                    "flex size-12 items-center justify-center rounded-full border font-sans text-sm transition-colors sm:size-14 sm:text-base",
                    quantity === n
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/50 bg-transparent text-muted-foreground hover:border-foreground/60 hover:text-foreground"
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
            className="font-sans text-xs leading-relaxed text-destructive"
          >
            {purchaseError}
          </m.p>
        ) : null}

        <MotionPillButton
          type="button"
          size="lg"
          onClick={onSubmit}
          disabled={purchaseBusy}
          className="h-14 w-full bg-foreground text-sm font-medium text-background disabled:opacity-40 sm:h-16 sm:text-base"
        >
          {purchaseBusy
            ? t("submitting")
            : !isAuthenticated
              ? t("signInRequired")
              : t("submit", { quantity, total: totalDisplay })}
        </MotionPillButton>

        {!isAuthenticated ? (
          <p className="font-sans text-xs leading-relaxed text-muted-foreground">
            {t("signInRedirectHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
