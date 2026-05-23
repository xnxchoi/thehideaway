"use client";

import { useTranslations } from "next-intl";
import * as m from "motion/react-m";
import { Button } from "@/components/core/Button";
import { useDetailsContext } from "./DetailsContext";
import { useViewContext } from "../ViewContext";

const FG = "rgb(244, 242, 235)"; // resolved --dn-fg cream

/**
 * Bottom action chrome.
 *
 * The old pill worked mechanically but felt too uniform: reserve,
 * essentials, and view-toggle all sat at the same visual temperature.
 * This version makes the CTA feel like a brighter lead object while the
 * utility controls tuck into a darker instrument cluster behind it.
 */
export function QuickActions() {
  const t = useTranslations("Event.DayNNight");
  const tView = useTranslations("Event.DayNNight.viewToggle");
  const { open, setOpen } = useDetailsContext();
  const { view, setView } = useViewContext();
  const isImmersive = view === "immersive";

  return (
    <m.div
      initial={{ y: "140%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.3, visualDuration: 0.5 }}
      // `bottom-5` resolved to ~12px (10px rem) — too tight on mobile,
      // leaving the pill colliding with the device safe area / browser
      // chrome. Clear the home-indicator inset + a 28px margin.
      className="fixed bottom-[calc(28px+env(safe-area-inset-bottom))] left-1/2 z-[47] -translate-x-1/2 lg:bottom-[92px]"
    >
      <div
        className="relative flex items-center rounded-[30px] p-[6px] backdrop-blur-[16px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(24, 22, 38, 0.92) 0%, rgba(11, 10, 19, 0.9) 100%)",
          border: "1px solid rgba(244, 242, 235, 0.16)",
          boxShadow:
            "0 18px 42px -18px rgba(0, 0, 0, 0.72), inset 0 1px 0 rgba(255,255,255,0.08)",
          gap: "6px"
        }}
      >
        <Button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="ease inline-flex cursor-pointer items-center gap-[8px] rounded-full px-[16px] py-[11px] font-mono text-[10px] font-semibold tracking-[0.14em] uppercase no-underline transition-[transform,filter] duration-200 hover:-translate-y-px hover:brightness-105 lg:px-[18px] lg:py-[12px] lg:text-[11px]"
          style={{
            background:
              "linear-gradient(135deg, var(--dn-accent-day) 0%, color-mix(in oklch, var(--dn-accent-day) 72%, white 28%) 100%)",
            color: "var(--dn-bg)",
            boxShadow: "0 10px 24px -14px color-mix(in oklch, var(--dn-accent-day) 65%, black 35%)"
          }}
        >
          <span>{t("rsvpCta.primary")}</span>
          <span aria-hidden className="text-[1.05em] leading-none">
            →
          </span>
        </Button>

        <Button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="ease inline-flex cursor-pointer appearance-none items-center rounded-full border px-[14px] py-[10px] font-mono text-[10px] font-medium tracking-[0.12em] uppercase transition-[background-color,color,border-color] duration-200 hover:border-[rgba(244,242,235,0.28)] hover:text-white lg:text-[11px]"
          style={{
            color: FG,
            backgroundColor: "rgba(244, 242, 235, 0.08)",
            borderColor: "rgba(244, 242, 235, 0.12)"
          }}
        >
          {t("infoCta")}
        </Button>

        <span aria-hidden className="w-[6px] max-lg:hidden" />

        <div
          role="radiogroup"
          aria-label={tView("label")}
          className="flex items-center rounded-full border border-white/6 bg-black/12 p-[3px] max-lg:hidden"
          style={{ gap: "3px" }}
        >
          <ViewChip
            label={tView("immersive")}
            active={isImmersive}
            onClick={() => setView("immersive")}
          />
          <ViewChip
            label={tView("simplified")}
            active={!isImmersive}
            onClick={() => setView("simplified")}
          />
        </div>
      </div>
    </m.div>
  );
}

interface ViewChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ViewChip({ label, active, onClick }: ViewChipProps) {
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className="ease inline-flex cursor-pointer appearance-none items-center rounded-full px-[12px] py-[9px] font-mono text-[10px] tracking-[0.12em] uppercase transition-[background-color,color,transform] duration-200 hover:-translate-y-px lg:text-[11px]"
      style={{
        backgroundColor: active ? "rgba(244, 242, 235, 0.18)" : "transparent",
        color: active ? FG : "rgba(244, 242, 235, 0.52)",
        fontWeight: active ? 600 : 500
      }}
    >
      {label}
    </Button>
  );
}
