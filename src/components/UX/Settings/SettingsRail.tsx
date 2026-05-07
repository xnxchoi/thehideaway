"use client";

import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { SETTINGS_SECTIONS, type SettingsSectionSlug } from "./sections";

const SETTINGS_BASE = "/me/settings";

const isActive = (pathname: string, slug: SettingsSectionSlug) =>
  pathname === `${SETTINGS_BASE}/${slug}` ||
  pathname.startsWith(`${SETTINGS_BASE}/${slug}/`);

export const SettingsRail = () => {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Settings sections"
      className="relative flex flex-col items-start justify-around gap-5 border-l border-border/20"
    >
      {SETTINGS_SECTIONS.map((section) => {
        const active = isActive(pathname, section.slug);
        return (
          <Link
            key={section.slug}
            href={`${SETTINGS_BASE}/${section.slug}`}
            className={cn(
              "group relative flex items-baseline gap-4 py-3.5 pr-4 pl-5 transition-all duration-200",
              // active rule (gradient instead of solid)
              "before:absolute before:inset-y-1 before:-left-px before:w-px before:bg-gradient-to-b before:from-transparent before:via-foreground/80 before:to-transparent before:transition-opacity dark:before:via-foreground",
              active
                ? "before:opacity-100"
                : "before:opacity-0 hover:before:opacity-40",
              // active sheen — barely-there gradient fading to the right
              "after:pointer-events-none after:absolute after:inset-y-0 after:-left-px after:w-32 after:bg-gradient-to-r after:from-foreground/[0.05] after:to-transparent after:transition-opacity dark:after:from-foreground/[0.07]",
              active ? "after:opacity-100" : "after:opacity-0"
            )}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={cn(
                "relative z-10 font-mono text-[10px] tracking-widest tabular-nums transition-colors",
                active
                  ? "text-foreground/85"
                  : "text-foreground/55 dark:text-foreground/50"
              )}
            >
              {section.number}
            </span>
            <span
              className={cn(
                "relative z-10 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors xl:text-xs",
                active
                  ? "text-foreground"
                  : "text-foreground/60 group-hover:text-foreground/85 dark:text-foreground/55"
              )}
            >
              {section.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export const SettingsRailMobile = () => {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Settings sections"
      className="-mx-6 flex snap-x snap-mandatory gap-0 overflow-x-auto border-b border-border/20 px-6 [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden"
    >
      {SETTINGS_SECTIONS.map((section) => {
        const active = isActive(pathname, section.slug);
        return (
          <Link
            key={section.slug}
            href={`${SETTINGS_BASE}/${section.slug}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex shrink-0 snap-start items-baseline gap-2 py-3 pr-5 transition-colors",
              "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-foreground after:to-transparent after:transition-opacity",
              active ? "after:opacity-100" : "after:opacity-0"
            )}
          >
            <span
              className={cn(
                "font-mono text-[9px] tracking-widest tabular-nums",
                active
                  ? "text-foreground/85"
                  : "text-foreground/55 dark:text-foreground/50"
              )}
            >
              {section.number}
            </span>
            <span
              className={cn(
                "font-mono text-[10px] tracking-[0.18em] uppercase transition-colors",
                active
                  ? "text-foreground"
                  : "text-foreground/60 dark:text-foreground/55"
              )}
            >
              {section.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
