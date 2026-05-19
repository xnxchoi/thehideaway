"use client";

import { useTranslations } from "next-intl";
import type { DayNNightView } from "./useViewPref";

interface ViewToggleProps {
  value: DayNNightView;
  onChange: (next: DayNNightView) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const t = useTranslations("Event.DayNNight.viewToggle");

  // Visible markup is a binary toggle — two buttons only. The "View"
  // label is announced via aria-label on the radiogroup so screen
  // readers still hear the control's purpose; rendering it visually
  // made the pill read as a tri-state switch (label / Story / Card).
  return (
    <div
      data-dn-chrome-pill
      role="radiogroup"
      aria-label={t("label")}
      className="fixed top-5 right-5 z-[46] inline-flex gap-0.5 p-[3px] rounded-full border border-[var(--dn-chrome-line)] md:top-8 md:right-8 xl:top-10 xl:right-12"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "immersive"}
        data-active={value === "immersive"}
        data-dn-toggle-btn
        className="appearance-none border-0 bg-transparent text-[var(--dn-chrome-fg-mute)] font-mono text-[10px] tracking-[0.16em] uppercase py-[7px] px-[13px] rounded-full cursor-pointer transition-[background,color] duration-[250ms] ease"
        onClick={() => onChange("immersive")}
      >
        {t("immersive")}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "simplified"}
        data-active={value === "simplified"}
        data-dn-toggle-btn
        className="appearance-none border-0 bg-transparent text-[var(--dn-chrome-fg-mute)] font-mono text-[10px] tracking-[0.16em] uppercase py-[7px] px-[13px] rounded-full cursor-pointer transition-[background,color] duration-[250ms] ease"
        onClick={() => onChange("simplified")}
      >
        {t("simplified")}
      </button>
    </div>
  );
}
