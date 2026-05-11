"use client";

import { cn } from "@/lib/utils";
import { Popover as PopoverPrimitive } from "@base-ui/react";
import * as React from "react";
import { ComponentProps } from "react";

function PopoverRoot({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  side,
  alignOffset,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<
    ComponentProps<typeof PopoverPrimitive.Positioner>,
    "align" | "sideOffset" | "side" | "alignOffset"
  >) {
  // `--popover` is `var(--button-background) = oklch(.../0.25)`, i.e. ~25%
  // opacity — see globals.css. That's intentional for the floating-glass
  // `<button>` look but unreadable as a popover container (content behind
  // bleeds through). Override locally with an opaque-ish background +
  // backdrop blur, so popovers always read as discrete surfaces.
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        sideOffset={sideOffset}
        side={side}
        alignOffset={alignOffset}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md p-4 outline-hidden",
            // Opaque-leaning surface (95%) + blur — discrete, readable.
            "bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-xl",
            "text-foreground shadow-[0_8px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-foreground/15",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { PopoverRoot, PopoverTrigger, PopoverContent };
