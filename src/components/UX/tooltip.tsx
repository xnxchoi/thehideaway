import {cn} from "@/lib/utils";

export function RPTooltip(l: { className?: string; label: string }) {
	return (
		<div className={cn(
			"tooltip",
			{ui: !l.className},
			...[l.className && l.className],
		)}>
			<div className="tooltip__content">{l.label}</div>
		</div>
	);
}
