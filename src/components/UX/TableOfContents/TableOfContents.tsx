"use client";

import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import type {
  TableOfContentsProps,
  TableOfContentsRouteProps,
  TableOfContentsAnchorProps,
  TocItem
} from "./types";
import { useActiveSection } from "./useActiveSection";

/**
 * Vertical, gradient-led table of contents.
 *
 * Used for:
 *  - Long-form documents (`/terms`, `/privacy`) — `mode="anchor"`
 *  - Settings rail (`/me/settings/*`) — `mode="route"`
 *
 * Visual signature, ported from the original SettingsRail:
 *  - Hairline left border at `border-border/20`
 *  - Active rule: 1px-wide vertical gradient pill that fades in/out
 *  - Active sheen: a wide horizontal gradient fading to the right
 *  - Mono caps label + small tabular-nums marker
 */
export function TableOfContents(props: TableOfContentsProps) {
  return props.mode === "route" ? (
    <RouteToc {...props} />
  ) : (
    <AnchorToc {...props} />
  );
}

function RouteToc({
  items,
  ariaLabel = "Contents",
  className,
  isActive: customIsActive
}: TableOfContentsRouteProps) {
  const pathname = usePathname();

  const defaultIsActive = (pathname: string, href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const checkActive = customIsActive ?? defaultIsActive;

  return (
    <TocShell ariaLabel={ariaLabel} className={className}>
      {items.map((item, index) => {
        const href = item.href ?? "#";
        const active = checkActive(pathname, href);
        return (
          <TocItemLink
            key={href}
            href={href}
            label={item.label}
            number={item.number ?? formatOrdinal(index)}
            active={active}
            asAnchor={false}
          />
        );
      })}
    </TocShell>
  );
}

function AnchorToc({
  items,
  ariaLabel = "Contents",
  className,
  scrollOffsetTop = 96
}: TableOfContentsAnchorProps) {
  // Memoize ids so the effect inside useActiveSection doesn't tear down
  // on every render of the parent.
  const ids = useMemo(
    () => items.map((i) => i.id).filter((v): v is string => Boolean(v)),
    [items]
  );

  const activeId = useActiveSection(ids, scrollOffsetTop);

  return (
    <TocShell ariaLabel={ariaLabel} className={className}>
      {items.map((item, index) => {
        const href = item.id ? `#${item.id}` : "#";
        const active = item.id != null && item.id === activeId;
        return (
          <TocItemLink
            key={item.id ?? `${index}`}
            href={href}
            label={item.label}
            number={item.number ?? formatOrdinal(index)}
            active={active}
            asAnchor={true}
          />
        );
      })}
    </TocShell>
  );
}

function TocShell({
  ariaLabel,
  className,
  children
}: {
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "relative flex flex-col items-start justify-around gap-1 border-l border-border/20",
        className
      )}
    >
      {children}
    </nav>
  );
}

interface TocItemLinkProps {
  href: string;
  label: string;
  number: string;
  active: boolean;
  /** Use a plain <a> for in-page anchors so the browser handles the hash scroll. */
  asAnchor: boolean;
}

function TocItemLink({
  href,
  label,
  number,
  active,
  asAnchor
}: TocItemLinkProps) {
  const className = cn(
    "group relative flex items-baseline gap-4 py-3.5 pr-4 pl-5 transition-all duration-200",
    // Active rule: vertical gradient pill on the left edge
    "before:absolute before:inset-y-1 before:-left-px before:w-px before:bg-gradient-to-b before:from-transparent before:via-foreground/80 before:to-transparent before:transition-opacity dark:before:via-foreground",
    active
      ? "before:opacity-100"
      : "before:opacity-0 hover:before:opacity-40",
    // Active sheen: wide horizontal gradient fading right
    "after:pointer-events-none after:absolute after:inset-y-0 after:-left-px after:w-32 after:bg-gradient-to-r after:from-foreground/[0.05] after:to-transparent after:transition-opacity dark:after:from-foreground/[0.07]",
    active ? "after:opacity-100" : "after:opacity-0"
  );

  const content = (
    <>
      <span
        className={cn(
          "relative z-10 font-mono text-[10px] tracking-widest tabular-nums transition-colors",
          active
            ? "text-foreground/85"
            : "text-foreground/55 dark:text-foreground/50"
        )}
      >
        {number}
      </span>
      <span
        className={cn(
          "relative z-10 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors xl:text-xs",
          active
            ? "text-foreground"
            : "text-foreground/60 group-hover:text-foreground/85 dark:text-foreground/55"
        )}
      >
        {label}
      </span>
    </>
  );

  if (asAnchor) {
    // Use a plain <a> so the browser handles hash navigation & focus.
    return (
      <a
        href={href}
        className={className}
        aria-current={active ? "location" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </Link>
  );
}

function formatOrdinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}
