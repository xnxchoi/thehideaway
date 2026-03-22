"use client";

import { MotionPillButton } from "@/components/UX/Button";
import { SPRING_EASE } from "@/constants/animations";
import { authClient } from "@/lib/auth/client";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import type { RegistrationStep } from "@/stores/Tour/TourStore";
import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useLenis } from "lenis/react";
import {
  AnimatePresence,
  useMotionValue,
  useReducedMotion,
  Variants
} from "motion/react";
import * as m from "motion/react-m";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { TextBlurIn } from "./TextBlurIn";
import { useTourStore } from "./TourProvider";
import {
  defaultOptions,
  useAppForm,
  withForm
} from "@/components/UX/Tour/form";
import {
  bioSchema,
  detailsSchema,
  identitySchema,
  type ProfileFormValues
} from "@/components/UX/Tour/Onboard/Form/schema";

// Re-export so existing consumers aren't broken
export type { ProfileFormValues } from "@/components/UX/Tour/Onboard/Form/schema";

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

// ─── Build active steps from pending fields ──────────────────────────────────

export function buildActiveSteps(pending: {
  needsIdentity: boolean;
}): RegistrationStep[] {
  const steps: RegistrationStep[] = ["welcome"];
  if (pending.needsIdentity) steps.push("identity");
  steps.push("bio", "details", "complete");
  return steps;
}

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

export const WelcomeStep = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
    const { firstName } = form.state.values.identity;
    return (
      (firstName && (
        <m.p
          className="text-[15px] text-muted-foreground"
          variants={bodyFadeVariants}
          initial="hidden"
          animate="visible"
        >
          Good to have you, {firstName}.
        </m.p>
      )) || <></>
    );
  }
});
export const IdentityStep = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
    return (
      <m.div
        className="flex flex-col gap-3"
        variants={bodyFadeVariants}
        initial="hidden"
        animate="visible"
      >
        <form.AppField name="identity.firstName">
          {(field) => (
            <field.TextField
              placeholder="First name"
              autoComplete="given-name"
            />
          )}
        </form.AppField>
        <form.AppField name="identity.lastName">
          {(field) => (
            <field.TextField
              placeholder="Last name"
              autoComplete="family-name"
            />
          )}
        </form.AppField>
      </m.div>
    );
  }
});

export const BioStep = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
    return (
      <m.div
        className="flex flex-col gap-2"
        variants={bodyFadeVariants}
        initial="hidden"
        animate="visible"
      >
        <form.AppField name="bio.content">
          {(field) => (
            <field.TextArea
              placeholder="Your passion, work, interests — keep it interesting."
              maxLength={200}
            />
          )}
        </form.AppField>
      </m.div>
    );
  }
});

const DetailsStep = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
    return (
      <m.div
        className="flex flex-col gap-3"
        variants={bodyFadeVariants}
        initial="hidden"
        animate="visible"
      >
        <form.AppField name="details.location">
          {(field) => (
            <field.TextField
              placeholder="Location (e.g. Seoul, KR)"
              autoComplete="address-level2"
            />
          )}
        </form.AppField>
        <form.AppField name="details.link">
          {(field) => (
            <field.TextField
              placeholder="Website or social link"
              type="url"
              autoComplete="url"
            />
          )}
        </form.AppField>
      </m.div>
    );
  }
});

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

