import * as React from "react";

import {cn} from "@/lib/utils";
import {MouseEventHandler, useCallback} from "react";

function Textarea({className, ...props}: React.ComponentProps<"textarea">) {
	const onClick:MouseEventHandler = useCallback((e) => {
		e.stopPropagation()
	}, [])
	return (<textarea data-slot="textarea" className={cn(
			"border-input placeholder:text-muted-foreground focus-visible:border-none focus-visible:ring-ring/0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[0px] disabled:opacity-50",
			className,)} onClick={onClick}
	                  {...props} />);
}

export {Textarea};
