"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import * as m from "motion/react-m";
import { useShallow } from "zustand/shallow";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { useDetailsContext } from "./DetailsContext";
import { useDayNNightScene } from "../store";
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
  const sessionUserId = useRPSession(useShallow((r) => r.id as string | null));
  const loaderProgress = useDayNNightScene(useShallow((r) => r.loaderProgress));
  const isImmersive = view === "immersive";
  const isRsvped = Boolean(sessionUserId);
  const rsvpLabel = isRsvped ? t("rsvpCta.rsvped") : t("rsvpCta.rsvp");
  const rsvpStrength = Math.max(0.42, Math.min(1, loaderProgress));
  const rsvpStyle = {
    ["--dn-rsvp-strength" as string]: (0.42 + rsvpStrength * 0.58).toFixed(3),
    ["--dn-rsvp-saturation" as string]: (0.68 + rsvpStrength * 0.38).toFixed(3),
    ["--dn-rsvp-depth" as string]: `${(5 + rsvpStrength * 7).toFixed(1)}px`
  } satisfies CSSProperties;
  const rsvpBorderClass = isRsvped
    ? "bg-[linear-gradient(90deg,oklch(51%_0.07_255),oklch(58%_0.08_48),oklch(51%_0.07_255))]"
    : "animate-[dn-rsvp-chroma-field_6.8s_ease-in-out_infinite] bg-[radial-gradient(circle_at_18%_24%,oklch(54%_0.07_255/0.82)_0%,transparent_34%),radial-gradient(circle_at_76%_32%,oklch(58%_0.075_50/0.74)_0%,transparent_36%),conic-gradient(from_120deg_at_52%_50%,oklch(44%_0.06_255),oklch(53%_0.052_228),oklch(58%_0.07_56),oklch(48%_0.058_36),oklch(44%_0.06_255))] bg-[length:155%_155%,165%_165%,200%_200%]";
  const rsvpTextClass = isRsvped
    ? "bg-[linear-gradient(90deg,oklch(66%_0.07_255),oklch(70%_0.075_52),oklch(66%_0.07_255))] bg-clip-text text-transparent"
    : "animate-[dn-rsvp-chroma-ink_5.2s_ease-in-out_infinite] bg-[linear-gradient(110deg,oklch(62%_0.062_255)_0%,oklch(66%_0.048_232)_16.666%,oklch(69%_0.068_52)_33.333%,oklch(64%_0.055_38)_41.666%,oklch(62%_0.062_255)_50%,oklch(66%_0.048_232)_66.666%,oklch(69%_0.068_52)_83.333%,oklch(64%_0.055_38)_91.666%,oklch(62%_0.062_255)_100%)] bg-[length:200%_100%] bg-clip-text text-transparent";

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

        <span aria-hidden className="w-[6px] max-lg:hidden" />

        <Button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex cursor-pointer appearance-none items-center rounded-full border px-[14px] py-[10px] font-mono text-[10px] font-medium tracking-[0.12em] uppercase transition-[background-color,color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hover:scale-[1.015] hover:border-[rgba(244,242,235,0.28)] hover:text-white active:scale-[0.985] lg:text-[11px]"
          style={{
            color: FG,
            backgroundColor: "rgba(244, 242, 235, 0.08)",
            borderColor: "rgba(244, 242, 235, 0.12)"
          }}
        >
          {t("infoCta")}
        </Button>

        <Link
          href="/tickets/day-n-night"
          className="dn-rsvp-link group/dn-rsvp relative inline-flex cursor-pointer items-center gap-[8px] overflow-hidden rounded-full p-px font-mono text-[10px] font-semibold tracking-[0.14em] uppercase no-underline [perspective:760px] lg:text-[11px]"
          aria-label={rsvpLabel}
          data-rsvped={isRsvped ? "true" : "false"}
          style={rsvpStyle}
        >
          <span
            aria-hidden
            className={`dn-rsvp-field absolute inset-0 ${rsvpBorderClass}`}
          />
          <span className="dn-rsvp-core relative inline-flex items-center gap-[8px] rounded-full bg-[linear-gradient(180deg,rgba(10,10,13,0.98),rgba(0,0,0,0.92))] px-[16px] py-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:px-[18px] lg:py-[12px]">
            <span
              aria-hidden
              className="dn-rsvp-sheen absolute inset-0 rounded-full"
            />
            {isRsvped ? (
              <span
                aria-hidden
                className="h-[6px] w-[6px] rounded-full bg-[oklch(64%_0.07_255)]"
              />
            ) : null}
            <span className={rsvpTextClass}>{rsvpLabel}</span>
            <span
              aria-hidden
              className={`${rsvpTextClass} text-[1.05em] leading-none`}
            >
              →
            </span>
          </span>
        </Link>
      </div>
      <style>{`
        .dn-rsvp-link {
          transform-style: preserve-3d;
          transition:
            transform 520ms cubic-bezier(0.19, 1, 0.22, 1),
            filter 520ms cubic-bezier(0.19, 1, 0.22, 1);
        }

        .dn-rsvp-link:hover {
          transform: translateY(-1px) rotateX(1.5deg) rotateY(-2.25deg);
        }

        .dn-rsvp-link:active {
          transform: translateY(0) rotateX(0deg) rotateY(0deg) scale(0.985);
        }

        .dn-rsvp-field {
          opacity: var(--dn-rsvp-strength);
          filter: saturate(var(--dn-rsvp-saturation));
          transform: translateZ(-18px);
        }

        .dn-rsvp-core {
          isolation: isolate;
          transform: translateZ(0);
          transition:
            transform 560ms cubic-bezier(0.19, 1, 0.22, 1),
            box-shadow 560ms cubic-bezier(0.19, 1, 0.22, 1);
        }

        .dn-rsvp-link:hover .dn-rsvp-core {
          transform: translateZ(var(--dn-rsvp-depth));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.09),
            inset 0 -1px 0 rgba(255,255,255,0.035);
        }

        .dn-rsvp-sheen {
          background:
            radial-gradient(circle at 18% 18%, rgba(255,255,255,0.075), transparent 34%),
            linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.055) 44%, transparent 57%);
          opacity: calc(0.34 * var(--dn-rsvp-strength));
          mix-blend-mode: screen;
          transform: translateX(-18%);
          transition:
            opacity 560ms cubic-bezier(0.19, 1, 0.22, 1),
            transform 720ms cubic-bezier(0.19, 1, 0.22, 1);
        }

        .dn-rsvp-link:hover .dn-rsvp-sheen {
          opacity: calc(0.5 * var(--dn-rsvp-strength));
          transform: translateX(12%);
        }

        @keyframes dn-rsvp-chroma-ink {
          0% {
            background-position: 0% 52%;
            filter: saturate(calc(var(--dn-rsvp-saturation) * 0.92));
          }
          23% {
            background-position: 46% 38%;
            filter: saturate(calc(var(--dn-rsvp-saturation) * 1.02));
          }
          51% {
            background-position: 92% 58%;
            filter: saturate(calc(var(--dn-rsvp-saturation) * 0.88));
          }
          78% {
            background-position: 72% 44%;
            filter: saturate(calc(var(--dn-rsvp-saturation) * 1.05));
          }
          100% {
            background-position: 100% 52%;
            filter: saturate(calc(var(--dn-rsvp-saturation) * 0.92));
          }
        }

        @keyframes dn-rsvp-chroma-field {
          0% {
            background-position: 12% 18%, 84% 28%, 0% 50%;
            transform: translateZ(-18px) rotate(0deg) scale(1);
          }
          19% {
            background-position: 38% 42%, 66% 18%, 44% 54%;
            transform: translateZ(-18px) rotate(4deg) scale(1.025);
          }
          43% {
            background-position: 72% 30%, 38% 58%, 95% 46%;
            transform: translateZ(-18px) rotate(-3deg) scale(1.015);
          }
          67% {
            background-position: 46% 72%, 22% 36%, 142% 55%;
            transform: translateZ(-18px) rotate(2deg) scale(1.03);
          }
          84% {
            background-position: 24% 46%, 58% 72%, 182% 48%;
            transform: translateZ(-18px) rotate(-1deg) scale(1.01);
          }
          100% {
            background-position: 12% 18%, 84% 28%, 100% 50%;
            transform: translateZ(-18px) rotate(0deg) scale(1);
          }
        }
      `}</style>
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
      className="inline-flex cursor-pointer appearance-none items-center rounded-full px-[12px] py-[9px] font-mono text-[10px] tracking-[0.12em] uppercase transition-[background-color,color,transform] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hover:scale-[1.015] active:scale-[0.985] lg:text-[11px]"
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
