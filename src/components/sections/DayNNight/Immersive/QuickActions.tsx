"use client";

import { useTranslations } from "next-intl";
import * as m from "motion/react-m";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { useDetailsContext } from "./DetailsContext";
import { useViewContext } from "../ViewContext";

const FG = "rgb(244, 242, 235)"; // resolved --dn-fg cream

/**
 * Bottom action chrome — two-layer nested pills:
 *
 *   outer pill (translucent dark, backdrop-blurred)
 *     ├─ Reserve chip   (warm accent fill, primary)
 *     ├─ Details chip   (subtle cream-tint fill)
 *     ├─ Story chip     (cream fill when active)
 *     └─ Card chip      (cream fill when active)
 *
 * Story+Card sit at the same level as Reserve/Details — no sub-pill.
 * They're visually grouped as the view toggle via gap-delta alone:
 *   Reserve → 6px → Details → 12px → Story → 3px → Card.
 * The wide gap between Details and Story signals the group boundary;
 * the tight gap between Story and Card signals they're a pair.
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
      className="fixed bottom-5 left-1/2 z-[47] -translate-x-1/2 lg:bottom-[92px]"
    >
      {/* Outer pill — hosts the four chips. */}
      <div
        className="flex items-center rounded-full p-[5px] backdrop-blur-[14px]"
        style={{
          backgroundColor: "rgba(15, 14, 26, 0.85)",
          border: "1px solid rgba(244, 242, 235, 0.18)",
          boxShadow: "0 10px 28px -10px rgba(0, 0, 0, 0.55)",
          gap: "6px"
        }}
      >
        {/* Reserve — warm accent fill */}
        <Link
          href="/tickets/day-n-night"
          className="ease inline-flex cursor-pointer items-center gap-[6px] rounded-full px-[14px] py-[10px] font-mono text-[10px] font-semibold tracking-[0.1em] uppercase no-underline transition-[filter] duration-200 hover:brightness-110 lg:text-[11px]"
          style={{
            backgroundColor: "var(--dn-accent-day)",
            color: "var(--dn-bg)"
          }}
        >
          <span>{t("rsvpCta.primary")}</span>
          <span aria-hidden className="text-[1.05em] leading-none">
            →
          </span>
        </Link>

        {/* Details — subtle cream fill */}
        <Button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="ease inline-flex cursor-pointer appearance-none items-center rounded-full px-[14px] py-[10px] font-mono text-[10px] font-medium tracking-[0.1em] uppercase transition-colors duration-200 lg:text-[11px]"
          style={{
            color: FG,
            backgroundColor: "rgba(244, 242, 235, 0.14)"
          }}
        >
          Details
        </Button>

        {/* Group-boundary spacer — wider gap before view toggle */}
        <span aria-hidden className="w-[6px]" />

        {/* Story / Card — active gets cream fill, paired by tight gap */}
        <div
          role="radiogroup"
          aria-label={tView("label")}
          className="flex items-center"
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
      className="ease inline-flex cursor-pointer appearance-none items-center rounded-full px-[12px] py-[10px] font-mono text-[10px] tracking-[0.1em] uppercase transition-colors duration-200 lg:text-[11px]"
      style={{
        backgroundColor: active ? "rgba(244, 242, 235, 0.20)" : "transparent",
        color: active ? FG : "rgba(244, 242, 235, 0.55)",
        fontWeight: active ? 600 : 500
      }}
    >
      {label}
    </Button>
  );
}
