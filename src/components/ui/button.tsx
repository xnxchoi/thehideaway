"use client"
import * as React from "react"
import {Slot} from "@radix-ui/react-slot"
import {cva, type VariantProps} from "class-variance-authority"

import {cn} from "@/lib/utils"
import {ButtonHTMLAttributes, ComponentPropsWithRef, RefAttributes} from "react"
import {useCursorHandlers, useDomCursor} from "../core/cursorWrapper"

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"bg-background text-foreground shadow-xs hover:bg-primary/90",
				destructive:
					"bg-destructive text-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
				outline:
					"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-foreground underline-offset-4 hover:underline",
			},
			size: {
				default: "h-12 px-6 py-3 has-[>svg]:px-5",
				sm: "h-12 rounded-md px-5 has-[>svg]:px-4",
				lg: "h-16 rounded-md px-9 has-[>svg]:px-6",
				icon: "size-14",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
)

export interface ButtonProps
	extends Partial<VariantProps<typeof buttonVariants>> {
	asChild?: boolean
}

export type ButtonTotalProps = ButtonProps & ComponentPropsWithRef<"button">

function Button({
	asChild = false,
	className,
	size,
	variant,
	ref,
	onMouseEnter: onEnter,
	onMouseLeave: onLeave,
	onClick,
	children,
	...props
}: React.ComponentProps<"button"> & ButtonTotalProps) {
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		onEnter,
		onLeave,
	})
	const Comp = asChild ? Slot : "button"

	return (
		<Comp data-slot="button" className={cn(
			(variant && buttonVariants({className, size, variant})) ?? "",
			className,
			"transition-colors ease-power4 duration-300",
		)} data-themed={"background-color,color"} ref={ref} onClick={onClick}
		      {...props} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
			{children}
		</Comp>
	)
}

export {Button, buttonVariants}
