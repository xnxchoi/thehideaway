"use client";
import {useEffect, useRef, useState} from "react";
import {useRPStore} from "@/providers/RP_Pro";
import {Icon} from "src/components/UX/Icon";
import {cn} from "@/lib/utils";
import {Button, ButtonTotalProps} from "@/components/ui/button";
import gsap from "gsap";
import {useGSAP} from "@gsap/react";
import NumberFlow, {continuous} from "@number-flow/react";
import {useWindowResize} from "@/utilities/use_window_resize";
import {useIsMobile} from "@/providers/MiddleMan";
import {useNotifications} from "@/providers/Notifications";

interface ExpandButtonProps extends ButtonTotalProps {
	defaultWidth?: number;
	onContract?: () => void;
	onExpand?: () => void;
}

export const NotificationButton = (config: ExpandButtonProps) => {
	const {onContract, onExpand, children, ref, ...props} = config;
	const widths = {
		mobile: 32,
		desktop: 24,
	};

	const padding = 8;
	const [defaultW, setDefaultW] = useState(widths.desktop);
	const [expW, setExpW] = useState(24),
		[expanded, setExpanded] = useState(true),
		setNavIsOpen = useRPStore((store) => store.setNavIsOpen),
		navIsOpen = useRPStore((store) => store.navIsOpen),
		windowReside = useWindowResize();
	const {isMobile} = useIsMobile();

	useEffect(() => {
		setDefaultW(widths[isMobile ? "mobile" : "desktop"]);
	}, [windowReside, widths, isMobile]);
	useEffect(() => {
		setExpW(isMobile ? defaultW : Math.max(40, padding * 0.5 + defaultW));
	}, [defaultW, isMobile, padding]);

	const icon = useRef<typeof Icon>(null!),
		txt = useRef<HTMLSpanElement>(null!);
	const {count, isLoading} = useNotifications();
	useGSAP(
		() => {
			if (!ref) return;
			gsap.to(ref, {
				minWidth: expanded ? expW : defaultW,
				ease: "Power3.easeOut",
				duration: 0.2,
			});
		},
		{dependencies: [expanded, defaultW, expW]},
	);

	return (
		<Button ref={ref} type={"button"}
		        className={cn("rp_btn", "bt_sm", "bell-button", {hover: navIsOpen})}>
			<div className="bell-link-text">
				<NumberFlow respectMotionPreference={false} locales={"en-US"} plugins={[continuous]}
				            value={count} format={{notation: "compact", compactDisplay: "short"}} />
			</div>
			<svg className="bell-icon" viewBox="0 0 45 45" fill="none">
				<path data-themed={"stroke,fill"} fill="oklch(var(--n-s-btn)/1)"
				      d="m40.7,34.79c-1.21-1.07-2.26-2.31-3.14-3.66-.96-1.87-1.53-3.92-1.69-6.01v-6.18c.02-6.81-5.04-12.57-11.8-13.44v-1.61c0-.92-.75-1.67-1.67-1.67s-1.67.75-1.67,1.67v1.64c-6.69.93-11.68,6.65-11.66,13.41v6.18c-.16,2.1-.73,4.14-1.69,6.01-.86,1.35-1.9,2.58-3.09,3.66-.27.24-.42.58-.42.94v1.7c0,.69.56,1.25,1.25,1.25h34.75c.69,0,1.25-.56,1.25-1.25v-1.7c0-.36-.16-.7-.43-.94Zm-34.22,1.39c1.16-1.12,2.19-2.38,3.05-3.75,1.21-2.26,1.91-4.75,2.06-7.31v-6.18c-.2-6.03,4.52-11.08,10.55-11.29,6.03-.2,11.08,4.52,11.29,10.55,0,.25,0,.49,0,.74v6.18c.15,2.56.86,5.05,2.06,7.31.86,1.37,1.89,2.63,3.05,3.75H6.48Z"></path>
				<path data-themed={"stroke,fill"} fill="oklch(var(--n-s-btn)/1)"
				      d="m22.56,42.85c1.63-.04,2.99-1.24,3.22-2.85h-6.58c.24,1.66,1.68,2.87,3.35,2.85Z"></path>
			</svg>
		</Button>
	);
};
