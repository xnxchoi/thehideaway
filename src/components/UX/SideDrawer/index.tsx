"use client";
import {useDomCursor} from "@/components/core/cursorWrapper";
import {useCursorStore, useRPStore} from "@/providers/RP_Pro";
import {useCallback, useEffect, useRef, useState} from "react";
import {Drawer} from "@/components/vaul";
import {Link} from "../Link";
import {useIsMobile} from "@/providers/MiddleMan";
import {RP_FM} from "../Radio/RP_FM";
import {SideNotch} from "../SideNotch";
import {useRadioStore} from "@/providers/RadioProvider";

export const SIDE_DRAWER = {
	MOBILE: {
		width: "100vw",
		height: "auto",
		direction: "bottom",
	},
	DESKTOP: {
		width: "24vw",
		height: "100vh",
		direction: "left",
	},
};

export const SideDrawer = () => {
	const setSnapPoint = useRPStore((r) => r.setActiveSnapPoint);
	const snapPoints = useRPStore((r) => r.snapPoints);
	const snapPoint = useRPStore((r) => r.activeSnapPoint);

	const open = useRPStore((r) => r.sidebarOpen);
	const setSideDrawerOpen = useRPStore((r) => r.setSideDrawerOpen);
	const setIsDraggingSideDrawer = useRPStore((r) => r.setIsDraggingSideDrawer);

	const {isMobile} = useIsMobile();
	const setCursor = useCursorStore((r) => r.setCursorState);
	const hasRadio = useRadioStore((r) => r.hasRadio);
	const [direction, setDirection] = useState<
		"bottom" | "left" | "top" | "right" | undefined
	>(
		SIDE_DRAWER[isMobile ? "MOBILE" : "DESKTOP"].direction as
			| "bottom"
			| "left"
			| "top"
			| "right"
			| undefined,
	);
	useEffect(() => {
		setDirection(
			SIDE_DRAWER[isMobile ? "MOBILE" : "DESKTOP"].direction as
				| "bottom"
				| "left"
				| "top"
				| "right"
				| undefined,
		);
	}, [isMobile]);

	const setCursorTheme = useCursorStore((r) => r.setCursorTheme);
	const resetCursor = useCursorStore((r) => r.resetCursorTheme);
	const {onMouseEnter, onMouseLeave} = useDomCursor({
		enterCondition: () => "CLOSE",
		onEnter: (e) => setCursorTheme("dark"),
		onLeave: (e) => resetCursor(),
	});
	const lastOpen = useRef(open);
	const [isOpen, setIsOpen] = useState(true);
	const lastRelease = useRef(0);
	const onOpenChange = useCallback(
		(o: boolean) => {
			if (o !== lastOpen.current) {
				setSideDrawerOpen(o);
			}
			lastOpen.current = o;
		},
		[setSideDrawerOpen],
	);

	useEffect(() => {
		!open && (setCursor(null), resetCursor());
	}, [open, setCursor, resetCursor]);
	return (
		snapPoints.length > 0 && (
			<Drawer.Root snapPoints={snapPoints} activeSnapPoint={snapPoint}
			             setActiveSnapPoint={setSnapPoint} open={isOpen} onOpenChange={onOpenChange}
			             defaultOpen={true} snapToSequentialPoint={true} modal={open}
			             direction={"left"} onDrag={(e) => {
				setIsDraggingSideDrawer(true);
			}} onRelease={(e) => {
				console.log("release");
				setIsDraggingSideDrawer(false);
				lastRelease.current = e.timeStamp;
			}}>
				<Drawer.Portal>
					<Drawer.Overlay onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
					                className="fixed inset-0 bg-[oklch(var(--n-s-bg)/0.5)] backdrop-blur-sm z-[39]" />
					<Drawer.Content
						className="fixed z-[239] outline-none w-[calc(24vw+40px)] max-md:w-screen flex gap-0 items-end text-[oklch(var(--n-s-fg)/1)] top-0 bottom-0"
						style={{} as React.CSSProperties}>
						<div
							className="h-full w-[24vw] max-md:w-screen grid grid-rows-14 gap-y-5 grid-cols-8 rounded-[16px] items-center justify-center bg-[oklch(var(--n-s-bg)/1)]"
							onMouseEnter={() => {
								setCursor(null);
								setCursorTheme("dark");
							}} onMouseLeave={() => {
							resetCursor();
						}}>
							<div className={"col-[2/8] row-[2/3] flex flex-col justify-center"}>
								<Drawer.Title className={"text-h3"} title={"Quick Access"}>
									Quick Access
								</Drawer.Title>
							</div>
							<div className="col-[2/8] row-[3/10] px-4">
								<div className="flex flex-col gap-5 text-[23px] font-sans">
									<Link href="/users">Directory</Link>
									<Link href="/latest">Latest</Link>
									<Link href="/posts">Latest</Link>
								</div>
							</div>
							<div className={"col-[1/-1] row-[11/14]"}>
								{hasRadio && <RP_FM />}
							</div>
						</div>
						<SideNotch sideDrawer={true} />
					</Drawer.Content>
				</Drawer.Portal>
			</Drawer.Root>
		)
	);
};
