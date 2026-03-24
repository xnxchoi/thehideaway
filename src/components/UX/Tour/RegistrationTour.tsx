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
import { AnimatePresence, Transition, Variant, Variants } from "motion/react";
import * as m from "motion/react-m";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TextBlurIn } from "./TextBlurIn";
import { useTourStore } from "./TourProvider";
import {
  defaultOptions,
  useAppForm,
  withForm
} from "@/components/UX/Tour/form";
import {
  detailsSchema,
  profileSchema,
  type ProfileFormValues
} from "@/components/UX/Tour/Onboard/Form/schema";
import { useBetterAuth } from "@/lib/auth/context";
import { User } from "@payload-types";
import { redirect, usePathname } from "next/navigation";
import { useTransitionRouter } from "next-transition-router";

// Re-export so existing consumers aren't broken
export type { ProfileFormValues } from "@/components/UX/Tour/Onboard/Form/schema";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Pages where the full overlay is acceptable for returning users */
const PASSIVE_PATHS = new Set([
  "/",
  "/posts",
  "/surf",
  "/albums",
  "/playlists",
  "/categories",
  "/tags"
]);

/** sessionStorage key for dismissal persistence */
const DISMISSED_KEY = "rp:onboarding-dismissed";

// ─── Step configs ─────────────────────────────────────────────────────────────

type StepConfig = {
  title: string;
  subtitle: string;
  /** Alternate subtitle when fields are pre-filled (OAuth etc.) */
  subtitlePrefilled?: string;
  optional?: boolean;
};

const STEP_COPY: Record<RegistrationStep, StepConfig> = {
  welcome: {
    title: "Welcome to\nThe Hideaway.",
    subtitle: "A few quick details and you're all set."
  },
  profile: {
    title: "Tell us\nabout yourself.",
    subtitle: "Your name and a short bio to get started.",
    subtitlePrefilled: "Confirm or update how you'll appear."
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
const INDICATOR_STEPS: RegistrationStep[] = ["profile", "details", "complete"];

// ─── Build active steps ──────────────────────────────────────────────────────

export function buildActiveSteps(): RegistrationStep[] {
  return ["welcome", "profile", "details", "complete"];
}

// ─── Subtle fade-up for step body content ────────────────────────────────────

const bodyFadeVariants: Variants = {
  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.84,
      delay: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

// ─── Step content components ──────────────────────────────────────────────────

export const WelcomeStep = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
    const { firstName } = form.state.values.identity;
    return firstName ? (
      <TextBlurIn
        text={`Great to see you, ${firstName}.`}
        as="h1"
        className="text-xl leading-[1.2] font-extrabold tracking-[-0.025em] text-foreground"
        style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
        preserveNewlines
        splitBy="word"
        stagger={0.05}
        delay={0.45}
        yOffset={6}
        blurAmount={6}
        duration={0.8}
      />
    ) : (
      <TextBlurIn
        text={STEP_COPY.welcome.title}
        as="h1"
        className="text-xl leading-[1.2] font-extrabold tracking-[-0.025em] text-foreground"
        style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
        preserveNewlines
        splitBy="word"
        stagger={0.05}
        delay={0.45}
        yOffset={6}
        blurAmount={6}
        duration={0.8}
      />
    );
  }
});

