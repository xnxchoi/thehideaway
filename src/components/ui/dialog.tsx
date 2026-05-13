"use client";
import { HTMLMotionProps } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { useCursor } from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import { Dialog as DialogPrimitive } from "@base-ui/react";
import { ComponentType } from "react";
import * as React from "react";
import { useDomCursor } from "@/components/core/cursorWrapper";

function DialogRoot({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  onMouseLeave: onLeave,
  onMouseEnter: onEnter,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter,
    onLeave
  });
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      {...props}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-[200] bg-transparent backdrop-blur-[2px] backdrop-grayscale-50 data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      data-lenis-prevent="true"
      {...props}
    />
  );
}

const OmniaPortal = m.create(DialogPortal);
const OmniaOverlay = m.create(DialogOverlay);
const OmniaViewport = m.create(DialogPrimitive.Viewport);
const OmniaContent = m.create(DialogPrimitive.Popup);
function DialogContent({
  className,
  onMouseEnter: nEnter,
  onMouseLeave: nLeave,
  children,
  open = true,
  ...props
}: HTMLMotionProps<"div"> & {
  open?: boolean;
}) {
  const setCursorTheme = useCursor((l) => l.setCursorTheme);
  const theme = useTheme((l) => l.theme);

  return (
    <OmniaPortal data-slot="dialog-portal" data-lenis-prevent="true">
      <OmniaOverlay />
      <OmniaViewport>
        <OmniaContent
          data-slot="dialog-content"
          data-themed={"background-color,color,height"}
          className={"pointer-events-none"}
          {...props}
        >
          <m.div
            className={cn(
              "pointer-events-auto fixed top-[45%] left-[50%] z-[245] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl bg-faded-background/40 p-6 text-faded-foreground shadow-lg/25 outline-1 outline-muted-faded-foreground/20! backdrop-blur-xs duration-200 ease-out-power2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-[550px] dark:bg-faded-background/80 dark:shadow-xl/40 dark:shadow-gray-900/30 dark:outline-muted-faded-foreground/40!",
              className
            )}
            data-lenis-prevent="true"
          >
            {children}
          </m.div>
          <DialogClose className="absolute top-6 right-10 rounded-sm text-foreground opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent"></DialogClose>
        </OmniaContent>
      </OmniaViewport>
    </OmniaPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("leading-[1] font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  DialogRoot,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
};
