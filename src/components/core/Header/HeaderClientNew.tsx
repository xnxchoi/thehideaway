"use client";
import { CheckInButton } from "@/components/core/Header/CheckInButton";
import { SearchBar } from "@/components/UX/CommandKey/SearchBar";
import { DarkmodeButton } from "@/components/UX/DarkMode/Darkmode";
import { UserDropdown } from "@/components/UX/Dropdown/RPDropDown";
import { Link } from "@/components/core/Link/Link";
import { Logo, Mogo } from "@/components/UX/Logo";
import { MenuButton } from "@/components/UX/Menu/MenuButton";
import { NotificationButton } from "@/components/UX/NotificationButton/notificationButton";
import { EASING, SPRING_EASE } from "@/constants/animations";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import {
  useCursor,
  useDeviceInfo,
  useMenu,
  useRPStore
} from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { delay, rp_lerp } from "@/utilities/rp_utils";
import { useWindowResize } from "@/utilities/use_window_resize";
import { SignedIn, SignedOut } from "@betterauth-ui";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import { animate } from "motion";
import {
  AnimatePresence,
  HTMLMotionProps,
  MotionValue,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform
} from "motion/react";
import * as m from "motion/react-m";
import { useTransitionState } from "next-transition-router";
import React, {
  type ComponentRef,
  CSSProperties,
  MouseEventHandler,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useShallow } from "zustand/shallow";
import { NotificationProvider } from "../../../providers/Notifications";

type VerticalDirection = "up" | "down";
type TransitionType =
  | "animate-to-full"
  | "transition-wipe"
  | "animate-to-previous";
