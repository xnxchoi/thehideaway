import {type ButtonTotalProps} from "@/components/ui/button";
import {MotionPillButton} from "@/components/UX/Button";
import {EASING, springGSAP} from "@/constants/animations";
import {cn} from "@/lib/utils";
import {useIsMobile} from "@/providers/MiddleMan";
import {useRPStore} from "@/providers/RP_Pro";
import {animate} from "motion";
import {
	HTMLMotionProps, useMotionTemplate,
	useMotionValue,
	useMotionValueEvent,
	useSpring,
	useTransform
} from "motion/react";
import * as m from "motion/react-m";
import type {ComponentPropsWithRef, MouseEventHandler} from "react";
import {RefObject, useCallback, useEffect, useRef} from "react";
import {Icon} from "src/components/UX/Icon";
import {useShallow} from "zustand/shallow";

type MenuButtonProps = ComponentPropsWithRef<"button">;
export const MenuButton = ({style, className, ...props}: HTMLMotionProps<"button">) => {
	const toggleNav = useRPStore((store) => store.toggleMenu);
	const isNavOpen = useRPStore(useShallow((store) => store.navIsOpen));
	const navState = useMotionValue(isNavOpen)
	useEffect(() => {
		navState.set(isNavOpen)
	}, [isNavOpen, navState])

	const menuTextRef: RefObject<null | HTMLElement> = useRef(null);
	// const [buttonPaddingPx, setButtonPaddingPx] = useState("16");
	const closeTextRef: RefObject<null | HTMLElement> = useRef(null);
	const menuIconRef: RefObject<null | HTMLElement> = useRef(null);
	const {ref: menuRef} = props;
	// const x = useRef(!1);
	const {isMobile} = useIsMobile();
	const mobileState = useMotionValue(isMobile)
	useEffect(() => {
		// setButtonPaddingPx(`${isMobile ? 14 : 16}`);
		mobileState.set(isMobile)
	}, [isMobile, mobileState]);
	const px = useTransform(() => mobileState.get() ? 14 : 16 as number)
	const wd = useMotionValue(64);
	const __iconY = useTransform(() => navState.get() ? 0 : 50 as number)
	const _iconY = useSpring(__iconY, {
		visualDuration: 0.6,
		...springGSAP.power3.out
	});
	const iconY = useMotionTemplate`${_iconY}%`
	const openY = useMotionValue("0%"), closeY = useMotionValue("105%")

	useMotionValueEvent(navState, "change", (latestValue) => {
		if (
			!menuTextRef.current ||
			!closeTextRef.current

		)
			return;
		animate(openY, latestValue ? "-105%" : "0%", {
			duration: 0.6, ease: EASING.power4.out
		})
		animate(closeY, latestValue ? "0%" : "105%", {
			duration: 0.6, ease: EASING.power4.out
		})
		const wdx = px.get() * 2
		animate(wd, wdx + (latestValue ? closeTextRef.current.offsetWidth : menuTextRef.current.offsetWidth), {
			duration: 0.6, ease: EASING.power4.out
		})

	})
	// const textSwitchCallback = useCallback(
	// 	(l: boolean) => {
	// 		if (
	// 			!menuTextRef.current ||
	// 			!closeTextRef.current ||
	// 			!menuIconRef.current ||
	// 			!menuRef
	// 		)
	// 			return;
	// 		const textWidth = isNavOpen
	// 			? closeTextRef.current.offsetWidth
	// 			: menuTextRef.current.offsetWidth + 2;
	// 		gsap.killTweensOf([
	// 			menuTextRef.current,
	// 			menuIconRef.current,
	// 			closeTextRef.current,
	// 			menuRef
	// 		]);
	// 		(gsap[l ? "set" : "to"](menuRef, {
	// 			width: parseInt(buttonPaddingPx, 10) * 4 + textWidth,
	// 			duration: 0.6,
	// 			ease: "power4.out"
	// 		}),
	// 			gsap[l ? "set" : "to"](menuTextRef.current, {
	// 				y: isNavOpen ? "-105%" : 0,
	// 				duration: 0.6,
	// 				ease: "power4.out"
	// 			}),
	// 			gsap[l ? "set" : "to"](closeTextRef.current, {
	// 				y: isNavOpen ? 0 : "105%",
	// 				duration: 0.6,
	// 				ease: "power4.out"
	// 			}),
	// 			gsap[l ? "set" : "to"](menuIconRef.current, {
	// 				y: isNavOpen ? 0 : "50%",
	// 				duration: 0.6,
	// 				ease: "power4.out",
	// 				delay: isNavOpen ? 0.075 : 0
	// 			}));
	// 	},
	// 	[isNavOpen]
	// );
	// useEffect(() => {
	// 	textSwitchCallback(false);
	// }, [textSwitchCallback]);
	// useEffect(() => {
	// 	x.current || ((x.current = !0), textSwitchCallback(true));
	// }, [textSwitchCallback]);
	const onClick: MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
		e.preventDefault();
		toggleNav();
	}, [toggleNav])
	return (
		<MotionPillButton
			id="primary__nav"
			data-themed="border-color,background-color"
			onClick={onClick}
			ref={menuRef}
			className={cn(
				"rp_btn",
				"leading-[140%] font-normal tracking-[-0.01em]",
				"relative w-[64px] overflow-hidden transition-all duration-300 ease-out-power3 hover:border-current! hover:bg-transparent! data-[state=true]:w-[77px] data-[state=true]:border-current! data-[state=true]:bg-transparent!",
				className
			)}
			style={{
				paddingLeft: px,
				paddingRight: px, width: wd,
				...style
			}}
			data-state={isNavOpen}
			aria-label={`${isNavOpen ? "Close" : "Open"} The Menu`}
		>
			<m.span
				ref={menuTextRef}
				className="menu__button-text"
				data-themed="color"
				aria-hidden="false"
				data-toggle="ON"
				style={{y: openY}}
			>
				MENU
			</m.span>
			<m.span
				style={{y: closeY}}
				ref={closeTextRef}
				className="menu__button-close"
				aria-hidden="true"
			>
        <span data-themed="color" data-toggle="OFF">
          BACK
        </span>
				<m.span className="menu__button-icon-container" ref={menuIconRef}
				        style={{y: iconY,}}>
					<Icon className={"menu__button-icon"} name={"Close"}/>
				</m.span>
			</m.span>
		</MotionPillButton>
	);
};
