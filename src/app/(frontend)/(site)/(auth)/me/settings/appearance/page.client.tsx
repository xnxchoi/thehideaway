"use client";

import {
  ChoiceField,
  Panel,
  PanelControls,
  PanelGrid,
  PanelHeader,
  SubRouteHeader
} from "@/components/UX/Settings";
import { useTheme } from "@/providers/Theme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { RPage } from "@/components/UX/Transition";

/**
 * Appearance is intentionally focused: theme + ambient motion status.
 * Language was previously duplicated here from Account; removed at
 * breakpoint 3 to eliminate "which one wins" ambiguity. Language now
 * lives only on the Account section.
 */
export default function AppearanceSectionClient() {
  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-6">
        <SubRouteHeader
          title="Appearance"
          blurb="Theme and ambient motion. Language lives in Account."
        />

        <Panel>
          <PanelGrid>
            <PanelHeader
              eyebrow="Theme"
              title="Light or dark"
              blurb="Light is editorial. Dark is reading by lamplight. The Hideaway honours your OS reduced-motion preference; there is no in-app override."
            />
            <PanelControls>
              <ThemeField />
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