/** Merged identity + bio step */
export const ProfileStep = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
    return (
      <m.div
        className="flex flex-col gap-4"
        variants={bodyFadeVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Name fields */}
        <div className="flex flex-col gap-3">
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
        </div>

        {/* Bio — visually separated */}
        <div className="pt-1">
          <form.AppField name="bio.content">
            {(field) => (
              <field.TextArea
                placeholder="Your passion, work, interests — keep it interesting."
                maxLength={200}
              />
            )}
          </form.AppField>
        </div>
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
      ...SPRING_EASE.power3.out,
      visualDuration: 0.6
    }
  },
  exit: (dir: 1 | -1) => ({
    y: dir > 0 ? "-40%" : "90%",
    opacity: 0,
    transition: {
      duration: 0.32,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
};

// ─── Step-level submission helper ─────────────────────────────────────────────

type UserField = "bio" | "link" | "firstName" | "lastName" | "location";

async function submitStepFields({
  data,
  currentProfile,
  step,
  complete = false
}: {
  data: Partial<ProfileFormValues>;
  currentProfile: Pick<User, UserField>;
  step: RegistrationStep;
  complete?: boolean;
}) {
  const updateData = new Map<UserField, User[UserField]>();

  if (data.identity?.firstName?.trim() &&
    data.identity.firstName.trim() !== currentProfile.firstName)
    updateData.set("firstName", data.identity.firstName.trim());
  if (data.identity?.lastName?.trim() &&
    data.identity.lastName.trim() !== currentProfile.lastName)
    updateData.set("lastName", data.identity.lastName.trim());
  if (data.bio?.content?.trim() &&
    data.bio.content.trim() !== currentProfile.bio)
    updateData.set("bio", data.bio.content.trim());
  if (data.details?.location?.trim() &&
    data.details.location.trim() !== currentProfile.location)
    updateData.set("location", data.details.location.trim());
  if (data.details?.link?.trim() &&
    data.details.link.trim() !== currentProfile.link)
    updateData.set("link", data.details.link.trim());

  // Update user fields if anything changed, or if completing
  if (updateData.size > 0 || complete) {
    const updates = Object.fromEntries(updateData) as Record<string, string>;
    await authClient.updateUser({
      ...updates,
      ...(complete ? { onboarded: true } : {})
    } as Parameters<typeof authClient.updateUser>[0]);
  }

  // Persist progress (or mark complete) server-side
  fetch("/api/onboarding", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      complete
        ? { complete: true }
        : { step, fields: Object.fromEntries(updateData) }
    )
  }).catch(() => {});

  return updateData.size;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RegistrationTour() {
  // Tour lifecycle — Zustand
  const closeRegistrationTour = useTourStore((s) => s.closeRegistrationTour);
  const dismissRegistrationTour = useTourStore(
    (s) => s.dismissRegistrationTour
  );
  const regPending = useTourStore((s) => s.regPending);
  const regFromPath = useTourStore((s) => s.regFromPath);

  // Session
  const { currentUserPromise } = useBetterAuth();
  const currentUser = use(currentUserPromise) as
    | (User & { collection: "users" })
    | null;
  const markStale = useRPSession((s) => s.markStale);
  const router = useTransitionRouter();

  const sessionFirstName = currentUser?.firstName;
  const sessionLastName = currentUser?.lastName;
  const [dir, setDir] = useState<1 | -1>(1);
  const [showExitWarning, setShowExitWarning] = useState(false);

  const lenis = useLenis();

  // ── Active steps (always the same 4 now) ──────────────────────────────────

  const activeSteps = useMemo(() => buildActiveSteps(), []);

  // ── Detect preexisting data for subtitle copy ─────────────────────────────

  const hasPrefilled = useMemo(
    () =>
      !!(
        sessionFirstName?.trim() ||
        sessionLastName?.trim() ||
        currentUser?.bio?.trim()
      ),
    [sessionFirstName, sessionLastName, currentUser?.bio]
  );

  // ── TanStack Form (single source of truth for step + field values) ────────

  const form = useAppForm({
    ...defaultOptions,
    defaultValues: {
      ...defaultOptions.defaultValues,
      identity: {
        firstName: sessionFirstName?.trim() || "",
        lastName: sessionLastName?.trim() || ""
      },
      bio: {
        content: currentUser?.bio || ""
      },
      details: {
        location: currentUser?.location || "",
        link: currentUser?.link || ""
      }
    },
    onSubmit: ({ value, formApi }) => {
      const idx = activeSteps.indexOf(value.step);
      if (idx < activeSteps.length - 1) {
        formApi.setFieldValue("step", activeSteps[idx + 1]);
      }
    }
  });

  const formValues = useStore(form.store, (s) => s.values);
  const currentStep = useStore(form.store, (s) => s.values.step);
  const firstName = useStore(form.store, (s) => s.values.identity.firstName);
  const lastName = useStore(form.store, (s) => s.values.identity.lastName);
  const isFormDirty = useStore(form.store, (s) => s.isDirty);

  // ── Per-step mutation (fire-and-forget, non-blocking) ─────────────────────

  const stepMutation = useMutation({
    mutationKey: ["registration", "step-save"],
    mutationFn: submitStepFields,
    onSettled: () => markStale()
  });

  // ── Completion mutation ───────────────────────────────────────────────────

  const completeMutation = useMutation({
    mutationKey: ["registration", "complete"],
    mutationFn: submitStepFields,
    onSuccess: () => {
      markStale();
      closeRegistrationTour();
      // Navigate back to where the user was, or home
      const dest =
        regFromPath && regFromPath !== "/me/onboarding" ? regFromPath : "/";
      router.push(dest);
    },
    onError: () => {
      closeRegistrationTour();
      router.push("/");
    }
  });

  const isSubmitting = completeMutation.isPending;

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
    currentStep === "welcome" || currentStep === "profile";

  const stepCopy = STEP_COPY[currentStep] ?? STEP_COPY.welcome;
  const subtitle =
    hasPrefilled && stepCopy.subtitlePrefilled
      ? stepCopy.subtitlePrefilled
      : stepCopy.subtitle;

  const canAdvance = useMemo((): boolean => {
    if (currentStep === "profile") {
      return firstName.trim().length >= 2 && lastName.trim().length >= 2;
    }
    return true;
  }, [currentStep, firstName, lastName]);

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
      currentUser &&
        completeMutation.mutate({
          data: { ...formValues },
          currentProfile: currentUser as User,
          step: "complete",
          complete: true
        });
      return;
    }

    setDir(1);

    // Validate with Zod inline — only call form.handleSubmit on failure
    let valid = true;
    if (currentStep === "profile") {
      valid = profileSchema.safeParse(formValues).success;
    } else if (currentStep === "details") {
      valid = detailsSchema.safeParse(formValues).success;
    }

    if (!valid) {
      await form.handleSubmit();
      return;
    }

    // ── Per-step save (non-blocking) ──────────────────────────────────────
    if (currentUser && (currentStep === "profile" || currentStep === "details")) {
      stepMutation.mutate({
        data: { ...formValues },
        currentProfile: currentUser as User,
        step: currentStep
      });
    }

    // Advance step
    const idx = activeSteps.indexOf(currentStep);
    if (idx < activeSteps.length - 1) {
      form.setFieldValue("step", activeSteps[idx + 1]);
    }
  }, [
    currentStep,
    activeSteps,
    completeMutation,
    stepMutation,
    formValues,
    currentUser,
    form
  ]);

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
      if (e.target instanceof HTMLTextAreaElement) return;
      if (showExitWarning || isSubmitting) return;
      if (canAdvance) handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canAdvance, handleNext, isSubmitting, showExitWarning]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <m.div
        className="fixed inset-0 z-40 flex flex-col bg-background/5 px-5 py-5"
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
          <span className="text-[11px] font-medium tracking-[0.12em] text-foreground/30 uppercase select-none">
            The Hideaway
          </span>
          <div className="flex items-center gap-4">
            <StepIndicators current={currentStep} steps={INDICATOR_STEPS} />
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
        <div
          className="z-20 flex flex-1 items-center justify-center overflow-hidden px-8 py-8 md:px-14"
          style={{ perspective: "1500px" }}
        >
          <div className="w-full max-w-[460px]">
            <AnimatePresence mode="popLayout" custom={dir} initial={true}>
              <m.div
                key={currentStep}
                custom={dir}
                variants={{
                  ...slideVariants,
                  animate: {
                    ...slideVariants.animate,
                    transition: {
                      ...(
                        slideVariants.animate as Variant & {
                          transition: Transition;
                        }
                      ).transition,
                      ...((currentStep === "welcome" && {
                        delay: 1.1,
                        visualDuration: 1.1
                      }) ||
                        {})
                    }
                  }
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col gap-8"
              >
                {/* Title block */}
                <div className="flex flex-col gap-2.5">
                  {currentStep === "welcome" ? (
                    <WelcomeStep form={form} />
                  ) : (
                    <TextBlurIn
                      key={`title-${currentStep}`}
                      text={stepCopy.title}
                      as="h1"
                      className="text-xl leading-[1.2] font-extrabold tracking-[-0.025em] text-foreground"
                      style={{ fontSize: "clamp(3rem, 5.5vw, 4.75rem)" }}
                      preserveNewlines
                      splitBy="word"
                      stagger={0.05}
                      delay={0.45}
                      yOffset={6}
                      blurAmount={6}
                      duration={0.8}
                    />
                  )}
                  <m.div
                    initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      transition: {
                        duration: 0.8,
                        delay: currentStep === "welcome" ? 0.5 : 0.18,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }
                    }}
                  >
                    <m.p className="text-[15px] leading-relaxed text-muted-foreground">
                      {subtitle}
                      {stepCopy.optional && (
                        <m.span className="ml-2 text-small font-medium tracking-widest text-foreground/25 uppercase">
                          optional
                        </m.span>
                      )}
                    </m.p>
                  </m.div>
                </div>

                {/* Step body */}
                {currentStep === "profile" && <ProfileStep form={form} />}
                {currentStep === "details" && <DetailsStep form={form} />}
                {currentStep === "complete" && <CompleteStep />}
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="z-120 flex shrink-0 items-center justify-between px-8 pb-8 md:px-14">
          {!isFirst ? (
            <MotionPillButton
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 border border-foreground/50 bg-transparent text-[13px] text-foreground/50 transition-colors hover:text-foreground/70 disabled:bg-muted-foreground/60 disabled:opacity-40"
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
    </>
  );
}

