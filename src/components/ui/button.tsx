"use client";
import * as React from "react";
import {Slot} from "@radix-ui/react-slot";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "@/lib/utils";
import {
	ButtonHTMLAttributes,
	ComponentPropsWithRef,
	RefAttributes
} from "react";
import {useCursorHandlers, useDomCursor} from "../core/cursorWrapper";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-3.5 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-6.5 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default: "bg-background text-foreground shadow-xs hover:bg-primary/90",
				destructive:
					"bg-destructive text-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
				outline:
					"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-foreground underline-offset-4 hover:underline"
			},
			size: {
				default: "h-14 px-6 py-3.5 has-[>svg]:px-5",
				sm: "h-13 rounded-md gap-2.5 px-5 has-[>svg]:px-4",
				lg: "h-16 rounded-md px-9.5 has-[>svg]:px-6.5",
				icon: "size-14.5",
				"icon-sm": "size-13",
				"icon-lg": "size-16",
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	}
);

export interface ButtonProps
	extends Partial<VariantProps<typeof buttonVariants>> {
	asChild?: boolean;
}

export type ButtonTotalProps = ButtonProps & ComponentPropsWithRef<"button">;

function Button({
	                asChild = false,
	                className,
	                size,
	                variant,
	                ref,
	                onMouseEnter: onEnter,
	                onMouseLeave: onLeave,
	                onClick,
	                children, disabled,
	                ...props
}: React.ComponentProps<"button"> & ButtonTotalProps) {
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		enterCondition: () => (disabled ? null : "FOCUS"),
		onEnter,
		onLeave
	});
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(
				(variant && buttonVariants({className, size, variant})) ?? "",
				className,
				"transition-colors duration-200 ease-out-power2"
			)}
			data-themed={"background-color,color"}
			ref={ref}
			onClick={onClick}
			{...props}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{children}
		</Comp>
	);
}

function VaultButton({
	                     asChild = false,
	                     className,
	                     size,
	                     variant,
	                     ref,
	                     onClick,
	                     children,
	                     ...props
                     }: React.ComponentProps<"button"> & ButtonTotalProps) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(
				(variant && buttonVariants({className, size, variant})) ?? "",
				className,
				"transition-colors duration-300 ease-out-power2"
			)}
			data-themed={"background-color,color"}
			ref={ref}
			onClick={onClick}
			{...props}
		>
			{children}
		</Comp>
	);
}

export {Button, buttonVariants, VaultButton};
