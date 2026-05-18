"use client";

import { useTranslations } from "next-intl";
import s from "./styles.module.scss";
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
    <div className={s.toggle} role="radiogroup" aria-label={t("label")}>
      <button
        type="button"
        role="radio"
        aria-checked={value === "immersive"}
        data-active={value === "immersive"}
        className={s.toggleBtn}
        onClick={() => onChange("immersive")}
      >
        {t("immersive")}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "simplified"}
        data-active={value === "simplified"}
        className={s.toggleBtn}
        onClick={() => onChange("simplified")}
      >
        {t("simplified")}
      </button>
    </div>
  );
}
