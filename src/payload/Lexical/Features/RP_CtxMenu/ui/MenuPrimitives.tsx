"use client";

import { ContextMenu, Menu } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Primitive UI components for the RP context menu. Design grammar matches
 * `src/payload/fields/Article/Cover/Components/CoverMenu.tsx`: `@base-ui/react`
 * ContextMenu + Menu parts, `rounded-md bg-[canvas] py-1.5 outline outline-1`
 * popups, `min-h-11 px-3.5 py-3.5 text-sm` rows with `before:` pseudo for the
 * highlight background.
 */

export function MenuPopup({
  className,
  children,
  ...props
}: ComponentProps<typeof ContextMenu.Popup>) {
  return (
    <ContextMenu.Popup
      className={cn(
        "max-w-[280px] min-w-[200px] origin-[var(--transform-origin)] rounded-md bg-[canvas]/40 py-1.5 outline outline-1 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
        className
      )}
      data-rp-ctxmenu="popup"
      onMouseDown={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </ContextMenu.Popup>
  );
}

export function SubmenuPopup({
  className,
  children,
  ...props
}: ComponentProps<typeof Menu.Popup>) {
  return (
    <Menu.Popup
      className={cn(
        "max-w-[280px] min-w-[200px] origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1.5 outline outline-1 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
        className
      )}
      data-rp-ctxmenu="submenu"
      {...props}
    >
      {children}
    </Menu.Popup>
  );
}

type Tone = "default" | "danger" | "accent";

function itemToneClass(tone: Tone | undefined) {
  switch (tone) {
    case "danger":
      return "data-[highlighted]:text-rouge-400";
    case "accent":
      return "data-[highlighted]:text-accent-foreground";
    default:
      return "data-[highlighted]:text-foreground";
  }
}

const ITEM_BASE =
  "relative z-0 flex min-h-11 w-full items-center gap-3 rounded-[6px] px-3.5 py-3.5 text-sm leading-[120%] transition-colors duration-150 ease-out-power2 outline-none select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] before:rounded-sm before:bg-transparent before:transition-colors before:duration-150 before:ease-out-power2 data-[highlighted]:before:bg-muted-faded-background data-[disabled]:opacity-40";

export interface MenuItemProps extends Omit<
  ComponentProps<typeof ContextMenu.Item>,
  "render"
> {
  tone?: Tone;
  icon?: ReactNode;
  hint?: string;
}

export function MenuItem({
  className,
  tone,
  icon,
  hint,
  children,
  ...props
}: MenuItemProps) {
  return (
    <ContextMenu.Item
      className={className}
      render={({ className: rc, ...rp }) => (
        <div
          className={cn(ITEM_BASE, itemToneClass(tone), rc)}
          role="button"
          {...rp}
        >
          {icon ? (
            <span className="flex size-4 shrink-0 items-center justify-center text-foreground/70">
              {icon}
            </span>
          ) : null}
          <span className="flex-1 truncate font-light tracking-tight">
            {children}
          </span>
          {hint ? (
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground/50">
              {hint}
            </span>
          ) : null}
        </div>
      )}
      {...props}
    />
  );
}

export interface SubmenuItemProps extends Omit<
  ComponentProps<typeof Menu.SubmenuTrigger>,
  "render"
> {
  tone?: Tone;
  icon?: ReactNode;
  hint?: string;
}

export function SubmenuTriggerItem({
  className,
  tone,
  icon,
  hint,
  children,
  ...props
}: SubmenuItemProps) {
  return (
    <Menu.SubmenuTrigger
      className={className}
      render={({ className: rc, ...rp }) => (
        <div
          role="button"
          className={cn(ITEM_BASE, itemToneClass(tone), rc)}
          {...rp}
        >
          {icon ? (
            <span className="flex size-4 shrink-0 items-center justify-center text-foreground/70">
              {icon}
            </span>
          ) : null}
          <span className="flex-1 truncate font-light tracking-tight">
            {children}
          </span>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground/50">
            {hint ?? "›"}
          </span>
        </div>
      )}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return (
    <ContextMenu.Separator
      className="mx-2 my-1 h-px bg-border/30"
      aria-hidden
    />
  );
}

export function MenuGroupLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-3.5 py-1.5 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/50 uppercase select-none"
      data-rp-ctxmenu="group-label"
    >
      {children}
    </div>
  );
}
