"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {CheckIcon, ChevronRightIcon, CircleIcon} from "lucide-react";

import {cn} from "@/lib/utils";
import {useRPStore} from "@/providers/RP_Pro";

import {useLenis} from "lenis/react";
import {useVoyageur} from "@/stores/Routing/RP_Voyageur";
import {useCursorHandlers} from "../core/cursorWrapper";
import {useCallback} from "react";
import { useTransitionRouter } from "next-transition-router";

function DropdownMenu({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
	return (
		<DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
	);
}

function DropdownMenuTrigger({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
	return (
		<DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger"
		                               {...props} />
	);
}

function DropdownMenuContent({
	className,
	sideOffset = 4,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content data-slot="dropdown-menu-content" sideOffset={sideOffset}
			                               className={cn(
				                               "bg-popover text-[oklch(var(--n-s-btn)/.9)] font-light font-sans data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-245 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
				                               className,
			                               )} style={{backdropFilter: "blur(10px)"}}
			                               {...props} />
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuGroup({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
	return (
		<DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
	);
}

function DropdownMenuItem({
	className,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
}) {
	const handler = useCursorHandlers("dom");
	const {onMouseEnter, onMouseLeave} = handler;
	return (
		<DropdownMenuPrimitive.Item data-themed={"background,color"} data-slot="dropdown-menu-item"
		                            data-inset={inset} data-variant={variant} className={cn(
			"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors ease-in-out select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		)}
		                            {...props} onMouseEnter={onMouseEnter}
		                            onMouseLeave={onMouseLeave} />
	);
}

export const DropOutButton = () => {
	const onSelect = useCallback(async () => {
		await fetch("/api/users/logout", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
		});
		location.replace('/home');
	}, []);
	return (
		<DropdownMenuItem variant={"destructive"} onSelect={onSelect}>
			Sign out
		</DropdownMenuItem>
	);
};

export const LinkedDropdownItem = ({
	className,
	inset,
	variant = "default",
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
	variant?: "default" | "destructive";
	href: string;
	title: string;
	value?: string;
	type?: string;
}) => {
	const {href, title, value, ...rest} = props;
	const lenis = useLenis();
	const router = useTransitionRouter();
	const setOpen = useRPStore((store) => store.setDropdownOpen);
	const url = useVoyageur((l) => l.url);
	const pathName = useVoyageur((l) => l.pathName);
	const isAnchor = href === url || href.startsWith(`${pathName}#`);
	const handleClick = () => {
		setOpen(false);
		if (isAnchor) {
			lenis && lenis.scrollTo(href);
		} else {
			router.push(href);
		}
	};
	return (
		<DropdownMenuItem data-themed={"background-color,color"} data-slot="dropdown-menu-item"
		                  data-inset={inset} data-variant={variant} className={cn(
			"focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors ease-in-out select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		)} value={value ?? href} onSelect={handleClick}
		                  {...props}
		>
			{title}
			{rest.children}
			{rest.type && (
				<div className="rp_tag absolute right-2">
					{rest.type.endsWith("s") ? rest.type.slice(0, -1) : rest.type}
				</div>
			)}
		</DropdownMenuItem>
	);
};

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
	return (
		<DropdownMenuPrimitive.CheckboxItem data-themed={"background,color"}
		                                    data-slot="dropdown-menu-checkbox-item" className={cn(
			"focus:bg-accent focus:text-accent-foreground relative flex items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors ease-in-out select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		)} checked={checked}
		                                    {...props}
		>
      <span
	      className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	);
}

function DropdownMenuRadioGroup({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
	return (
		<DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group"
		                                  {...props} />
	);
}

function DropdownMenuRadioItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
	return (
		<DropdownMenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item"
		                                 data-themed={"background,color"} className={cn(
			"focus:bg-accent focus:text-accent-foreground relative flex items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		)}
		                                 {...props}
		>
      <span
	      className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
			{children}
		</DropdownMenuPrimitive.RadioItem>
	);
}

function DropdownMenuLabel({
	className,
	inset,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.Label data-slot="dropdown-menu-label"
		                             data-themed={"background,color"} data-inset={inset}
		                             className={cn(
			                             "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
			                             className,
		                             )}
		                             {...props} />
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn(
			"bg-[oklch(var(--border-subtle-inverted)/0.2)] -mx-1 my-1 h-px",
			className,
		)}
		                                 {...props} />
	);
}

function DropdownMenuShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span data-slot="dropdown-menu-shortcut" className={cn(
			"text-muted-foreground ml-auto text-xs tracking-widest",
			className,
		)}
		      {...props} />
	);
}

function DropdownMenuSub({
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
	return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
	className,
	inset,
	children,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.SubTrigger data-slot="dropdown-menu-sub-trigger" data-inset={inset}
		                                  data-themed={"background,color"} className={cn(
			"focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors ease-in-out select-none data-[inset]:pl-8",
			className,
		)}
		                                  {...props}
		>
			{children}
			<ChevronRightIcon className="ml-auto size-4" />
		</DropdownMenuPrimitive.SubTrigger>
	);
}

function DropdownMenuSubContent({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
	return (
		<DropdownMenuPrimitive.SubContent data-slot="dropdown-menu-sub-content" className={cn(
			"bg-popover left-1 text-[oklch(var(--n-s-btn)/.9)] font-sans data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
			className,
		)}
		                                  {...props} style={{backdropFilter: "blur(10px)"}} />
	);
}

export {
	DropdownMenu,
	DropdownMenuPortal,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
};