export const HeaderClient = ({ children }: { children: ReactNode }) => {
  const main = useRef<HTMLElement>(null!);
  const showHeader = useRPStore(useShallow((store) => store.showHeader));
  const setHeaderVisibility = useRPStore((store) => store.setHeaderVisibility);
  const transitionOutType = useRPStore(
    useShallow((store) => store.transitionOutType)
  );
  const { scrollYProgress } = useScroll({ offset: ["50px", "400px"] });
  const isPreloader = useRPStore(useShallow((store) => store.isPreloader));
  const theme = useTheme(useShallow((r) => r.theme));
  const [the, setTheme] = useState(theme);
  const themeValue = useMotionValue(theme);
  useEffect(() => {
    themeValue.set(theme);
  }, [theme, themeValue]);
  const transitioning = useMotionValue(false);
  const scrubPosition = useTransform(() =>
    transitioning.get() ? 0 : scrollYProgress.get()
  );
  const to = useRef<ReturnType<typeof setTimeout>>(null!);
  const [visible, setVisible] = useState(true);
  const visibleness = useMotionValue(visible);
  useEffect(() => {
    visibleness.set(visible);
  }, [visible, visibleness]);

  const isMobile = useDeviceInfo(useShallow((r) => r.isMobile));
  const mobileState = useMotionValue(isMobile);
  useEffect(() => {
    mobileState.set(isMobile);
  }, [mobileState, isMobile]);
  // const notificationRef = useRef<ComponentRef<"button">>(null!);
  const frameLeft = useMenu(useShallow((r) => r.left));
  const frameRight = useMenu(useShallow((r) => r.right));
  const frameLeftValue = useMotionValue(frameLeft);
  useEffect(() => {
    frameLeftValue.set(frameLeft);
  }, [frameLeft, frameLeftValue]);
  const frameRightValue = useMotionValue(frameRight);
  useEffect(() => {
    frameRightValue.set(frameRight);
  }, [frameRight, frameRightValue]);

  const frameTop = useMenu(useShallow((l) => l.top));
  const frameTopValue = useMotionValue(frameTop);
  useEffect(() => {
    frameTopValue.set(frameTop);
  }, [frameTop, frameTopValue]);
  const mainT = useTransform(() => frameTopValue.get() * 0.5);
  const mainTop = useSpring(mainT, {
    visualDuration: 0.2,
    ...SPRING_EASE.power4.out
  });
  const gutter = useTransform(() => (mobileState.get() ? 16 : (20 as number)));

  const bottom = useMenu(useShallow((r) => r.bottom));
  const blurRef = useRef<HTMLDivElement>(null!);
  const colorRef = useRef<HTMLDivElement>(null!);
  // const fxRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<ComponentRef<"button">>(null!);
  const darkModeRef = useRef<ComponentRef<"button">>(null!);
  // const fx2Ref = useRef<HTMLDivElement>(null!);
  // const fx3Ref = useRef<HTMLDivElement>(null!);
  // const fx4Ref = useRef<HTMLDivElement>(null!);

  const { headerTheme } = useHeaderTheme();
  const fxVisibility = useRPStore(useShallow((l) => l.showFXFrame));

  // const inner = useRef<HTMLDivElement>(null!)
  // ,
  // l = useRef<HTMLDivElement>(null!),
  // r = useRef<HTMLDivElement>(null!),
  // c = useRef<HTMLDivElement>(null!)
  // ;
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] =
    useState<VerticalDirection>("up");
  const navIsOpen = useRPStore(useShallow((store) => store.navIsOpen));
  const navState = useMotionValue(navIsOpen);
  useEffect(() => {
    navState.set(navIsOpen);
  }, [navIsOpen, navState]);
  const lenis = useLenis();
  useLenis((lenis) => {
    setIsScrolling(!!lenis.isScrolling);
    setScrollDirection(lenis.direction > -1 ? "up" : "down");
  });
  const commandRef = useRef<ComponentRef<"button">>(null!);
  const user = useRPSession(useShallow((r) => r.id));

  const headerTransition = useRPStore(useShallow((l) => l.headerTransition));
  const transitionVariant = useMotionValue(headerTransition);
  useEffect(() => {
    transitionVariant.set(headerTransition);
  }, [headerTransition, transitionVariant]);

  const setHeaderTransition = useRPStore((l) => l.setHeaderTransition);
  const isTransitioningWipe = useRPStore(
    useShallow((l) => l.isTransitioningWipe)
  );
  const isWipe = useMotionValue(isTransitioningWipe);
  useEffect(() => {
    isWipe.set(isTransitioningWipe);
  }, [isTransitioningWipe, isWipe]);
  const _themeColour = useTransform(() => {
    const currentTheme = themeValue.get(),
      currentNav = navState.get();
    return currentTheme === "dark"
      ? currentNav
        ? 10.17
        : 97.5
      : currentNav
        ? 97.5
        : 10.17;
  });
  const themeColour = useMotionTemplate`oklch(${_themeColour}% 0.001 218.99)`;
  const tweenNumber = useRef(0);
  const lerpedTween = useRef(0);
  const getTweenPercentBasedOnScroll = useCallback(
    (l: number) => gsap.utils.clamp(0, 1, l / 350),
    []
  );
  const animateOnScroll = useCallback(
    (l: number) => {
      const c = getTweenPercentBasedOnScroll(l);
      ((lerpedTween.current = c),
        headerTimeline.current && headerTimeline.current.progress(c));
    },
    [getTweenPercentBasedOnScroll]
  );
  useEffect(() => {
    setTheme((headerTheme && headerTheme) || theme);
  }, [headerTheme, theme]);
  const headerTimeline = useRef<GSAPTimeline>(null!);
  const _sectionTranslate = useTransform(() => {
    const isVisibility = visibleness.get(),
      tv = transitionVariant.get();
    return tv !== "slide" || isVisibility ? 0 : (100 as number);
  });
  const sectionTranslate = useSpring(_sectionTranslate, {
    visualDuration: 0.4,
    ...SPRING_EASE.power4.inOut
  });
  const innerTranslate = useMotionValue(0);
  const innerOpacity = useMotionValue(1);
  const innerVisibility = useTransform<
    number,
    NonNullable<CSSProperties["visibility"]>
  >(innerOpacity, [0, 0.2], ["hidden", "visible"]);

  useMotionValueEvent(transitionVariant, "change", (latestValue) => {
    const iss = latestValue === "slide";
    const vis = visibleness.get();
    const ty = iss ? (vis ? 0 : -100) : 0;
    animate(innerTranslate, ty, {
      delay: iss ? 0.4 : 0,
      duration: iss ? 0.4 : 0.1,
      ease: EASING.power4.inOut
    });
  });
  const sectionY = useMotionTemplate`-${sectionTranslate}%`;
  const sectionLX = useMotionTemplate`-${sectionTranslate}%`,
    sectionRX = useMotionTemplate`${sectionTranslate}%`;
  const innerY = useMotionTemplate`${innerTranslate}%`;
  // useGSAP(
  // 	() => {
  // 		if (headerTransition) {
  // gsap.killTweensOf([inner.current, l.current, c.current, r.current]);
  // gsap.killTweensOf([l.current, c.current, r.current]);
  // gsap.to([l.current, c.current, r.current], {
  // 	autoAlpha: visible ? 1 : 0,
  // 	duration: 0.4,
  // 	ease: "power4.inOut"
  // });
  // switch (headerTransition) {
  // 	case "slide":
  // (
  // 	gsap.to(inner.current, {
  // 	duration: 0.4,
  // 	ease: "power4.inOut",
  // 	y: visible ? 0 : "-100%",
  // 	delay: 0.4
  // }),
  // 	(gsap.to(l.current, {
  // 		duration: 0.4,
  // 		ease: "power4.inOut",
  // 		x: visible ? 0 : "-100%",
  // 		y: visible ? 0 : "-100%"
  // 	}),
  // 		gsap.to(c.current, {
  // 			duration: 0.4,
  // 			ease: "power4.inOut",
  // 			y: visible ? 0 : "-100%"
  // 		}),
  // 		gsap.to(r.current, {
  // 			duration: 0.4,
  // 			ease: "power4.inOut",
  // 			x: visible ? 0 : "100%",
  // 			y: visible ? 0 : "-100%"
  // 		})));
  // 			break;
  // 	}
  // } else {
  // gsap.killTweensOf([inner.current, l.current, c.current, r.current]);
  // gsap.killTweensOf([l.current, c.current, r.current]);
  // gsap.to([l.current, c.current, r.current], {
  // 	autoAlpha: 1,
  // 	x: 0,
  // 	y: 0,
  // 	duration: 0.4,
  // 	ease: "power4.inOut"
  // });
  // }
  // gsap.to(inner.current, {
  // 	autoAlpha: showHeader || visible ? 1 : 0,
  // 	duration: 0.4,
  // 	ease: "power4.inOut"
  // });
  // },
  // {scope: main, dependencies: [headerTransition, visible]}
  // );
  const { stage } = useTransitionState();
  const clearPageTheme = useTheme((l) => l.clearPageTheme);
  const initiatedScroll = useRef(false);
  const reset = useVoyageur((l) => l.reset);
  const resetCursorTheme = useCursor((l) => l.resetCursorTheme);
  const setCursorState = useCursor((l) => l.setCursorState);
  useEffect(() => {
    setVisible(showHeader && fxVisibility);
  }, [fxVisibility, showHeader]);
  const headerTransitionDisabled = useRef(false);
  const lastResize = useWindowResize({ debounce: 100 });
  // useGSAP(
  //   () => {
  //     gsap.to(inner.current, {
  //       autoAlpha: showHeader || visible ? 1 : 0,
  //       duration: 0.4,
  //       ease: "power4.inOut",
  //     })
  //   },
  //   { scope: main, dependencies: [visible, showHeader] },
  // )

  useEffect(() => {
    if (stage === "leaving") {
      delay(50).then(() => {
        clearPageTheme();

        reset();
        resetCursorTheme();
        setCursorState(null);
        to.current && clearTimeout(to.current);
        to.current = null!;
        setHeaderTransition(null);
        setHeaderVisibility(true);
      });
    }
  }, [
    clearPageTheme,
    reset,
    resetCursorTheme,
    setCursorState,
    setHeaderTransition,
    setHeaderVisibility,
    stage
  ]);
  const progressRate = useRef(0);
  const initiateAnimationTimeline = useRef<(() => void) | null>(null);
  // const btBackground = useRef(
  // 	navIsOpen ? "transparent" : "var(--button-background)"
  // );

  const themeOK = useTransform(() => {
    switch (themeValue.get()) {
      case "dark":
        return "5% 0 56.57";
      case "light":
        return "78.94% 0.008 176.48";
    }
  });
  const _scrollToBtbgop = useTransform(scrubPosition, [0, 1], [0, 0.25]);
  const btbgop = useTransform(() =>
    navState.get() ? _scrollToBtbgop.get() : 0
  );

  const btBackground = useMotionTemplate`oklch(${themeOK}/${btbgop})`;
  const logoSize = useTransform(scrubPosition, [0.1, 0.3], [28, 22]);
  const themeRef = useRef(theme);
  // const fxInnerTopOG = useRef(navIsOpen ? -frameTop : 0);
  const fxInnerTop = useTransform(() =>
    navState.get() ? -frameTopValue.get() : 0
  );
  const initialInnerLeft = useTransform(() =>
    navState.get() ? -frameLeftValue.get() : 0
  );
  // const innerLeftOG = useRef(navIsOpen ? -frameLeft : 0);
  // const innerRightOG = useRef(navIsOpen ? -frameRight : 0);
  const initialInnerRight = useTransform(() =>
    navState.get() ? -frameRightValue.get() : 0
  );
  const ssss = useTransform(scrubPosition, [0, 0.4], [0, 1]);
  const innerLeft = useTransform(() => {
    const progress = ssss.get();
    return (1 - progress) * initialInnerLeft.get();
  });
  const innerRight = useTransform(() => {
    const progress = scrubPosition.get();
    return (1 - progress) * initialInnerRight.get();
  });
  const innerPX = useTransform(() => {
    const progress = ssss.get();
    return 36 + progress * (gutter.get() - 36);
  });
  const innerPTop = useTransform(() => {
    const progress = ssss.get();
    return (1 - progress) * 24;
  });
  // const fxLeft = useRef(navIsOpen ? 0 : 10);
  // const fxRight = useRef(navIsOpen ? 0 : 10);
  // const fxTop = useRef(navIsOpen ? frameTop - 10 : 0);
  // const transitionDelay = useRef(navIsOpen ? 0 : 0.2);
  // const btBlurOG = useRef(navIsOpen ? "blur(0px)" : "blur(1.4rem)");
  const _btBlur = useTransform(() => {
    const navOpen = navState.get(),
      progress = scrubPosition.get();
    return navOpen ? 0 : progress * 14;
  });
  const btBlur = useMotionTemplate`blur(${_btBlur}px)`;
  // const condensedWidthOG = useRef(isMobile ? window.innerWidth - 2 * 16 : 645);
  // const mainYOG = useRef(isMobile ? 16 - 4 : 12);
  const mainY = useTransform(() => scrubPosition.get() * 12);
  const translate = useMotionTemplate`translate(-50%,${mainY}px)`;
  const windowWidthValue = useMotionValue(window.innerWidth);
  useEffect(() => {
    windowWidthValue.set(window.innerWidth);
  }, [lastResize, windowWidthValue]);
  const condensedWidth = useTransform(() =>
    mobileState.get() ? windowWidthValue.get() - 32 : 645
  );
  const mainPx = useTransform(
    () => 36 - scrubPosition.get() * (36 + gutter.get())
  );
  const mainWidth = useTransform(() => {
    const progress = scrubPosition.get(),
      ww = windowWidthValue.get();
    return ww + progress * (condensedWidth.get() - ww);
  });
  const mainZIndex = useTransform(scrubPosition, [0, 1], [249, 245]);
  const _bsSpread = useTransform(() => 0.5 * scrubPosition.get()),
    _bsBlur = useTransform(() => 1.2 * scrubPosition.get()),
    _bsOKOp = useTransform(() => 0.7 * scrubPosition.get());
  const mainBS = useMotionTemplate`0 0 ${_bsSpread}px ${_bsBlur}px oklch(36.76% 0.003 58.67/${_bsOKOp})`;
  const mainBoxShadow = useTransform(() => {
    const progress = scrubPosition.get();
    const dark = progress > 0.3 && themeValue.get() === "dark";
    return dark ? mainBS.get() : "none";
  });

  // useEffect(() => {

  // fxInnerTopOG.current = navIsOpen ? -frameTop : 0;
  // innerLeftOG.current = navIsOpen ? -frameLeft : 0;
  // innerRightOG.current = navIsOpen ? -frameRight : 0;
  // fxLeft.current = navIsOpen ? 0 : 10;
  // fxRight.current = navIsOpen ? 0 : 10;
  // fxTop.current = navIsOpen ? frameTop - 10 : frameTop;
  // transitionDelay.current = navIsOpen ? 0 : 0.2;
  // btBlurOG.current = navIsOpen ? "blur(0px)" : "blur(1.4rem)";

  // condensedWidthOG.current = isMobile ? window.innerWidth - 2 * 16 : 645;
  // mainYOG.current = isMobile ? 16 - 4 : 12;
  // }, [navIsOpen, frameTop, isMobile, frameLeft, frameRight]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  useGSAP(
    (context, contextSafe) => {
      if (!contextSafe) {
        return;
      }
      initiateAnimationTimeline.current = contextSafe(() => {
        if (
          (headerTimeline.current &&
            (headerTimeline.current.restart(), headerTimeline.current.kill()),
          !menuRef ||
            !darkModeRef.current ||
            !colorRef.current ||
            !blurRef.current)
        )
          return;
        headerTimeline.current = gsap.timeline({
          paused: !0
        });
        headerTimeline.current.fromTo(
          progressRate,
          {
            current: 0
          },
          {
            current: 1,
            duration: 0.6
          }
        );

        headerTimeline.current.fromTo(
          main.current,
          {
            // width: window.innerWidth,
            overflow: "visible"
            // translate: "-50%,0px",
            // boxShadow: "none",
            // zIndex: 249
          },
          {
            // width: condensedWidthOG.current,
            // translate: `-50%,${mainYOG.current + fxTop.current}px`,
            // zIndex: 245,
            overflow: "hidden",
            // boxShadow:
            // 	themeRef.current === "dark"
            // 		? "0 0 0.5px 1.2px oklch(from var(--muted-faded-bg) l c h/.7)"
            // 		: "none",
            duration: 1
          },
          0
        );
        // gsap.killTweensOf(c.current, "width");
        // headerTimeline.current.fromTo(
        // 	c.current,
        // 	{
        // 		width: 28
        // 	},
        // 	{
        // 		width: 22,
        // 		duration: 0.2
        // 	},
        // 	0.1
        // );
        // gsap.killTweensOf(inner.current, "padding,left,right,top");
        // headerTimeline.current.fromTo(
        // 	inner.current,
        // 	{
        // 		// paddingTop: 24,
        // 		// paddingRight: 36,
        // 		// paddingLeft: 36,
        // 		// paddingBottom: 0,
        // 		left: innerLeftOG.current,
        // 		right: innerRightOG.current
        // 	},
        // 	{
        // 		paddingTop: 0,
        // 		paddingRight: "var(--gutter)",
        // 		paddingLeft: "var(--gutter)",
        // 		paddingBottom: 0,
        // 		duration: 0.4,
        // 		left: 0,
        // 		right: 0
        // 	},
        // 	0
        // );
        // gsap.killTweensOf(
        // 	[fxRef.current, fx2Ref.current, fx3Ref.current, fx4Ref.current],
        // 	"top,bottom,backdropFilter"
        // );
        // gsap.killTweensOf([fxRef.current], "left,right,");
        // headerTimeline.current.fromTo(
        // 	fxRef.current,
        // 	{
        // 		left: fxLeft.current,
        // 		right: fxRight.current,
        // 		top: fxTop.current
        // 	},
        // 	{
        // 		top: 0,
        // 		left: 0,
        // 		right: 0,
        // 		bottom: 0,
        // 		duration: 0.4,
        // 		delay: transitionDelay.current
        // 	},
        // 	0
        // );
        // headerTimeline.current.fromTo(
        // 	[fx2Ref.current, fx3Ref.current, fx4Ref.current],
        // 	{
        // 		top: fxInnerTopOG.current,
        //
        // 		bottom: "auto"
        // 	},
        // 	{
        // 		top: 0,
        //
        // 		bottom: 0,
        // 		delay: transitionDelay.current,
        // 		duration: 0.4
        // 	},
        // 	0
        // );
        // headerTimeline.current.fromTo(
        // 	fx2Ref.current,
        // 	{
        // 		backdropFilter:
        // 			"brightness(100%) blur(5px) contrast(500%) saturate(1500%)"
        // 	},
        // 	{
        // 		backdropFilter:
        // 		// theme === "dark"
        // 		//   ? "brightness(70%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)"
        // 		//   : "brightness(200%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)",
        // 			"none",
        // 		duration: 0.6
        // 	},
        // 	0
        // );
        // headerTimeline.current.fromTo(
        // 	fx3Ref.current,
        // 	{
        // 		backdropFilter:
        // 			"hue-rotate(0deg) brightness(100%) blur(5px) contrast(500%) saturate(1500%)"
        // 	},
        // 	{
        // 		backdropFilter:
        // 		// theme === "dark"
        // 		//   ? "hue-rotate(10deg) brightness(70%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)"
        // 		//   : "hue-rotate(10deg) brightness(200%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)",
        // 			"none",
        // 		duration: 0.6
        // 	},
        // 	0
        // );
        // const y = [
        // 	menuRef.current,
        // 	darkModeRef.current,
        // 	notificationRef.current,
        // 	commandRef.current
        // ];
        // (gsap.killTweensOf(y, "backdropFilter"),
        // 	headerTimeline.current.fromTo(
        // 		y,
        // 		{
        // 			backdropFilter: btBlurOG.current
        // 		},
        // 		{
        // 			backdropFilter: "blur(0px)",
        // 			duration: 0.6
        // 		},
        // 		0
        // 	),
        // 	headerTimeline.current.fromTo(
        // 		[colorRef.current, blurRef.current],
        // 		{
        // 			opacity: 0
        // 		},
        // 		{
        // 			opacity: 1,
        // 			duration: 1
        // 		},
        // 		0
        // 	));
      });
    },
    { dependencies: [lastResize], scope: main }
  );
  useEffect(() => {
    initiateAnimationTimeline.current && initiateAnimationTimeline.current();
  }, [lastResize, lenis]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const setHeaderState = useCallback(
    (transitionType: TransitionType, callback?: () => void) => {
      if (transitionType === "transition-wipe") {
        // (gsap.killTweensOf(main.current, "autoAlpha"),
        // 	gsap.to(main.current, {
        // 		autoAlpha: 0,
        // 		duration: 0.3,
        // 		ease: "power3.inOut",
        // 		onComplete: () => {
        // 			gsap.killTweensOf(lerpedTween);
        // 			tweenNumber.current = 0;
        // 			headerTimeline.current && headerTimeline.current.progress(0);
        // 			lerpedTween.current = 0;
        // 			gsap.to(main.current, {
        // 				// autoAlpha: 1,
        // 				duration: 0.3,
        // 				delay: 0.6 * 1.4,
        // 				// translate: `-50%,${fxTop.current + mainYOG.current}px`,
        // 				ease: "power3.inOut",
        // 				onComplete: () => {
        // 					callback && callback();
        // 				}
        // 			});
        // 		}
        // 	}));
        return;
      }
      if (
        (gsap.killTweensOf(lerpedTween), "animate-to-full" === transitionType)
      )
        gsap.to(lerpedTween, {
          current: 0,
          duration: 0.8 * 1.2,
          ease: "power3.inOut",
          onUpdate: () => {
            headerTimeline.current &&
              headerTimeline.current.progress(lerpedTween.current);
          },
          onComplete: () => {
            callback && callback();
          }
        });
      // ,
      // gsap.to(main.current, {
      // 	duration: 0.4,
      // 	zIndex: 249,
      // 	// translate: `-50%,${fxTop.current + mainYOG.current}px`,
      //
      // 	delay: 0.2,
      // 	ease: "power4.inOut"
      // })
      else {
        callback && callback();
        const rafToPosition = () => {
          ((lerpedTween.current = rp_lerp(
            lerpedTween.current,
            getTweenPercentBasedOnScroll(tweenNumber.current),
            0.08
          )),
            headerTimeline.current &&
              headerTimeline.current.progress(lerpedTween.current));
        };

        (gsap.ticker.add(rafToPosition),
          setTimeout(() => {
            gsap.ticker.remove(rafToPosition);
          }, 1e3));
      }
    },
    [getTweenPercentBasedOnScroll]
  );
  const pageIsTransitioning = useRPStore(
    useShallow((r) => r.pageIsTransitioning)
  );

  const enableScrollAnimation = () => {
    headerTransitionDisabled.current = false;
    transitioning.set(false);
  };
  const haltScrollAnimation = () => {
    headerTransitionDisabled.current = true;
    transitioning.set(true);
  };
  useEffect(() => {
    !initiatedScroll.current &&
      lenis &&
      ((initiatedScroll.current = !0),
      lenis.on("scroll", (l) => {
        if (!headerTransitionDisabled.current && l.animatedScroll) {
          const c = l.animatedScroll;
          (c > 50 ? (tweenNumber.current = c - 50) : (tweenNumber.current = 0),
            animateOnScroll(tweenNumber.current));
        }
      }));
  }, [animateOnScroll, lenis]);
  useEffect(() => {
    (timeoutRef.current && clearTimeout(timeoutRef.current),
      (timeoutRef.current = setTimeout(() => {
        if (isTransitioningWipe) {
          (haltScrollAnimation(),
            setHeaderState("transition-wipe", () => {
              enableScrollAnimation();
            }));
          return;
        }
        if (navIsOpen) {
          (haltScrollAnimation(), setHeaderState("animate-to-full"));
          return;
        }
        if (typeof transitionOutType === "string") {
          ((lerpedTween.current = 0),
            haltScrollAnimation(),
            setHeaderState("animate-to-full"),
            setTimeout(() => {
              enableScrollAnimation();
            }, 720));
          return;
        }

        setHeaderState("animate-to-previous", () => {
          enableScrollAnimation();
        });
      }, 20)));
  }, [
    navIsOpen,
    isTransitioningWipe,
    transitionOutType,
    frameTop,
    setHeaderState,
    haltScrollAnimation,
    enableScrollAnimation
  ]);

  const onEnter: MouseEventHandler = useCallback((e) => {
    to.current && clearTimeout(to.current);
    to.current = null!;
    to.current = setTimeout(() => {
      setVisible(true);
    }, 200);
  }, []);
  const onLeave: MouseEventHandler = useCallback((e) => {
    to.current && clearTimeout(to.current);
    to.current = null!;
    to.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  }, []);

  return (
    <AnimatePresence>
      {!isPreloader && (
        <m.header
          key={"rp-header-client"}
          initial={{
            opacity: 0,
            visibility: "hidden"
          }}
          animate={{
            opacity: 1,
            visibility: "visible"
          }}
          exit={{
            opacity: 0,
            visibility: "hidden"
          }}
          data-theme={the}
          ref={main}
          id="rp-header"
          className={cn(
            "fixed z-[240] m-0 w-full overflow-hidden rounded-[100rem] p-0 shadow-none",
            {
              scrolling: isScrolling
            }
          )}
          data-scroll={scrollDirection}
          data-themed={"background-color,color.z-index"}
          style={{
            top: mainTop,
            zIndex: mainZIndex,
            width: mainWidth,
            transform: translate,
            left: "50%",
            boxShadow: mainBoxShadow
          }}
          {...((showHeader && {
            onMouseEnter: onEnter,
            onMouseLeave: onLeave
          }) ||
            {})}
        >
          {children}
          <AnimatePresence mode="sync" initial={false}>
            {
              // 	<m.div
              //     ref={fxRef}
              //     className={cn(
              // 		"pointer-events-none fixed top-0 right-[10px] bottom-0 left-[10px] z-10 mx-auto",
              // 	)}
              // >
              //     <div
              //         ref={fx2Ref}
              //         data-themed={"background-color"}
              //         className="mask-linear-from-[#000] mask-linear-to-[transparent] absolute top-[10px] bottom-auto z-[19] h-[80px] opacity-50 backdrop-blur-[5px] backdrop-contrast-500 backdrop-saturate-[1500%] bg-[#ffffff03]"
              //
              //     />
              //     <div
              //         ref={fx3Ref}
              //         data-themed={"background-color"}
              //         className="mask-linear-from-[#000] mask-linear-to-[transparent] absolute top-[10px] bottom-auto z-[19] h-[60px] opacity-75 hue-rotate-0 blur-[5px] contrast-[500%] saturate-[1500%] bg-[#ffffff03]"
              //
              //     />
              //     <div
              //         ref={fx4Ref}
              //         data-themed={"background-color"}
              //         className="mask-linear-from-[#000] mask-linear-to-[transparent] top-fx-bottom fixed top-0 bottom-auto inset-x-0 z-[10] hidden h-[50px] blur-[5px] contrast-[500%] saturate-[1500%] bg-[#ffffff03]"
              //
              //     />
              // </m.div>
              <FXs progressRate={ssss} fxVisibility={visible} />
            }
          </AnimatePresence>
          <m.div
            key={"color-fx"}
            style={{
              opacity: scrubPosition
            }}
            ref={colorRef}
            className={
              "absolute top-0 left-0 z-[1] h-full w-full bg-off-l-gray/35 opacity-[0.00001] dark:bg-faded-l-gray/35"
            }
          />
          {
            // "absolute top-0 left-0 w-full h-full z-[1] bg-[oklch(0.7894_0_0/0.70)] dark:bg-[oklch(0.7894_0_0/0.40)] opacity-[0.00001]"
          }
          <m.div
            key={"blur-fx"}
            ref={blurRef}
            style={{ opacity: scrubPosition }}
            className={
              "absolute top-0 left-0 z-[2] h-full w-full opacity-[0.00001] backdrop-blur-[20px]"
            }
          />
          {/* header-inner*/}
          <m.div
            style={{
              y: innerY,
              opacity: innerOpacity,
              visibility: innerVisibility,
              paddingLeft: innerPX,
              paddingRight: innerPX,
              paddingTop: innerPTop,
              left: innerLeft,
              right: innerRight,
              paddingBottom: 0
            }}
            className="relative z-20 flex h-[4.8rem] items-center justify-between px-[36px] pt-[24px] pb-0 max-md:h-[5.4rem]"
            // ref={inner}
          >
            <m.div
              id="l-side"
              className="z-20"
              // ref={l}
              style={{
                y: sectionY,
                x: sectionLX
              }}
            >
              <div className="flex">
                <MenuButton
                  ref={menuRef}
                  style={{
                    backgroundColor: btBackground,
                    backdropFilter: btBlur,
                    color: themeColour
                  }}
                />
              </div>
            </m.div>
            <m.div
              // ref={c}
              style={{
                y: sectionY,
                x: 0
              }}
              id="c-side"
            >
              <Link
                href="/home"
                aria-label={"Logo"}
                className="header-main__logo z-20"
                style={{
                  transform: "translate(-50%, 0%)"
                }}
              >
                <Mogo
                  style={{
                    width: logoSize,
                    height: logoSize,
                    color: themeColour
                  }}
                />
              </Link>
            </m.div>

            <m.div
              id="r-side"
              // ref={r}
              className={"z-20"}
              style={{
                y: sectionY,
                x: sectionRX
              }}
            >
              <AnimatePresence mode="popLayout" propagate={true}>
                <SignedIn key="signed-in">
                  <NotificationProvider user={user!}>
                    <NotificationButton
                      style={{
                        color: themeColour,
                        backgroundColor: btBackground,
                        backdropFilter: btBlur
                      }}
                    />
                  </NotificationProvider>
                  <UserDropdown
                    style={{
                      color: themeColour,
                      backgroundColor: btBackground,
                      backdropFilter: btBlur
                    }}
                  />
                </SignedIn>
                <SignedOut key="signed-out">
                  <CheckInButton />
                </SignedOut>
                <SearchBar
                  ref={commandRef}
                  style={{
                    color: themeColour,
                    backgroundColor: btBackground,
                    backdropFilter: btBlur
                  }}
                />
                <DarkmodeButton
                  ref={darkModeRef}
                  style={{
                    color: themeColour,
                    backgroundColor: btBackground,
                    backdropFilter: btBlur
                  }}
                />
              </AnimatePresence>
            </m.div>
          </m.div>
        </m.header>
      )}
    </AnimatePresence>
  );
};

