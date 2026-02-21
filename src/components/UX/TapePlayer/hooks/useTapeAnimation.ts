"use client";

import {useRadioStore} from "@/providers/RadioProvider";
import {useGSAP} from "@gsap/react";
import {gsap} from "gsap";
import {useMotionValue} from "motion/react";
import {RefObject, useEffect, useRef} from "react";
import {useShallow} from "zustand/shallow";
import {REEL_BASE_DURATION} from "../constants";

/**
 * Drives the dual-reel GSAP rotation animation.
 * Supply reel slows as track progresses, takeup reel speeds up.
 * TimeScale is linked to playing state and playbackRate.
 */
export function useTapeAnimation(
	supplyRef: RefObject<SVGGElement | null>,
	takeupRef: RefObject<SVGGElement | null>,
	scopeRef: RefObject<HTMLElement | SVGElement | null>
) {
	const playing = useRadioStore(useShallow((t) => t.playing));
	const playbackRate = useRadioStore(useShallow((t) => t.playbackRate));
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
	const supplyTL = useRef<GSAPTimeline>(null!);
	const takeupTL = useRef<GSAPTimeline>(null!);

	// Create the perpetual rotation timelines
	useGSAP(
		() => {
			if (!supplyRef.current || !takeupRef.current) return;

			supplyTL.current = gsap
				.timeline({
					defaults: {ease: "none", repeat: -1, yoyo: false},
				})
				.to(supplyRef.current, {
					rotate: 360,
					duration: REEL_BASE_DURATION,
					transformOrigin: "center center",
				});

			takeupTL.current = gsap
				.timeline({
					defaults: {ease: "none", repeat: -1, yoyo: false},
				})
				.to(takeupRef.current, {
					rotate: 360,
					duration: REEL_BASE_DURATION,
					transformOrigin: "center center",
				});
		},
		{scope: scopeRef}
	);

	// Animate timeScale based on playing, playbackRate, and progress
	useGSAP(
		() => {
			if (!supplyTL.current || !takeupTL.current) return;

			const active = playing ? 1 : 0;
			// Supply reel: faster when more tape (start), slower near end
			// const supplySpeed = active * playbackRate * Math.max(0.15, 1 - progress);
			const supplySpeed = active * playbackRate;
			// Takeup reel: slower at start, faster as it fills
			// const takeupSpeed = active * playbackRate * Math.max(0.15, progress);
			const takeupSpeed = active * playbackRate;

			gsap.to(supplyTL.current, {
				timeScale: supplySpeed,
				duration: 0.3,
				ease: playing ? "power2.in" : "power2.out",
				overwrite: true,
			});

			gsap.to(takeupTL.current, {
				timeScale: takeupSpeed,
				duration: 0.3,
				ease: playing ? "power2.in" : "power2.out",
				overwrite: true,
			});
		},
		{dependencies: [playing, playbackRate,], scope: scopeRef}
	);

	return {supplyTL, takeupTL};
}
