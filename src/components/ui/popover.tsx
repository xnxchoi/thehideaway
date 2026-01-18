"use client"

import {cn} from "@/lib/utils"
import {Popover as PopoverPrimitive} from "@base-ui/react"
import * as React from "react";
import {ComponentProps} from "react";

function PopoverRoot({
	                     ...props
                     }: ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
	                        ...props
                        }: ComponentProps<typeof PopoverPrimitive.Trigger>) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
	                        className,
	                        align = "center",
	                        sideOffset = 4, side, alignOffset,
	                        ...props
                        }: ComponentProps<typeof PopoverPrimitive.Popup> & Pick<ComponentProps<typeof PopoverPrimitive.Positioner>, "align" | "sideOffset" | "side" | "alignOffset">) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner align={align} sideOffset={sideOffset} side={side}
			                             alignOffset={alignOffset}>
				<PopoverPrimitive.Popup data-slot="popover-content"
				                        className={cn(
					                        "bg-popover text-(--n-s-fg) data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
					                        className
				                        )}
				                        {...props} /></PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	)
}

export {PopoverRoot, PopoverTrigger, PopoverContent,}
