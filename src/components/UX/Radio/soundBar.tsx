"use client";

import {cn} from "@/lib/utils";
import {useRadio, useRadioStore} from "@/providers/RadioProvider";
import {useCallback, useEffect, useRef, useState} from "react";
import {useCursorStore} from "@/providers/RP_Pro";
import * as m from "motion/react-m";
import {useDomCursor} from "@/components/core/cursorWrapper";

type SoundBarProps = {};
export const SoundBar = ({}: SoundBarProps) => {
	const {playing, toggle} = useRadio();
	const [hovered, setHovered] = useState(false);

	const trackStatus = useRadioStore((t) => t.trackStatus);
	const cursorState = useCursorStore((state) => state.cursorState);
	const lastHovered = useRef<boolean>(hovered);
	const lastCursorState = useRef<string | null>(cursorState);
	const setMarquee = useCursorStore((l) => l.setMarquee);

	useEffect(() => {
		if (
			lastHovered.current !== hovered ||
			(lastCursorState.current !== cursorState && hovered)
		) {
			setMarquee(hovered);
		}
		lastHovered.current = hovered;
		lastCursorState.current = cursorState;
	}, [hovered, cursorState]);
	const setCursor = useCursorStore((state) => state.setCursorState);

	const {onMouseEnter, onMouseLeave} = useDomCursor({
		enterCondition: () =>
			trackStatus === "playing"
				? (setHovered(true), "MUTE")
				: trackStatus === "paused"
					? (setHovered(true), "RP.FM")
					: null,

		onLeave: () => setHovered(false),
	});
	const stateRef = useRef(trackStatus);
	useEffect(() => {
		stateRef.current = trackStatus;
	}, [trackStatus]);
	const onClick = useCallback(() => {
		switch (stateRef.current) {
			case "playing":
				setCursor("RP.FM");
				setHovered(true);
				toggle();
				break;
			case "paused":
				setCursor("MUTE");
				setHovered(true);
				toggle();
				break;
			default:
				return;
		}
	}, [toggle]);
	return (
		<m.button initial={{
			opacity: 0,
		}} animate={{
			opacity: 1,
			transition: {
				duration: 0.3,
				ease: "easeInOut",
				type: "tween",
			},
		}} exit={{
			opacity: 0,
			transition: {
				duration: 0.3,
				ease: "easeInOut",
				type: "tween",
			},
		}} className={cn(
			"group/soundbar flex h-[32px] w-[32px] shrink-0 items-center justify-center gap-[1.5px] rounded-[50%]",
		)} data-themed="color, background-color" data-active={trackStatus === "playing"}
		          onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
			<div data-themed="color, background-color" className={cn(
				"c-soundwave__bar group-soundbar:data-[active=true]:animate-soundwave h-[4px] w-[2px] origin-center rounded-[1px] transition-[background-color] ease-power4 duration-300",
				playing
					? "bg-[oklch(var(--n-s-fg)/1)]"
					: "bg-[oklch(var(--n-s-fg)/.5)]",
				"delay-[0s]",
			)}></div>
			<div data-themed="color, background-color" className={cn(
				"c-soundwave__bar group-soundbar:data-[active=true]:animate-soundwave h-[4px] w-[2px] origin-center rounded-[1px] transition-[background-color] ease-power4   duration-300",
				playing
					? "bg-[oklch(var(--n-s-fg)/1)]"
					: "bg-[oklch(var(--n-s-fg)/.5)]",
				"delay-[-0.4s]",
			)}></div>
			<div data-themed="color, background-color" className={cn(
				"c-soundwave__bar group-soundbar:data-[active=true]:animate-soundwave h-[4px] w-[2px] origin-center rounded-[1px] transition-[background-color] ease-power4   duration-300",
				playing
					? "bg-[oklch(var(--n-s-fg)/1)]"
					: "bg-[oklch(var(--n-s-fg)/.5)]",
				"delay-[-0.2s]",
			)}></div>
			<div data-themed="color, background-color" className={cn(
				"c-soundwave__bar group-soundbar:data-[active=true]:animate-soundwave h-[4px] w-[2px] origin-center rounded-[1px] transition-[background-color] ease-power4   duration-300",
				playing
					? "bg-[oklch(var(--n-s-fg)/1)]"
					: "bg-[oklch(var(--n-s-fg)/.5)]",
				"delay-[-0.4s]",
			)}></div>
		</m.button>
	);
};
