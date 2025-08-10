"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {CheckIcon, ChevronDownIcon, ChevronUpIcon} from "lucide-react";

import {cn} from "@/lib/utils";
import {useDomCursor} from "../core/cursorWrapper";

function Select({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
	return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
	return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
	return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
	className,
	children,
	onMouseEnter: onEnter,
	onMouseLeave: onLeave,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		onEnter,
		onLeave,
	});

	return (
		<SelectPrimitive.Trigger data-slot="select-trigger" className={cn(
			"data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex !h-10 w-full items-center justify-between rounded-md border bg-transparent px-5 py-3 text-xs shadow-xs transition-colors outline-none focus-visible:ring-[0.1px] disabled:opacity-50 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6 [&>span]:line-clamp-3",
			className,
		)}
		                         {...props} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDownIcon className="size-4 opacity-50" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectContent({
	className,
	children,
	position = "popper",
	...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content data-slot="select-content" className={cn(
				"bg-(--button-background) backdrop-blur-xs text-[oklch(var(--n-s-fg)/.9)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-3 data-[side=left]:slide-in-from-right-3 data-[side=right]:slide-in-from-left-3 data-[side=top]:slide-in-from-bottom-3 relative z-[350] max-h-96 min-w-[12rem] overflow-hidden rounded-md border shadow-md transition-all duration-200 ease-in-out",
				position === "popper" &&
				"data-[side=bottom]:translate-y-1.5 data-[side=left]:-translate-x-1.5 data-[side=right]:translate-x-1.5 data-[side=top]:-translate-y-1.5",
				className,
			)} position={position}
			                         {...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport data-lenis-prevent className={cn(
					"p-1.5",
					position === "popper" &&
					"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1.5",
				)}>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label data-slot="select-label"
		                       className={cn("px-3 py-2 text-sm font-medium", className)}
		                       {...props} />
	);
}

function SelectItem({
	className,
	children,
	onMouseEnter: onEnter,
	onMouseLeave: onLeave,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	const handler = useDomCursor({onEnter, onLeave});
	const {onMouseEnter, onMouseLeave} = handler;

	return (
		<SelectPrimitive.Item data-slot="select-item" className={cn(
			"focus:bg-accent font-sans text-foreground transition-colors ease-power4 duration-200 focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full items-center gap-3 rounded-sm py-2 pr-10 pl-3 text-xs outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-3",
			className,
		)}
		                      {...props} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span className="absolute right-3 flex size-5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-6" />
        </SelectPrimitive.ItemIndicator>
      </span>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator data-slot="select-separator" className={cn(
			"bg-border pointer-events-none -mx-1.5 my-1.5 h-px", className)}
		                           {...props} />
	);
}

function SelectScrollUpButton({
	className,
	onMouseEnter: onEnter,
	onMouseLeave: onLeave,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	const handler = useDomCursor({onEnter, onLeave});
	const {onMouseEnter, onMouseLeave} = handler;
	return (
		<SelectPrimitive.ScrollUpButton data-slot="select-scroll-up-button"
		                                className={cn("flex items-center justify-center py-1.5",
			                                className)}
		                                {...props} onMouseEnter={onMouseEnter}
		                                onMouseLeave={onMouseLeave}>
			<ChevronUpIcon className="size-4" />
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	onMouseEnter: onEnter,
	onMouseLeave: onLeave,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	const handler = useDomCursor({onEnter, onLeave});
	const {onMouseEnter, onMouseLeave} = handler;

	return (
		<SelectPrimitive.ScrollDownButton data-slot="select-scroll-down-button"
		                                  className={cn("flex items-center justify-center py-1.5",
			                                  className,
		                                  )}
		                                  {...props} onMouseEnter={onMouseEnter}
		                                  onMouseLeave={onMouseLeave}>
			<ChevronDownIcon className="size-4" />
		</SelectPrimitive.ScrollDownButton>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
