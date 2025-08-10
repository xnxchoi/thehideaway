"use client";

import * as darkAnimation from "./lottie-dark.json";
import * as lightAnimation from "./lottie\ light.json";
import {useEffect, useRef, useState} from "react";
import {useRPStore} from "@/providers/RP_Pro";
import {canUseDOM} from "@/utilities/canUseDOM";
import {useTheme} from "@/providers/Theme";
import Lottie from "react-lottie-player";
import gsap from "gsap";
import {useGSAP} from "@gsap/react";

export const LoaderLottie = () => {
	const theme = useTheme((r) => r.theme);
	// const [animationData, setAnimationData] = useState(darkAnimation);
	// useEffect(() => {
	//   setAnimationData(theme === "dark" ? darkAnimation : lightAnimation);
	// }, [theme]);
	const pageIsTransitioning = useRPStore((l) => l.pageIsTransitioning);
	const divRef = useRef<HTMLDivElement>(null!);

	useGSAP(
		() => {
			if (pageIsTransitioning) {
				gsap.to(divRef.current, {
					autoAlpha: 1,
					duration: 0.2,
					ease: "power4.easeIn",
				});
			}
			// else {
			//   gsap.to(divRef.current, {
			//     autoAlpha: 0,
			//     duration: 0.2,
			//     ease: "power4.easeOut",
			//   });
			// }
		},
		{dependencies: [pageIsTransitioning], scope: divRef},
	);
	return (
		<div data-themed="background-color,color" className={
			"fixed inset-0 flex flex-col justify-center items-center bg-[oklch(var(--bg/1))] w-screen h-screen"
		} ref={divRef}>
			<div className="w-[120px] h-[120px] xl:w-[24vw] xl:h-[24vw] gap-x-2.5 gap-y-2.5 flex flex-col justify-center items-center
    overflow-hidden contents-center m-auto">
				<div className="w-full flex">
					<Lottie play={true} loop={true} renderer={"svg"} animationData={darkAnimation}
					        style={{width: "100%", height: "100%"}} rendererSettings={{
						preserveAspectRatio: "xMidYMid slice",
					}} />
				</div>
			</div>
		</div>
	);
};
// variants = {{
//   start: { opacity: 0, visibility: 'hidden' }, enter: {
//     visibility: 'visible', opacity: 1, transition: {
//       ease: 'easeIn', duration: 0.3, zIndex: 244
//     },
//   }, exit: {
//     visibility: 'hidden', zIndex: 45, opacity: 0, transition: {
//       duration: 0.2, ease: 'easeOut', zIndex: 45
//     },

//   },
// }}
