"use client";

import {SlidingNumber} from "@/components/ui/sliding-number";
import {cn} from "@/lib/utils";
import {useRadioStore} from "@/providers/RadioProvider";
import {AnimatePresence, useMotionValue, useMotionValueEvent, useTransform} from "motion/react";
import * as m from "motion/react-m";
import {useEffect, useState} from "react";
import {useShallow} from "zustand/shallow";

type TapeCounterProps = {
	height?: number;
	className?: string;
};

/** Format seconds into MM:SS:FF (frames at 30fps for tape-counter feel) */
function formatTapeTime(seconds: number): string {
	const abs = Math.abs(seconds);
	const m = Math.floor(abs / 60);
	const s = Math.floor(abs % 60);
	const f = Math.floor((abs % 1) * 30); // 30 "frames" per second
	const sign = seconds < 0 ? "-" : "";
	return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** A single digit cell with flip animation on change */
const DigitCell = ({char, index}: { char: string; index: number }) => (
	<AnimatePresence mode="popLayout" initial={false}>
		<m.span
			key={`${index}-${char}`}
			initial={{y: 8, opacity: 0}}
			animate={{y: 0, opacity: 1}}
			exit={{y: -8, opacity: 0}}
			transition={{duration: 0.12, ease: [0.32, 0.72, 0, 1]}}
			className="inline-block"
		>
			{char}
		</m.span>
	</AnimatePresence>
);

/**
 * OP-1 Field-inspired digital tape counter.
 * Shows elapsed time on the left and remaining (negative) on the right.
 * Each digit flips independently when its value changes.
 */
export const TapeCounter = ({height = 36, className}: TapeCounterProps) => {
	const currentTrackIndex = useRadioStore(useShallow((t) => t.currentIndex))
	const tracks = useRadioStore(useShallow((t) => t.tracks))
	const currentTrack = useMotionValue(tracks[currentTrackIndex])

	useEffect(() => currentTrack.set(tracks[currentTrackIndex]), [tracks, currentTrackIndex, currentTrack])
	const e = useRadioStore(useShallow((t) => t.elapsedTime));
	const dura = useTransform(() => currentTrack.get().duration)
	const [duration, setDuration] = useState(dura.get())
	useMotionValueEvent(dura, "change", (v) => setDuration(v))
	const elapsedTime = useMotionValue(e)
	useEffect(() => elapsedTime.set(e), [e, elapsedTime])

	const [elapsedMinutes, setElapsedM] = useState(Math.floor(e / 60))
	const [elapsedSeconds, setElapsedS] = useState(Math.floor(e % 60))

	const [remainingMinutes, setRemainingMinutes] = useState(duration > 0 ? Math.floor((duration - e) / 60) : 0)
	const [remainingSeconds, setRemainingSeconds] = useState(duration > 0 ? Math.floor((duration - e) % 60) : 0)
	useEffect(() => {
		const durat = dura.get()
		if (durat > 0) {
			const rema = Math.max(0, durat - e);
			setElapsedM(Math.floor(e / 60));
			setElapsedS(Math.floor(e % 60));
			setRemainingMinutes(Math.floor(rema / 60));
			setRemainingSeconds(Math.floor(rema % 60));
		} else {
			setElapsedM(0);
			setElapsedS(0);
			setRemainingMinutes(0);
			setRemainingSeconds(0);
		}
	}, [dura, e])

	return (
		<m.div
			className={cn(
				"flex w-full items-center justify-between rounded-sm bg-off-bg px-3",
				"font-mono text-bleu-200 tabular-nums tracking-tight",
				className
			)}
			style={{height}}
			role="timer"

		>
			{/* Elapsed */}
			<div className="flex items-center gap-0">

				<SlidingNumber value={elapsedMinutes} padStart={true}/>
				<SlidingNumber value={elapsedSeconds} padStart={true}/></div>
			{/* Center separator — playback rate indicator */}
			<PlaybackRateIndicator/>

			{/* Remaining */}
			<div className="flex items-center gap-0 opacity-60">
				<SlidingNumber value={remainingMinutes} padStart={true}/>
				<SlidingNumber value={remainingSeconds} padStart={true}/>
			</div>
		</m.div>
	);
};

const PlaybackRateIndicator = () => {
	const playbackRate = useRadioStore(useShallow((t) => t.playbackRate));

	if (playbackRate === 1.0) {
		return (
			<span className="text-[0.6em] opacity-30">
        ▶
      </span>
		);
	}

	return (
		<m.span
			key={playbackRate}
			initial={{scale: 1.3, opacity: 0}}
			animate={{scale: 1, opacity: 1}}
			className={cn(
				"text-[0.6em] font-medium",
				playbackRate > 1 ? "text-rouge-400" : "text-bleu-400"
			)}
		>
			{playbackRate}x
		</m.span>
	);
};
