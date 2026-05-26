"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
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
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle
} from "@/components/ui/dialog";
import {
  ArrowUpRight,
  Camera,
  Copy,
  ExternalLink,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  TicketCheck
} from "lucide-react";
import { BANK } from "@/components/sections/DayNNight/survivalKit.config";

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
  order_id: string;
  tickets: PurchasedTicket[];
  total_amount: number;
  purchaser_id?: string | null;
  purchaser_name?: string | null;
  sender_name?: string | null;
  payment_submitted_at?: string | null;
}

interface Props {
  event: EventLite;
  remaining: number | null;
  isAuthenticated: boolean;
  sessionUserId: string | null;
  sessionEmail: string | null;
  sessionName: string | null;
  sessionFirstName: string | null;
  sessionLastName: string | null;
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
type FlowStep =
  | "welcome"
  | "name"
  | "contact"
  | "passkey"
  | "reserve"
  | "purchased";

type ContactChannelKey = "seanPhone" | "ingyuPhone" | "email" | "instagram";

const CONTACT_CHANNELS: {
  key: ContactChannelKey;
  href: string;
  icon: typeof Phone;
  external?: boolean;
}[] = [
  {
    key: "seanPhone",
    href: "tel:+821046379289",
    icon: Phone
  },
  {
    key: "ingyuPhone",
    href: "tel:+821025296700",
    icon: Phone
  },
  {
    key: "email",
    href: "mailto:seanschoi@hideawayseoul.com",
    icon: Mail
  },
  {
    key: "instagram",
    href: "https://www.instagram.com/geekid/",
    icon: Instagram,
    external: true
  }
];

type PasswordCredentialConstructor = new (data: {
  id: string;
  name?: string;
  password: string;
}) => Credential;

const SS_KEY = (slug: string) => `tickets:gate:${slug}`;

const formatKRW = (n: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0
  }).format(n);

function normalizePaymentMemoPart(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .slice(0, 80);
}

