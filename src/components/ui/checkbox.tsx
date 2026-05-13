"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useDomCursor } from "@/components/core/cursorWrapper";

function Checkbox({
  className,
  onMouseEnter: onEnter,
  onMouseLeave: onLeave,
  children,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter,
    onLeave
  });

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-[14px] shrink-0 rounded-[4px] border border-input shadow-sm transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      ></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
