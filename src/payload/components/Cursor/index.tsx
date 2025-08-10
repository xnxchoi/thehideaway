"use client";

import {gsap} from "gsap";
import {RefObject, useCallback, useEffect, useRef, useState} from "react";

import {useGSAP} from "@gsap/react";
import * as m from "motion/react-m";
import {AnimatePresence} from "motion/react";
import "./index.scss";
import {cn} from "@/lib/utils";
import {useIsMobile} from "@/providers/MiddleMan";
import {useCursorStore, useRaf} from "@/providers/RP_Pro";
import {useTheme} from "@/providers/Theme";
import {lerp} from "@/utilities/Helpers";
import {usePathname, useSearchParams} from "next/navigation";
import {delay} from "@/utilities/rp_utils";

export type TextCursorState = "HOVER" | "DRAG" | "CLOSE" | string;
export type CursorState = "FOCUS" | null;
export type CursorStated = TextCursorState | CursorState;
type DomCursorOptions<E> = Partial<{
	onEnter: (e: React.MouseEvent<E>) => void;
	onLeave: (e: React.MouseEvent<E>) => void;

	enterCondition?: (e: React.MouseEvent<E>) => CursorStated;
	leaveCondition?: (e: React.MouseEvent<E>) => CursorStated;
}>;
type DomHandlers<E> = {
	onMouseEnter: (e: React.MouseEvent<E>) => void;
	onMouseLeave: (e: React.MouseEvent<E>) => void;
};

export function useDomCursor<E extends HTMLElement>({
	onEnter,
	onLeave,
	enterCondition,
	leaveCondition,
}: DomCursorOptions<E>): DomHandlers<E> {
	const {isMobile} = useIsMobile();
	const setCur = useCursorStore((l) => l.setCursorState);
	const onMouseEnter: DomHandlers<E>["onMouseEnter"] = useCallback(
		(e) => {
			if (isMobile) return;
			const disabled = (e.target as HTMLDivElement).dataset.disabled;
			const active = (e.target as HTMLDivElement).dataset.active;
			const nullCondition = Boolean(
				(disabled && disabled === "true") || (active && active === "true"),
			);
			const onEnterState: CursorStated = enterCondition
				? enterCondition(e)
				: nullCondition
					? null
					: "FOCUS";
			setCur(onEnterState);
			onEnter?.(e);
		},
		[onEnter, enterCondition, isMobile],
	);
	const onMouseLeave: DomHandlers<E>["onMouseLeave"] = useCallback(
		(e) => {
			if (isMobile) return;
			const onLeaveState: CursorStated = leaveCondition
				? leaveCondition(e)
				: null;
			setCur(onLeaveState);
			onLeave?.(e);
		},
		[onLeave, leaveCondition, isMobile],
	);
	return {
		onMouseEnter,
		onMouseLeave,
	};
}

