"use client";

import s from "./Pricing.module.scss";

export type Interval = "monthly" | "yearly";

export type IntervalToggleProps = {
  value: Interval;
  onChange: (next: Interval) => void;
  yearlySaveLabel?: string | null;
};

export function IntervalToggle({
  value,
  onChange,
  yearlySaveLabel
}: IntervalToggleProps) {
  return (
    <div role="group" aria-label="Billing interval" className={s.toggleTrack}>
      <button
        type="button"
        aria-pressed={value === "monthly"}
        data-active={value === "monthly"}
        className={s.toggleButton}
        onClick={() => onChange("monthly")}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === "yearly"}
        aria-label={yearlySaveLabel ? `Yearly — ${yearlySaveLabel}` : "Yearly"}
        data-active={value === "yearly"}
        className={s.toggleButton}
        onClick={() => onChange("yearly")}
      >
        Yearly
        {yearlySaveLabel ? (
          <span className={s.savePill} aria-hidden>
            {yearlySaveLabel}
          </span>
        ) : null}
      </button>
    </div>
  );
}