function StepIndicators({
  current,
  steps
}: {
  current: RegistrationStep;
  steps: RegistrationStep[];
}) {
  const currentIdx = steps.indexOf(current);

  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={Math.max(0, currentIdx + 1)}
      aria-valuemax={steps.length}
    >
      {steps.map((step, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <m.span
            key={step}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
              isCurrent
                ? "bg-foreground text-background"
                : isPast
                  ? "border border-foreground/25 text-foreground/40"
                  : "border border-foreground/10 text-foreground/20"
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
          "flex w-full max-w-xl flex-col gap-5 shadow-2xl"
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
  Pick<ProfileFormValues, "bio" | "identity" | "details">
>;

async function submitProfile(data: ProfilePayload) {
  const updates: Record<string, string> = {};
  if (data.identity?.firstName?.trim())
    updates.firstName = data.identity.firstName.trim();
  if (data.identity?.lastName?.trim())
    updates.lastName = data.identity.lastName.trim();
  if (data.bio?.content?.trim()) updates.bio = data.bio.content.trim();
  if (data.details?.location?.trim())
    updates.location = data.details.location.trim();
  if (data.details?.link?.trim()) updates.link = data.details.link.trim();

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
  // Tour lifecycle — Zustand
  const closeRegistrationTour = useTourStore((s) => s.closeRegistrationTour);
  const dismissRegistrationTour = useTourStore(
    (s) => s.dismissRegistrationTour
  );
  const regPending = useTourStore((s) => s.regPending);

  // Session
  const sessionFirstName = useRPSession((s) => s.firstName);
  const sessionLastName = useRPSession((s) => s.lastName);
  const setFirstNameSession = useRPSession((s) => s.setFirstName);
  const setLastNameSession = useRPSession((s) => s.setLastName);
  const setOnboarded = useRPSession((s) => s.setOnboarded);

  const [dir, setDir] = useState<1 | -1>(1);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const prefersReduced = useReducedMotion();
  const lenis = useLenis();

  // ── Dynamic steps based on pending fields ─────────────────────────────────

  const activeSteps = useMemo(() => buildActiveSteps(regPending), [regPending]);

  const indicatorSteps = useMemo(
    () => activeSteps.filter((s) => s !== "welcome"),
    [activeSteps]
  );

  // ── TanStack Form (single source of truth for step + field values) ────────
  // Seed identity fields from existing session data so returning users see
  // their name pre-filled without having to retype it.

  const form = useAppForm({
    ...defaultOptions,
    defaultValues: {
      ...defaultOptions.defaultValues,
      identity: {
        firstName: sessionFirstName?.trim() || "",
        lastName: sessionLastName?.trim() || ""
      }
    },
    onSubmit: ({ value, formApi }) => {
      const idx = activeSteps.indexOf(value.step);
      if (idx < activeSteps.length - 1) {
        formApi.setFieldValue("step", activeSteps[idx + 1]);
      }
    }
  });

  // Derived from form state
  const currentStep = useStore(form.store, (s) => s.values.step);
  const formValues = useStore(form.store, (s) => s.values);
  const isFormDirty = useStore(form.store, (s) => s.isDirty);

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

  const stepIdx = activeSteps.indexOf(currentStep);
  const isFirst = stepIdx === 0;
  const isLast = currentStep === "complete";
  const isInRequiredSection =
    currentStep === "welcome" || currentStep === "identity";
  const stepCopy = STEP_COPY[currentStep] ?? STEP_COPY.welcome;

  const canAdvance = useMemo((): boolean => {
    if (currentStep === "identity") {
      return (
        formValues.identity.firstName.trim().length >= 2 &&
        formValues.identity.lastName.trim().length >= 2
      );
    }
    return true;
  }, [currentStep, formValues.identity]);

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDismissRequest = useCallback(() => {
    if (currentStep === "welcome") {
      dismissRegistrationTour();
      return;
    }
    setShowExitWarning(true);
  }, [currentStep, dismissRegistrationTour]);

  const handleNext = useCallback(async () => {
    if (currentStep === "complete") {
      profileMutation.mutate({
        identity: formValues.identity,
        bio: formValues.bio,
        details: formValues.details
      });
      return;
    }

    setDir(1);

    // ── Validate inline with Zod (no isSubmitting state flip = no GPU spike) ──
    // Only call form.handleSubmit() when validation *fails*, so that TanStack
    // Form distributes field-level error messages. On success we advance the
    // step with a single setFieldValue call to keep re-renders minimal.
    let valid = true;

    if (currentStep === "identity") {
      valid = identitySchema.safeParse(formValues).success;
    } else if (currentStep === "bio") {
      valid = bioSchema.safeParse(formValues).success;
    } else if (currentStep === "details") {
      valid = detailsSchema.safeParse(formValues).success;
    }

    if (!valid) {
      // Let TanStack Form run its validators so errors appear in field components
      await form.handleSubmit();
      return;
    }

    // Single state change — no cascading re-renders
    const idx = activeSteps.indexOf(currentStep);
    if (idx < activeSteps.length - 1) {
      form.setFieldValue("step", activeSteps[idx + 1]);
    }
  }, [currentStep, formValues, form, activeSteps, profileMutation]);

  const handleBack = useCallback(() => {
    setDir(-1);
    if (stepIdx > 0) {
      form.setFieldValue("step", activeSteps[stepIdx - 1]);
    }
  }, [stepIdx, activeSteps, form]);

  // ── Keyboard: Escape ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLast && !showExitWarning) {
        handleDismissRequest();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLast, showExitWarning, handleDismissRequest]);

  // ── Keyboard: Enter → advance ─────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      // Let textareas use Enter for newlines
      if (e.target instanceof HTMLTextAreaElement) return;
      // Don't fire when a dialog / warning is up
      if (showExitWarning || isSubmitting) return;
      if (canAdvance) handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canAdvance, handleNext, isSubmitting, showExitWarning]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <m.div
      className="fixed inset-0 z-300 flex flex-col bg-background/20"
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
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
          <StepIndicators current={currentStep} steps={indicatorSteps} />
          {!isLast && (
            <MotionPillButton
              type="button"
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
              key={currentStep}
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
                  key={`title-${currentStep}`}
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
              {currentStep === "welcome" && <WelcomeStep form={form} />}
              {currentStep === "identity" && <IdentityStep form={form} />}
              {currentStep === "bio" && <BioStep form={form} />}
              {currentStep === "details" && <DetailsStep form={form} />}
              {currentStep === "complete" && <CompleteStep />}
            </m.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="flex shrink-0 items-center justify-between px-8 pb-8 md:px-14">
        {!isFirst ? (
          <MotionPillButton
            type="button"
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
          type="button"
          onClick={handleNext}
          disabled={!canAdvance || isSubmitting}
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
              : currentStep === "welcome"
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
