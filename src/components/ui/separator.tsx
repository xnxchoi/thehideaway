"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root data-slot="separator-root" decorative={decorative}
			orientation={orientation} className={cn(
				"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
				className
			)}
			{...props} />
	)
}

function GradientSeparator({ caption, orientation = "horizontal", ...props }: React.ComponentProps<'div'> & { caption?: string; orientation?: "horizontal" | "vertical" }) {
	return <div {...props} className={cn(
		// "flex items-center gap-2",
		"relative", (caption ? ("gap-[1px] bg-transparent flex items-center justify-center") : "from-transparent from-[35%] via-foreground/70 via-[65%] to-transparent"), ...((orientation === 'horizontal' ? ([(caption && "h-[3px] w-full" || "h-px w-full"), "bg-linear-to-r"]) : ([(caption && "w-[3px] h-full" || "w-px h-full"), "bg-linear-to-b"])) )
	)}>
		{caption && (<><div className=
			{cn("relative flex-[1_1_35%] from-transparent to-[oklch(var(--fg)/.7)]", orientation === 'horizontal' ? "-left-1 h-[1px] bg-linear-to-r" : "-top-1 w-[1px] bg-linear-to-b")}
		></div>
			<div className={cn("text-center text-[12px]", orientation === 'horizontal' ? 'px-[1px]' : 'py-[1px]')}>
				{caption}
			</div>
			<div className=
				{cn("relative flex-[1_1_35%] from-[oklch(var(--fg)/.7)] to-transparent", orientation === 'horizontal' ? "-right-1 h-[1px] bg-linear-to-r" : "-bottom-1 w-[1px] bg-linear-to-b")}
			></div>
		</>
		)}
	</div>
}

export { Separator, GradientSeparator }
