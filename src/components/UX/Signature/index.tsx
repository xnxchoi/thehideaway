"use client";
import React, {useEffect, useMemo, useRef} from "react";
import {gsap} from "gsap";
import {
	paths,
	SIGN_ANIMATION_DURATION,
	SIGN_ANIMATION_FRAMECOUNT,
	trans,
} from "./paths";
import "./__signature.scss";
import {useGSAP} from "@gsap/react";
import {clamp} from "@/utilities/mathUtilities";
import {useInView} from "react-intersection-observer";
import {MorphSVGPlugin} from "gsap/MorphSVGPlugin";

type Transitionn = typeof paths.transitions;
type SignatureKeys = keyof Transitionn;
export const Signature = () => {
	const {ref: signRef, inView} = useInView({
		threshold: 0.5,
		triggerOnce: true,
	});
	const timelineRef = useRef<GSAPTimeline>(null!);
	const transitions = useMemo(
		() => paths.transitions as Record<SignatureKeys, string[]>,
		[],
	);
	const finalPaths = useMemo(
		() => paths.final as Record<SignatureKeys, string>,
		[],
	);
	const s = {};
	gsap.registerPlugin(MorphSVGPlugin);
	//45 frames per second
	const fps = useMemo(() => 1000 / 45, []);

	const refs = useRef<Record<SignatureKeys, SVGPathElement>>({
		s_1: null!,
		s_2: null!,
		s_3: null!,
		e: null!,
		a: null!,
		n: null!,
		comma: null!,
		small_s: null!,
		period: null!,
		c_1: null!,
		c_2: null!,
		h: null!,
		o_1: null!,
		o_2: null!,
		i: null!,
	});
	const inOut = useMemo(
		(): Record<SignatureKeys, [number, number]> => ({
			s_1: [0, 24],
			s_2: [12, 49],
			s_3: [43, 56],
			e: [53, 68],
			a: [69, 78],
			n: [78, 86],
			comma: [85, 87],
			small_s: [88, 93],
			period: [93, 94],
			c_1: [92, 100],
			c_2: [99, 109],
			h: [106, 117],
			o_1: [116, 127],
			o_2: [128, 135],
			i: [135, 145],
		}),
		[],
	);
	const ioK = useMemo(() => Object.entries(inOut), [inOut]);
	useGSAP(
		() => {
			const totalDuration =
				Math.ceil((SIGN_ANIMATION_DURATION / 1000) * 100) / 100;
			const singleTick = 45 / (totalDuration * 60);
			const singleFrame =
				Math.ceil(
					(totalDuration / SIGN_ANIMATION_FRAMECOUNT) * Math.pow(10, 3),
				) / Math.pow(10, 3);
			let framecount = 0;
			let io = ioK;
			timelineRef.current = gsap.timeline({
				paused: true,
				onComplete: () => {
					console.log("complete");
					framecount = 0;
					timelineRef.current.pause();
					io = ioK;
				},
				onUpdate: () => {
					const currentFrame = Math.round(framecount);
					io.filter(([_key, [start, end]]) => {
						return start <= currentFrame && currentFrame <= end;
					}).forEach(([key, [start, _end]]) => {
						const index = clamp(
							0,
							currentFrame - start,
							transitions[key].length,
						);
						refs.current[key].setAttribute(
							"d",
							transitions[key][index] || finalPaths[key],
						);
					});
					framecount += singleTick;
				},
			}).set(
				refs.current,
				{
					autoAlpha: 0,
				},
				0,
			).to(
				refs.current,
				{
					autoAlpha: 0,
					duration: 0.3,
					ease: "power2.inOut",
				},
				totalDuration + 4.5 - 0.3,
			);

			io.forEach(([key, [start, end]], i) => {
				const anime = gsap.timeline({}).set(refs.current[key], {
					autoAlpha: 1,
					duration: 0.1,
					ease: "power2.inOut",
				});
				const position = i > 0 ? singleFrame * start - 0.1 : 0;
				console.log(`position for ${key}:${position}`);
				timelineRef.current.add(anime, position);
			});
		},
		{dependencies: [transitions, finalPaths, fps, inOut]},
	);
	useEffect(() => {
	}, []);
	useEffect(() => {
		if (inView) {
			timelineRef.current.play();
		}
	}, [inView]);
	return (
		<svg ref={signRef} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"
		     className={"h-auto w-[270px]"} style={{
			display: "block",
		}} id={"yours-truly"} viewBox="0 0 960 184">
			<defs>
				<filter id="goo-1">
					<feGaussianBlur in="SourceGraphic" stdDeviation="1.15"
					                result="blur"></feGaussianBlur>
					<feColorMatrix in="blur" mode="matrix" values="	1 0 0 0 0
                      0 1 0 0 0
																			1 0 1 0 0
																			0 0 0 15 -8"
					               result="goo"></feColorMatrix>
					<feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
				</filter>
				<mask id={"h-1"}>
					<path
						d="m295 1-7-1q-14 3-24 9-12 6-23 20-12 14-22 29l-6 10-5 8h8l7-12 11-17q16-24 30-33l9-5 10-3 2 1 2 1q2 3 0 6l-4 8-5 5-5 5q-13 14-37 32l-15 11-7 4-16 10-5 3-8 7-29 16-21 12-43 22-7 3q-25 12-42 17-17 6-28 6h-3l-2 1-2 5 3 3 8-1q14-3 43-15l26-12 59-29 44-25 28-18 20-13 17-12q17-13 28-25l10-14q4-7 5-14 0-4-4-5" />
				</mask>
				<mask id="h-2">
					<path
						d="M298 10q2-6-2-9-3-2-10-1l-17 6q-9 4-16 10-11 9-22 24l-17 24-6 9-5 8-3 6-1 1-15 26q-20 33-31 44-5 6-12 10l-11 4-11-1q-5-2-10-7l-13-13-17-20-3-3-3-4-11-12-3-3-4-3q-13-9-24-12-13-3-25 2-3 1-5 4t-1 6q4 10 24 17l18 4 18 2h2v-2l-1-2-2-2-11-3-11-2q-8-1-13-4-7-3-11-9-1-3 1-5t6-2q15-1 26 7l10 8 8 10 6 7 10 14q14 18 25 26 5 4 11 6l12 2q6 0 14-3 7-3 14-10 15-12 27-34l15-24 17-30 4-5 3-5 19-30q11-14 20-22l3-1 3-2 3-2 3-1 3-1 3-1 5-1 3 2q2 2 0 7l-6 9-4 4-5 5-16 14-16 13-17 13q-4 2-6 5l-4 7-1 1v1l-1 1v1h1l1-1 21-14 22-15q16-12 25-22 12-13 17-27" />
				</mask>
				<mask id="h-3">
					<path
						d="M188 125h-11l-20 1H93q-21-1-29-3-29-4-41-10-12-5-10-12l4-3h9q7 1 13 4 8 4 15 10l4 4h2l1-1 1-2v-1l-2-2-1-1-1-1-1-1-3-2-11-7-16-4-6-1-8 1Q2 96 0 104q0 3 3 7l5 5 6 3q9 4 25 7 13 3 31 4l22 2 33 1 31-1 28-2 36-4 11-2 10-3 1-1 1-2-1-2h-1l-17 4q-20 4-36 4" />
				</mask>
				<mask id="h-4">
					<path
						d="m234 120-14 11q-17 17-17 32 0 11 12 11 10-1 20-5 9-3 19-9l18-13 21-15q0-2-2-2l-3 1-15 11-15 12q-9 6-17 9-9 4-17 4-6 0-8-3-2-2-1-7 21-11 32-22 5-5 7-10l2-7q-1-3-4-3h-7q-5 1-11 5m-8 13 8-8q5-3 9-3 4 1 2 6l-9 9-12 9-8 5q0-4 3-9l7-9" />
				</mask>
				<mask id="h-5">
					<path
						d="m366 137 6-5q0-4-8 1l-6 5-3 2-28 19-9 5-8 4h-6q-2-1-2-4l5-9 3-3 3-4 1-2v-1q-1-2-4-2t-6 3l-8 7-10 7q-11 8-13 2 0-4 7-12 6-9 15-16 10-8 18-10 8-3 12 3l-2 5-5 5-4 4 2 1q2 1 5-1l7-5 6-6q3-3 2-5 1-4-2-5-2-2-6-2l-16 2-16 7-15 10-12 11-6 8q-3 4-3 8-2 4 0 6 1 3 6 3 4 1 14-5l8-5 5-3v3l-1 3v1q0 18 36-4l27-18 11-8" />
				</mask>
				<mask id="h-6">
					<path
						d="m465 134-2 1-11 8-17 12q-25 16-26 9l4-6 10-13 10-12 4-6q-2-4-5-4-4 0-9 3l-12 7-15 9-13 9-10 6-6 4q-2 1-2-1l5-6 10-13 11-13 4-6q0-4-4-4-8 2-22 11l-9 7-5 4 1 4 17-12 6-3q2 0-2 6l-11 14-11 14-4 7q0 3 4 3l5-1 4-2 5-3 6-5 19-14 25-16q2 1 0 3l-2 3-3 3-5 6-5 7q-7 9-7 15 2 6 9 6 6-1 17-8l24-15 26-20q0-4-4-1l-4 3" />
				</mask>
				<mask id="h-7">
					<path
						d="M482 160q-1-3-6-4t-7 2l-1 4-1 6q0 2-4 4l-2 1q-1 1 0 0l-4 2-8 2h-5l-1-1v1q4 3 12 1l14-4 7-4 5-5q2-3 1-5" />
				</mask>
				<mask id="h-8">
					<path
						d="m531 159-3 1q-2 0-3 2t-1 2q0 4 6 7l10 3 12-4 16-10 5-4 13-10q16-15 5-12-6 7-14 13l-13 11-9 5q-3 1-1-3l3-10 3-12 1-7 2-9 2-5q0-4-2-2l-12 8-13 11-13 12-13 10-2 2 1 2 2-1h1q6-1 13-6l23-19 2-1 1 1-1 9-3 14q-3 7-6 9-4 1-10-6l-2-1" />
				</mask>
				<mask id="h-9">
					<path d="m599 160-4 3-2 4-1 3 1 4 4 1h3l3-3 3-4v-3l-1-4-3-2-3 1" />
				</mask>
				<mask id="h-10">
					<path
						d="M816 12q0-5-12-5-10 0-22 4v4h1l2 1 6-2 6-1q16 1-8 19-16 12-40 24t-44 18l-19 5q-16 4-29 4-3 0-3 2 0 4 11 3l9-2 6-1 18-5 30-10q20-8 36-17 20-10 33-20 15-11 19-21" />
				</mask>
				<mask id="h-11">
					<path
						d="M802.792 7.469q-.199-.433-.667-.398-26.719 1.862-61.789 25.558-26.8 18.11-54.748 46.14l-5.728 6.02q-31.509 33.325-38.326 57.021-3.046 10.577-.762 18.32 2.156 7.332 8.903 11.514 6.524 4.041 16.621 4.709 10.05.656 22.396-2.097 12.65-2.834 26.226-8.925 14.244-6.373 28.112-15.732.621-.41 1.043-1.089.785-1.265.457-2.061-.293-.703-1.37-.879-1.031-.176-2.332.187-1.358.387-2.413 1.195l-.152.106q-13.4 9.183-28.393 15.824-19.058 8.458-31.252 7.989-20.498-.761-24.633-12.053-3.479-9.476 4.627-26.027 6.384-13.06 19.514-29.682 9.254-11.713 20.019-23.005l6.348-6.466q25.793-24.774 43.879-37.998 27.866-20.382 47.673-22.396.258-.012.61-.117l2.131-.692q.457-.164.75-.374.902-.621 1.476-1.324.293-.351.398-.562l.117-.246q.14-.281.211-.387.328-.48.691-.972l.258-.34q.316-.34.105-.761" />
				</mask>
				<mask id="h-12">
					<path
						d="m860 46 2-4q1-3-4-4-5 0-9 4L744 162q-3 2-4 5-2 3 1 4l8-4 34-23 9-5 7-4 5-2q2-1 2 1l-4 6-9 11q-12 16-11 18 1 14 37-4l27-15 11-6 7-5q1-2-1-2l-4 1-14 8-16 9q-19 10-30 13-5-1-2-6l8-11 10-11q5-6 5-8 0-12-24 1l-17 10q-9 7-11 7h-2l1-3 36-39 37-41 10-10 6-6 4-5" />
				</mask>
				<mask id="h-13">
					<path
						d="m834 162-1 7 4 4 6 1 8-1q10-4 19-13l4-5q7-8 9-16 2-7 0-12-1-4-4-6-2-3-6-4l-6-1-6 1-6 3-4 4-2 8 2 11q-13 11-17 19m33-41 4 1q5 3 6 9 2 7-3 16l-2 3-3 4-4 5q-10 10-16 10t-6-4q0-3 4-8l6-7 2-3 2-2 3 1-1-1 1 1q3 1 2-1l-2-3 4-2v-2h-3l-2 1-1-3-1-8q0-3 2-5l3-2h5" />
				</mask>
				<mask id="h-14">
					<path
						d="M913 145h-1l-1-1h-1l-2 1q-18 11-31 11l-3-1-2-1-2-1q-6-3-10-11-3-7-3-14 0-5 4-7h7q4 1 7 5t3 9v1l1 1 1 1h2l1 1 1-5v-3q0-4-3-8-2-3-5-4l-7-3-7 1q-4 0-7 2t-5 6q-4 7 1 18l3 6 8 8 3 2 4 1h4q8 1 18-3 9-3 21-11v-1" />
				</mask>
				<mask id="h-15">
					<path
						d="m937 106-2 1-3 3-2 4-1 2q0 2 2 3l2 1 3-1 3-3 3-3v-3l-1-3-4-1m24 26-1-2-3 2-10 8-11 9q-14 11-23 15-4-1-1-8l8-12q9-12 9-15-3-5-9 1l-10 14-5 10-4 8v6q2 3 6 3 8-3 28-18l15-12 11-9" />
				</mask>
			</defs>
			<g id={"signature"} className={
				"[&_path]:fill-faded-foreground [&_path]:stroke-faded-foreground overflow-visible [&_path]:stroke-2"
			} style={{
				filter: "url(#goo-1)",
			}}>
				<g id={"s_1"} mask="url(#h-1)">
					<path d="" ref={(el) => {
						el && (refs.current.s_1 = el);
					}} />
				</g>
				<g id={"s_2"} mask="url(#h-2)">
					<path d="" ref={(el) => {
						el && (refs.current.s_2 = el);
					}} />
				</g>
				<g id={"s_3"} mask="url(#h-3)">
					<path d="" ref={(el) => {
						el && (refs.current.s_3 = el);
					}} />
				</g>
				<g id={"e"} mask="url(#h-4)">
					<path d="" ref={(el) => {
						el && (refs.current.e = el);
					}} />
				</g>
				<g id={"a"} mask="url(#h-5)">
					<path d="" ref={(el) => {
						el && (refs.current.a = el);
					}} />
				</g>
				<g id={"n"} mask="url(#h-6)">
					<path d="" ref={(el) => {
						el && (refs.current.n = el);
					}} />
				</g>
				<g id={"comma"} mask="url(#h-7)">
					<path d="" ref={(el) => {
						el && (refs.current.comma = el);
					}} />
				</g>
				<g id={"small_s"} mask="url(#h-8)">
					<path d="" ref={(el) => {
						el && (refs.current.small_s = el);
					}} />
				</g>
				<g id={"period"} mask="url(#h-9)">
					<path d="" ref={(el) => {
						el && (refs.current.period = el);
					}} />
				</g>
				<g id={"c_1"} mask="url(#h-10)">
					<path d="" ref={(el) => {
						el && (refs.current.c_1 = el);
					}} />
				</g>
				<g id={"c_2"} mask="url(#h-11)">
					<path d="" ref={(el) => {
						el && (refs.current.c_2 = el);
					}} />
				</g>
				<g id={"h"} mask="url(#h-12)">
					<path ref={(el) => {
						el && (refs.current.h = el);
					}} d="" />
				</g>
				<g id={"o_1"} mask="url(#h-13)">
					<path d="" ref={(el) => {
						el && (refs.current.o_1 = el);
					}} />
				</g>
				<g id={"o_2"} mask="url(#h-14)">
					<path ref={(el) => {
						el && (refs.current.o_2 = el);
					}} d="" />
				</g>
				<g id={"i"} mask="url(#h-15)">
					<path ref={(el) => {
						el && (refs.current.i = el);
					}} d="" />
				</g>
			</g>
		</svg>
	);
};
