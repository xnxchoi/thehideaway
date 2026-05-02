"use client";

import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import * as m from "motion/react-m";

interface TicketBottomBarProps {
  /** Small mono-uppercase label sitting above the title. */
  eyebrow: string;
  /** Page-level h1. */
  title: string;
  /** Optional count rendered inline with the title (mono, tabular). */
  count?: number | null;
  /** Optional right-side nav action, rendered as a quiet text link. */
  rightAction?: { label: string; href: string };
  /** Slot for an extra control on the right (e.g. focused-mode toggle). */
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Bottom-stuck navigation/title chassis used across the ticket pages.
 *
 * - Sits at `bottom-0` so it doesn't collide with the global site header.
 * - `pointer-events: none` on the outer wrapper so the page below can be
 *   clicked through the empty margins; `pointer-events: auto` on the
 *   chassis card itself.
 * - Padded to clear `env(safe-area-inset-bottom)` and the SideDrawer's
 *   collapsed handle peek on mobile (the drawer renders at z-239 and
 *   overlays this bar when expanded — that's fine).
 * - Visually a single chassis: rounded, hairline border, backdrop blur.
 *   Same vocabulary as the rest of the bottom UI (drawer handle,
 *   controlbar) so they read as one surface.
 */
export function TicketBottomBar({
  eyebrow,
  title,
  count,
  rightAction,
  rightSlot,
  className
}: TicketBottomBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30",
        className
      )}
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)"
      }}
    >
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
        className="pointer-events-auto mx-auto max-w-7xl px-4 pb-2 sm:px-6 md:pb-3 xl:px-10"
      >
        <div className="rounded-xl border border-border/30 bg-background/85 px-5 py-3 backdrop-blur-xl xl:px-6 xl:py-3.5">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase xl:text-xs">
                {eyebrow}
              </p>
              <h1 className="mt-0.5 truncate text-xl font-light tracking-tight xl:text-2xl">
                {title}
                {typeof count === "number" && count > 0 ? (
                  <span className="ml-2 font-mono text-sm text-muted-foreground/50 tabular-nums">
                    {count}
                  </span>
                ) : null}
              </h1>
            </div>
            <div className="flex shrink-0 items-end gap-3">
              {rightAction ? (
                <Link
                  href={rightAction.href}
                  className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase transition-colors hover:text-foreground xl:text-xs"
                >
                  {rightAction.label}
                </Link>
              ) : null}
              {rightSlot}
            </div>
          </div>
        </div>
      </m.div>
    </div>
  );
}