const FXs = ({
  ref,
  className,
  progressRate,
  fxVisibility
}: {
  progressRate: MotionValue<number>;
  fxVisibility: boolean;
} & HTMLMotionProps<"div">) => {
  const bottom = useTransform(() => (progressRate.get() > 0.1 ? 0 : "auto"));
  const xValue = useTransform(() => progressRate.get() * 10);
  const top = useTransform(() => (10 * (progressRate.get() - 1)) ^ 2);
  const fx3Filter = useTransform(() => {
    const progress = progressRate.get();
    return `hue-rotate(0deg) brightness(100%) blur(${5 - 5 * progress}px) contrast(${500 - 400 * progress}%) saturate(${500 - 400 * progress}%)`;
  });
  const fx2Filter = useTransform(() => {
    const progress = progressRate.get();
    return `brightness(100%) blur(${5 - 5 * progress}px) contrast(${500 - 400 * progress}%) saturate(${1500 - 1400 * progress}%)`;
  });
  return (
    <m.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      exit={{
        opacity: 0
      }}
      transition={{
        duration: 0.2,
        ease: EASING.power2.out
      }}
      ref={ref}
      className={cn(
        "pointer-events-none fixed top-0 right-[10px] bottom-0 left-[10px] z-10 mx-auto",
        !fxVisibility && "opacity-0",
        className
      )}
      style={{
        left: xValue,
        top,
        right: xValue,
        bottom
      }}
    >
      <m.div
        data-themed={"background-color"}
        className="absolute top-[10px] bottom-auto z-[19] h-[80px] bg-[#ffffff03] mask-linear-from-[#000] mask-linear-to-[transparent] opacity-50 backdrop-blur-[5px] backdrop-contrast-500 backdrop-saturate-[1500%]"
      />
      <m.div
        data-themed={"background-color"}
        className="absolute top-[10px] bottom-auto z-[19] h-[60px] bg-[#ffffff03] mask-linear-from-[#000] mask-linear-to-[transparent] opacity-75 blur-[5px] contrast-[500%] hue-rotate-0 saturate-[1500%]"
        style={{
          filter: fx2Filter
        }}
      />
      <m.div
        data-themed={"background-color"}
        className="top-fx-bottom fixed inset-x-0 top-0 bottom-auto z-[10] hidden h-[50px] bg-[#ffffff03] mask-linear-from-[#000] mask-linear-to-[transparent] blur-[5px] contrast-[500%] saturate-[1500%]"
        style={{
          filter: fx3Filter
        }}
      />
    </m.div>
  );
};
