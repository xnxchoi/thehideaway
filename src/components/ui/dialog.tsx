"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import {cn} from "@/lib/utils";
import {useCursorStore} from "@/providers/RP_Pro";
import {useDomCursor} from "../core/cursorWrapper";
import {useTheme} from "@/providers/Theme";

function Dialog({
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
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		onEnter,
		onLeave,
	});
	return (
		<DialogPrimitive.Close data-slot="dialog-close"
		                       {...props} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} />
	);
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn(
			"bg-transparent fixed inset-0 z-[200] data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 backdrop-blur-[2px] backdrop-grayscale-50",
			className,
		)} data-lenis-prevent="true"
		                         {...props} />
	);
}

interface DialogContentProps
	extends React.ComponentProps<typeof DialogPrimitive.Content> {
	open?: boolean;
}

function DialogContent({
	className,
	onMouseEnter: nEnter,
	onMouseLeave: nLeave,
	children,
	open = true,
	...props
}: DialogContentProps) {
	const setCursorTheme = useCursorStore((l) => l.setCursorTheme);
	const theme = useTheme((l) => l.theme);

	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content data-slot="dialog-content"
			                         data-themed={"background-color,color,height"} className={cn(
				"bg-[oklch(var(--faded-bg)/.4)] dark:bg-[oklch(var(--faded-bg)/.8)] text-[oklch(var(--faded-fg))] backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[245] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl p-6 shadow-lg/25 dark:shadow-xl/40 dark:shadow-gray-900/30 duration-200 outline-1 outline-[oklch(var(--muted-faded-fg)/.2)]! dark:outline-[oklch(var(--muted-faded-fg)/.4)]! sm:max-w-[550px]",
				className,
			)} data-lenis-prevent="true"
			                         {...props}
			>
				{children}
				<DialogClose
					className="absolute right-10 top-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent text-[oklch(var(--fg)/1)]"></DialogClose>
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({className, ...props}: React.ComponentProps<"div">) {
	return (
		<div data-slot="dialog-header" className={cn(
			"flex flex-col space-y-1.5 text-center sm:text-left",
			className,
		)}
		     {...props} />
	);
}

function DialogFooter({className, ...props}: React.ComponentProps<"div">) {
	return (
		<div data-slot="dialog-footer" className={cn(
			"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
			className,
		)}
		     {...props} />
	);
}

function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title data-slot="dialog-title"
		                       className={cn("font-medium leading-[1] tracking-tight", className)}
		                       {...props} />
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description data-slot="dialog-description"
		                             className={cn("text-muted-foreground text-sm", className)}
		                             {...props} />
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
