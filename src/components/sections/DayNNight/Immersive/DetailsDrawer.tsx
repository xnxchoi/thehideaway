"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/components/core/Link/Link";
import { Drawer } from "@/components/ui/vaul";
import { SurvivalKit } from "../SurvivalKit";

/**
 * Details drawer — a right-side Vaul sheet surfacing the event's
 * practical info without forcing the user to scroll through the loop.
 *
 * Contents (top → bottom):
 *   1. Eyebrow + Title
 *   2. Date / Time / Location rows
 *   3. Dress code summary line
 *   4. SurvivalKit (embedded)
 *   5. Reserve CTA
 *
 * Controlled drawer — `open` / `onOpenChange` come from QuickActions.
 */
interface DetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DetailsDrawer({ open, onOpenChange }: DetailsDrawerProps) {
  const t = useTranslations("Event.DayNNight");

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      modal
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-[3px]" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed top-0 right-0 z-[81] flex h-full w-full max-w-[480px] flex-col text-[var(--dn-fg)] shadow-[-32px_0_72px_-12px_rgba(0,0,0,0.7)] outline-none"
          style={{
            // Opaque elevated ink — visually detached from the dark sky
            // background. Slightly LIGHTER than --dn-bg so the sheet
            // reads as floating forward, not melted into the page.
            backgroundColor: "oklch(11% 0.018 280)",
            borderLeft: "1px solid oklch(from var(--dn-fg) l c h / 0.18)"
          }}
        >
          <Drawer.Handle className="absolute top-1/2 left-2 h-16 w-1 -translate-y-1/2 rounded-full bg-[var(--dn-fg)] opacity-30" />

          <header className="flex items-center justify-between border-b border-[var(--dn-line)] px-8 pt-8 pb-6">
            <div className="grid gap-2">
              <span className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
                Details
              </span>
              <Drawer.Title className="font-serif text-[clamp(1.85rem,2.4vw,2.4rem)] leading-[1.05] font-bold tracking-[-0.015em]">
                {t("title")}
              </Drawer.Title>
            </div>
            <Drawer.Close
              aria-label="Close"
              className="ease inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--dn-line)] text-[var(--dn-fg-mute)] transition-colors hover:border-[var(--dn-fg)] hover:text-[var(--dn-fg)]"
            >
              <span aria-hidden className="text-base leading-none">
                ×
              </span>
            </Drawer.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-8 py-7">
            <dl className="grid gap-[14px]">
              <DetailsRow label={t("date.weekday")} value={t("date.full")} />
              <DetailsRow
                label="Time"
                value={`${t("opening.time")}  ${t("act.night.time")}`}
              />
              <DetailsRow
                label={t("location.label")}
                value={t("location.neighborhood")}
                hint={t("location.address")}
              />
              <DetailsRow
                label="Dress"
                value={t("dressCode.heading")}
                hint={t("dressCode.option2.body")}
              />
              <DetailsRow
                label="Entry"
                value={t("entry.amount")}
                hint={t("entry.perGuest")}
              />
            </dl>

            <div className="mt-9 border-t border-[var(--dn-line)] pt-7">
              <SurvivalKit variant="embedded" />
            </div>
          </div>

          <footer className="border-t border-[var(--dn-line)] px-8 pt-5 pb-7">
            <Link
              href="/tickets/day-n-night"
              className="ease inline-flex w-full cursor-pointer items-baseline justify-between gap-4 border-0 border-b border-[var(--dn-fg)] bg-transparent py-3 font-mono text-[13px] tracking-[0.32em] text-[var(--dn-fg)] uppercase no-underline transition-[gap] duration-300 hover:gap-7"
            >
              <span>{t("rsvpCta.primary")}</span>
              <span aria-hidden className="text-[1.2em] leading-none">
                →
              </span>
            </Link>
          </footer>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

interface DetailsRowProps {
  label: string;
  value: string;
  hint?: string;
}

function DetailsRow({ label, value, hint }: DetailsRowProps) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-x-5 border-t border-[var(--dn-line)] pt-[14px] first:border-t-0 first:pt-0">
      <dt className="font-mono text-[10px] tracking-[0.32em] text-[var(--dn-fg-faint)] uppercase">
        {label}
      </dt>
      <dd className="grid gap-1">
        <span className="font-serif text-[clamp(1.15rem,1.3vw,1.35rem)] leading-[1.3] tracking-[-0.005em] text-[var(--dn-fg)]">
          {value}
        </span>
        {hint && (
          <span className="text-[12px] leading-[1.4] text-[var(--dn-fg-mute)]">
            {hint}
          </span>
        )}
      </dd>
    </div>
  );
}
