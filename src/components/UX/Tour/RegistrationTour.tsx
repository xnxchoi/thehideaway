"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MotionPillButton } from "@/components/UX/Button";
import { SPRING_EASE } from "@/constants/animations";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import type { RegistrationStep } from "@/stores/Tour/TourStore";
import { useLenis } from "lenis/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useTourStore } from "./TourProvider";
import { authClient } from "@/lib/auth/client";

// ─── Step configs ─────────────────────────────────────────────────────────────

type StepConfig = {
  title: string;
  subtitle: string;
};

const STEP_COPY: Record<RegistrationStep, StepConfig> = {
  welcome: {
    title: "Welcome to The Hideaway.",
    subtitle: "A few quick details and you're all set."
  },
  name: {
    title: "What should we call you?",
    subtitle: "This is how you'll appear across the platform."
  },
  profile: {
    title: "Tell us about yourself.",
    subtitle: "Optional — but it helps others find and connect with you."
  },
  complete: {
    title: "You're in.",
    subtitle: "Everything is set. Start exploring whenever you're ready."
  }
};

// ─── Step components ──────────────────────────────────────────────────────────

function WelcomeStep({ firstName }: { firstName: string }) {
  return (
    <div className="flex flex-col gap-2">
      {firstName ? (
        <p className="text-sm text-muted-foreground">
          Good to have you, {firstName}.
        </p>
      ) : null}
    </div>
  );
}

function NameStep({
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
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Input
        ref={firstRef}
        placeholder="First name"
        value={first}
        onChange={(e) => onFirst(e.target.value)}
        autoComplete="given-name"
      />
      <Input
        placeholder="Last name"
        value={last}
        onChange={(e) => onLast(e.target.value)}
        autoComplete="family-name"
      />
    </div>
  );
}

function ProfileStep({
  bio,
  location,
  link,
  onBio,
  onLocation,
  onLink
}: {
  bio: string;
  location: string;
  link: string;
  onBio: (v: string) => void;
  onLocation: (v: string) => void;
  onLink: (v: string) => void;
}) {
  const bioRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    bioRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        ref={bioRef}
        placeholder="A short bio"
        value={bio}
        onChange={(e) => onBio(e.target.value)}
        className="min-h-[88px] resize-none"
        maxLength={200}
      />
      <Input
        placeholder="Location  (e.g. Seoul, KR)"
        value={location}
        onChange={(e) => onLocation(e.target.value)}
        autoComplete="address-level2"
      />
      <Input
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
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        You can always update your profile in settings.
      </p>
    </div>
  );
}

// ─── Progress indicator ────────────────────────────────────────────────────────

function ProgressDots({
  steps,
  current
}: {
  steps: RegistrationStep[];
  current: RegistrationStep;
}) {
  const currentIndex = steps.indexOf(current);
  return (
    <div
      className="flex items-center gap-1.5"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemax={steps.length}
    >
      {steps.map((step, i) => (
        <span
          key={step}
          className={cn(
            "rounded-full transition-all duration-300",
            i === currentIndex
              ? "h-1.5 w-5 bg-foreground"
              : i < currentIndex
                ? "h-1.5 w-1.5 bg-foreground/40"
                : "h-1.5 w-1.5 bg-foreground/15"
          )}
        />
      ))}
    </div>
  );
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: 1 | -1) => ({
    x: dir * 28
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      ...SPRING_EASE.power3.out
    }
  },
  exit: (dir: 1 | -1) => ({
    x: dir * -20,
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  })
};

// ─── Main component ───────────────────────────────────────────────────────────

