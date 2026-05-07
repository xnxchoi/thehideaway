"use client";

import { Link } from "@/components/core/Link/Link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import type {
  TableOfContentsProps,
  TableOfContentsRouteProps,
  TableOfContentsAnchorProps
} from "./types";
import { useActiveSection } from "./useActiveSection";

/**
 * Horizontal snap-scrolling counterpart of <TableOfContents/>.
 * Used at small viewports where a vertical rail isn't appropriate.
 *
 * Visual signature: the same gradient design language, expressed as a
 * horizontal sheen line under the active item.
 */
export function TableOfContentsMobile(props: TableOfContentsProps) {
  return props.mode === "route" ? (
    <RouteTocMobile {...props} />
  ) : (
    <AnchorTocMobile {...props} />
  );
}

function RouteTocMobile({
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
    <ScrollerShell ariaLabel={ariaLabel} className={className}>
      {items.map((item, index) => {
        const href = item.href ?? "#";
        const active = checkActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={mobileItemClass(active)}
          >
            <ItemContent
              number={item.number ?? formatOrdinal(index)}
              label={item.label}
              active={active}
            />
          </Link>
        );
      })}
    </ScrollerShell>
  );
}

function AnchorTocMobile({
  items,
  ariaLabel = "Contents",
  className,
  scrollOffsetTop = 96
}: TableOfContentsAnchorProps) {
  const ids = useMemo(
    () => items.map((i) => i.id).filter((v): v is string => Boolean(v)),
    [items]
  );

  const activeId = useActiveSection(ids, scrollOffsetTop);

  return (
    <ScrollerShell ariaLabel={ariaLabel} className={className}>
      {items.map((item, index) => {
        const href = item.id ? `#${item.id}` : "#";
        const active = item.id != null && item.id === activeId;
        return (
          <a
            key={item.id ?? `${index}`}
            href={href}
            aria-current={active ? "location" : undefined}
            className={mobileItemClass(active)}
          >
            <ItemContent
              number={item.number ?? formatOrdinal(index)}
              label={item.label}
              active={active}
            />
          </a>
        );
      })}
    </ScrollerShell>
  );
}

function ScrollerShell({
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
        "-mx-6 flex snap-x snap-mandatory gap-0 overflow-x-auto border-b border-border/20 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </nav>
  );
}

function mobileItemClass(active: boolean) {
  return cn(
    "group relative flex shrink-0 snap-start items-baseline gap-2 py-3 pr-5 transition-colors",
    "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-foreground after:to-transparent after:transition-opacity",
    active ? "after:opacity-100" : "after:opacity-0"
  );
}

function ItemContent({
  number,
  label,
  active
}: {
  number: string;
  label: string;
  active: boolean;
}) {
  return (
    <>
      <span
        className={cn(
          "font-mono text-[9px] tracking-widest tabular-nums",
          active
            ? "text-foreground/85"
            : "text-foreground/55 dark:text-foreground/50"
        )}
      >
        {number}
      </span>
      <span
        className={cn(
          "font-mono text-[10px] tracking-[0.18em] uppercase transition-colors",
          active
            ? "text-foreground"
            : "text-foreground/60 dark:text-foreground/55"
        )}
      >
        {label}
      </span>
    </>
  );
}

function formatOrdinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}
