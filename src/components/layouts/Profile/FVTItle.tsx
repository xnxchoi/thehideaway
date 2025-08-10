"use client";
import React, {
	ComponentPropsWithRef,
	CSSProperties,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {useGSAP} from "@gsap/react";
import {useInView} from "react-intersection-observer";
import {gsap} from "gsap";
import {useLenis} from "lenis/react";

export const InkedTitle = (
	props: ComponentPropsWithRef<"div"> & { name: string; id: string },
) => {
	const {name, id, ..._rest} = props;
	const tl = useRef<GSAPTimeline>(null!);
	const ff = useRef(0);
	const lenis = useLenis();
	const interactionTL = useRef<GSAPTimeline>(null!);
	const [isHovered, setIsHovered] = useState(false);
	const tlRef = useRef<GSAPTimeline>(null!);
	const opacityTL = useRef<GSAPTimeline>(null!);
	const feBlurRef = useRef<SVGFEGaussianBlurElement>(null!);
	const feBlurValue = useRef(0.15);
	const containerRef = useRef<HTMLDivElement>(null!);
	const textsGroupRef = useRef<SVGGElement>(null!);
	const initialized = useRef(false);
	const textStyle = useMemo(
		(): CSSProperties => ({
			transformOrigin: "50% 50%",
			filter: "url(#goo-1)",

			transformBox: "view-box",
		}),
		[],
	);
	useGSAP(
		({context, contextSafe}) => {
			tlRef.current = gsap.timeline({
				paused: true,
				onUpdate: () => {
					feBlurRef.current.setAttribute(
						"stdDeviation",
						`${feBlurValue.current}`,
					);
				},
				onComplete: () => {
					initialized.current = true;
				},
			}).fromTo(
				feBlurValue,
				{
					current: 1.5,
				},
				{
					current: 0.195,
					duration: 1.6,
					delay: initialized.current ? 0.5 : 0.2,
					ease: "power2.inOut",
				},
				0,
			);
		},
		{
			scope: containerRef,
		},
	);
	useGSAP(
		({context, contextSafe}) => {
			if (!initialized.current) return;
			gsap.killTweensOf([feBlurValue, feBlurRef.current]);
			gsap.to(feBlurValue, {
				current: isHovered ? 2.15 : 0.215,
				duration: isHovered ? 1.5 : 1.6,
				delay: isHovered ? 0.71 : 0.75,
				ease: isHovered ? "power4.out" : "power2.in",
				onUpdate: () => {
					feBlurRef.current.setAttribute(
						"stdDeviation",
						`${feBlurValue.current}`,
					);
				},
			});
		},
		{
			dependencies: [isHovered],
			scope: containerRef,
		},
	);
	useGSAP(
		() => {
			opacityTL.current = gsap.timeline().fromTo(
				textsGroupRef.current,
				{
					opacity: 0,
				},
				{
					opacity: 1,
					duration: 1.5,
					delay: initialized.current ? 0.3 : 0,
					ease: "power2.inOut",
				},
			);
		},
		{scope: textsGroupRef},
	);
	const {inView, ref: inviewRef} = useInView({
		threshold: 1,
	});
	useEffect(() => {
		if (inView) {
			tlRef.current?.play();
			opacityTL.current?.play();
		} else {
			tlRef.current?.reverse();
			opacityTL.current?.reverse();
			initialized.current = false;
		}
	}, [inView]);
	return (
		<div className={"h-screen w-full p-6"}>
			<div className={"relative w-full h-full"}>
				<div id={"title-container"} className={
					"absolute left-1/2 top-1/2 w-[50vw] z-[10] -translate-x-1/2 -translate-y-1/2 group"
				}>
					<div className="w-full relative h-full flex items-center justify-center"
					     ref={inviewRef}>
						<svg
							className="indent-[-9999px] aspect-[21/10] justify-center items-center flex fill-edge-black dark:hover:fill-faded-white text-center transition-colors duration-400 ease-in-out-2"
							viewBox={`0 0 160 50`} style={{
							height: "100%",
							width: "100%",
							display: "block",
						}} data-themed={"fill-color,color"} preserveAspectRatio="xMidYMid meet"
							onMouseEnter={() => {
								setIsHovered(true);
							}} onMouseLeave={() => {
							setIsHovered(false);
						}}>
							<defs>
								<filter id="goo-1">
									<feGaussianBlur ref={feBlurRef} in="SourceGraphic"
									                stdDeviation="0.15"
									                result="blur"></feGaussianBlur>
									<feColorMatrix in="blur" mode="matrix" values="	1 0 0 0 0
																			0 1 0 0 0
																			1 0 1 0 0
																			0 0 0 15 -8"
									               result="goo"></feColorMatrix>
									<feComposite in="SourceGraphic" in2="goo"
									             operator="atop"></feComposite>
								</filter>
							</defs>
							<g ref={textsGroupRef} data-themed={"color,stroke"}>
								<text dominantBaseline={"middle"} textAnchor={"middle"}
								      style={textStyle}
								      className="font-black font-siegfried italic text-[22px] text-center"
								      x="50%" y="50%">
									{name}
								</text>
							</g>
						</svg>
					</div>
				</div>
				<div id={"gradience"} data-gl-type="about-fv" style={{
					width: "100%",
					height: "100%",
					position: "absolute",
					top: 0,
					left: 0,
				}}
				     {..._rest}
				></div>
			</div>
		</div>
	);
};
