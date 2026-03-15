"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MotionPillButton } from "@/components/UX/Button";
import { authClient } from "@/lib/auth/client";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import { SPRING_EASE } from "@/constants/animations";
import type { RegistrationStep } from "@/stores/Tour/TourStore";
import { useLenis } from "lenis/react";
import { AnimatePresence, useReducedMotion, Variants } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTourStore } from "./TourProvider";

// ─── Step configs ─────────────────────────────────────────────────────────────

type StepConfig = {
  title: string;
  subtitle: string;
  optional?: boolean;
};

const STEP_COPY: Record<RegistrationStep, StepConfig> = {
  welcome: {
    title: "Welcome to\nThe Hideaway.",
    subtitle: "A few quick details and you're all set.",
  },
  identity: {
    title: "What should\nwe call you?",
    subtitle: "This is how you'll appear across the platform.",
  },
  bio: {
    title: "About you.",
    subtitle: "A short bio helps others find and connect with you.",
    optional: true,
  },
  details: {
    title: "Where are you\ncoming from?",
    subtitle: "Your location and a link — both optional.",
    optional: true,
  },
  complete: {
    title: "You're in.",
    subtitle: "Start exploring whenever you're ready.",
  },
};

// Steps shown in the indicator (exclude welcome)
const INDICATOR_STEPS: RegistrationStep[] = [
  "identity",
  "bio",
  "details",
  "complete",
];

// ─── Input primitive ──────────────────────────────────────────────────────────

const pillCn =
  "w-full px-5 py-3.5 rounded-full bg-transparent border border-foreground/15 " +
  "text-foreground text-[15px] placeholder:text-muted-foreground/35 " +
  "focus:outline-none focus:border-foreground/45 transition-colors duration-150 " +
  "autofill:bg-transparent";

// ─── Step content components ──────────────────────────────────────────────────

function WelcomeStep({ firstName }: { firstName: string }) {
  return firstName ? (
    <p className="text-[15px] text-muted-foreground">
      Good to have you, {firstName}.
    </p>
  ) : null;
}

function IdentityStep({
  first,
  last,
  onFirst,
  onLast
}: {
  first: string;
  last: string;
  onFirst: (v: string) => void;
  onLast: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={ref}
        className={pillCn}
        placeholder="First name"
        value={first}
        onChange={(e) => onFirst(e.target.value)}
        autoComplete="given-name"
      />
      <input
        className={pillCn}
        placeholder="Last name"
        value={last}
        onChange={(e) => onLast(e.target.value)}
        autoComplete="family-name"
      />
    </div>
  );
}

function BioStep({
  bio,
  onBio,
}: {
  bio: string;
  onBio: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={ref}
        className={
          "w-full px-5 py-4 rounded-2xl bg-transparent border border-foreground/15 " +
          "text-foreground text-[15px] placeholder:text-muted-foreground/35 " +
          "focus:outline-none focus:border-foreground/45 transition-colors duration-150 " +
          "resize-none min-h-[112px] leading-relaxed"
        }
        placeholder="Your passion, work, interests — keep it interesting."
        value={bio}
        onChange={(e) => onBio(e.target.value)}
        maxLength={200}
      />
      <span className="text-xs text-muted-foreground/35 text-right tabular-nums">
        {bio.length}/200
      </span>
    </div>
  );
}

function DetailsStep({
  location,
  link,
  onLocation,
  onLink
}: {
  location: string;
  link: string;
  onLocation: (v: string) => void;
  onLink: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={ref}
        className={pillCn}
        placeholder="Location (e.g. Seoul, KR)"
        value={location}
        onChange={(e) => onLocation(e.target.value)}
        autoComplete="address-level2"
      />
      <input
        className={pillCn}
        placeholder="Website or social link"
        value={link}
        onChange={(e) => onLink(e.target.value)}
        type="url"
        autoComplete="url"
      />
    </div>
  );
}

