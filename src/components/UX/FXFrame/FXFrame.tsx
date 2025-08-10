"use client";
import * as m from "motion/react-m";
import {cn} from "@/lib/utils";
import {useMenu, useRPStore} from "@/providers/RP_Pro";
import {useRef} from "react";
import {AnimatePresence} from "motion/react";
import {useGSAP} from "@gsap/react";
import {gsap} from "gsap";

export const FXFrame = () => {
	const showFXFrame = useRPStore((l) => l.showFXFrame);
	const fxWrapperRef = useRef<HTMLDivElement>(null!);
	const {right, left, bottom} = useMenu((r) => r.frames);
	const showHeader = useRPStore((r) => r.showHeader);
	useGSAP(
		() => {
			if (fxWrapperRef.current) {
				gsap.to(fxWrapperRef.current, {
					autoAlpha: showFXFrame ? 1 : 0,
					left: left,
					right: right,
					bottom: bottom,
					duration: 0.4,
					ease: "power3.easeInOut",
				});
				gsap.to("[data-footer-fx]", {
					bottom: bottom,
					duration: 0.4,
					ease: "power3.easeInOut",
				});
			}
		},
		{dependencies: [showFXFrame, bottom, left, right], scope: fxWrapperRef},
	);
	return (
		<AnimatePresence>
			{showFXFrame && showHeader && (
				<m.div ref={fxWrapperRef} initial={{visibility: "hidden", opacity: 0}} animate={{
					visibility: "visible",
					opacity: 1,
					transition: {
						duration: 0.3,
						ease: "easeIn",
					},
				}} exit={{
					opacity: 0,
					transition: {
						duration: 0.2,
						ease: "easeOut",
					},
				}} className={cn(
					"data-[visible=false]:animate-out data-[visible=true]:animate-in data-[visible=false]:fade-out-0 data-[visible=true]:fade-in-0 z-10 pointer-events-none margin-left-auto margin-right-auto position-fixed inset-0",
				)}>
					{/*bottom-fx soft */}
					<div data-footer-fx data-themed={"background-color"}
					     className="z-10 opacity-75 mask-[linear-gradient(transparent,oklch(var(--black)/1))] backdrop-filter-[brightness(100%)_blur(5px)_contrast(500%)_saturate(1500%)] pointer-events-none h-[80px] w-full absolute top-auto bottom-[20px] bg-[oklch(var(--black)/0)] fixed"></div>
					<div data-footer-fx data-themed={"background-color"}
					     className="z-10 opacity-75 mask-[linear-gradient(transparent,oklch(var(--black)/1))] backdrop-filter-[hue-rotate(0deg)_brightness(110%)_blur(5px)_contrast(500%)_saturate(1500%)] pointer-events-none h-[60px] w-full top-auto bottom-[20px] fixed"></div>
				</m.div>
			)}
		</AnimatePresence>
	);
};
