'use client'
import {ReactNode, useEffect, useRef} from "react";
import {HighlightsCollection, useHighlighter} from "@/components/UX/Highlightr/provider";
import {useNavEvents} from "@/providers/Navigation/_client-nav-events";
import {useTransitionState} from "next-transition-router";

export default function PageClient({children, target}: {
	children: ReactNode; target: {
		relationTo: HighlightsCollection; value: string; slug: string; author: string; disabled?: boolean;
	}
}) {
	const clearHighlights = useHighlighter(r => r.clear);
	const resetHighlights = useHighlighter(r => r.reset);
	const {stage} = useTransitionState()
	const {direction} = useNavEvents()

	const runRef = useRef(false)
	const setTarget = useHighlighter(r => r.setTarget)

	useEffect(() => {
		if (runRef.current) return
		clearHighlights();
		runRef.current = true;
		setTarget(target)
		return () => {
			runRef.current = false;
			resetHighlights();
		}
	}, [clearHighlights, direction, resetHighlights, setTarget, stage, target])


	return <div
		className={"rp_story bg-faded-white dark:bg-faded-black z-[120] w-[calc(100vw-20px)] pb-[20px] leading-[1.28]"}
		data-themed="background-color,color">{children}</div>
}