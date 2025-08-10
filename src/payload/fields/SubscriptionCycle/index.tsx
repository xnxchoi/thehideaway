"use client";
import {useField} from "@payloadcms/ui";

interface SubscriptionCycleProps {
	path: string;
}

export const SubscriptionCycle = ({path}: SubscriptionCycleProps) => {
	const {value: cycles} = useField<
		Array<{
			cycle_start: string;
			cycle_end: string;
		}>
	>({path});
	const lastCycle = cycles[cycles.length - 1];

	if (lastCycle) {
		const endDate = new Date(lastCycle.cycle_end).toLocaleDateString();
		return (
			<div style={{padding: "8px", fontWeight: "bold"}}> {endDate} </div>
		);
	} else {
		return (
			<div style={{padding: "8px", fontStyle: "italic"}}> No cycles yet </div>
		);
	}
};
