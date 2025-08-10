"use client";

import {gsap} from "gsap";
import {
	Fragment,
	RefObject,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	useCursorAPI,
	useCursorStore,
	useDeviceInfo,
	useRaf,
	useRPStore,
} from "@/providers/RP_Pro";
import {lerp} from "@/utilities/Helpers";
import {cn} from "@/lib/utils";
import {useTheme} from "@/providers/Theme";

import {useGSAP} from "@gsap/react";
import * as m from "motion/react-m";
import {AnimatePresence} from "motion/react";
import {useIsMobile} from "@/providers/MiddleMan";
import {clamp} from "@/utilities/mathUtilities";
import {Dots} from "fonts";

const validCursors = ["HOVER", "DRAG", "CLICK TO TURN", "CLOSE", "LOCKED"];

const cursorTheme = "dark";

// Initialize cursor
export default function RP_Cursor() {
	const {isMobile} = useIsMobile();
	const textWidth = useRef(12);
	const cursorSizes = useMemo(
		() => ({
			LARGE: 48,
			MEDIUM: 17,
			SMALL: 6,
		}),
		[],
	);
	const isTouchDevice = useDeviceInfo((r) => r.isTouchDevice);
	const [isTextCursor, setIsTextCursor] = useState(!1);
	const marquee = useCursorStore((l) => l.marquee);
	const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");

	const setCoord = useCursorStore((l) => l.setMouseCoordinates);
	const {subscribe} = useCursorAPI();
	const cursorState = useCursorStore((l) => l.cursorState);
	const oCircle = useRef(null);
	const iCircle = useRef(null);
	const cursr = useRef<HTMLSpanElement>(null!);
	const domEl = useRef<HTMLSpanElement>(null!);
	const [mqArr, setMqArr] = useState(
		Math.ceil(120 / ((cursorState?.length || 12) + 1)),
	);
	const pageIsTransitioning = useRPStore((l) => l.pageIsTransitioning);
	const rafAdd = useRaf((r) => r.addToRaf);
	const rafRem = useRaf((r) => r.removeFromRaf);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	const xTo = useRef<Function>(null!);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	const yTo = useRef<Function>(null!);
	const cursorTheme = useCursorStore((l) => l.cursorTheme);

	const theme = useTheme((r) => r.theme);
	const navIsOpen = useRPStore((l) => l.navIsOpen);
	const handleMouseOver = (c: MouseEvent | TouchEvent) => {
		const x =
			"changedTouches" in c ? c.changedTouches[0]?.clientX || 0 : c.clientX;
		const y =
			"changedTouches" in c ? c.changedTouches[0]?.clientY || 0 : c.clientY;
		setCoord({x, y});
	};

	const [isEnabled, setIsEnabled] = useState(!(isTouchDevice && isMobile));
	useEffect(() => {
		setIsEnabled(!(isTouchDevice && isMobile));
	}, [isTouchDevice, isMobile]);
	useEffect(() => {
		return (
			document.removeEventListener("pointerdown", handleMouseOver),
				document.removeEventListener("pointermove", handleMouseOver),
				document.removeEventListener("mousemove", handleMouseOver),
				document.addEventListener("pointerdown", handleMouseOver),
				document.addEventListener("pointermove", handleMouseOver),
				document.addEventListener("mousemove", handleMouseOver),
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
		smoothCoordinates.current = l
			? {
				x: mouseCoordinates.current.x,
				y: mouseCoordinates.current.y,
			}
			: {
				x: lerp(smoothCoordinates.current.x, mouseCoordinates.current.x, 1),
				y: lerp(smoothCoordinates.current.y, mouseCoordinates.current.y, 1),
			};
		cursr.current &&
		gsap.set(cursr.current, {
			x: smoothCoordinates.current.x - 0.5 * cursr.current.offsetWidth,
			y: smoothCoordinates.current.y - 0.5 * cursr.current.offsetWidth,
		});
	};
	const lastTextCursor = useRef(isTextCursor);

	useGSAP(
		() => {
			const isFocus = cursorState === "FOCUS";
			const isTC = !!cursorState && !isFocus;

			const outerRad = isFocus ? cursorSizes.MEDIUM : cursorSizes.SMALL;
			const innerRad = isFocus ? 1 : outerRad;

			setIsTextCursor(isTC);
			if (!isTC) {
				gsap.killTweensOf([oCircle.current, iCircle.current, domEl.current]);
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
					autoAlpha: 1,
					ease: "Power3.easeOut",
					duration: 0.3,
					delay: lastTextCursor.current ? 0.12 : 0,
				}),
					gsap.to(iCircle.current, {
						attr: {
							r: innerRad,
						},
						autoAlpha: 1,
						ease: "Power3.easeOut",
						duration: 0.3,
						delay: lastTextCursor.current ? 0.12 : 0,
					}));
			} else {
				gsap.set(domEl.current, {
					autoAlpha: 1,
					delay: 0.1,
				});
				const width =
					textWidth.current * cursorState.length +
					0.25 * textWidth.current * (cursorState.length - 1) +
					2 * textWidth.current;
				if (!lastTextCursor.current) {
					gsap.set(domEl.current, {
						width: outerRad,
						height: outerRad,
					});

					gsap.set([oCircle.current, iCircle.current], {
						autoAlpha: 0,
						delay: 0.12,
					});
					gsap.to(domEl.current, {
						duration: 0.3,

						height: 40,
						delay: 0.14,
						ease: "Power3.easeOut",
					});
				}
				gsap.to(domEl.current, {
					width: clamp(85, width, 120),
					delay: 0.14,
					duration: 0.3,
					ease: "Power3.easeOut",
				});
			}
			lastTextCursor.current = isTC;
		},
		{dependencies: [cursorState], scope: cursr},
	);
	const baseTheme = useCursorStore((l) => l.baseCursorTheme);
	const setBaseCursorTheme = useCursorStore((l) => l.setBaseCursorTheme);
	const resetCursorTheme = useCursorStore((l) => l.resetCursorTheme);

	useEffect(() => {
		theme && (setBaseCursorTheme(theme), !navIsOpen && resetCursorTheme());
	}, [
		navIsOpen,
		resetCursorTheme,
		setBaseCursorTheme,
		theme,
		pageIsTransitioning,
	]);

	useEffect(() => {
		return (
			rafRem("cursor"),
			isEnabled &&
			rafAdd({
				key: "cursor",
				callback: raf,
			}),
				() => {
					rafRem("cursor");
				}
		);
	}, [isEnabled]);
	useEffect(() => {
		Unsub.current && Unsub.current();
		Unsub.current = subscribe(
			(state) => state.mouseCoordinates,
			(l) => {
				((mouseCoordinates.current.x = l.x),
					(mouseCoordinates.current.y = l.y));
				l.x === 0 || l.y === 0 || isEnabled || (setIsEnabled(!0), raf(!0));
			},
			{
				fireImmediately: true,
			},
		);
		return () => {
			Unsub.current && Unsub.current();
		};
	}, [isEnabled, subscribe]);
	const [textMarq, setTextMarq] = useState(false);
	useEffect(() => {
		setTextMarq(Boolean(cursorState) && isTextCursor && marquee);
		setDirection((r) => (r === "ltr" ? "rtl" : "ltr"));
	}, [marquee, cursorState, isTextCursor]);
	return (
		<span className={cn("cursor rp__cursor", {
			text__cursor: isTextCursor,
			"show_cursor cursor-none": isEnabled,
		})} style={{
			cursor: "none",
		}} data-theme={cursorTheme} data-state={cursorState || "null"} ref={cursr} aria-hidden={!0}>
      <span ref={domEl} className={cn(
	      "cursor__text-container cursor-none transition-[background-color] duration-100",
	      {
		      "rounded-[8px] bg-[oklch(var(--n-s-btn)/0.1)] backdrop-blur-[4px] perspective-[1200px]":
		      isTextCursor,
		      "rounded-full bg-transparent": !isTextCursor,
	      },
      )} data-text={isTextCursor}>
        <AnimatePresence mode="wait" initial={false}>
          {isTextCursor &&
	          (textMarq ? (
		          <m.span data-themed="color, background-color" className={cn(
			          "cursor__text-caption cursor-none text-[1.2rem] font-bold text-[oklch(var(--n-s-fg)/1)]",
			          Dots.className,
		          )} key={cursorState} data-theme={cursorTheme} initial={{opacity: 0}} animate={{
			          opacity: 1,
			          transition: {
				          type: "tween",
				          duration: 0.225,
				          ease: [0.55, 0.055, 0.675, 0.19],
				          delay: 0.15,
			          },
		          }} exit={{
			          opacity: 0,
			          transition: {
				          type: "tween",
				          duration: 0.25,
				          ease: [0.55, 0.055, 0.675, 0.19],
			          },
		          }} style={{
			          overflow: "hidden",
			          width: "100%",
			          height: "100%",
		          }}>
			          <m.span className={cn(
				          "absolute flex h-full items-center justify-start text-nowrap whitespace-nowrap will-change-transform",
				          Dots.className,
				          direction === "ltr"
					          ? "marquee-horizontal-ltr"
					          : "marquee-horizontal-rtl",
			          )}>
				          {[...Array(mqArr)].map((_, idex) => (
					          <m.span initial={{
						          opacity: 0,
					          }} animate={{
						          opacity: 1,
						          transition: {
							          type: "tween",
							          duration: 0.225,
							          ease: [0.55, 0.055, 0.675, 0.19],
							          delay: 0.15,
						          },
					          }} exit={{
						          opacity: 0,
						          transition: {
							          type: "tween",
							          duration: 0.25,
						          },
					          }} key={
						          (cursorState ?? "") +
						          ((Math.random() * 133) % (idex + 1))
					          } className={cn(
						          "mr-[12px] inline-block flex-[0_0_auto] text-[1.2rem] font-bold uppercase",
						          Dots.className,
					          )}>
						          {cursorState}
					          </m.span>
				          ))}
			          </m.span>
		          </m.span>
	          ) : (
		          <m.span data-themed="color, background-color"
		                  className="cursor__text-caption font-dots cursor-none text-[1.2rem] font-bold text-[oklch(var(--n-s-fg)/1)] mix-blend-exclusion"
		                  key={cursorState} data-theme={cursorTheme} initial={{opacity: 0}}
		                  animate={{
			                  opacity: 1,
			                  transition: {
				                  type: "tween",
				                  duration: 0.225,
				                  ease: [0.55, 0.055, 0.675, 0.19],
				                  delay: 0.15,
			                  },
		                  }} exit={{
			          opacity: 0,
			          transition: {
				          type: "tween",
				          duration: 0.25,
				          ease: [0.55, 0.055, 0.675, 0.19],
			          },
		          }}>
			          {cursorState && <Fragment>{cursorState}</Fragment>}
		          </m.span>
	          ))}
        </AnimatePresence>
      </span>

      <svg viewBox="0 0 100 100" style={{backgroundColor: "transparent"}}
           className="cursor_svg z-[999] cursor-none">
        <circle ref={oCircle}
                className="data-focus:stroke-rouge-400! inline stroke-[oklch(var(--n-s-btn)/1)]"
                cx={50} cy={50} r={0} strokeWidth={1} fill="transparent"
                {...(cursorState === "FOCUS" && {"data-focus": ""})} data-themed="stroke" />
        <circle ref={iCircle} className="inline fill-[oklch(var(--n-s-btn)/1)]"
                {...(cursorState === "FOCUS" && {"data-focus": ""})} cx={50} cy={50} r={0}
                strokeWidth={0} data-themed="fill" />
      </svg>
    </span>
	);
}