function splitDisplayName(name: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function buildPaymentMemo({
  senderName,
  purchaserName,
  purchaserId,
  ticketCount
}: {
  senderName: string | null | undefined;
  purchaserName: string | null | undefined;
  purchaserId: string | null | undefined;
  ticketCount: number;
}): string {
  const sender = normalizePaymentMemoPart(senderName) || "sender";
  const name = normalizePaymentMemoPart(purchaserName) || "guest";
  const id = normalizePaymentMemoPart(purchaserId) || "unknown";
  return `${sender}_${name}_${id}_ticket_${ticketCount}`;
}

function buildTossPaymentHref({
  amount,
  memo
}: {
  amount: number;
  memo: string;
}): string {
  const params = new URLSearchParams({
    bank: BANK.nameKo,
    accountNo: BANK.accountNoDigits,
    amount: String(amount),
    origin: "qr",
    memo
  });

  return `supertoss://send?${params.toString()}`;
}

async function storePasswordCredential({
  email,
  name,
  password
}: {
  email: string;
  name: string;
  password: string;
}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const passwordCredential = (
    window as typeof window & {
      PasswordCredential?: PasswordCredentialConstructor;
    }
  ).PasswordCredential;
  if (!passwordCredential || !navigator.credentials?.store) return false;

  await navigator.credentials.store(
    new passwordCredential({
      id: email,
      name,
      password
    })
  );
  return true;
}

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
              "flex size-6 items-center justify-center rounded-full text-small font-medium transition-colors",
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
  sessionUserId,
  sessionEmail,
  sessionName,
  sessionFirstName,
  sessionLastName,
  gateInitiallyOpen = false
}: Props) {
  const router = useTransitionRouter();
  const t = useTranslations("Event.Rsvp.steps");
  const tGate = useTranslations("Event.Rsvp.gate");
  const tStatus = useTranslations("Event.Rsvp.status");
  const tBar = useTranslations("Event.Rsvp.bar");
  const tErrors = useTranslations("Event.Rsvp.errors");
  const tPurchased = useTranslations("Event.Rsvp.purchased");
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
  const storyHref = useStepFlow ? "/day-n-night" : "/";
  const signInHref = signInRedirectPath(`/tickets/${event.slug}`);
  const [step, setStep] = useState<FlowStep>("welcome");
  const [dir, setDir] = useState(1);
  const [supportOpen, setSupportOpen] = useState(false);
  const openSupport = useCallback(() => setSupportOpen(true), []);
  const { data: passkeys } = authClient.useListPasskeys();
  const [passkeyCreated, setPasskeyCreated] = useState(false);
  const hasPasskey = passkeyCreated || Boolean(passkeys?.length);
  const indicatorSteps = useMemo<FlowStep[]>(
    () =>
      isAuthenticated
        ? hasPasskey
          ? ["name", "reserve"]
          : ["name", "passkey", "reserve"]
        : ["name", "contact", "passkey", "reserve"],
    [hasPasskey, isAuthenticated]
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
  const [accountPassword, setAccountPassword] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactNeedsLogin, setContactNeedsLogin] = useState(false);
  const [sessionBootstrapped, setSessionBootstrapped] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyChecking, setPasskeyChecking] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const updateContactEmail = useCallback((value: string) => {
    setContactError(null);
    setContactNeedsLogin(false);
    setContactEmailInternal(value);
  }, []);
  const updateAccountPassword = useCallback((value: string) => {
    setContactError(null);
    setContactNeedsLogin(false);
    setAccountPassword(value);
  }, []);

  // Purchaser legal-ish name. Kept split for account storage, joined only
  // where existing ticket/order surfaces expect a display string.
  const fallbackSessionName = splitDisplayName(sessionName);
  const [purchaserFirstName, setPurchaserFirstNameInternal] = useState(
    sessionFirstName ?? fallbackSessionName.firstName
  );
  const [purchaserLastName, setPurchaserLastNameInternal] = useState(
    sessionLastName ?? fallbackSessionName.lastName
  );
  const [nameTouched, setNameTouched] = useState(false);
  const setPurchaserFirstName = useCallback((value: string) => {
    setNameTouched(true);
    setPurchaserFirstNameInternal(value);
  }, []);
  const setPurchaserLastName = useCallback((value: string) => {
    setNameTouched(true);
    setPurchaserLastNameInternal(value);
  }, []);
  const purchaserName = useMemo(
    () => [purchaserFirstName, purchaserLastName].filter(Boolean).join(" "),
    [purchaserFirstName, purchaserLastName]
  );

  // Live session — Better Auth flips this after the contact step or a
  // normal sign-in succeeds.
  const { data: liveSession } = authClient.useSession();
  const liveSessionUserId = (
    liveSession?.user as { id?: string | null } | undefined
  )?.id;
  const isAuthedNow =
    isAuthenticated || sessionBootstrapped || Boolean(liveSessionUserId);

  // ── Purchase state ───────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const [senderName, setSenderName] = useState(sessionName ?? "");
  const [senderTouched, setSenderTouched] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<PurchaseResult | null>(null);
  const [paymentSubmitBusy, setPaymentSubmitBusy] = useState(false);
  const [paymentSubmitError, setPaymentSubmitError] = useState<string | null>(
    null
  );
  const [copied, setCopied] = useState<string | null>(null);

  // Restore cached gate password on mount.
  useEffect(() => {
    if (gateInitiallyOpen) return;
    if (useStepFlow) return;
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem(SS_KEY(event.slug));
    if (cached) {
      setStoredPassword(cached);
      setGateOpen(true);
    }
  }, [event.slug, gateInitiallyOpen, useStepFlow]);

  // Sync purchaser name from the live session when sign-in lands mid-flow.
  const liveSessionUser = liveSession?.user as
    | {
        name?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      }
    | undefined;
  useEffect(() => {
    if (nameTouched) return;
    if (!liveSessionUser) return;
    const fallback = splitDisplayName(liveSessionUser.name);
    const nextFirstName = liveSessionUser.firstName ?? fallback.firstName;
    const nextLastName = liveSessionUser.lastName ?? fallback.lastName;
    if (!nextFirstName && !nextLastName) return;
    setPurchaserFirstNameInternal(nextFirstName);
    setPurchaserLastNameInternal(nextLastName);
    const nextName = [nextFirstName, nextLastName].filter(Boolean).join(" ");
    setSenderName((current) => current || nextName);
  }, [liveSessionUser, nameTouched]);

  useEffect(() => {
    if (senderTouched) return;
    setSenderName(purchaserName);
  }, [purchaserName, senderTouched]);

  useEffect(() => {
    if (!useStepFlow || step !== "passkey" || !isAuthedNow || !hasPasskey) {
      return;
    }
    setPasskeyBusy(false);
    setPasskeyChecking(false);
    setPasskeyError(null);
    advanceTo("reserve");
  }, [advanceTo, hasPasskey, isAuthedNow, step, useStepFlow]);

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
    if (!purchaserFirstName.trim() || !purchaserLastName.trim()) return;
    if (!isAuthedNow) {
      advanceTo("contact");
      return;
    }
    advanceTo(hasPasskey ? "reserve" : "passkey");
  };

  const continueFromContact = async () => {
    if (
      contactBusy ||
      !contactEmail.trim() ||
      !purchaserFirstName.trim() ||
      !purchaserLastName.trim() ||
      accountPassword.length < 8
    ) {
      return;
    }

    setContactBusy(true);
    setContactError(null);
    setContactNeedsLogin(false);

    const signInWithPassword = async (): Promise<boolean> => {
      const result = await authClient.signIn.email({
        email: contactEmail.trim(),
        password: accountPassword,
        rememberMe: true,
        fetchOptions: { throw: true }
      });

      if ("error" in result) return false;

      await storePasswordCredential({
        email: contactEmail.trim(),
        name: purchaserName || contactEmail.trim(),
        password: accountPassword
      }).catch(() => false);

      setSessionBootstrapped(true);
      return true;
    };

    try {
      const result = await prepareDayNNightPurchaserAction({
        email: contactEmail.trim(),
        firstName: purchaserFirstName.trim(),
        lastName: purchaserLastName.trim(),
        password: accountPassword
      });

      if (result.ok) {
        const signedIn = await signInWithPassword().catch(() => false);
        if (!signedIn) {
          setContactError(t("contact.signInError"));
          return;
        }
        advanceTo(hasPasskey ? "reserve" : "passkey");
        return;
      }

      if (result.reason === "existing-account-login-required") {
        try {
          const signedIn = await signInWithPassword();
          if (signedIn) {
            advanceTo(hasPasskey ? "reserve" : "passkey");
            return;
          }
        } catch {
          // Fall through to the explicit existing-account guidance below.
        }
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

  const createPasskey = async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    setPasskeyError(null);

    try {
      if (typeof window === "undefined" || !("PublicKeyCredential" in window)) {
        setPasskeyError(t("passkey.unsupported"));
        return;
      }

      const response = await authClient.passkey.addPasskey({
        name: "Day n Night",
        fetchOptions: { throw: true }
      });

      if (response?.error) {
        setPasskeyError(t("passkey.failed"));
        return;
      }

      setPasskeyCreated(true);
      setSessionBootstrapped(true);
      setPasskeyChecking(false);
      advanceTo("reserve");
    } catch {
      setPasskeyError(t("passkey.failed"));
    } finally {
      setPasskeyBusy(false);
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
        case "passkey-required":
          return tErrors("passkeyRequired");
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
    if (useStepFlow && !senderName.trim()) return;
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
            : {}),
          ...(useStepFlow && senderName.trim()
            ? { sender_name: senderName.trim() }
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
        order_id: out.order_id,
        tickets: out.tickets,
        total_amount: out.total_amount,
        purchaser_id: out.purchaser_id ?? liveSessionUserId ?? sessionUserId,
        purchaser_name: out.purchaser_name ?? (purchaserName.trim() || null),
        sender_name: out.sender_name ?? (senderName.trim() || null),
        payment_submitted_at: out.payment_submitted_at ?? null
      });
      setPaymentSubmitError(null);
      if (useStepFlow) advanceTo("purchased");
    } catch {
      setPurchaseError(tErrors("generic"));
    } finally {
      setPurchaseBusy(false);
    }
  };

  const markPaymentSubmitted = async () => {
    if (!purchased?.order_id || paymentSubmitBusy) return;

    setPaymentSubmitBusy(true);
    setPaymentSubmitError(null);

    try {
      const res = await fetch("/api/tickets/payment-submitted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: purchased.order_id
        })
      });
      const out = await res.json();

      if (!res.ok || !out.ok) {
        setPaymentSubmitError(tPurchased("paymentSubmitted.error"));
        return;
      }

      setPurchased((current) =>
        current
          ? {
              ...current,
              payment_submitted_at: out.payment_submitted_at ?? null
            }
          : current
      );
    } catch {
      setPaymentSubmitError(tPurchased("paymentSubmitted.error"));
    } finally {
      setPaymentSubmitBusy(false);
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
          purchaserName={purchased.purchaser_name ?? purchaserName}
          senderName={purchased.sender_name ?? senderName}
          purchaserId={
            purchased.purchaser_id ?? liveSessionUserId ?? sessionUserId
          }
          copied={copied}
          onCopy={copyClaim}
          myTicketsHref={myTicketsHref}
          paymentSubmitBusy={paymentSubmitBusy}
          paymentSubmitError={paymentSubmitError}
          onPaymentSubmitted={markPaymentSubmitted}
          onContactSupport={openSupport}
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
              password={accountPassword}
              setPassword={updateAccountPassword}
              busy={contactBusy}
              error={contactError}
              needsLogin={contactNeedsLogin}
              signInHref={signInHref}
              onContactSupport={openSupport}
              onContinue={continueFromContact}
            />
          );
        case "passkey":
          return (
            <PasskeyStep
              busy={passkeyBusy}
              checking={passkeyChecking}
              error={passkeyError}
              onContactSupport={openSupport}
              onCreate={createPasskey}
            />
          );
        case "name":
          return (
            <NameStep
              firstName={purchaserFirstName}
              lastName={purchaserLastName}
              setFirstName={setPurchaserFirstName}
              setLastName={setPurchaserLastName}
              onContinue={advanceFromName}
            />
          );
        case "reserve":
        case "purchased":
          return (
            <ReserveView
              quantity={quantity}
              setQuantity={setQuantity}
              senderName={senderName}
              setSenderName={(value) => {
                setSenderTouched(true);
                setSenderName(value);
              }}
              maxAllowed={maxAllowed}
              totalDisplay={totalDisplay}
              purchaseError={purchaseError}
              purchaseBusy={purchaseBusy}
              isAuthenticated={isAuthedNow}
              navLinks={
                useStepFlow
                  ? {
                      myTicketsHref,
                      storyHref,
                      onContactSupport: openSupport
                    }
                  : null
              }
              onSubmit={submitPurchase}
            />
          );
      }
    }
    return (
      <ReserveView
        quantity={quantity}
        setQuantity={setQuantity}
        senderName={senderName}
        setSenderName={(value) => {
          setSenderTouched(true);
          setSenderName(value);
        }}
        maxAllowed={maxAllowed}
        totalDisplay={totalDisplay}
        purchaseError={purchaseError}
        purchaseBusy={purchaseBusy}
        isAuthenticated={isAuthedNow}
        navLinks={null}
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
      <Link
        href="/"
        aria-label={tBar("backHome")}
        className="fixed top-5 left-5 z-40 inline-flex h-9 items-center gap-2 rounded-full border border-border/35 bg-background/80 px-3.5 font-sans text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-xl transition-colors hover:border-border/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span aria-hidden>←</span>
        <span>{tBar("backHome").replace(/^←\s*/, "")}</span>
      </Link>

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
        <section className="relative z-100 mx-auto w-full max-w-7xl px-6 pt-32 pb-32 xl:px-10 xl:pt-40 xl:pb-40">
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

      {useStepFlow ? (
        <ContactSupportModal open={supportOpen} onOpenChange={setSupportOpen} />
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
  const stepRef = useRef<HTMLDivElement>(null);

  const focusStepInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      const input = stepRef.current?.querySelector<HTMLElement>(
        "[data-autofocus-after-transition='true']"
      );
      input?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(focusStepInput, 680);
    return () => window.clearTimeout(id);
  }, [focusStepInput, stepKey]);

  return (
    <m.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed inset-0 z-1000 flex h-svh w-screen flex-col overflow-hidden bg-background/5 px-4 py-8 text-foreground [--dn-bg:oklch(8%_0.02_280)] [--dn-fg:oklch(96%_0.005_80)] sm:px-10 sm:py-14"
    >
      <ViewportMask />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,oklch(from_var(--foreground)_l_c_h/0.08),transparent_34%)]"
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
        <div className="w-full max-w-184">
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
              ref={stepRef}
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
          !isDayNNight && "hue-rotate-28 saturate-[0.9]"
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
        "relative isolate z-100 min-h-svh overflow-hidden bg-black text-white",
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
  password,
  setPassword,
  busy,
  error,
  needsLogin,
  signInHref,
  onContactSupport,
  onContinue
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  error: string | null;
  needsLogin: boolean;
  signInHref: string;
  onContactSupport: () => void;
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
          name="username"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          aria-label={t("emailPlaceholder")}
          autoComplete="username"
          data-autofocus-after-transition="true"
          spellCheck={false}
          inputMode="email"
          className="h-16 w-full border-b border-border/50 bg-transparent text-lg font-light tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-foreground"
        />
        <label htmlFor="contact-password" className="sr-only">
          {t("passwordPlaceholder")}
        </label>
        <input
          id="contact-password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          aria-label={t("passwordPlaceholder")}
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          className="h-16 w-full border-b border-border/50 bg-transparent text-lg font-light tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-foreground"
        />
        <p className="font-sans text-xs leading-relaxed text-muted-foreground">
          {t("passwordHint")}
        </p>
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
            disabled={busy || !email.trim() || password.length < 8}
            className="h-12 min-w-36 self-start bg-foreground px-7 text-sm font-medium whitespace-nowrap text-background disabled:opacity-40 sm:h-14 sm:text-base"
          >
            {busy ? "…" : t("submit")}
          </MotionPillButton>
          {needsLogin ? (
            <>
              <Link
                href={signInHref}
                className="inline-flex h-12 items-center rounded-full border border-border/50 px-5 font-sans text-sm text-foreground transition-colors hover:border-foreground sm:h-14 sm:text-base"
              >
                {t("signIn")}
              </Link>
              <button
                type="button"
                onClick={onContactSupport}
                className="inline-flex h-12 items-center rounded-full border border-border/30 px-5 font-sans text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground sm:h-14 sm:text-base"
              >
                {t("contactHost")}
              </button>
            </>
          ) : null}
        </div>
      </m.form>
    </div>
  );
}