// ─── Onboarding banner (non-blocking toast for active pages) ─────────────────

export function OnboardingBanner({
  onDismiss
}: {
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      <m.div
        className={cn(
          "fixed bottom-6 left-1/2 z-[500] -translate-x-1/2",
          "flex items-center gap-4 rounded-full",
          "border border-foreground/10 bg-background/80 px-5 py-3",
          "shadow-xl backdrop-blur-xl"
        )}
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        transition={{ type: "spring", ...SPRING_EASE.power3.out }}
      >
        <span className="text-[13px] text-muted-foreground">
          Complete your profile to get the full experience
        </span>
        <MotionPillButton
          onClick={() => redirect("/me/onboarding")}
          className={cn(
            "text-[12px] font-medium",
            "bg-foreground text-background",
            "hover:bg-foreground/90"
          )}
        >
          Let's go
        </MotionPillButton>
        <button
          onClick={onDismiss}
          className="ml-1 text-muted-foreground/40 transition-colors hover:text-foreground/60"
          aria-label="Dismiss"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </m.div>
    </AnimatePresence>
  );
}

// ─── Tour trigger — mounts at layout level, watches session ──────────────────

export function RegistrationTourTrigger() {
  const { currentUserPromise } = useBetterAuth();
  const currentUser = use(currentUserPromise) as User | null;

  const regActive = useTourStore((s) => s.regActive);
  const regDismissed = useTourStore((s) => s.regDismissed);
  const openRegistrationTour = useTourStore((s) => s.openRegistrationTour);
  const lenis = useLenis();

  const triggered = useRef(false);
  const pathName = usePathname();

  // Check sessionStorage for prior dismissal
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISSED_KEY) === "true";
  });

  // Banner mode — show non-blocking toast on active pages
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (
      triggered.current ||
      !currentUser ||
      currentUser.onboarded ||
      regActive ||
      regDismissed ||
      bannerDismissed
    )
      return;

    triggered.current = true;
    const needsIdentity =
      !currentUser.firstName?.trim() || !currentUser.lastName?.trim();
    const hasPreexistingData = !!(
      currentUser.firstName?.trim() ||
      currentUser.lastName?.trim() ||
      currentUser.bio?.trim()
    );

    // First visit heuristic: account created < 10 min ago
    const createdAt = currentUser.createdAt
      ? new Date(currentUser.createdAt).getTime()
      : 0;
    const isFirstVisit = Date.now() - createdAt < 10 * 60 * 1000;

    if (pathName === "/me/onboarding") {
      // Already on onboarding page — open overlay directly
      openRegistrationTour(
        { needsIdentity, hasPreexistingData },
        pathName
      );
    } else if (isFirstVisit) {
      // Brand-new user — redirect is acceptable
      redirect("/me/onboarding");
    } else if (PASSIVE_PATHS.has(pathName)) {
      // Returning user on passive page — show overlay in-place
      openRegistrationTour(
        { needsIdentity, hasPreexistingData },
        pathName
      );
    } else {
      // Returning user on active page — show non-blocking banner
      setShowBanner(true);
    }
  }, [
    currentUser,
    regDismissed,
    regActive,
    openRegistrationTour,
    lenis,
    pathName,
    bannerDismissed
  ]);

  if (showBanner && !regActive && !bannerDismissed) {
    return (
      <OnboardingBanner
        onDismiss={() => {
          setShowBanner(false);
          setBannerDismissed(true);
          sessionStorage.setItem(DISMISSED_KEY, "true");
        }}
      />
    );
  }

  return null;
}
