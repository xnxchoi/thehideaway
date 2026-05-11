"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  ChoiceField,
  Panel,
  PanelBento,
  PanelControls,
  PanelGrid,
  PanelHeader,
  SubRouteHeader
} from "@/components/UX/Settings";
import { RPage } from "@/components/UX/Transition";
import { useTheme } from "@/providers/Theme";

import { LocaleField } from "../_helpers/LocaleField";

interface GeneralSectionClientProps {
  locale: "en" | "ko";
}

/**
 * Canonical i18n shape for a settings page (use this as the template for
 * other section migrations):
 *
 *   1. The page-level component scopes a single `useTranslations` call
 *      (`Settings.general` here).
 *   2. Sub-components scope their own `useTranslations` to a leaf
 *      namespace — keeps the call site close to where the keys are read.
 *   3. No locale-conditional ternaries (`isKo ? "한글" : "English"`) and
 *      no static `LABELS` objects ever live in the component file.
 */
export default function GeneralSectionClient({
  locale
}: GeneralSectionClientProps) {
  const t = useTranslations("Settings.general");

  return (
    <RPage type="account" slug={[]}>
      <div className="flex w-full flex-col gap-8">
        <SubRouteHeader title={t("title")} blurb={t("blurb")} />

        <PanelBento>
          <Panel>
            <PanelGrid>
              <PanelHeader eyebrow={t("interfaceEyebrow")} />
              <PanelControls>
                <LocaleField current={locale} />
                <ThemeField />
              </PanelControls>
            </PanelGrid>
          </Panel>

          <Panel>
            <PanelGrid>
              <PanelHeader
                eyebrow={t("motionEyebrow")}
                blurb={t("motionBlurb")}
              />
              <PanelControls>
                <ReducedMotionStatus />
              </PanelControls>
            </PanelGrid>
          </Panel>
        </PanelBento>
      </div>
    </RPage>
  );
}

function ThemeField() {
  const t = useTranslations("Settings.general");
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);
  const saveTheme = useTheme((s) => s.saveTheme);

  const onChange = async (next: "light" | "dark") => {
    setTheme(next);
    saveTheme(next);
  };

  return (
    <ChoiceField<"light" | "dark">
      label={t("themeLabel")}
      value={(theme as "light" | "dark") ?? "light"}
      onChange={onChange}
      options={[
        {
          value: "light",
          label: t("themeOptions.light"),
          icon: <Sun size={12} />
        },
        {
          value: "dark",
          label: t("themeOptions.dark"),
          icon: <Moon size={12} />
        }
      ]}
    />
  );
}

/**
 * Read-only reflection of the OS `prefers-reduced-motion` query. There's
 * nothing to configure here — this row exists so the user can see what
 * The Hideaway is currently honouring, not so they can override it.
 */
function ReducedMotionStatus() {
  const t = useTranslations("Settings.general");
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const detected =
    reduced === null
      ? t("reduceMotionDetected.loading")
      : reduced
        ? t("reduceMotionDetected.on")
        : t("reduceMotionDetected.off");

  return (
    <div className="rounded-lg bg-foreground/[0.025] px-4 py-3 dark:bg-foreground/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-foreground">
            {t("reduceMotionLabel")}
          </span>
          <span className="text-xs text-foreground/65 dark:text-foreground/60">
            {t("reduceMotionDescription")}
          </span>
        </div>
        <span className="text-xs text-foreground/85 tabular-nums">
          {detected}
        </span>
      </div>
    </div>
  );
}