function PasskeyStep({
  busy,
  checking,
  error,
  onContactSupport,
  onCreate
}: {
  busy: boolean;
  checking: boolean;
  error: string | null;
  onContactSupport: () => void;
  onCreate: () => void;
}) {
  const t = useTranslations("Event.Rsvp.steps.passkey");
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
          {t("body")}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <MotionPillButton
            type="button"
            size="md"
            disabled={busy}
            onClick={onCreate}
            className="h-12 min-w-44 self-start bg-foreground px-7 text-sm font-medium whitespace-nowrap text-background disabled:opacity-40 sm:h-14 sm:text-base"
          >
            {busy ? t("creating") : t("submit")}
          </MotionPillButton>
          <button
            type="button"
            onClick={onContactSupport}
            className="inline-flex h-12 items-center rounded-full border border-border/30 px-5 font-sans text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground sm:h-14 sm:text-base"
          >
            {t("contactHost")}
          </button>
        </div>
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
        {checking ? (
          <m.p
            aria-live="polite"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-xs leading-relaxed text-muted-foreground"
          >
            {t("checking")}
          </m.p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Name step — captures the display name stamped on ticket-orders.purchaser_name.
 */
function NameStep({
  firstName,
  lastName,
  setFirstName,
  setLastName,
  onContinue
}: {
  firstName: string;
  lastName: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
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
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="font-sans text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              {t("firstNameLabel")}
            </span>
            <input
              id="purchaser-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("firstNamePlaceholder")}
              aria-label={t("firstNameLabel")}
              autoComplete="given-name"
              data-autofocus-after-transition="true"
              maxLength={80}
              className="h-16 w-full border-b border-border/50 bg-transparent text-lg font-light tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-foreground"
            />
          </label>
          <label className="grid gap-2">
            <span className="font-sans text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
              {t("lastNameLabel")}
            </span>
            <input
              id="purchaser-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("lastNamePlaceholder")}
              aria-label={t("lastNameLabel")}
              autoComplete="family-name"
              maxLength={80}
              className="h-16 w-full border-b border-border/50 bg-transparent text-lg font-light tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-foreground"
            />
          </label>
        </div>
        <MotionPillButton
          type="submit"
          size="md"
          disabled={!firstName.trim() || !lastName.trim()}
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
  purchaserName,
  senderName,
  purchaserId,
  copied,
  onCopy,
  myTicketsHref,
  paymentSubmitBusy,
  paymentSubmitError,
  onPaymentSubmitted,
  onContactSupport
}: {
  purchased: PurchaseResult;
  purchaserName: string | null;
  senderName: string | null;
  purchaserId: string | null;
  copied: string | null;
  onCopy: (url: string) => void;
  myTicketsHref: string;
  paymentSubmitBusy: boolean;
  paymentSubmitError: string | null;
  onPaymentSubmitted: () => void;
  onContactSupport: () => void;
}) {
  const t = useTranslations("Event.Rsvp.purchased");
  const [paymentCopied, setPaymentCopied] = useState(false);
  const [showPaymentFallback, setShowPaymentFallback] = useState(false);
  const paymentSubmitted = Boolean(purchased.payment_submitted_at);
  const paymentMemo = buildPaymentMemo({
    senderName,
    purchaserName,
    purchaserId,
    ticketCount: purchased.tickets.length
  });
  const paymentHref = buildTossPaymentHref({
    amount: purchased.total_amount,
    memo: paymentMemo
  });
  const paymentClipboardText = [
    `${t("payment.account")}: ${BANK.nameKo} ${BANK.accountNo}`,
    `${t("payment.holder")}: ${BANK.holder}`,
    `${t("payment.amount")}: ${formatKRW(purchased.total_amount)}`
  ].join("\n");

  const copyPaymentDetails = async () => {
    try {
      await navigator.clipboard.writeText(paymentClipboardText);
      setPaymentCopied(true);
      window.setTimeout(() => setPaymentCopied(false), 2000);
    } catch {
      // Bank app deep-link support varies by browser; the visible fallback
      // below keeps all transfer details available if copying is blocked.
    }
  };

  const handlePaymentClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setShowPaymentFallback(false);
    void copyPaymentDetails();

    window.setTimeout(() => setShowPaymentFallback(true), 1500);
    window.location.href = paymentHref;
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="font-sans text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
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
        <p className="max-w-md font-sans text-sm leading-relaxed text-muted-foreground">
          {t("nextStep")}
        </p>
      </div>

      <div className="grid gap-7">
        <section className="grid gap-5 border-y border-border/35 py-6">
          <div className="grid gap-1.5">
            <p className="font-sans text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              {t("payment.eyebrow")}
            </p>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              {t("payment.body")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <dl className="grid gap-3 font-sans text-xs text-muted-foreground">
              <div className="grid gap-1">
                <dt>{t("payment.amount")}</dt>
                <dd className="font-sans text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">
                  {formatKRW(purchased.total_amount)}
                </dd>
              </div>
              <div className="grid gap-1 border-t border-border/25 pt-3">
                <dt>{t("payment.account")}</dt>
                <dd className="text-sm text-foreground">
                  {BANK.nameKo} {BANK.accountNo}
                </dd>
              </div>
              <div className="grid gap-1 border-t border-border/25 pt-3">
                <dt>{t("payment.sender")}</dt>
                <dd className="text-sm text-foreground">{senderName}</dd>
              </div>
            </dl>

            <a
              href={paymentHref}
              onClick={handlePaymentClick}
              data-testid="ticket-make-payment"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-foreground/20 bg-foreground px-6 font-sans text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:h-14"
            >
              {t("payment.makePayment")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>

          {showPaymentFallback ? (
            <div className="grid gap-3 border-t border-border/25 pt-4">
              <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                {t("payment.fallback")}
              </p>
              <button
                type="button"
                onClick={copyPaymentDetails}
                className="inline-flex h-9 w-fit items-center gap-2 rounded-full border border-border/40 px-3.5 font-sans text-xs font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Copy className="size-3.5" aria-hidden="true" />
                {paymentCopied ? t("payment.copied") : t("payment.copyDetails")}
              </button>
            </div>
          ) : null}

          <div
            className={cn(
              "grid gap-3 border-t border-border/25 pt-4",
              paymentSubmitted ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border",
                  paymentSubmitted
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/40 text-muted-foreground"
                )}
                aria-hidden="true"
              >
                <TicketCheck className="size-3.5" />
              </span>
              <div className="grid gap-1">
                <p className="font-sans text-sm font-medium tracking-tight">
                  {paymentSubmitted
                    ? t("paymentSubmitted.doneTitle")
                    : t("paymentSubmitted.title")}
                </p>
                <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                  {paymentSubmitted
                    ? t("paymentSubmitted.doneBody")
                    : t("paymentSubmitted.body")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onPaymentSubmitted}
              disabled={paymentSubmitBusy || paymentSubmitted}
              data-testid="ticket-payment-submitted"
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-border/40 px-4 font-sans text-xs font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55"
            >
              <TicketCheck className="size-3.5" aria-hidden="true" />
              {paymentSubmitted
                ? t("paymentSubmitted.doneCta")
                : paymentSubmitBusy
                  ? t("paymentSubmitted.submitting")
                  : t("paymentSubmitted.cta")}
            </button>

            {paymentSubmitError ? (
              <m.p
                role="alert"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-sans text-xs leading-relaxed text-destructive"
              >
                {paymentSubmitError}
              </m.p>
            ) : null}

            <div className="grid gap-2 rounded-xl border border-border/25 bg-muted/10 p-3">
              <div className="flex items-start gap-3">
                <Camera
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="grid gap-1">
                  <p className="font-sans text-xs font-medium tracking-tight text-foreground">
                    {t("paymentSubmitted.photoTitle")}
                  </p>
                  <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                    {t("paymentSubmitted.photoBody")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onContactSupport}
                data-testid="ticket-payment-photo-request"
                className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full border border-border/35 px-4 font-sans text-xs font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Camera className="size-3.5" aria-hidden="true" />
                {t("paymentSubmitted.photoCta")}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 border-b border-border/35 pb-5">
          <p className="font-sans text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {t("summary.eyebrow")}
          </p>
          <dl className="grid gap-2 font-sans text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <dt>{t("payment.amount")}</dt>
              <dd className="text-right text-foreground">
                {formatKRW(purchased.total_amount)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>{t("payment.account")}</dt>
              <dd className="text-right text-foreground">
                {BANK.nameKo} {BANK.accountNo}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>{t("summary.tickets")}</dt>
              <dd className="text-right text-foreground">
                {t("summary.ticketCount", {
                  quantity: purchased.tickets.length
                })}
              </dd>
            </div>
          </dl>
        </div>

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

        <div className="grid gap-3 border-t border-border/35 pt-5">
          <p className="max-w-sm font-sans text-xs leading-relaxed text-muted-foreground">
            {t("accountHint")}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={myTicketsHref}
              data-testid="view-my-tickets"
              className="font-sans text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {t("viewMy")}
            </Link>
            <button
              type="button"
              onClick={onContactSupport}
              data-testid="ticket-support-link"
              className="font-sans text-xs tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              {t("contactHost")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactSupportModal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Event.Rsvp.support");

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(92svh,680px)] overflow-y-auto border border-border/35 bg-background/95 p-5 text-foreground shadow-[0_24px_90px_rgba(0,0,0,0.38)] outline-border/30! backdrop-blur-xl sm:max-w-[440px] sm:p-6"
        data-testid="ticket-contact-dialog"
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <DialogTitle className="font-sans text-2xl font-light tracking-tight">
              {t("title")}
            </DialogTitle>
            <DialogDescription className="font-sans text-sm leading-relaxed text-muted-foreground">
              {t("body")}
            </DialogDescription>
          </div>

          <div className="grid gap-2.5">
            {CONTACT_CHANNELS.map((channel) => {
              const Icon = channel.icon;
              return (
                <a
                  key={channel.key}
                  href={channel.href}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer noopener" : undefined}
                  data-testid={`ticket-support-${channel.key}`}
                  className="group grid min-h-16 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border/25 bg-muted/10 px-3.5 py-3 text-left transition-colors hover:border-border/60 hover:bg-muted/20"
                >
                  <span className="flex size-10 items-center justify-center rounded-full border border-border/25 bg-background/70 text-foreground transition-colors group-hover:border-border/60">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-sans text-sm font-medium text-foreground">
                      {t(`actions.${channel.key}.label`)}
                    </span>
                    <span className="mt-0.5 block truncate font-sans text-xs text-muted-foreground">
                      {t(`actions.${channel.key}.value`)}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>

          <DialogClose className="h-11 rounded-full border border-border/30 px-5 font-sans text-sm text-muted-foreground transition-colors hover:border-border/60 hover:text-foreground">
            {t("close")}
          </DialogClose>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}

function ReserveView({
  quantity,
  setQuantity,
  senderName,
  setSenderName,
  maxAllowed,
  totalDisplay,
  purchaseError,
  purchaseBusy,
  isAuthenticated,
  navLinks,
  onSubmit
}: {
  quantity: number;
  setQuantity: (n: number) => void;
  senderName: string;
  setSenderName: (value: string) => void;
  maxAllowed: number;
  totalDisplay: string;
  purchaseError: string | null;
  purchaseBusy: boolean;
  isAuthenticated: boolean;
  navLinks: {
    myTicketsHref: string;
    storyHref: string;
    onContactSupport: () => void;
  } | null;
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

      {navLinks ? (
        <nav
          aria-label={t("navigationLabel")}
          className="grid grid-cols-3 border-y border-border/30"
        >
          <Link
            href={navLinks.myTicketsHref}
            data-testid="reserve-nav-my-tickets"
            className="group flex min-h-16 flex-col justify-center gap-2 border-r border-border/30 px-3 py-3 font-sans text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:bg-muted/20 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <TicketCheck className="size-4 transition-transform group-hover:-translate-y-0.5" />
            <span>{t("nav.myTickets")}</span>
          </Link>
          <Link
            href={navLinks.storyHref}
            data-testid="reserve-nav-story"
            className="group flex min-h-16 flex-col justify-center gap-2 border-r border-border/30 px-3 py-3 font-sans text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:bg-muted/20 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span>{t("nav.story")}</span>
          </Link>
          <button
            type="button"
            onClick={navLinks.onContactSupport}
            data-testid="reserve-nav-contact"
            className="group flex min-h-16 flex-col justify-center gap-2 px-3 py-3 text-left font-sans text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:bg-muted/20 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <MessageCircle className="size-4 transition-transform group-hover:-translate-y-0.5" />
            <span>{t("nav.contact")}</span>
          </button>
        </nav>
      ) : null}

      <div className="grid gap-6">
        <div
          className="grid gap-3 border-b border-border/30 pb-5"
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

        <label className="grid gap-3 border-b border-border/30 pb-5">
          <span className="font-sans text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {t("senderLabel")}
          </span>
          <span className="font-sans text-xs leading-relaxed text-muted-foreground">
            {t("senderHint")}
          </span>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder={t("senderPlaceholder")}
            autoComplete="name"
            maxLength={120}
            className="h-14 w-full border-b border-border/50 bg-transparent font-sans text-lg font-light tracking-tight text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-foreground"
          />
        </label>

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
          disabled={purchaseBusy || !senderName.trim()}
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
