import * as React from "react"

import {cn} from "@/lib/utils"
import {Label} from "./label"

function Input({className, type, ...props}: React.ComponentProps<"input">) {
	return (
		<input type={type} data-slot="input" suppressHydrationWarning className={cn(
			"file:text-foreground placeholder:text-muted-foreground  placeholder:text-base selection:bg-background selection:text-foreground flex h-14 w-full min-w-0 border-solid border-b-1 border-faded-background/60 bg-transparent px-4 py-5 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-11 file:border-0 file:bg-transparent file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
			"focus-visible:border-faded-background/50 focus-visible:ring-ring/0 focus-visible:ring-offset-0",
			"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
			className
		)}
		       {...props} />
	)
}

export function InputFile({className, ...props}: React.ComponentProps<"input">) {
	return (<div className="grid w-full max-w-sm items-center gap-1.5">
		<Label htmlFor="picture">Picture</Label>
		<Input id="picture" type="file" {...props} />
	</div>)
}

export {Input}
