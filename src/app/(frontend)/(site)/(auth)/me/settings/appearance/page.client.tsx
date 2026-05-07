"use client";

import {
  ChoiceField,
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader
} from "@/components/UX/Settings";
import { useTheme } from "@/providers/Theme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { setLocaleAction } from "../_helpers/setLocale";
import { RPage } from "@/components/UX/Transition";

interface AppearanceSectionClientProps {
  locale: "en" | "ko";
}

export default function AppearanceSectionClient({
  locale
}: AppearanceSectionClientProps) {
  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Theme"
              title="Light or dark"
              blurb="Light is editorial. Dark is reading by lamplight."
            />
            <PanelControls>
              <ThemeField />
            </PanelControls>
          </PanelGrid>
        </Panel>

        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Language"
              title="Site-wide UI language"
              blurb="Affects this device until your account preference is synced."
            />
            <PanelControls>
              <LocaleField current={locale} />
            </PanelControls>
          </PanelGrid>
        </Panel>

        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Motion"
              title="Reduced motion"
              blurb="The Hideaway honours your operating-system reduced-motion preference. There's no in-app override."
            />
            <PanelControls>
              <ReducedMotionStatus />
            </PanelControls>
          </PanelGrid>
        </Panel>
      </div>
    </RPage>
  );
}

function ThemeField() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const saveTheme = useTheme((s) => s.saveTheme);

  const onChange = async (next: "light" | "dark") => {
    setTheme(next);
    saveTheme(next);
  };

  return (
    <ChoiceField<"light" | "dark">
      label="Mode"
      value={(theme as "light" | "dark") ?? "light"}
      onChange={onChange}
      options={[
        { value: "light", label: "Light", icon: <Sun size={12} /> },
        { value: "dark", label: "Dark", icon: <Moon size={12} /> }
      ]}
    />
  );
}

function LocaleField({ current }: { current: "en" | "ko" }) {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<"en" | "ko">(current);

  const onChange = async (next: "en" | "ko") => {
    if (next === active) return;
    setActive(next);
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await setLocaleAction(next);
          resolve();
        } catch (e) {
          setActive(current);
          reject(e);
        }
      });
    });
  };

  return (
    <ChoiceField<"en" | "ko">
      label="Language"
      value={active}
      onChange={onChange}
      disabled={pending}
      options={[
        { value: "en", label: "EN — English" },
        { value: "ko", label: "KO — 한국어" }
      ]}
    />
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
    <div className="rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-foreground">System preference</span>
          <span className="text-xs text-foreground/65 dark:text-foreground/60">
            Configured in your operating system.
          </span>
        </div>
        <span className="text-xs text-foreground/85">
          {reduced === null
            ? "Detecting…"
            : reduced
              ? "Active"
              : "Off (system default)"}
        </span>
      </div>
    </div>
  );
}
