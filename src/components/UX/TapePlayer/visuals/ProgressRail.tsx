"use client";

import {springGSAP} from "@/constants/animations";
import {cn} from "@/lib/utils";
import {useRadioStore} from "@/providers/RadioProvider";
import {useMotionTemplate, useMotionValue, useSpring, useTransform} from "motion/react";
import * as m from "motion/react-m";
import {useEffect} from "react";
import {useShallow} from "zustand/shallow";

type ProgressRailProps = {
	thin?: boolean;
	className?: string;
};

/**
 * Passive progress display — shows tape travel as a filled bar.
 * Non-interactive: seeking is handled by SeekKnob.
 */
export const ProgressRail = ({thin = false, className}: ProgressRailProps) => {
	const elapsedTime = useRadioStore(useShallow((t) => t.elapsedTime));
	const e = useRadioStore(useShallow((t) => t.elapsedTime));
	const elaos = useMotionValue(e)
	useEffect(
		() => elaos.set(e), [e, elaos]
	)
	const currentIndex = useRadioStore(useShallow((t) => t.currentIndex))
	const tracks = useRadioStore(useShallow((t) => t.tracks))
	const currentTrack = useMotionValue(
		tracks[currentIndex]
	)
	useEffect(
		() => currentTrack.set(tracks[currentIndex]), [currentIndex, currentTrack, tracks]
	)
	const durationValue = useTransform(
		() => currentTrack.get().duration
	)
	const progress = useTransform(
		() => {
			const elapsedTime = elaos.get()
			const duration = durationValue.get()
			return duration > 0 ? elapsedTime / duration : 0;
		})
	// Spring the progress for smooth visual updates
	const smoothProgress = useSpring(progress, springGSAP.power4.inOut);
	const widthd = useTransform(smoothProgress, [0, 1], [0, 100])
	const width = useMotionTemplate`${widthd}%`;
	const baseHeight = useMotionValue(thin ? 4 : 6)
	const height = useMotionValue(thin ? 10 : 16
	)

	return (
		<m.div
			className={cn(
				"relative flex w-full cursor-default items-center",
				className
			)}
			style={{height}}
		>
			{/* Track (background) */}
			<m.div
				className="relative w-full overflow-hidden rounded-full bg-faded-fg/15"
				style={{height: baseHeight}}
			>
				{/* Fill — spring-animated width */}
				<m.div
					className="absolute inset-y-0 left-0 rounded-full bg-bleu-400"
					style={{width}}
				/>
			</m.div>
		</m.div>
	);
};
