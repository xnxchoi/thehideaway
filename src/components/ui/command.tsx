"use client";

import * as React from "react";
import { useRef, useEffect, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useSearchBar } from "@/providers/RP_Pro";
import { useDomCursor } from "../core/cursorWrapper";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col rounded-xl shadow-lg/30",
        className
      )}
      data-themed={"background-color"}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  open,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
}) {
  const subMenuOpen = useSearchBar((l) => l.subMenuOpen);
  const lastExpanded = useRef(false);
  const [referenceHeight, setReferenceHeight] = useState("initial");
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (subMenuOpen) {
      if (!lastExpanded.current) {
        lastExpanded.current = true;
        setReferenceHeight(
          Math.max(contentRef.current?.clientHeight || 350, 350) + "px"
        );
      }
    }
  }, [subMenuOpen]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        ref={contentRef}
        open={open}
        className={cn("p-0", !subMenuOpen && "overflow-hidden")}
        style={{
          minHeight: referenceHeight
        }}
      >
        <Command
          data-themed={"background-color,height,color"}
          className={cn(
            "p-[4px] text-xl [&_[cmdk-group-heading]]:px-[8px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-[4px] [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-8 [&_[cmdk-input-wrapper]_svg]:w-8 [&_[cmdk-input]]:h-[32px] [&_[cmdk-item]]:px-[8px] [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
            { "overflow-hidden": !subMenuOpen }
          )}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      className="z-1 flex w-full items-center p-[8px]"
      cmdk-rp-courier={""}
      data-slot="command-input-wrapper"
    >
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
	        "flex h-[44px] w-full rounded-md bg-transparent py-5 text-sm outline-hidden placeholder:text-background disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        data-themed={"color, background-color,height,placeholder-color"}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "relative max-h-[500px] scroll-py-1.5 overflow-x-hidden overflow-y-auto",
        className
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="absolute inset-0 flex items-center justify-center py-6 text-center text-xl text-faded-foreground"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
	      "overflow-hidden rounded-[4px] py-[6px] [&_[cmdk-group-heading]]:text-xl [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-faded-foreground",
        className
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1.5 h-px bg-faded-foreground/10", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  onMouseEnter: onEnter,
  onMouseLeave: onLeave,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter,
    onLeave
  });
  return (
    <CommandPrimitive.Item
      className={cn(
        "group relative flex min-h-[2.5rem] items-center gap-3.5 rounded-sm px-3.5 py-2.5 text-lg text-faded-foreground outline-hidden transition-colors duration-170 ease-out-power3 select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-off-foreground/50 data-[selected=true]:text-faded-background [&_svg]:pointer-events-none [&_svg]:size-6 [&_svg]:shrink-0",
        className
      )}
      {...props}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

//   <div className={cn('ml-auto flex gap-0.5', className)} {...props}>
//       {shortcut.split(' ').map((key) => {
//         return <kbd key={key}>{key}</kbd>
//       })}
//     </div>
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator
};
