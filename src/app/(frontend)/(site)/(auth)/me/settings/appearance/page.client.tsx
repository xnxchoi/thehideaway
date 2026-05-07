"use client";

import {
  SaveStatus,
  type SaveState,
  SettingsGroup,
  SettingsHeader,
  SettingsRow,
  getSection
} from "@/components/UX/Settings";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/Theme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { setLocaleAction } from "../_helpers/setLocale";
import { RPage } from "@/components/UX/Transition";

const section = getSection("appearance");

interface AppearanceSectionClientProps {
  locale: "en" | "ko";
}

export default function AppearanceSectionClient({
  locale
}: AppearanceSectionClientProps) {
  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        <SettingsHeader section={section} />

        <SettingsGroup
          title="Theme"
          description="Light is editorial. Dark is reading by lamplight."
        >
          <SettingsRow label="Mode">
            <ThemeToggle />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title="Language" description="Site-wide UI language.">
          <SettingsRow label="Language">
            <LocaleToggle current={locale} />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup
          title="Motion"
          description="The Hideaway honours your system reduced-motion setting."
        >
          <SettingsRow
            label="Reduced motion"
            description="Configured at the OS level."
          >
            <ReducedMotionStatus />
          </SettingsRow>
        </SettingsGroup>
      </div>
    </RPage>
  );
}

function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const saveTheme = useTheme((s) => s.saveTheme);

  const set = (next: "light" | "dark") => {
    if (theme === next) return;
    setTheme(next);
    saveTheme(next);
  };

  const Btn = ({
    code,
    label,
    icon
  }: {
    code: "light" | "dark";
    label: string;
    icon: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => set(code)}
      className={cn(
        "inline-flex items-center gap-2 border px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors",
        theme === code
          ? "border-foreground text-foreground"
          : "border-border/30 text-foreground/55 hover:border-border hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="inline-flex items-center gap-0 [&>*:not(:first-child)]:-ml-px">
      <Btn code="light" label="Light" icon={<Sun size={12} />} />
      <Btn code="dark" label="Dark" icon={<Moon size={12} />} />
    </div>
  );
}

function LocaleToggle({ current }: { current: "en" | "ko" }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SaveState>("idle");

  const set = (next: "en" | "ko") => {
    if (next === current) return;
    setState("saving");
    startTransition(async () => {
      try {
        await setLocaleAction(next);
        setState("saved");
      } catch {
        setState("error");
      }
    });
  };

  const Btn = ({ code, label }: { code: "en" | "ko"; label: string }) => (
    <button
      type="button"
      onClick={() => set(code)}
      disabled={pending}
      className={cn(
        "border px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors disabled:opacity-50",
        current === code
          ? "border-foreground text-foreground"
          : "border-border/30 text-foreground/55 hover:border-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-0 [&>*:not(:first-child)]:-ml-px">
        <Btn code="en" label="EN — English" />
        <Btn code="ko" label="KO — 한국어" />
      </div>
      <SaveStatus state={state} />
    </div>
  );
}

function ReducedMotionStatus() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return (
    <span className="font-mono text-[11px] tracking-[0.18em] text-foreground/55 uppercase">
      {reduced === null
        ? "Detecting…"
        : reduced
          ? "Active"
          : "Off (system default)"}
    </span>
  );
}
