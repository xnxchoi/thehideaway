import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Lifted dark panel — the structural unit of admin / settings surfaces.
 *
 * Visual signature (per CLAUDE.md "Admin surfaces (Fey direction)"):
 *  - rounded-2xl outer corners
 *  - bg foreground/[0.04] (light) — bg foreground/[0.05] (dark)
 *  - top-edge inner highlight via :before pseudo-element (the lift)
 *  - soft outer drop-shadow (the float)
 *  - no visible border; separation comes from luminance + shadow
 *
 * Internal composition is up to the consumer; pair with <PanelGrid/> when
 * you want the standard 2-col `description | controls` layout.
 */
interface PanelProps {
  children: ReactNode;
  className?: string;
  /**
   * Render a `<section>` (default), `<aside>`, etc. Use `<aside>` for the
   * companion column on the overview canvas.
   */
  as?: "section" | "aside" | "div";
}

export function Panel({ children, className, as = "section" }: PanelProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-2xl",
        // Surface tint — lighter than the canvas. Slightly stronger in dark
        // mode so the panel reads as a pool of light against near-black.
        "bg-foreground/[0.04] dark:bg-foreground/[0.05]",
        // Top-edge inner highlight: the lift. Spans the full panel width
        // and fades softly toward the edges.
        "before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/25 before:to-transparent",
        "dark:before:via-foreground/30",
        // Soft outer shadow: the float. Slightly stronger in dark mode.
        "shadow-[0_2px_24px_-8px_rgba(0,0,0,0.35)]",
        "dark:shadow-[0_2px_28px_-8px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Standard 2-column composition inside a Panel.
 *
 *   ┌─────────────── Panel ───────────────┐
 *   │  description (5fr) │ controls (7fr) │
 *   └─────────────────────────────────────┘
 *
 * Stacks below `lg:`. Padding scales with breakpoint.
 */
interface PanelGridProps {
  children: ReactNode;
  className?: string;
}

export function PanelGrid({ children, className }: PanelGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-12 gap-y-8 p-7",
        "lg:grid-cols-[minmax(220px,5fr)_minmax(0,7fr)]",
        "xl:p-9 2xl:p-10",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Left column of a PanelGrid — eyebrow + title + blurb.
 *
 * Sans-only typography per the Fey direction; admin surfaces drop the
 * mono-caps eyebrow used elsewhere on content surfaces.
 */
interface PanelHeaderProps {
  /** Optional small categorical label, e.g. "Identity" / "Voice". */
  eyebrow?: string;
  /** Section title — sans, light weight, never mono. */
  title: string;
  /** Optional supporting blurb — body weight, foreground/70. */
  blurb?: string;
  /** Optional ambient meta (a status, a count). */
  meta?: ReactNode;
  className?: string;
}

export function PanelHeader({
  eyebrow,
  title,
  blurb,
  meta,
  className
}: PanelHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2", className)}>
      {eyebrow ? (
        <p className="text-xs font-medium tracking-tight text-foreground/55 dark:text-foreground/50">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-xl font-light tracking-tight text-foreground xl:text-2xl">
        {title}
      </h2>
      {blurb ? (
        <p className="max-w-prose text-sm leading-relaxed text-foreground/70 dark:text-foreground/65">
          {blurb}
        </p>
      ) : null}
      {meta ? (
        <div className="mt-3 text-xs text-foreground/55 dark:text-foreground/50">
          {meta}
        </div>
      ) : null}
    </header>
  );
}

/**
 * Right column of a PanelGrid — vertical stack of inset row pills.
 *
 * Spacing is tight (gap-1) because each row pill carries its own
 * background and top-edge highlight; rows separate visually without
 * needing dividers.
 */
interface PanelControlsProps {
  children: ReactNode;
  className?: string;
}

export function PanelControls({ children, className }: PanelControlsProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      {children}
    </div>
  );
}