const P = {
	LARGE: 48,
	MEDIUM: 17,
	SMALL: 6,
};
// Initialize cursor
export default function RP_Cursor() {
	const {isMobile} = useIsMobile();
	const [showCursor, setShowCursor] = useState(!1);
	const [isTextCursor, setIsTextCursor] = useState(!1);
	const [setCoord, api] = useCursorStore((l) => l.setMouseCoordinates);
	const setCursorState = useCursorStore((l) => l.setCursorState);
	const cursorState = useCursorStore((l) => l.cursorState);
	const oCircle = useRef(null);
	const iCircle = useRef(null);
	const cursr = useRef(null);
	const domEl = useRef<HTMLSpanElement>(null!);
	const searchParams = useSearchParams();
	const rafAdd = useRaf((l) => l.addToRaf);
	const rafRem = useRaf((l) => l.removeFromRaf);
	const xSetter = gsap.quickSetter(cursr.current, "x", "px");
	const ySetter = gsap.quickSetter(cursr.current, "y", "px");
	const cursorTheme = useCursorStore((l) => l.cursorTheme);
	const pathname = usePathname();
	const theme = useTheme((r) => r.theme);
	const lastPathname = useRef(pathname);
	const lastSearchParams = useRef(searchParams);
	const lastLinks = useRef<NodeListOf<HTMLAnchorElement> | null>(null);
	useEffect(() => {
		if (document) {
			document.querySelectorAll('[style*="cursor"]').forEach((el) => {
				(el as HTMLElement).style.setProperty("cursor", "none");
			});
		}
	}, []);

	useEffect(() => {
		if (document) {
			document.querySelectorAll('[style*="cursor"]').forEach((el) => {
				(el as HTMLElement).style.setProperty("cursor", "none");
			});
		}
	}, [pathname, searchParams]);
	const lastButtons = useRef<NodeListOf<HTMLButtonElement> | null>(null);
	const lastPopupButtons = useRef<NodeListOf<HTMLButtonElement> | null>(null);
	const lastCheckBoxes = useRef<NodeListOf<HTMLInputElement> | null>(null);
	const onMouseEnter = useCallback((e: MouseEvent) => {
		const target = e.target as HTMLElement;
		if (target.tagName === "BUTTON" || target.tagName === "INPUT") {
			(target as HTMLButtonElement | HTMLInputElement).disabled
				? setCursorState(null)
				: setCursorState("FOCUS");
			return;
		}
		setCursorState("FOCUS");
	}, []);
	const onMouseLeave = useCallback((e: MouseEvent) => {
		setCursorState(null);
	}, []);

	const popupButtonClickCallback = useCallback(
		(e: MouseEvent) => {
			const popup = (e.target as HTMLButtonElement).closest(".popup__content");
			if (popup) {
				delay(200).then(() => {
					popup.querySelectorAll("button").forEach((a) => {
						a.addEventListener("mouseenter", onMouseEnter);
						a.addEventListener("mouseleave", onMouseLeave);
					});
				});
			}
		},
		[onMouseEnter, onMouseLeave],
	);
	const onClickCallback = useCallback(
		(e: MouseEvent) => {
			delay(200).then(() => {
				const leaveWithoutSaving = document.getElementById(
					"leave-without-saving",
				);
				if (leaveWithoutSaving) {
					leaveWithoutSaving.querySelectorAll("button").forEach((a) => {
						a.addEventListener("mouseenter", onMouseEnter);
						a.addEventListener("mouseleave", onMouseLeave);
					});
				}
			});
		},
		[onMouseEnter, onMouseLeave],
	);
	const resetAllEvents = useCallback(() => {
		if (lastLinks.current) {
			lastLinks.current.forEach((a) => {
				a.removeEventListener("mouseenter", onMouseEnter);
				a.removeEventListener("mouseleave", onMouseLeave);
				a.removeEventListener("click", onClickCallback);
			});
		}
		if (lastButtons.current) {
			lastButtons.current.forEach((a) => {
				a.removeEventListener("mouseenter", onMouseEnter);
				a.removeEventListener("mouseleave", onMouseLeave);
			});
		}
		if (lastPopupButtons.current) {
			lastPopupButtons.current.forEach((a) => {
				a.removeEventListener("click", popupButtonClickCallback);
			});
		}
		if (lastCheckBoxes.current) {
			lastCheckBoxes.current.forEach((a) => {
				a.removeEventListener("mouseenter", onMouseEnter);
				a.removeEventListener("mouseleave", onMouseLeave);
			});
		}
		lastLinks.current = null;
		lastButtons.current = null;
		lastPopupButtons.current = null;
		lastCheckBoxes.current = null;
	}, [onMouseEnter, onMouseLeave, popupButtonClickCallback, onClickCallback]);
	const buttonAttach = useCallback(() => {
		const links = document.querySelectorAll("a");

		links.forEach((a) => {
			a.addEventListener("mouseenter", onMouseEnter);
			a.addEventListener("mouseleave", onMouseLeave);
			a.addEventListener("click", onClickCallback);
		});
		lastLinks.current = links as unknown as NodeListOf<HTMLAnchorElement>;
		const buttons = document.querySelectorAll("button");
		buttons.forEach((a) => {
			a.addEventListener("mouseenter", onMouseEnter);
			a.addEventListener("mouseleave", onMouseLeave);
		});
		lastButtons.current = buttons as unknown as NodeListOf<HTMLButtonElement>;
		const popupButtons = document.querySelectorAll("button.popup-button");
		popupButtons.forEach((a) => {
			a.addEventListener("click", popupButtonClickCallback);
		});
		lastPopupButtons.current =
			popupButtons as unknown as NodeListOf<HTMLButtonElement>;
		const checkBoxes = document.querySelectorAll('input[type="checkbox"]');
		checkBoxes.forEach((a) => {
			a.addEventListener("mouseenter", onMouseEnter);
			a.addEventListener("mouseleave", onMouseLeave);
		});
		lastCheckBoxes.current =
			checkBoxes as unknown as NodeListOf<HTMLInputElement>;
	}, [onMouseEnter, onMouseLeave, popupButtonClickCallback, onClickCallback]);

	useEffect(() => {
		delay(200).then(() => {
			resetAllEvents();
			buttonAttach();
		});
	}, []);
	useEffect(() => {
		if (
			lastPathname.current === pathname &&
			lastSearchParams.current === searchParams
		)
			return;
		setCursorState(null);
		delay(200).then(() => {
			resetAllEvents();
			buttonAttach();
		});

		lastPathname.current = pathname;
		lastSearchParams.current = searchParams;
	}, [pathname, searchParams]);

	const handleMouseOver = useCallback(
		(c: MouseEvent | TouchEvent) => {
			let d = 0;
			let h = 0;
			if ("changedTouches" in c) {
				let p;
				let m;
				((d =
					(p = c.changedTouches[0]) === null || void 0 === p ? 0 : p.clientX),
					(h =
						(m = c.changedTouches[0]) === null || void 0 === m
							? 0
							: m.clientY));
			} else ((d = c.clientX), (h = c.clientY));
			setCoord({
				x: d,
				y: h,
			});
		},
		[setCoord],
	);
	useEffect(() => {
		return (
			document.removeEventListener("pointerdown", handleMouseOver),
				document.removeEventListener("pointermove", handleMouseOver),
				document.removeEventListener("mousemove", handleMouseOver),
				document.addEventListener("mousemove", handleMouseOver),
				document.addEventListener("pointerdown", handleMouseOver),
				document.addEventListener("pointermove", handleMouseOver),
				() => {
					(document.removeEventListener("pointerdown", handleMouseOver),
						document.removeEventListener("pointermove", handleMouseOver),
						document.removeEventListener("mousemove", handleMouseOver));
				}
		);
	}, []);
	const smoothCoordinates = useRef({x: 0, y: 0});
	const mouseCoordinates = useRef({
		x: 0,
		y: 0,
	});
	const Unsub: RefObject<null | (() => void)> = useRef(null);

	const raf = (l: boolean) => {
		(l
			? (smoothCoordinates.current = {
				x: mouseCoordinates.current.x,
				y: mouseCoordinates.current.y,
			})
			: (smoothCoordinates.current = {
				x: lerp(smoothCoordinates.current.x, mouseCoordinates.current.x, 1),
				y: lerp(smoothCoordinates.current.y, mouseCoordinates.current.y, 1),
			}),
		cursr.current &&
		gsap.set(cursr.current, {
			x:
				smoothCoordinates.current.x -
				0.5 * (cursr.current as HTMLSpanElement).offsetWidth,
			y:
				smoothCoordinates.current.y -
				0.5 * (cursr.current as HTMLSpanElement).offsetWidth,
		}));
	};
	const lastTextCursor = useRef(isTextCursor);
	useGSAP(
		() => {
			const isFocus = cursorState === "FOCUS";
			const isTC = typeof cursorState === "string" && !isFocus;

			const outerRad = isFocus ? P.MEDIUM : P.SMALL;
			const innerRad = isFocus ? 1 : outerRad;
			gsap.killTweensOf([oCircle.current, iCircle.current, domEl.current]);
			setIsTextCursor(isTC);
			if (!isTC) {
				lastTextCursor.current &&
				(gsap.set([oCircle.current, iCircle.current], {
					autoAlpha: 0,
					attr: {
						r: 0,
					},
				}),
					gsap.to(domEl.current, {
						width: 1,
						height: 1,
						autoAlpha: 0,

						delay: 0.1,
						duration: 0.3,
						ease: "Power3.easeOut",
					}),
					gsap.to([oCircle.current, iCircle.current], {
						autoAlpha: 1,
						duration: 0.12,
						ease: "Power3.easeOut",
						delay: 0.1,
					}));
				(gsap.to(oCircle.current, {
					attr: {
						r: outerRad,
					},
					ease: "Power3.easeOut",
					duration: 0.3,
					delay: lastTextCursor.current ? 0.12 : 0,
				}),
					gsap.to(iCircle.current, {
						attr: {
							r: innerRad,
						},
						ease: "Power3.easeOut",
						duration: 0.3,
						delay: lastTextCursor.current ? 0.12 : 0,
					}));
			} else {
				if (lastTextCursor.current) {
				} else {
					gsap.set(domEl.current, {
						width: outerRad,
						height: outerRad,
					});
					gsap.set(domEl.current, {
						autoAlpha: 1,
						delay: 0.1,
					});
					gsap.set([oCircle.current, iCircle.current], {
						autoAlpha: 0,
						delay: 0.12,
					});
					gsap.to(domEl.current, {
						duration: 0.3,
						width: Math.max(8.5 * cursorState.length, 100),
						height: 40,
						delay: 0.14,
						ease: "Power3.easeOut",
					});
				}
			}
			lastTextCursor.current = isTC;
		},
		{dependencies: [cursorState]},
	);

	const baseTheme = useCursorStore((l) => l.baseCursorTheme);
	const setBaseCursorTheme = useCursorStore((l) => l.setBaseCursorTheme);
	const resetCursorTheme = useCursorStore((l) => l.resetCursorTheme);

	useEffect(() => {
		theme && (setBaseCursorTheme(theme), resetCursorTheme());
	}, [theme]);

	useEffect(() => {
		return (
			rafRem("cursor"),
			isMobile ||
			rafAdd({
				key: "cursor",
				callback: raf,
			}),
				() => {
					rafRem("cursor");
				}
		);
	}, [isMobile]);
	useEffect(() => {
		Unsub.current && Unsub.current();
		Unsub.current = api.subscribe(
			(state) => state.mouseCoordinates,
			(l) => {
				((mouseCoordinates.current.x = l.x),
					(mouseCoordinates.current.y = l.y));
				l.x === 0 || l.y === 0 || showCursor || (raf(!0), setShowCursor(!0));
			},
			{
				fireImmediately: true,
			},
		);
		return () => {
			Unsub.current && Unsub.current();
		};
	}, [showCursor]);

	return (
		<span className={cn("cursor rp__cursor", {
			text__cursor: isTextCursor,
			show_cursor: showCursor,
		})} style={{backgroundColor: "transparent"}} data-theme={cursorTheme}
		      data-state={cursorState || "null"} ref={cursr} aria-hidden={!0}>
      <span ref={domEl} className={cn(
	      "cursor__text-container transition-[background-color] duration-100",
	      {
		      "bg-[oklch(var(--fg)/0.1)] backdrop-blur-[4px] perspective-[1200px] rounded-[10%]":
		      isTextCursor,
		      "bg-transparent! rounded-full": !isTextCursor,
	      },
      )} data-text={isTextCursor}>
        <AnimatePresence mode="wait" initial={false}>
          {isTextCursor && (
	          <m.span className="cursor__text-caption" key={cursorState} initial={{
		          opacity: 0,
		          visibility: lastTextCursor.current ? "hidden" : "visible",
		          y: lastTextCursor.current ? "20%" : 0,
	          }} animate={{
		          opacity: 1,
		          visibility: "visible",
		          y: lastTextCursor.current ? "-20%" : 0,
		          transition: {
			          type: "tween",
			          duration: 0.225,
			          ease: lastTextCursor.current
				          ? "easeIn"
				          : [0.55, 0.055, 0.675, 0.19],
			          delay: 0.1,
		          },
	          }} exit={{
		          opacity: 0,
		          visibility: "hidden",
		          y: lastTextCursor.current ? "-20%" : 0,
		          transition: {
			          type: "tween",
			          duration: 0.1,
			          ease: lastTextCursor.current
				          ? "easeOut"
				          : [0.55, 0.055, 0.675, 0.19],
		          },
	          }}>
		          <span>{cursorState}</span>
	          </m.span>
          )}
        </AnimatePresence>
      </span>

      <svg viewBox="0 0 100 100" style={{backgroundColor: "transparent"}} fill="transparent"
           className="cursor_svg cursor-none">
        <circle ref={oCircle}
                className="inline stroke-[oklch(var(--fg)/1)] data-focus:stroke-rouge-400!" cx={50}
                cy={50} r={0} strokeWidth={1} fill="transparent"
                {...(cursorState === "FOCUS" && {"data-focus": ""})} data-themed="stroke" />
        <circle ref={iCircle} className="inline fill-[oklch(var(--fg)/1)]"
                {...(cursorState === "FOCUS" && {"data-focus": ""})} cx={50} cy={50} r={0}
                strokeWidth={0} data-themed="fill" />
      </svg>
    </span>
	);
}
