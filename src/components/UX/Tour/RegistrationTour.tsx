"use client";

import { MotionPillButton } from "@/components/UX/Button";
import { SPRING_EASE } from "@/constants/animations";
import { authClient } from "@/lib/auth/client";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import type { RegistrationStep } from "@/stores/Tour/TourStore";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useLenis } from "lenis/react";
import { AnimatePresence, useReducedMotion, Variants } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { TextBlurIn } from "./TextBlurIn";
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
    subtitle: "A few quick details and you're all set."
  },
  identity: {
    title: "What should\nwe call you?",
    subtitle: "This is how you'll appear across the platform."
  },
  bio: {
    title: "About you.",
    subtitle: "A short bio helps others find and connect with you.",
    optional: true
  },
  details: {
    title: "Where are you\ncoming from?",
    subtitle: "Your location and a link — both optional.",
    optional: true
  },
  complete: {
    title: "You're in.",
    subtitle: "Start exploring whenever you're ready."
  }
};

// Steps shown in the indicator (exclude welcome)
const INDICATOR_STEPS: RegistrationStep[] = [
  "identity",
  "bio",
  "details",
  "complete"
];

// ─── Form types ──────────────────────────────────────────────────────────────

export type ProfileFormValues = {
  step: RegistrationStep;
  identity: {
    firstName: string;
    lastName: string;
  };
  bio: { content: string };
  details: { location: string; link: string };
};

// ─── Input primitive ──────────────────────────────────────────────────────────

const pillCn =
  "w-full px-5 py-3.5 rounded-full bg-transparent border border-foreground/15 " +
  "text-foreground text-[15px] placeholder:text-muted-foreground/35 " +
  "focus:outline-none focus:border-foreground/45 transition-colors duration-150 " +
  "autofill:bg-transparent";

// ─── Subtle fade-up for step body content ────────────────────────────────────

const bodyFadeVariants: Variants = {
  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

// ─── Step content components ──────────────────────────────────────────────────

function WelcomeStep({ firstName }: { firstName: string }) {
  return firstName ? (
    <m.p
      className="text-[15px] text-muted-foreground"
      variants={bodyFadeVariants}
      initial="hidden"
      animate="visible"
    >
      Good to have you, {firstName}.
    </m.p>
  ) : null;
}

function IdentityStep({
  form
}: {
  form: ReturnType<typeof useForm<ProfileFormValues>>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <m.div
      className="flex flex-col gap-3"
      variants={bodyFadeVariants}
      initial="hidden"
      animate="visible"
    >
      <form.Field name="firstName">
        {(field) => (
          <input
            ref={ref}
            className={pillCn}
            placeholder="First name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            autoComplete="given-name"
          />
        )}
      </form.Field>
      <form.Field name="lastName">
        {(field) => (
          <input
            className={pillCn}
            placeholder="Last name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            autoComplete="family-name"
          />
        )}
      </form.Field>
    </m.div>
  );
}

function BioStep({
  form
}: {
  form: ReturnType<typeof useForm<ProfileFormValues>>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <m.div
      className="flex flex-col gap-2"
      variants={bodyFadeVariants}
      initial="hidden"
      animate="visible"
    >
      <form.Field name="bio">
        {(field) => (
          <>
            <textarea
              ref={ref}
              className={
                "w-full rounded-2xl border border-foreground/15 bg-transparent px-5 py-4 " +
                "text-[15px] text-foreground placeholder:text-muted-foreground/35 " +
                "transition-colors duration-150 focus:border-foreground/45 focus:outline-none " +
                "min-h-[112px] resize-none leading-relaxed"
              }
              placeholder="Your passion, work, interests — keep it interesting."
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              maxLength={200}
            />
            <span className="text-right text-xs text-muted-foreground/35 tabular-nums">
              {field.state.value.length}/200
            </span>
          </>
        )}
      </form.Field>
    </m.div>
  );
}

function DetailsStep({
  form
}: {
  form: ReturnType<typeof useForm<ProfileFormValues>>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <m.div
      className="flex flex-col gap-3"
      variants={bodyFadeVariants}
      initial="hidden"
      animate="visible"
    >
      <form.Field name="location">
        {(field) => (
          <input
            ref={ref}
            className={pillCn}
            placeholder="Location (e.g. Seoul, KR)"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            autoComplete="address-level2"
          />
        )}
      </form.Field>
      <form.Field name="link">
        {(field) => (
          <input
            className={pillCn}
            placeholder="Website or social link"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            type="url"
            autoComplete="url"
          />
        )}
      </form.Field>
    </m.div>
  );
}

function CompleteStep() {
  return (
    <m.p
      className="text-[15px] text-muted-foreground"
      variants={bodyFadeVariants}
      initial="hidden"
      animate="visible"
    >
      You can always update your profile in settings.
    </m.p>
  );
}

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepIndicators({ current }: { current: RegistrationStep }) {
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
          <m.span
            key={step}
            className={cn(
              "flex items-center justify-center rounded-full text-[11px] font-medium",
              isCurrent
                ? "h-6 w-6 bg-foreground text-background"
                : isPast
                  ? "h-6 w-6 border border-foreground/25 text-foreground/40"
                  : "h-6 w-6 border border-foreground/10 text-foreground/20"
            )}
            layout
            transition={{ type: "spring", ...SPRING_EASE.power2.out }}
          >
            {isPast ? (
              <m.svg
                width="10"
                height="8"
                viewBox="0 0 10 8"
                fill="none"
                aria-hidden="true"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", ...SPRING_EASE.power3.out }}
              >
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </m.svg>
            ) : (
              i + 1
            )}
          </m.span>
        );
      })}
    </div>
  );
}

