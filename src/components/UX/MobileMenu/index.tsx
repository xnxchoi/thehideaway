import {useDomCursor} from "@/components/core/cursorWrapper";
import {useIsMobile} from "@/providers/MiddleMan";

import {useRPStore} from "@/providers/RP_Pro";
import {useGSAP} from "@gsap/react";
import gsap from "gsap";
import {AnimatePresence} from "motion/react";
import * as m from "motion/react-m";
import {useRef, useState} from "react";

export const MobileMenu = () => {
	const navIsOpen = useRPStore((state) => state.navIsOpen);
	const navIsTransitioning = useRPStore((state) => state.navIsTransitioning);
	const pageIsTransitioning = useRPStore((state) => state.pageIsTransitioning);
	const {isMobile} = useIsMobile();
	const [isOpen, setIsOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const {onMouseEnter, onMouseLeave} = useDomCursor({});
	const ref = useRef<HTMLDivElement>(null!);
	useGSAP(
		() => {
			gsap.to(ref.current, {
				y: 0,
				opacity: 1,
				duration: 0.2,
				ease: "power2.inOut",
			});
		},
		{scope: ref},
	);
	return (
		<AnimatePresence mode="wait" initial={false}>
			{isMobile && isVisible && (
				<m.div ref={ref} initial={{opacity: 0, y: "100%"}} animate={{
					y: [0, 0],
					opacity: [1, 1],
					transition: {
						times: [0, 1],
						type: "tween",
						duration: 0.5,
						ease: "easeInOut",
					},
				}} className="fixed w-screen h-[30px] bottom-0 bg-transparent z-[248]">
					<div className="flex flex-row gap-2 w-[80px] h-[30px]"
					     onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
						<div className="w-[30px] h-[1px] bg-[oklch(var(--n-s-fg)/1)]"></div>
						<div className="w-[30px] h-[1px] bg-[oklch(var(--n-s-fg)/1)]"></div>
					</div>
				</m.div>
			)}
		</AnimatePresence>
	);
};
