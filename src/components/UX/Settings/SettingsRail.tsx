"use client";

import { Link } from "@/components/core/Link/Link";
import {
  Bell,
  IdCard,
  ShieldCheck,
  Sliders,
  UserRound,
  type LucideIcon
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { SETTINGS_SECTION_SLUGS, type SettingsSectionSlug } from "./sections";

/**
 * Settings rail — macOS System Settings cadence in the Hideaway palette.
 *
 * Visual signature:
 *   - Each row is `[icon-tile] label` — same categorical color tile used
 *     on `<SectionLink/>` in the hub, miniaturised. Icons aren't
 *     decorative here; they encode section identity at a glance.
 *   - Active row: full-row `bg-foreground/[0.06]` rounded pill, no edge
 *     gradient. macOS uses a flat highlight; we match that, but
 *     restrained for the dark-canvas tone.
 *   - Hover row: a softer tint, only on inactive rows.
 *   - Wider than the editorial TOC (>= 248px) so labels don't crowd.
 *
 * Mobile: the desktop rail is `xl:` only. Mobile / tablet drill into the
 * hub page (`/me/settings`) per the iOS Settings cadence.
 */
const SETTINGS_BASE = "/me/settings";

type Tone = "data" | "account" | "billing" | "support" | "options" | "neutral";

interface RailDecor {
  icon: LucideIcon;
  /** Categorical color tone — same token set as <SectionLink/>. */
  tone: Tone;
}

/** Icon + tone per slug. Labels come from translations, not from here. */
const RAIL_DECOR: Record<SettingsSectionSlug, RailDecor> = {
  general: { icon: Sliders, tone: "data" },
  profile: { icon: UserRound, tone: "account" },
  account: { icon: IdCard, tone: "billing" },
  security: { icon: ShieldCheck, tone: "support" },
  notifications: { icon: Bell, tone: "options" }
};

const TILE_TONES: Record<Tone, string> = {
  account: "bg-[oklch(72%_0.10_50/0.18)] text-[oklch(85%_0.08_50)]",
  options: "bg-[oklch(60%_0.12_280/0.18)] text-[oklch(80%_0.10_280)]",
  support: "bg-[oklch(70%_0.14_160/0.18)] text-[oklch(85%_0.10_160)]",
  billing: "bg-[oklch(60%_0.18_25/0.20)] text-[oklch(80%_0.12_25)]",
  data: "bg-[oklch(75%_0.04_90/0.18)] text-[oklch(88%_0.04_90)]",
  neutral: "bg-foreground/[0.06] text-foreground/70 dark:bg-foreground/[0.08]"
};

const isActive = (pathname: string, slug: SettingsSectionSlug) =>
  pathname === `${SETTINGS_BASE}/${slug}` ||
  pathname.startsWith(`${SETTINGS_BASE}/${slug}/`);

export function SettingsRail() {
  const pathname = usePathname();
  const t = useTranslations("Settings");
  const tSections = useTranslations("Settings.sections");

  return (
    <nav aria-label={t("navAria")} className="flex w-full flex-col gap-0.5">
      {SETTINGS_SECTION_SLUGS.map((slug) => {
        const active = isActive(pathname, slug);
        const decor = RAIL_DECOR[slug];
        const Icon = decor.icon;
        const label = tSections(`${slug}.label`);
        return (
          <Link
            key={slug}
            href={`${SETTINGS_BASE}/${slug}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors duration-150 ease-out-power2",
              active
                ? "bg-foreground/[0.06] dark:bg-foreground/[0.08]"
                : "hover:bg-foreground/[0.03] dark:hover:bg-foreground/[0.04]",
              "focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-[7px]",
                TILE_TONES[decor.tone]
              )}
            >
              <Icon size={14} strokeWidth={1.4} />
            </span>
            <span
              className={cn(
                "text-sm tracking-tight transition-colors duration-150",
                active
                  ? "font-medium text-foreground"
                  : "font-normal text-foreground/75 group-hover:text-foreground dark:text-foreground/65"
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