export function RegistrationTour() {
  const regActive = useTourStore((s) => s.regActive);
  const regStep = useTourStore((s) => s.regStep);
  const regSteps = useTourStore(useShallow((s) => s.regSteps));
  const regPending = useTourStore(useShallow((s) => s.regPending));
  const regSubmitting = useTourStore((s) => s.regSubmitting);
  const regNext = useTourStore((s) => s.regNext);
  const regPrev = useTourStore((s) => s.regPrev);
  const closeRegistrationTour = useTourStore((s) => s.closeRegistrationTour);
  const dismissRegistrationTour = useTourStore(
    (s) => s.dismissRegistrationTour
  );
  const setRegSubmitting = useTourStore((s) => s.setRegSubmitting);

  const sessionFirstName = useRPSession((s) => s.firstName);
  const setFirstNameSession = useRPSession((s) => s.setFirstName);
  const setLastNameSession = useRPSession((s) => s.setLastName);
  const setOnboarded = useRPSession((s) => s.setOnboarded);

  const [dir, setDir] = useState<1 | -1>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");

  const prefersReduced = useReducedMotion();

  // Keyboard navigation
  useEffect(() => {
    if (!regActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRegistrationTour();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [regActive, dismissRegistrationTour]);

  const canAdvance = useCallback((): boolean => {
    if (regStep === "name") return firstName.trim().length > 0;
    return true;
  }, [regStep, firstName]);

  const handleNext = useCallback(async () => {
    if (regStep === "complete") {
      // Final step — commit all data
      setRegSubmitting(true);
      try {
        // Update user profile fields
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

        // Update local session immediately so UI responds
        if (updates.firstName) setFirstNameSession(updates.firstName);
        if (updates.lastName) setLastNameSession(updates.lastName);
        setOnboarded(true);

        // Mark onboarding complete server-side (fire-and-forget; don't block UX)
        fetch("/api/onboarding", {
          method: "POST",
          credentials: "include"
        }).catch(
          () => {} // swallow — session is already optimistically marked
        );

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
  const isFirst = regStep === regSteps[0];
  const isLast = regStep === "complete";
  const currentIndex = regSteps.indexOf(regStep);

  if (!regActive) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
    >
      {/* Backdrop */}
      <m.div
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={isLast ? undefined : dismissRegistrationTour}
      />

      {/* Card */}
      <m.div
        className={cn(
          "relative z-10 mx-4 w-full max-w-[440px]",
          "rounded-2xl border border-foreground/8 bg-background shadow-2xl",
          "flex flex-col overflow-hidden"
        )}
        initial={{ opacity: 0, y: prefersReduced ? 0 : 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.99 }}
        transition={{ type: "spring", ...SPRING_EASE.power3.out }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-2">
          <ProgressDots steps={regSteps} current={regStep} />
          {!isLast && (
            <button
              onClick={dismissRegistrationTour}
              className="cursor-pointer text-sm leading-none text-foreground/30 transition-colors hover:text-foreground/60"
              aria-label="Skip onboarding"
            >
              Skip
            </button>
          )}
        </div>

        {/* Step content — animated */}
        <div className="flex min-h-[240px] flex-col gap-6 px-8 pt-6 pb-8">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <m.div
              key={regStep}
              custom={dir}
              variants={prefersReduced ? {} : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-5"
            >
              {/* Title block */}
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[22px] leading-snug font-medium tracking-[-0.01em] text-foreground">
                  {stepCopy.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {stepCopy.subtitle}
                </p>
              </div>

              {/* Step body */}
              {regStep === "welcome" && (
                <WelcomeStep firstName={sessionFirstName} />
              )}
              {regStep === "name" && (
                <NameStep
                  first={firstName}
                  last={lastName}
                  onFirst={setFirstName}
                  onLast={setLastName}
                />
              )}
              {regStep === "profile" && (
                <ProfileStep
                  bio={bio}
                  location={location}
                  link={link}
                  onBio={setBio}
                  onLocation={setLocation}
                  onLink={setLink}
                />
              )}
              {regStep === "complete" && <CompleteStep />}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Footer — actions */}
        <div className="flex items-center gap-3 px-8 pb-8">
          {!isFirst && (
            <MotionPillButton
              size="sm"
              onClick={handleBack}
              disabled={regSubmitting}
              className="text-muted-foreground hover:text-foreground"
            >
              Back
            </MotionPillButton>
          )}
          <MotionPillButton
            className="ml-auto min-w-[120px]"
            onClick={handleNext}
            disabled={!canAdvance() || regSubmitting}
          >
            {regSubmitting
              ? "Saving…"
              : isLast
                ? "Get started"
                : regStep === "welcome"
                  ? "Continue"
                  : "Next"}
          </MotionPillButton>
        </div>
      </m.div>
    </div>
  );
}

//─── Tour trigger — mounts at layout level, watches session ──────────────────

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
    // Only trigger once per session mount, for logged-in non-onboarded users
    if (
      !triggered.current &&
      sessionId &&
      !onboarded &&
      !regActive &&
      !regDismissed
    ) {
      triggered.current = true;
      const needsName = !firstName?.trim() || !lastName?.trim();
      // Profile is optional — only surface if user has nothing
      const needsProfile = false; // always optional, can expand later
      console.log("lenis", lenis);
      lenis && lenis.stop();
      openRegistrationTour({ needsName, needsProfile });
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
