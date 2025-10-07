"use client";
import React, {
  type ComponentRef,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

import { SearchBar } from "@/components/UX/CommandKey/SearchBar";
import { DarkmodeButton } from "@/components/UX/DarkMode/Darkmode";
import { UserDropdown } from "@/components/UX/Dropdown/RPDropDown";
import { Link } from "@/components/UX/Link/Link";
import { Logo } from "@/components/UX/Logo";
import { MenuButton } from "@/components/UX/Menu/MenuButton";
import { NotificationButton } from "@/components/UX/NotificationButton/notificationButton";
import { useSession } from "@/lib/auth/client";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import {
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform
} from "motion/react";
import { useTransitionState } from "next-transition-router";
import { SignedIn, SignedOut } from "../../../lib/auth/betterauth-ui/src";
import { useShallow } from "zustand/shallow";
import { NotificationProvider } from "../../../providers/Notifications";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import { useIsMobile } from "@/providers/MiddleMan";
import {
  useCursor,
  useDeviceInfo,
  useMenu,
  useRPStore
} from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { delay, rp_lerp } from "@/utilities/rp_utils";
import { useWindowResize } from "@/utilities/use_window_resize";
import { CheckInButton } from "@/payload/components/Header/CheckInButton";
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
  const isPreloader = useRPStore(useShallow((store) => store.isPreloader));
  const theme = useTheme(useShallow((r) => r.theme));
  const [the, setTheme] = useState(theme);
  const { data, isPending } = useSession();

  const setUser = useRPSession((r) => r.setUser);
  const to = useRef<ReturnType<typeof setTimeout>>(null!);
  const [visible, setVisible] = useState(true);
  const isMobile = useDeviceInfo(useShallow((r) => r.isMobile));
  const notificationRef = useRef<ComponentRef<"button">>(null!);
  const left = useMenu(useShallow((r) => r.left));
  const right = useMenu(useShallow((r) => r.right));

  const top = useMenu(useShallow((l) => l.top));
  const bottom = useMenu(useShallow((r) => r.bottom));
  const blurRef = useRef<HTMLDivElement>(null!);
  const colorRef = useRef<HTMLDivElement>(null!);
  const fxRef = useRef<HTMLDivElement>(null!);
  const menuRef = useRef<ComponentRef<"button">>(null!);
  const darkModeRef = useRef<ComponentRef<"button">>(null!);
  const fx2Ref = useRef<HTMLDivElement>(null!);
  const fx3Ref = useRef<HTMLDivElement>(null!);
  const fx4Ref = useRef<HTMLDivElement>(null!);

  const { headerTheme } = useHeaderTheme();
  const fxVisibility = useRPStore(useShallow((l) => l.showFXFrame));

  const inner = useRef<HTMLDivElement>(null!),
    l = useRef<HTMLDivElement>(null!),
    r = useRef<HTMLDivElement>(null!),
    c = useRef<HTMLAnchorElement>(null!);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] =
    useState<VerticalDirection>("up");
  const navIsOpen = useRPStore(useShallow((store) => store.navIsOpen));
  const lenis = useLenis();
  useLenis((lenis) => {
    setIsScrolling(!!lenis.isScrolling);
    setScrollDirection(lenis.direction > -1 ? "up" : "down");
  });
  const commandRef = useRef<ComponentRef<"button">>(null!);
  const user = useRPSession(useShallow((r) => r.id));
  useEffect(() => {
    if (data?.user) {
      setUser({
        ...data.user,
        role: data.user.role as RP_Roles,
        bio: data.user.bio || ""
      });
    }
  }, [data, setUser]);
  const headerTransition = useRPStore(useShallow((l) => l.headerTransition));
  const setHeaderTransition = useRPStore((l) => l.setHeaderTransition);
  const isTransitioningWipe = useRPStore(
    useShallow((l) => l.isTransitioningWipe)
  );
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
    (headerTheme && setTheme(headerTheme)) || setTheme(theme);
  }, [headerTheme, theme]);
  const headerTimeline = useRef<GSAPTimeline>(null!);
  useGSAP(
    () => {
      if (headerTransition) {
        gsap.killTweensOf([inner.current, l.current, c.current, r.current]);
        gsap.to([l.current, c.current, r.current], {
          autoAlpha: visible ? 1 : 0,
          duration: 0.4,
          ease: "power4.inOut"
        });
        switch (headerTransition) {
          case "slide":
            (gsap.to(inner.current, {
              duration: 0.4,
              ease: "power4.inOut",
              y: visible ? 0 : "-100%",
              delay: 0.4
            }),
              (gsap.to(l.current, {
                duration: 0.4,
                ease: "power4.inOut",
                x: visible ? 0 : "-100%",
                y: visible ? 0 : "-100%"
              }),
              gsap.to(c.current, {
                duration: 0.4,
                ease: "power4.inOut",
                y: visible ? 0 : "-100%"
              }),
              gsap.to(r.current, {
                duration: 0.4,
                ease: "power4.inOut",
                x: visible ? 0 : "100%",
                y: visible ? 0 : "-100%"
              })));
            break;
        }
      } else {
        gsap.killTweensOf([inner.current, l.current, c.current, r.current]);
        gsap.to([l.current, c.current, r.current], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: 0.4,
          ease: "power4.inOut"
        });
      }
      gsap.to(inner.current, {
        autoAlpha: showHeader || visible ? 1 : 0,
        duration: 0.4,
        ease: "power4.inOut"
      });
    },
    { scope: main, dependencies: [headerTransition, visible] }
  );
  const { stage, navigate, isReady } = useTransitionState();
  const clearPageTheme = useTheme((l) => l.clearPageTheme);
  const initiatedScroll = useRef(false);
  const reset = useVoyageur((l) => l.reset);
  const resetCursorTheme = useCursor((l) => l.resetCursorTheme);
  const setCursorState = useCursor((l) => l.setCursorState);
  useEffect(() => {
    setVisible(showHeader);
  }, [showHeader]);
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
  const btBackground = useRef(
    navIsOpen ? "transparent" : "oklch(var(--button-background))"
  );

  const themeRef = useRef(theme);
  const fxInnerTop = useRef(navIsOpen ? -top : 0);
  const innerLeft = useRef(navIsOpen ? -left : 0);
  const innerRight = useRef(navIsOpen ? -right : 0);
  const fxLeft = useRef(navIsOpen ? 0 : 10);
  const fxRight = useRef(navIsOpen ? 0 : 10);
  const fxTop = useRef(navIsOpen ? top - 10 : 0);
  const transitionDelay = useRef(navIsOpen ? 0 : 0.2);
  const btBlur = useRef(navIsOpen ? "blur(0px)" : "blur(1.4rem)");
  const windowWidth = useRef(window.innerWidth);
  const condensedWidth = useRef(isMobile ? windowWidth.current - 2 * 16 : 645);
  const mainY = useRef(isMobile ? 16 - 4 : 12);
  useEffect(() => {
    btBackground.current = navIsOpen
      ? "oklch(var(--transparent-base)/0)"
      : "oklch(var(--button-background))";
    fxInnerTop.current = navIsOpen ? -top : 0;
    innerLeft.current = navIsOpen ? -left : 0;
    innerRight.current = navIsOpen ? -right : 0;
    fxLeft.current = navIsOpen ? 0 : 10;
    fxRight.current = navIsOpen ? 0 : 10;
    fxTop.current = navIsOpen ? top - 10 : top;
    transitionDelay.current = navIsOpen ? 0 : 0.2;
    btBlur.current = navIsOpen ? "blur(0px)" : "blur(1.4rem)";

    condensedWidth.current = isMobile ? windowWidth.current - 2 * 16 : 645;
    mainY.current = isMobile ? 16 - 4 : 12;
  }, [navIsOpen, top, left, right, isMobile]);
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
            width: windowWidth.current,
            y: 0,
            top: fxTop.current,
            x: "-50%",
            overflow: "visible",
            boxShadow: "none",
            zIndex: 249
          },
          {
            width: condensedWidth.current,
            y: mainY.current,
            x: "-50%",
            zIndex: 245,
            top: fxTop.current,
            overflow: "hidden",
            boxShadow:
              themeRef.current === "dark"
                ? "0 0 0.5px 1.2px oklch(var(--muted-faded-bg)/.7)"
                : "none",
            duration: 1
          },
          0
        );
        gsap.killTweensOf(c.current, "width");
        headerTimeline.current.fromTo(
          c.current,
          {
            width: 28
          },
          {
            width: 22,
            duration: 0.2
          },
          0.1
        );
        gsap.killTweensOf(inner.current, "padding,left,right,top");
        headerTimeline.current.fromTo(
          inner.current,
          {
            padding: "24px 36px 0",
            left: innerLeft.current,
            right: innerRight.current
          },
          {
            padding: "0 var(--gutter)",
            duration: 0.4,
            left: 0,
            right: 0
          },
          0
        );
        gsap.killTweensOf(
          [fxRef.current, fx2Ref.current, fx3Ref.current, fx4Ref.current],
          "top,bottom,backdropFilter"
        );
        gsap.killTweensOf([fxRef.current], "left,right,");
        headerTimeline.current.fromTo(
          fxRef.current,
          {
            left: fxLeft.current,
            right: fxRight.current,
            top: fxTop.current
          },
          {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            duration: 0.4,
            delay: transitionDelay.current
          },
          0
        );
        headerTimeline.current.fromTo(
          [fx2Ref.current, fx3Ref.current, fx4Ref.current],
          {
            top: fxInnerTop.current,

            bottom: "auto"
          },
          {
            top: 0,

            bottom: 0,
            delay: transitionDelay.current,
            duration: 0.4
          },
          0
        );
        headerTimeline.current.fromTo(
          fx2Ref.current,
          {
            backdropFilter:
              "brightness(100%) blur(5px) contrast(500%) saturate(1500%)"
          },
          {
            backdropFilter:
              // theme === "dark"
              //   ? "brightness(70%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)"
              //   : "brightness(200%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)",
              "none",
            duration: 0.6
          },
          0
        );
        headerTimeline.current.fromTo(
          fx3Ref.current,
          {
            backdropFilter:
              "hue-rotate(0deg) brightness(100%) blur(5px) contrast(500%) saturate(1500%)"
          },
          {
            backdropFilter:
              // theme === "dark"
              //   ? "hue-rotate(10deg) brightness(70%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)"
              //   : "hue-rotate(10deg) brightness(200%) blur(5px) contrast(150%) saturate(200%) grayscale(50%)",
              "none",
            duration: 0.6
          },
          0
        );
        const y = [
          menuRef.current,
          darkModeRef.current,
          notificationRef.current,
          commandRef.current
        ];
        (gsap.killTweensOf(y, "backgroundColor,backdropFilter"),
          headerTimeline.current.fromTo(
            y,
            {
              backgroundColor: btBackground.current,
              backdropFilter: btBlur.current
            },
            {
              backgroundColor: "transparent",
              backdropFilter: "blur(0px)",
              duration: 0.6
            },
            0
          ),
          headerTimeline.current.fromTo(
            [colorRef.current, blurRef.current],
            {
              opacity: 0
            },
            {
              opacity: 1,
              duration: 1
            },
            0
          ));
      });
    },
    { dependencies: [lastResize], scope: main }
  );
  useEffect(() => {
    initiateAnimationTimeline.current && initiateAnimationTimeline.current();
    windowWidth.current = window.innerWidth;
  }, [isMobile, lastResize, lenis]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null!);
  const setHeaderState = useCallback(
    (transitionType: TransitionType, callback?: () => void) => {
      if (transitionType === "transition-wipe") {
        (gsap.killTweensOf(main.current, "autoAlpha"),
          gsap.to(main.current, {
            autoAlpha: 0,
            duration: 0.3,
            ease: "power3.inOut",
            onComplete: () => {
              gsap.killTweensOf(lerpedTween);
              tweenNumber.current = 0;
              headerTimeline.current && headerTimeline.current.progress(0);
              lerpedTween.current = 0;
              gsap.to(main.current, {
                autoAlpha: 1,
                duration: 0.3,
                delay: 0.6 * 1.4,
                top: fxTop.current,
                ease: "power3.inOut",
                onComplete: () => {
                  callback && callback();
                }
              });
            }
          }));
        return;
      }
      if (
        (gsap.killTweensOf(lerpedTween), "animate-to-full" === transitionType)
      )
        (gsap.to(lerpedTween, {
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
        }),
          gsap.to(main.current, {
            duration: 0.4,
            zIndex: 249,
            top: fxTop.current,
            delay: 0.2,
            ease: "power4.inOut"
          }));
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
  };
  const haltScrollAnimation = () => {
    headerTransitionDisabled.current = true;
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
  }, [navIsOpen, isTransitioningWipe, transitionOutType, top, setHeaderState]);
  useEffect(() => {
    if (!isPreloader && main.current) {
      gsap.to(main.current, {
        autoAlpha: 1
      });
    }
  }, [isPreloader]);
  const [compact, setCompact] = useState<boolean>(progressRate.current === 1);
  const isCondensed = useCallback(() => {
    setCompact(progressRate.current === 1);
  }, [setCompact]);
  useGSAP(
    () => {
      gsap.ticker.add(isCondensed);
      return () => {
        gsap.ticker.remove(isCondensed);
      };
    },
    { scope: main }
  );
  return (
    <header
      data-theme={the}
      ref={main}
      id="rp-header"
      className={cn("sticky z-[240] shadow-none", {
        scrolling: isScrolling
      })}
      data-scroll={scrollDirection}
      data-themed={"background-color,color.z-index"}
      onMouseEnter={
        showHeader
          ? undefined
          : () => {
              to.current && clearTimeout(to.current);
              to.current = null!;
              to.current = setTimeout(() => {
                setVisible(true);
              }, 200);
            }
      }
      onMouseLeave={
        showHeader
          ? undefined
          : () => {
              to.current && clearTimeout(to.current);
              to.current = null!;
              to.current = setTimeout(() => {
                setVisible(false);
              }, 200);
            }
      }
      style={{
        top: top / 2 + "px"
      }}
    >
      {children}{" "}
      <div
        ref={fxRef}
        className={cn(
          "pointer-events-none fixed top-0 right-[10px] bottom-0 left-[10px] z-10 mx-auto",
          {
            "opacity-0": !fxVisibility
          }
        )}
      >
        <div
          ref={fx2Ref}
          data-themed={"background-color"}
          className="absolute top-[10px] bottom-auto z-[19] h-[80px] opacity-50"
          style={{
            backdropFilter:
              "brightness(100%) blur(5px) contrast(500%) saturate(1500%)",
            backgroundColor: "#ffffff03",

            maskImage: "linear-gradient(#000, transparent)"
          }}
        />
        <div
          ref={fx3Ref}
          data-themed={"background-color"}
          className="absolute top-[10px] bottom-auto z-[19] h-[60px] opacity-75"
          style={{
            backdropFilter:
              "hue-rotate(0deg) brightness(100%) blur(5px) contrast(500%) saturate(1500%)",
            backgroundColor: "#ffffff03",

            maskImage: "linear-gradient(#000, transparent)"
          }}
        />
        <div
          ref={fx4Ref}
          data-themed={"background-color"}
          className="top-fx-bottom fixed top-[10px] z-[10] hidden h-[50px]"
          style={{
            backdropFilter:
              "brightness(100%) blur(5px) contrast(500%) saturate(1500%)",
            backgroundColor: "#ffffff03",
            maskImage: "linear-gradient(transparent, #000)",
            inset: "0% 0% auto"
          }}
        />
      </div>
      <div
        ref={colorRef}
        className={
          "absolute top-0 left-0 z-[1] h-full w-full bg-off-l-gray/35 opacity-[0.00001] dark:bg-faded-l-gray/35"
        }
      />
      {
        // "absolute top-0 left-0 w-full h-full z-[1] bg-[oklch(0.7894_0_0/0.7)] dark:bg-[oklch(0.7894_0_0/0.4)] opacity-[0.00001]"
      }
      <div
        ref={blurRef}
        className={
          "absolute top-0 left-0 z-[2] h-full w-full opacity-[0.00001] backdrop-blur-[20px]"
        }
      />
      <div className="header-inner z-20" ref={inner}>
        <div id="l-side" className="z-20" ref={l}>
          <div className="flex">
            <MenuButton ref={menuRef} />
          </div>
        </div>
        <Link
          ref={c}
          id="c-side"
          href="/home"
          aria-label={"Logo"}
          className="header-main__logo z-20"
          style={{
            transform: "translate(-50%, 0%)"
          }}
        >
          <Logo />
        </Link>
        <div id="r-side" ref={r} className={"z-20"}>
          <AnimatePresence mode="sync" propagate={true}>
            <SignedIn key="signed-in">
              {user && (
                <NotificationProvider user={user}>
                  <NotificationButton />
                </NotificationProvider>
              )}
              <UserDropdown />
            </SignedIn>
            <SignedOut key="signed-out">
              <CheckInButton />
            </SignedOut>
          </AnimatePresence>
          <SearchBar ref={commandRef} />
          <DarkmodeButton ref={darkModeRef} />
        </div>
      </div>
    </header>
  );
};