function CompleteStep() {
  return (
    <p className="text-[15px] text-muted-foreground">
      You can always update your profile in settings.
    </p>
  );
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepIndicators({
  current,
}: {
  current: RegistrationStep;
}) {
  const currentIdx = INDICATOR_STEPS.indexOf(current);

  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={Math.max(0, currentIdx + 1)}
      aria-valuemax={INDICATOR_STEPS.length}
    >
      {INDICATOR_STEPS.map((step, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <span
            key={step}
            className={cn(
              "flex items-center justify-center rounded-full text-[11px] font-medium",
              "transition-all duration-300",
              isCurrent
                ? "w-6 h-6 bg-foreground text-background"
                : isPast
                ? "w-6 h-6 border border-foreground/25 text-foreground/40"
                : "w-6 h-6 border border-foreground/10 text-foreground/20"
            )}
          >
            {isPast ? (
              // Checkmark for completed steps
              <svg
                width="10"
                height="8"
                viewBox="0 0 10 8"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              i + 1
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── Exit warning ─────────────────────────────────────────────────────────────

function ExitWarning({
  isRequiredSection,
  onConfirm,
  onCancel,
}: {
  isRequiredSection: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Trap focus within the warning
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <m.div
      className="absolute inset-0 z-10 flex items-center justify-center px-6"
      style={{ backdropFilter: "blur(8px)", background: "rgba(var(--background-rgb, 255 255 255) / 0.7)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onCancel}
    >
      <m.div
        className={cn(
          "bg-background border border-foreground/8 rounded-2xl p-7",
          "w-full max-w-[360px] shadow-2xl flex flex-col gap-5"
        )}
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.97, y: 6, opacity: 0 }}
        transition={{ type: "spring", ...SPRING_EASE.power3.out }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-[17px] font-medium leading-snug text-foreground">
            {isRequiredSection
              ? "You haven't set your name yet."
              : "Leave without saving?"}
          </h3>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            {isRequiredSection
              ? "Your name is required to fully use your account. You can complete this anytime from your profile settings."
              : "Your profile changes won't be saved. You can always update these in settings."}
          </p>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            autoFocus
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer",
              isRequiredSection
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/15"
                : "bg-foreground/8 text-foreground hover:bg-foreground/12"
            )}
          >
            {isRequiredSection ? "Skip for now" : "Leave"}
          </button>
        </div>
      </m.div>
    </m.div>
  );
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants:Variants = {
  initial: (dir: 1 | -1) => ({
    y: dir > 0 ? "105%" : "-50%",
    opacity: 0,
  }),
  animate: {
    y: "0%",
    opacity: 1,
    transition: {
      type: "spring" as const,
      ...SPRING_EASE.power3.out,
    },
  },
  exit: (dir: 1 | -1) => ({
    y: dir > 0 ? "-40%" : "90%",
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// ─── Main component ───────────────────────────────────────────────────────────

export function RegistrationTour() {
  const regStep = useTourStore((s) => s.regStep);
  const regSteps = useTourStore((s) => s.regSteps);
  const regSubmitting = useTourStore((s) => s.regSubmitting);
  const regNext = useTourStore((s) => s.regNext);
  const regPrev = useTourStore((s) => s.regPrev);
  const closeRegistrationTour = useTourStore((s) => s.closeRegistrationTour);
  const dismissRegistrationTour = useTourStore(
    (s) => s.dismissRegistrationTour
  );
  const setRegSubmitting = useTourStore((s) => s.setRegSubmitting);

  const sessionFirstName = useRPSession((s) => s.firstName);
  const sessionLastName = useRPSession((s) => s.lastName);
  const setFirstNameSession = useRPSession((s) => s.setFirstName);
  const setLastNameSession = useRPSession((s) => s.setLastName);
  const setOnboarded = useRPSession((s) => s.setOnboarded);

  const [dir, setDir] = useState<1 | -1>(1);
  const [firstName, setFirstName] = useState(sessionFirstName ?? "");
  const [lastName, setLastName] = useState(sessionLastName ?? "");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");

  const [showExitWarning, setShowExitWarning] = useState(false);

  const prefersReduced = useReducedMotion();

  // ── Derived state ───────────────────────────────────────────────────────────

  const isFormDirty =
    firstName.trim().length > 0 ||
    lastName.trim().length > 0 ||
    bio.trim().length > 0 ||
    location.trim().length > 0 ||
    link.trim().length > 0;

  // Required section = welcome or identity steps
  const isInRequiredSection =
    regStep === "welcome" || regStep === "identity";

  const isFirst = regStep === "welcome";
  const isLast = regStep === "complete";

  // ── beforeunload warning ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isFormDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isFormDirty]);

  // ── Keyboard: Escape ────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLast && !showExitWarning) {
        handleDismissRequest();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLast, showExitWarning, regStep]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDismissRequest = useCallback(() => {
    if (regStep === "welcome") {
      dismissRegistrationTour();
      return;
    }
    setShowExitWarning(true);
  }, [regStep, dismissRegistrationTour]);

  const canAdvance = useCallback((): boolean => {
    if (regStep === "identity") return firstName.trim().length > 0;
    return true;
  }, [regStep, firstName]);

  const handleNext = useCallback(async () => {
    if (regStep === "complete") {
      setRegSubmitting(true);
      try {
        const updates: Record<string, string> = {};
        if (firstName.trim()) updates.firstName = firstName.trim();
        if (lastName.trim()) updates.lastName = lastName.trim();
        if (bio.trim()) updates.bio = bio.trim();
        if (location.trim()) updates.location = location.trim();
        if (link.trim()) updates.link = link.trim();

        if (Object.keys(updates).length > 0) {
          await authClient.updateUser(
            updates as Parameters<typeof authClient.updateUser>[0]
          );
        }

        if (updates.firstName) setFirstNameSession(updates.firstName);
        if (updates.lastName) setLastNameSession(updates.lastName);
        setOnboarded(true);

        // Fire-and-forget — marks onboarded server-side
        fetch("/api/onboarding", {
          method: "POST",
          credentials: "include",
        }).catch(() => {});

        closeRegistrationTour();
      } catch {
        // Don't block the user — close anyway
        closeRegistrationTour();
      } finally {
        setRegSubmitting(false);
      }
      return;
    }

    setDir(1);
    regNext();
  }, [
    regStep,
    firstName,
    lastName,
    bio,
    location,
    link,
    regNext,
    closeRegistrationTour,
    setRegSubmitting,
    setOnboarded,
    setFirstNameSession,
    setLastNameSession
  ]);

  const handleBack = useCallback(() => {
    setDir(-1);
    regPrev();
  }, [regPrev]);

  const stepCopy = STEP_COPY[regStep];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <m.div
      className="fixed inset-0 z-[500] bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
    >
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-8 md:px-14 pt-8">
        {/* Brand */}
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/30 select-none">
          The Hideaway
        </span>

        <div className="flex items-center gap-4">
          <StepIndicators current={regStep} />
          {!isLast && (
            <button
              onClick={handleDismissRequest}
              className="text-[13px] text-muted-foreground/50 hover:text-foreground/70 transition-colors cursor-pointer"
              aria-label="Skip onboarding"
            >
              Skip
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main
        className="flex-1 flex items-center justify-center px-8 md:px-14 overflow-hidden py-8"
        style={{ perspective: "1500px" }}
      >
        <div className="w-full max-w-[460px]">
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <m.div
              key={regStep}
              custom={dir}
              variants={prefersReduced ? {} : slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-8"
            >
              {/* Title block */}
              <div className="flex flex-col gap-2.5">
                <h1
                  className="font-medium leading-[1.15] tracking-[-0.025em] text-foreground whitespace-pre-line"
                  style={{ fontSize: "clamp(2rem, 5.5vw, 2.75rem)" }}
                >
                  {stepCopy.title}
                </h1>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {stepCopy.subtitle}
                  {stepCopy.optional && (
                    <span className="ml-2 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground/25">
                      optional
                    </span>
                  )}
                </p>
              </div>

              {/* Step body */}
              {regStep === "welcome" && (
                <WelcomeStep firstName={sessionFirstName} />
              )}
              {regStep === "identity" && (
                <IdentityStep
                  first={firstName}
                  last={lastName}
                  onFirst={setFirstName}
                  onLast={setLastName}
                />
              )}
              {regStep === "bio" && (
                <BioStep bio={bio} onBio={setBio} />
              )}
              {regStep === "details" && (
                <DetailsStep
                  location={location}
                  link={link}
                  onLocation={setLocation}
                  onLink={setLink}
                />
              )}
              {regStep === "complete" && <CompleteStep />}
            </m.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 flex items-center justify-between px-8 md:px-14 pb-8">
        {!isFirst ? (
          <MotionPillButton
            onClick={handleBack}
            disabled={regSubmitting}
            className="text-[13px] text-muted-foreground/50 hover:text-foreground/70 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8.5 3L4.5 7L8.5 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
              Back
            </MotionPillButton>
          ):<div/>}
          <MotionPillButton
          onClick={handleNext}
          disabled={!canAdvance() || regSubmitting}
          className={cn(
            "px-7 py-3 rounded-full text-[14px] font-medium",
            "bg-foreground text-background",
            "hover:bg-foreground/90 active:scale-[0.97]",
            "transition-all duration-150",
            "disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100",
            "min-w-[140px] text-center"
          )}
        >
          {regSubmitting
            ? "Saving…"
            : isLast
            ? "Get started"
            : regStep === "welcome"
            ? "Let's go"
            : "Continue"}
          </MotionPillButton>
      </footer>

      {/* ── Exit warning ── */}
      <AnimatePresence>
        {showExitWarning && (
          <ExitWarning
            isRequiredSection={isInRequiredSection}
            onConfirm={() => {
              setShowExitWarning(false);
              dismissRegistrationTour();
            }}
            onCancel={() => setShowExitWarning(false)}
          />
        )}
      </AnimatePresence>
    </m.div>
  );
}

// ─── Tour trigger — mounts at layout level, watches session ──────────────────

export function RegistrationTourTrigger() {
  const sessionId = useRPSession((s) => s.id);
  const onboarded = useRPSession((s) => s.onboarded);
  const firstName = useRPSession((s) => s.firstName);
  const lastName = useRPSession((s) => s.lastName);

  const regActive = useTourStore((s) => s.regActive);
  const regDismissed = useTourStore((s) => s.regDismissed);
  const openRegistrationTour = useTourStore((s) => s.openRegistrationTour);
  const lenis = useLenis();

  const triggered = useRef(false);

  useEffect(() => {
    if (
      !triggered.current &&
      sessionId &&
      !onboarded &&
      !regActive &&
      !regDismissed
    ) {
      triggered.current = true;
      const needsIdentity = !firstName?.trim() || !lastName?.trim();
      console.log("lenis", lenis);
      lenis && lenis.stop();  openRegistrationTour({ needsIdentity });
    }
  }, [
    sessionId,
    onboarded,
    firstName,
    lastName,
    regActive,
    regDismissed,
    openRegistrationTour,
    lenis
  ]);

  return null;
}
