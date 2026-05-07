"use client";

import { ChoiceField } from "@/components/UX/Settings";
import { useState, useTransition } from "react";

import { setLocaleAction } from "./setLocale";

/**
 * Shared locale toggle. Used by both the Account section (under Sign-in)
 * and the Appearance section.
 *
 * Optimistic update: the active state flips immediately and rolls back
 * if the server action rejects. Uses startTransition so React keeps the
 * UI responsive while the action persists.
 */
export function LocaleField({
  current,
  label = "Language"
}: {
  current: "en" | "ko";
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<"en" | "ko">(current);

  const onChange = async (next: "en" | "ko") => {
    if (next === active) return;
    setActive(next);
    // Per the breakpoint-3 audit: React 19 startTransition accepts async
    // callbacks natively. We still surface a Promise so ChoiceField's
    // pending tracking works — but the rejection path is straightforward,
    // not wrapped through a Promise constructor that obscures it.
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
      label={label}
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
