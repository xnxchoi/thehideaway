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
import { useIsMobile } from "@/providers/MiddleMan";
import { useCursor, useMenu, useRPStore } from "@/providers/RP_Pro";
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

  const { isMobile } = useIsMobile();
  const mobileState = useMotionValue(isMobile);
  useEffect(() => {
    mobileState.set(isMobile);
  }, [mobileState, isMobile]);
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

  const { headerTheme } = useHeaderTheme();
  const fxVisibility = useRPStore(useShallow((l) => l.showFXFrame));

  // const inner = useRef<HTMLDivElement>(null!)
  // ,
  // l = useRef<HTMLDivElement>(null!),
  // r = useRef<HTMLDivElement>(null!),
  // c = useRef<HTMLDivElement>(null!)
  // ;
  const [scrollDirection, setScrollDirection] =
    useState<VerticalDirection>("up");
  const navIsOpen = useRPStore(useShallow((store) => store.navIsOpen));
  const navState = useMotionValue(navIsOpen);
  useEffect(() => {
    navState.set(navIsOpen);
  }, [navIsOpen, navState]);
  const [isScrolling, setScrolling] = useState(false);
  useLenis(({ isScrolling, direction }) => {
    setScrolling(!!isScrolling);
    setScrollDirection(direction > -1 ? "up" : "down");
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
  const sectionY = useMotionTemplate`-${sectionTranslate}%`,
    sectionCY = useTransform(() => {
      const scft = sectionTranslate.get(),
        mb = mobileState.get(),
        scb = scrubPosition.get();
      const y = scft < 0 ? scft : mb ? -50 : -25 - scb * 25;
      return `translate(-50%,${y}%)`;
    });
  const sectionLX = useMotionTemplate`-${sectionTranslate}%`,
    sectionRX = useMotionTemplate`${sectionTranslate}%`;
  const innerY = useMotionTemplate`${innerTranslate}%`;
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

  const themeOK = useTransform(() => {
    const progress = scrubPosition.get();
    const darkValue = 78.94,
      lightValue = 66.06;
    const a = themeValue.get() === "dark" ? darkValue : lightValue;
    const b = a === darkValue ? lightValue : darkValue;
    return a * (1 - progress) + b * progress;
  });
  const _scrollToBtbgop = useTransform(scrubPosition, [0, 1], [0.25, 0.1]);
  const btbgop = useTransform(() =>
    navState.get() ? 0 : _scrollToBtbgop.get()
  );

  const btBackground = useMotionTemplate`oklch(${themeOK}% 0.008 176.48/${btbgop})`;
  const logoSize = useTransform(scrubPosition, [0.1, 0.3], [28, 22]);
  const fxInnerTop = useTransform(() =>
    navState.get() ? -frameTopValue.get() : 0
  );
  const initialInnerLeft = useTransform(() =>
    navState.get() ? -frameLeftValue.get() : 0
  );
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
    const pxOrigin = mobileState.get() ? 24 : 36;
    return pxOrigin + progress * (gutter.get() - pxOrigin);
  });
  const innerPTop = useTransform(
    () => (1 - ssss.get()) * (mobileState.get() ? 0 : 24)
  );
  const _btBlur = useTransform(() => {
    const navOpen = navState.get(),
      progress = scrubPosition.get();
    return navOpen ? 0 : 4 + progress * 10;
  });
  const btBlur = useMotionTemplate`blur(${_btBlur}px)`;

  const mainY = useTransform(() => {
    const mb = mobileState.get();
    const fc = mb ? 5 : 0;
    return fc + scrubPosition.get() * (12 - fc);
  });
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
    const kw = mobileState.get() ? ww - 32 : 645;
    return ww + progress * (kw - ww);
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
  useGSAP(
    (context, contextSafe) => {
      if (!contextSafe) {
        return;
      }
      initiateAnimationTimeline.current = contextSafe(() => {
        headerTimeline.current &&
          (headerTimeline.current.restart(), headerTimeline.current.kill());

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
      });
    },
    { dependencies: [lastResize] }
  );
  useEffect(() => {
    initiateAnimationTimeline.current && initiateAnimationTimeline.current();
  }, [lastResize]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const setHeaderState = useCallback(
    (transitionType: TransitionType, callback?: () => void) => {
      if (transitionType === "transition-wipe") {
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
            scrubPosition.set(lerpedTween.current);
            headerTimeline.current &&
              headerTimeline.current.progress(lerpedTween.current);
          },
          onComplete: () => {
            callback && callback();
          }
        });
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
    [getTweenPercentBasedOnScroll, scrubPosition]
  );

  const enableScrollAnimation = useCallback(() => {
    headerTransitionDisabled.current = false;
    transitioning.set(false);
  }, [transitioning]);
  const haltScrollAnimation = useCallback(() => {
    headerTransitionDisabled.current = true;
    transitioning.set(true);
  }, [transitioning]);
  useLenis((lenis) => {
    !initiatedScroll.current &&
      ((initiatedScroll.current = !0),
      lenis.on("scroll", (l) => {
        if (!headerTransitionDisabled.current && l.animatedScroll) {
          const c = l.animatedScroll;
          (c > 50 ? (tweenNumber.current = c - 50) : (tweenNumber.current = 0),
            animateOnScroll(tweenNumber.current));
        }
      }));
  });
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
            className={
              "absolute top-0 left-0 z-[1] h-full w-full bg-off-l-gray/35 opacity-[0.00001] dark:bg-faded-l-gray/35"
            }
          />
          <m.div
            key={"blur-fx"}
            style={{ opacity: scrubPosition }}
            className={
              "absolute top-0 left-0 z-[2] h-full w-full opacity-[0.00001] backdrop-blur-[20px]"
            }
          />
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
            key={"section-header-container"}
            className="relative z-20 flex h-[4.8rem] items-center justify-between px-[36px] pt-[24px] pb-0 min-lg:h-[5.4rem]"
          >
            <m.div
              id="l-side"
              className="z-20"
              style={{
                y: sectionY,
                x: sectionLX
              }}
            >
              <div className="flex">
                <MenuButton
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
                transform: sectionCY,
                left: "50%",
                top: "50%"
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
                  {!isMobile && (
                    <NotificationProvider user={user!}>
                      <NotificationButton
                        style={{
                          color: themeColour,
                          backgroundColor: btBackground,
                          backdropFilter: btBlur
                        }}
                      />
                    </NotificationProvider>
                  )}
                  <UserDropdown
                    style={{
                      color: themeColour,
                      backgroundColor: btBackground,
                      backdropFilter: btBlur
                    }}
                  />
                </SignedIn>
                <SignedOut key="signed-out">
                  {!isMobile && (
                    <CheckInButton
                      style={{
                        color: themeColour,
                        backgroundColor: btBackground,
                        backdropFilter: btBlur
                      }}
                    />
                  )}
                </SignedOut>
                {!isMobile && (
                  <SearchBar
                    key={"search-component"}
                    ref={commandRef}
                    style={{
                      color: themeColour,
                      backgroundColor: btBackground,
                      backdropFilter: btBlur
                    }}
                  />
                )}
                <DarkmodeButton
                  key={"darkmode-component"}
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
      key={"fx-container"}
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