// ─── Exit warning ─────────────────────────────────────────────────────────────

function ExitWarning({
  isRequiredSection,
  onConfirm,
  onCancel
}: {
  isRequiredSection: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
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
      style={{
        backdropFilter: "blur(8px)",
        background: "rgba(var(--background-rgb, 255 255 255) / 0.7)"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onCancel}
    >
      <m.div
        className={cn(
          "rounded-2xl border border-foreground/8 bg-background p-7",
          "flex w-full max-w-[360px] flex-col gap-5 shadow-2xl"
        )}
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.97, y: 6, opacity: 0 }}
        transition={{ type: "spring", ...SPRING_EASE.power3.out }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-[17px] leading-snug font-medium text-foreground">
            {isRequiredSection
              ? "You haven't set your name yet."
              : "Leave without saving?"}
          </h3>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            {isRequiredSection
              ? "Your name is required to fully use your account. You can complete this anytime from your profile settings."
              : "Your profile changes won't be saved. You can always update these in settings."}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <MotionPillButton
            onClick={onCancel}
            className="text-[13px] text-muted-foreground/50 transition-colors hover:text-foreground/70"
            autoFocus
          >
            Stay
          </MotionPillButton>
          <MotionPillButton
            onClick={onConfirm}
            className={cn(
              "text-[13px] font-medium",
              isRequiredSection
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/15"
                : "bg-foreground/8 text-foreground hover:bg-foreground/12"
            )}
          >
            {isRequiredSection ? "Skip for now" : "Leave"}
          </MotionPillButton>
        </div>
      </m.div>
    </m.div>
  );
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants: Variants = {
  initial: (dir: 1 | -1) => ({
    y: dir > 0 ? "105%" : "-50%",
    opacity: 0
  }),
  animate: {
    y: "0%",
    opacity: 1,
    transition: {
      type: "spring" as const,
      ...SPRING_EASE.power3.out
    }
  },
  exit: (dir: 1 | -1) => ({
    y: dir > 0 ? "-40%" : "90%",
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
};

// ─── Profile mutation ─────────────────────────────────────────────────────────

type ProfilePayload = Partial<
  Pick<
    ProfileFormValues,
    "firstName" | "lastName" | "bio" | "location" | "link"
  >
>;

async function submitProfile(data: ProfilePayload) {
  const updates: Record<string, string> = {};
  if (data.firstName?.trim()) updates.firstName = data.firstName.trim();
  if (data.lastName?.trim()) updates.lastName = data.lastName.trim();
  if (data.bio?.trim()) updates.bio = data.bio.trim();
  if (data.location?.trim()) updates.location = data.location.trim();
  if (data.link?.trim()) updates.link = data.link.trim();

  if (Object.keys(updates).length > 0) {
    await authClient.updateUser(
      updates as Parameters<typeof authClient.updateUser>[0]
    );
  }

  // Fire-and-forget — marks onboarded server-side
  fetch("/api/onboarding", {
    method: "POST",
    credentials: "include"
  }).catch(() => {});

  return updates;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RegistrationTour() {
  const regStep = useTourStore((s) => s.regStep);
  const regSteps = useTourStore((s) => s.regSteps);
  const regNext = useTourStore((s) => s.regNext);
  const regPrev = useTourStore((s) => s.regPrev);
  const closeRegistrationTour = useTourStore((s) => s.closeRegistrationTour);
  const dismissRegistrationTour = useTourStore(
    (s) => s.dismissRegistrationTour
  );

  const sessionFirstName = useRPSession((s) => s.firstName);
  const sessionLastName = useRPSession((s) => s.lastName);
  const setFirstNameSession = useRPSession((s) => s.setFirstName);
  const setLastNameSession = useRPSession((s) => s.setLastName);
  const setOnboarded = useRPSession((s) => s.setOnboarded);

  const [dir, setDir] = useState<1 | -1>(1);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const prefersReduced = useReducedMotion();
  const lenis = useLenis();

  // ── TanStack Form ──────────────────────────────────────────────────────────

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      firstName: sessionFirstName ?? "",
      lastName: sessionLastName ?? "",
      bio: "",
      location: "",
      link: ""
    }
  });

  // ── TanStack Query mutation ────────────────────────────────────────────────

  const profileMutation = useMutation({
    mutationKey: ["registration", "profile"],
    mutationFn: submitProfile,
    onSuccess: (updates) => {
      if (updates.firstName) setFirstNameSession(updates.firstName);
      if (updates.lastName) setLastNameSession(updates.lastName);
      setOnboarded(true);
      closeRegistrationTour();
    },
    onError: () => {
      // Don't block the user — close anyway
      closeRegistrationTour();
    }
  });

  const isSubmitting = profileMutation.isPending;

  // ── Lock scroll while tour is open ────────────────────────────────────────
  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const formValues = form.useStore((s) => s.values);

  const isFormDirty =
    formValues.firstName.trim().length > 0 ||
    formValues.lastName.trim().length > 0 ||
    formValues.bio.trim().length > 0 ||
    formValues.location.trim().length > 0 ||
    formValues.link.trim().length > 0;

  const isInRequiredSection = regStep === "welcome" || regStep === "identity";
  const isFirst = regStep === "welcome";
  const isLast = regStep === "complete";

  // ── beforeunload warning ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isFormDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isFormDirty]);

  // ── Keyboard: Escape ──────────────────────────────────────────────────────

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDismissRequest = useCallback(() => {
    if (regStep === "welcome") {
      dismissRegistrationTour();
      return;
    }
    setShowExitWarning(true);
  }, [regStep, dismissRegistrationTour]);

  const canAdvance = useCallback((): boolean => {
    if (regStep === "identity") return formValues.firstName.trim().length > 0;
    return true;
  }, [regStep, formValues.firstName]);

  const handleNext = useCallback(async () => {
    if (regStep === "complete") {
      profileMutation.mutate({
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        bio: formValues.bio,
        location: formValues.location,
        link: formValues.link
      });
      return;
    }

    setDir(1);
    regNext();
  }, [regStep, formValues, regNext, profileMutation]);

  const handleBack = useCallback(() => {
    setDir(-1);
    regPrev();
  }, [regPrev]);

  const stepCopy = STEP_COPY[regStep];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <m.div
      className="fixed inset-0 z-[500] flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
    >
      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between px-8 pt-8 md:px-14">
        {/* Brand */}
        <span className="text-[11px] font-medium tracking-[0.12em] text-foreground/30 uppercase select-none">
          The Hideaway
        </span>

        <div className="flex items-center gap-4">
          <StepIndicators current={regStep} />
          {!isLast && (
            <MotionPillButton
              onClick={handleDismissRequest}
              className="text-[13px] text-muted-foreground/50 transition-colors hover:text-foreground/70"
              aria-label="Skip onboarding"
            >
              Skip
            </MotionPillButton>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main
        className="flex flex-1 items-center justify-center overflow-hidden px-8 py-8 md:px-14"
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
              {/* Title block — blur-in animated */}
              <div className="flex flex-col gap-2.5">
                <TextBlurIn
                  key={`title-${regStep}`}
                  text={stepCopy.title}
                  as="h1"
                  className="leading-[1.15] font-medium tracking-[-0.025em] text-foreground"
                  style={{ fontSize: "clamp(2rem, 5.5vw, 2.75rem)" }}
                  preserveNewlines
                  splitBy="word"
                  stagger={0.035}
                  delay={0.05}
                  yOffset={6}
                  blurAmount={6}
                  duration={0.4}
                />
                <m.div
                  initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: {
                      duration: 0.4,
                      delay: 0.18,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }
                  }}
                >
                  <p className="text-[15px] leading-relaxed text-muted-foreground">
                    {stepCopy.subtitle}
                    {stepCopy.optional && (
                      <span className="ml-2 text-[10px] font-medium tracking-[0.1em] text-foreground/25 uppercase">
                        optional
                      </span>
                    )}
                  </p>
                </m.div>
              </div>

              {/* Step body */}
              {regStep === "welcome" && (
                <WelcomeStep firstName={sessionFirstName} />
              )}
              {regStep === "identity" && <IdentityStep form={form} />}
              {regStep === "bio" && <BioStep form={form} />}
              {regStep === "details" && <DetailsStep form={form} />}
              {regStep === "complete" && <CompleteStep />}
            </m.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="flex shrink-0 items-center justify-between px-8 pb-8 md:px-14">
        {!isFirst ? (
          <MotionPillButton
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground/50 transition-colors hover:text-foreground/70 disabled:opacity-40"
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
        ) : (
          <div />
        )}
        <MotionPillButton
          onClick={handleNext}
          disabled={!canAdvance() || isSubmitting}
          className={cn(
            "rounded-full px-7 py-3 text-[14px] font-medium",
            "bg-foreground text-background",
            "hover:bg-foreground/90 active:scale-[0.97]",
            "transition-all duration-150",
            "disabled:opacity-25 disabled:active:scale-100",
            "min-w-[140px] text-center"
          )}
        >
          {isSubmitting
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
      lenis && lenis.stop();
      openRegistrationTour({ needsIdentity });
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
