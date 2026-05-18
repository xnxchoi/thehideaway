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

  return (
    <div className={s.toggle} role="radiogroup" aria-label={t("label")}>
      <span aria-hidden className={s.toggleLabel}>
        {t("label")}
      </span>
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
