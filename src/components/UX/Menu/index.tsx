"use client";

import { Link } from "@/components/core/Link/Link";
import { EASING, TWEEN_EASE } from "@/constants/animations";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import {
  useCursor,
  useDeviceInfo,
  // useMenu,
  useRPStore
} from "@/providers/RP_Pro";
import { useTheme } from "@/providers/Theme";
import { CornerSide, FrameSide } from "@/stores/Frame_Ctrl";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { motionCallback } from "@/utilities/motionHelpers";
import { useWindowResize } from "@/utilities/use_window_resize";
// import { useGSAP } from "@gsap/react";
// import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import { AnimationSequence } from "motion";
import {
  animate,
  type MotionValue,
  useMotionValue,
  useTransform,
  type Variants
} from "motion/react";
import * as m from "motion/react-m";
import {
  SVGAttributes,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState
} from "react";
import { useShallow } from "zustand/shallow";

const B = "navWindow";
// export const getNavId = () => B;

export const RP_Menu = () => {
  const H = 590;
  // const top = useMenu(useShallow((l) => l.top));
  // const bottom = useMenu(useShallow((l) => l.bottom));
  // const right = useMenu(useShallow((l) => l.right));
  // const left = useMenu(useShallow((l) => l.left));

  const navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  const navOpenValue = useMotionValue(navIsOpen);
  useEffect(() => {
    navOpenValue.set(navIsOpen);
  }, [navIsOpen, navOpenValue]);

  const frameDim = useMemo(
    () => ({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }),
    []
  );

  const t = useTransform(() => (navOpenValue.get() ? 0 : 10) as number);
  const b = useTransform(() => (navOpenValue.get() ? 0 : 30) as number);
  const r = useTransform(() => (navOpenValue.get() ? 0 : 10) as number);
  const l = useTransform(() => (navOpenValue.get() ? 0 : 10) as number);
  const { isMobile } = useIsMobile();
  const mobileState = useMotionValue(isMobile);
  useEffect(() => {
    mobileState.set(isMobile);
  }, [isMobile, mobileState]);
  const isAndroid = useDeviceInfo((r) => r.os.isAndroid);
  const androidState = useMotionValue(isAndroid);
  useEffect(() => {
    androidState.set(isAndroid);
  }, [isAndroid, androidState]);
  const frames: FrameSide[] = ["top", "right", "bottom", "left"];
  const keyedFrames = useRef<{ [x: string]: string }>({});
  const keyedCorners = useRef<{ [x: string]: string }>({});
  const keyedSvg = useRef<{ [x: string]: string }>({});
  const corners: CornerSide[] = [
    "topleft",
    "topright",
    "bottomright",
    "bottomleft"
  ];
  const corn = useMemo(
    () => ({
      mobile: {
        topright:
          // "M.07.01c50.62,2.79,51.7,3.82,56.01,56.12,0-.45,0-3.7,0-8.44,0-13.09.02-35.5-.01-47.69C40.43,0,14.98,0,0,0h.07Z",
          "M270 270V0H0c182.34 14.03 252.47 84.16 270 270",
        topleft:
          // "M56.07,0C41.09,0,15.65,0,.01,0,0,12.23,0,34.57,0,47.69c0,4.74,0,8,0,8.44C.92,3.75,2.1,2.82,56,.01h.07Z",
          "M270 0H0v270C14.03 87.66 84.16 17.53 270 0",
        bottomright:
          // "M0,56.13c14.99,0,40.42.01,56.06,0,.02-12.23.01-34.56.01-47.69,0-4.74,0-8,0-8.44C53.76,52.46,52.63,53.43.07,56.12h-.07Z",
          "M0 270h270V0C255.97 182.34 185.84 252.47 0 270",
        bottomleft:
          // "M0,0c.02,10.34-.01,29.22,0,40.94,0,8.72,0,15.31,0,15.18,2.85.03,7.55-.02,15.18,0,10.22,0,22.94,0,32.7,0,4.69,0,7.88,0,8.24,0,0,0,.05,0,0,0h-.3c-35.4-1.47-50.86,1.97-54.23-24.43C.39,22.32.28,10.22,0,.06v-.06Z"
          "M0 0v270h270C87.66 255.97 17.53 185.84 0 0"
      },
      desktop: {
        // topright: "M0,0q25.73,1.58,28.07,28.07V0H0Z",
        topright: "M270 270V0H0c182.34 14.03 252.47 84.16 270 270",
        topleft: "M270 0H0v270C14.03 87.66 84.16 17.53 270 0",

        // "M0,0v28.07h28.07Q.65,27.54,0,0Z",
        bottomleft: "M0 0v270h270C87.66 255.97 17.53 185.84 0 0",
        // bottomright: "M0,28.07h28.07V0Q26.73,26.54,0,28.07Z",
        bottomright: "M0 270h270V0C255.97 182.34 185.84 252.47 0 270"
        // topleft: "M28.07,0H0v28.07Q.65,1.58,28.07,0Z"
      }
    }),
    []
  );

  const size = useMotionValue(isMobile ? "2rem" : "2.2rem");

  useEffect(() => {
    // viewbox.set(isMobile ? `0 0 56.15 56.15` : `0 0 28.07 28.07`);

    size.set(isMobile ? "2rem" : "2.2rem");
  }, [isMobile, size]);
  const focusedRef = useRef<-1 | string>(-1),
    activeRef = useRef<string | -1>(-1),
    [activeIndex, setActiveIndex] = useState<string | -1>(-1);
  const toggleMenu = useRef<
    (isNavOpen: boolean, needsResizing: boolean) => void
  >(null!);
  const setNavOpeningElement = useRPStore((l) => l.setNavOpeningElement);
  /**
   * Ref Objects for Navigation Items
   *
   */
  const navigationList = useRef<HTMLUListElement>(null!);
  const navItems = useRef<HTMLLIElement[]>([]);
  const navLines = useRef<HTMLSpanElement[]>([]);
  const navButtons = useRef<HTMLAnchorElement[]>([]);
  const navWindow = useRef<HTMLDivElement>(null!);
  /**
   *  Menu Frame ref Objects
   */
  const menuFrames = useRef<Array<HTMLDivElement>>([]);
  const menuCorners = useRef<Array<HTMLDivElement>>([]);
  const menuSVgs = useRef<Array<HTMLDivElement>>([]);

  /**
   * Cursor Functions
   */
  const setCursorTheme = useCursor((l) => l.setCursorTheme);
  const resetCursorTheme = useCursor((l) => l.resetCursorTheme);
  /**
   *  Transition / UI Functions
   */

  const setCanInteract = useRPStore((store) => store.setCanInteract);
  const setNavigationPageIsTransitioning = useRPStore(
    (store) => store.setNavigationPageIsTransitioning
  );
  const setNavIsTransitioning = useRPStore((l) => l.setNavIsTransitioning);
  const setNavIsOpen = useRPStore((l) => l.setNavIsOpen);
  const setTransitionOutType = useRPStore((l) => l.setTransitionOutType);
  const setNavIsOpenDebounced = useRPStore((l) => l.setNavIsOpenDebounced);
  const menuPageItemKeys = useRPStore(
    useShallow((l) => l.navigationPageItemKeys)
  );
  const lastAdjustRealTime = useMemo(() => 2026, []);
  const currentPageKey = useVoyageur(useShallow((l) => l.pageKey));
  const setNavItemHovered = useRPStore((l) => l.setNavigationPageItemHovered);
  const setNavItemSelected = useRPStore((l) => l.setNavigationPageItemSelected);
  const menuWrap = useRef<HTMLDivElement>(null!);
  const pathVariants: Variants = useMemo(
    () => ({
      initial: {
        opacity: 0,
        visibility: "hidden"
      },
      animate: {
        opacity: 1,
        visibility: "visible"
      },
      exit: {
        opacity: 0,
        visibility: "hidden"
      }
    }),
    []
  );
  const handlePagePreviewMouseEnter = useCallback(
    (pagekey: string | -1) => {
      currentPageKey !== pagekey && setNavItemHovered(pagekey);
    },
    [currentPageKey, setNavItemHovered]
  );
  const handlePagePreviewMouseLeave = useCallback(() => {
    setNavItemHovered(-1);
  }, [setNavItemHovered]);

  const hoveredNavItem = useRPStore(
    useShallow((l) => l.navigationPageItemHovered)
  );
  const activeTO = useRef<ReturnType<typeof setTimeout>>(null!);
  useEffect(() => {
    if (hoveredNavItem === -1) {
      {
        activeTO.current && clearTimeout(activeTO.current);
        activeTO.current = setTimeout(() => {
          setActiveIndex(currentPageKey);
        }, 450);
      }
    }
  }, [currentPageKey, hoveredNavItem]);
  const menuToPageCallback = useCallback(
    (pagekey: string) => {
      (setNavItemSelected(pagekey),
        setTransitionOutType("FROM_MENU"),
        setNavigationPageIsTransitioning(true));
      setTimeout(() => {
        setCanInteract(true);
        setNavIsOpen(!1);
        setTransitionOutType(null);
      }, 1200);
    },
    [
      setNavItemSelected,
      setNavigationPageIsTransitioning,
      setCanInteract,
      setNavIsOpen,
      setTransitionOutType
    ]
  );
  const handlePagePreviewClick = useCallback(
    (pageKey: string) => {
      isMobile
        ? (handlePagePreviewMouseEnter(pageKey),
          setTimeout(() => {
            menuToPageCallback(pageKey);
          }, 300))
        : menuToPageCallback(pageKey);
    },
    [handlePagePreviewMouseEnter, isMobile, menuToPageCallback]
  );
  const er = useRef(null),
    resizeTime = useWindowResize({ debounce: 100 }),
    lastResize = useRef(0),
    sizeAdjust = useMotionValue(resizeTime);
  useEffect(() => {
    sizeAdjust.set(resizeTime);
  }, [resizeTime, sizeAdjust]);
  const focusResetTO = useRef<ReturnType<typeof setTimeout>>(null!);
  const isHome = useVoyageur((l) => l.isHome);
  useEffect(() => {
    (focusResetTO.current && clearTimeout(focusResetTO.current),
      (focusResetTO.current = setTimeout(() => {
        setNavIsOpenDebounced(navIsOpen);
      }, 400)));
  }, [setNavIsOpenDebounced, navIsOpen]);
  // const { contextSafe: anotherOne } = useGSAP({
  //   dependencies: [hoveredNavItem, activeIndex],
  //   scope: menuWrap
  // });
  // const resetFrames = anotherOne(() => {
  //   const l = focusedRef.current !== activeIndex;
  //   const nothingIsActive = activeIndex === -1 && hoveredNavItem === -1;
  //   const resetElement = (
  //     l: gsap.TweenTarget,
  //     c: gsap.TweenTarget,
  //     d = 0.3
  //   ) => {
  //     const dur = 0.3;
  //     gsap.killTweensOf([l, c]);
  //     gsap.to(l, {
  //       x: "102%",
  //       duration: dur
  //     });
  //     gsap.to(c, {
  //       autoAlpha: d,
  //       duration: dur
  //     });
  //   };
  //   navLines.current.forEach((navLine, h) => {
  //     if (!navLine) {
  //       return;
  //     }
  //     const currentButton = navButtons.current[h];
  //     if (currentButton) {
  //       if (l) {
  //         resetElement(navLine, currentButton, nothingIsActive ? 1 : 0.3);
  //       }
  //       if (
  //         menuPageItemKeys[h] === hoveredNavItem ||
  //         (hoveredNavItem === -1 && menuPageItemKeys[h] === activeIndex)
  //       ) {
  //         gsap.killTweensOf([navLine, currentButton]);
  //         gsap.fromTo(
  //           navLine,
  //           {
  //             x: "-102%"
  //           },
  //           {
  //             x: 0,
  //             duration: 0.6,
  //             ease: "power3.out"
  //           }
  //         );
  //         gsap.to(currentButton, {
  //           autoAlpha: 1,
  //           duration: 0.6,
  //           ease: "power3.out"
  //         });
  //       } else if (
  //         menuPageItemKeys[h] === activeRef.current ||
  //         (hoveredNavItem !== -1 && menuPageItemKeys[h] === activeIndex) ||
  //         activeIndex === -1
  //       ) {
  //         resetElement(navLine, currentButton);
  //       }
  //       if (nothingIsActive) {
  //         gsap.killTweensOf([navLine, currentButton]);
  //         resetElement(navLine, currentButton, 1);
  //       }
  //     }
  //   });
  //   activeRef.current = hoveredNavItem;
  //   focusedRef.current = activeIndex;
  // });
  const resetFrame = useEffectEvent(() => {
    const seq: AnimationSequence = [];
    const notInFocus = focusedRef.current !== activeIndex;
    const nothingIsActive = activeIndex === -1 && hoveredNavItem === -1;
    const resetElement = (l: object, c: object, d = 0.3) => {
      const dur = 0.3;
      const base = {
        duration: dur,
        type: "tween" as const,
        at: 0,
        ease: TWEEN_EASE.power1.out
      };
      seq.push([l, { x: "102%" }, { ...base }], [c, { opacity: d }, base]);
    };
    navLines.current.forEach((navLine, h) => {
      if (!navLine) {
        return;
      }
      const currentButton = navButtons.current[h];
      if (currentButton) {
        if (notInFocus) {
          resetElement(navLine, currentButton, nothingIsActive ? 1 : 0.3);
        }
        if (
          menuPageItemKeys[h] === hoveredNavItem ||
          (hoveredNavItem === -1 && menuPageItemKeys[h] === activeIndex)
        ) {
          seq.push(
            [navLine, { x: "-102%" }, { at: 0, duration: 0 }],
            [
              navLine,
              {
                x: 0
              },
              {
                duration: 0.6,
                at: 0,
                type: "tween",
                ease: TWEEN_EASE.power3.out
              }
            ],
            [
              currentButton,
              {
                opacity: 1,
                visibility: "visible"
              },
              {
                type: "tween",
                duration: 0.6,
                at: 0,
                ease: TWEEN_EASE.power3.out
              }
            ]
          );
        } else if (
          menuPageItemKeys[h] === activeRef.current ||
          (hoveredNavItem !== -1 && menuPageItemKeys[h] === activeIndex) ||
          activeIndex === -1
        ) {
          resetElement(navLine, currentButton);
        }
        if (nothingIsActive) {
          resetElement(navLine, currentButton, 1);
        }
      }
    });
    const prevActive = activeRef.current;
    const prevFocused = focusedRef.current;
    seq.push([
      motionCallback({
        onBackwards: () => {
          activeRef.current = prevActive;
          focusedRef.current = prevFocused;
        },
        onForwards: () => {
          activeRef.current = hoveredNavItem;
          focusedRef.current = activeIndex;
        }
      })
    ]);
    animate(seq);
  });
  useEffect(() => {
    setActiveIndex(-1);
    (isHome && window.innerHeight > H && !isMobile) ||
      navItems.current.forEach((el, ind) => {
        if (el && el.dataset.isActive == "true") {
          setTimeout(() => {
            setActiveIndex(menuPageItemKeys[ind] || -1);
          }, 400);
        }
      });
  }, [isHome, isMobile, menuPageItemKeys]);
  const links = useRPStore(useShallow((r) => r.navigationPageItemData));
  const toggM = useEffectEvent(
    ({ needsResizing }: { needsResizing?: boolean }) => {
      if (!er.current || !navWindow.current) {
        return;
      }
      const isM = mobileState.get();
      const navo = navOpenValue.get();
      const top = t.get();
      const right = r.get();
      const bottom = b.get();
      const left = l.get();
      const isAndro = androidState.get();

      setNavIsTransitioning(!0);
      const navWClient = (
        navWindow.current as HTMLElement
      ).getBoundingClientRect();
      const windowHeight = (navWindow.current as HTMLElement).offsetHeight;
      const windowXOff = navWClient.left;
      const windowYOff = navWClient.top;
      const seq: AnimationSequence = [];
      menuFrames.current.forEach((frame, ind) => {
        if (!frame) {
          return;
        }
        let xOff: string | number = 0;
        let yOff: string | number = 0;
        const frameRect = frame.getBoundingClientRect();
        if (!navo) {
          switch (ind) {
            case 0:
              yOff = -frameRect.height + top;
              break;
            case 1:
              xOff = isM ? right - 3 : frame.offsetWidth - right;
              break;
            case 2:
              // yOff = isMobile && os.name === 'android' ? frame.offsetHeight : '100%'
              yOff = isM
                ? isAndro
                  ? frameRect.height
                  : frameRect.height - 20
                : frameRect.height - bottom;
              break;
            case 3:
              xOff = isM ? -left + 3 : -frameRect.width + left;
          }
        }
        seq.push([
          frame,
          {
            x: `${xOff}px`,
            y: `${yOff}px`,
            opacity: 1,
            visibility: "visible"
          },
          {
            duration: 1.2,
            ease: TWEEN_EASE[`power${navo ? 4 : 3}`].inOut,
            at: 0
          }
        ]);
      });
      menuCorners.current.forEach((corner, indx) => {
        let xoffse = 0;
        let yoffse = 0;
        if (!corner) {
          return;
        }
        if (!navo && isM && isAndro) {
          const l = menuFrames.current[2];
          const c = l?.offsetHeight || 0;
          switch (indx) {
            case 2:
            case 3:
              yoffse = c - c / 1.5;
          }
        }
        switch (indx) {
          case 0:
            if (navo) {
              yoffse = windowYOff;
              xoffse = windowXOff;
            } else {
              yoffse = top;
              xoffse = left;
            }
            break;
          case 1:
            if (navo) {
              yoffse = windowYOff;
              xoffse = -windowXOff;
            } else {
              yoffse = top;
              xoffse = -right;
            }
            break;
          case 2:
            if (navo) {
              xoffse = -windowXOff;
              yoffse = isM
                ? -((window.innerHeight - (windowHeight + windowYOff)) * 1) + 1
                : -windowYOff;
            } else {
              yoffse = -bottom;
              xoffse = -right;
            }
            break;
          case 3:
            if (navo) {
              xoffse = windowXOff;
              yoffse = isM
                ? -((window.innerHeight - (windowHeight + windowYOff)) * 1) + 1
                : -windowYOff;
            } else {
              yoffse = -bottom;
              xoffse = left;
            }
        }

        seq.push([
          corner,
          {
            x: `${xoffse}px`,
            y: `${yoffse}px`
          },
          {
            duration: 1.2,
            ease: TWEEN_EASE[`power${navo ? 4 : 3}`].inOut,
            at: 0
          }
        ]);
      });
      menuSVgs.current.forEach((svg) => {
        if (svg) {
          seq.push([
            svg,
            { scale: 1 },
            needsResizing
              ? {
                  duration: 0,
                  at: 0
                }
              : {
                  duration: 1.2,
                  ease: TWEEN_EASE[`power${navo ? 4 : 3}`].inOut,
                  at: 0
                }
          ]);
        }
      });
      const startLoc = isM ? 0 : -150;
      seq.push([
        navigationList.current,
        {
          x: navo ? 0 : `${startLoc}px`,
          visibility: navo ? "visible" : "hidden",
          opacity: navo ? 1 : 0
        },
        {
          type: "tween",
          duration: navo ? 1.2 : 1.2 * 0.75,
          ease: TWEEN_EASE.power3.out,
          at: 0,
          delay: navo ? 0.75 : 0
        }
      ]);

      seq.push(
        [
          er.current,
          {
            opacity: navo ? 1 : 0,
            visibility: navo ? "visible" : "hidden"
          },
          {
            delay: navo ? 0.5 : 0,
            duration: 1.2,
            at: 0
          }
        ],
        [
          motionCallback({
            onBackwards: () => {
              setNavIsTransitioning(true);
            },
            onForwards: () => {
              setNavIsTransitioning(false);
            }
          })
        ]
      );
      animate(seq);
    }
  );
  // const toggleMenuCallback = useCallback(
  //   ({
  //     isNavOpen,
  //     needsResizing,
  //     top,
  //     right,
  //     bottom,
  //     left,
  //     isMobile,
  //     isAndroid
  //   }: {
  //     isNavOpen: boolean;
  //     needsResizing: boolean;
  //     top: number;
  //     right: number;
  //     bottom: number;
  //     left: number;
  //     isMobile: boolean;
  //     isAndroid: boolean;
  //   }) => {
  //     if (!er.current || !navWindow.current) {
  //       return;
  //     }
  //     setNavIsTransitioning(!0);
  //     const navWClient = (
  //       navWindow.current as HTMLElement
  //     ).getBoundingClientRect();
  //     const windowHeight = (navWindow.current as HTMLElement).offsetHeight;
  //     const windowXOff = navWClient.left;
  //     const windowYOff = navWClient.top;
  //     gsap.killTweensOf([...menuSVgs.current, ...navItems.current, er.current]);
  //
  //     menuFrames.current.forEach((frame, ind) => {
  //       if (!frame) {
  //         return;
  //       }
  //       gsap.killTweensOf(frame);
  //       let xOff: string | number = 0;
  //       let yOff: string | number = 0;
  //       const frameRect = frame.getBoundingClientRect();
  //       if (!isNavOpen) {
  //         switch (ind) {
  //           case 0:
  //             yOff = -frameRect.height + top;
  //             break;
  //           case 1:
  //             xOff = isMobile ? right - 3 : frame.offsetWidth - right;
  //             break;
  //           case 2:
  //             // yOff = isMobile && os.name === 'android' ? frame.offsetHeight : '100%'
  //             yOff = isMobile
  //               ? isAndroid
  //                 ? frameRect.height
  //                 : frameRect.height - 20
  //               : frameRect.height - bottom;
  //             break;
  //           case 3:
  //             xOff = isMobile ? -left + 3 : -frameRect.width + left;
  //         }
  //       }
  //       gsap.to(frame, {
  //         x: xOff,
  //         y: yOff,
  //         autoAlpha: 1,
  //         duration: isNavOpen ? 1.2 : 1.2,
  //         ease: isNavOpen ? "power4.inOut" : "power3.inOut"
  //       });
  //     });
  //     menuCorners.current.forEach((corner, indx) => {
  //       let xoffse = 0;
  //       let yoffse = 0;
  //       if (!corner) {
  //         return;
  //       }
  //       gsap.killTweensOf(corner);
  //       if (!isNavOpen && isMobile && isAndroid) {
  //         const l = menuFrames.current[2];
  //         const c = l?.offsetHeight || 0;
  //         switch (indx) {
  //           case 2:
  //           case 3:
  //             yoffse = c - c / 1.5;
  //         }
  //       }
  //       switch (indx) {
  //         case 0:
  //           if (isNavOpen) {
  //             yoffse = windowYOff;
  //             xoffse = windowXOff;
  //           } else {
  //             yoffse = top;
  //             xoffse = left;
  //           }
  //           break;
  //         case 1:
  //           if (isNavOpen) {
  //             yoffse = windowYOff;
  //             xoffse = -windowXOff;
  //           } else {
  //             yoffse = top;
  //             xoffse = -right;
  //           }
  //           break;
  //         case 2:
  //           if (isNavOpen) {
  //             xoffse = -windowXOff;
  //             yoffse = isMobile
  //               ? -((window.innerHeight - (windowHeight + windowYOff)) * 1) + 1
  //               : -windowYOff;
  //           } else {
  //             yoffse = -bottom;
  //             xoffse = -right;
  //           }
  //           break;
  //         case 3:
  //           if (isNavOpen) {
  //             xoffse = windowXOff;
  //             yoffse = isMobile
  //               ? -((window.innerHeight - (windowHeight + windowYOff)) * 1) + 1
  //               : -windowYOff;
  //           } else {
  //             yoffse = -bottom;
  //             xoffse = left;
  //           }
  //       }
  //
  //       gsap.to(corner, {
  //         x: xoffse,
  //         y: yoffse,
  //         duration: isNavOpen ? 1.2 : 1.2,
  //         ease: isNavOpen ? "power4.inOut" : "power3.inOut"
  //       });
  //     });
  //     menuSVgs.current.forEach((svg) => {
  //       if (svg) {
  //         const m = {
  //           scale: 1,
  //           duration: isNavOpen ? 1.2 : 1.2,
  //           ease: isNavOpen ? "power4.inOut" : "power3.inOut"
  //         };
  //         needsResizing ? gsap.set(svg, m) : gsap.to(svg, m);
  //       }
  //     });
  //     const startLoc = isMobile ? 0 : -150;
  //     const moveTargets = [navigationList.current];
  //
  //     gsap.killTweensOf(moveTargets);
  //     gsap[needsResizing ? "set" : "to"](moveTargets, {
  //       x: isNavOpen ? 0 : startLoc,
  //       autoAlpha: isNavOpen ? 1 : 0,
  //       delay: isNavOpen ? 0.75 : 0,
  //       duration: isNavOpen ? 1.2 : 1.2 * 0.75,
  //       ease: "power3.out"
  //     });
  //     gsap[needsResizing ? "set" : "to"](er.current, {
  //       autoAlpha: isNavOpen ? 1 : 0,
  //       delay: isNavOpen ? 0.5 : 0,
  //       duration: isNavOpen ? 1.2 : 1.2,
  //       onComplete: () => {
  //         setNavIsTransitioning(false);
  //       }
  //     });
  //   },
  //   [setNavIsTransitioning]
  // );

  useEffect(() => {
    (setActiveIndex(-1),
      (isHome && window.innerHeight > H && !isMobile) ||
        navItems.current.forEach((l, c) => {
          l &&
            "true" === l.dataset.isActive &&
            setTimeout(() => {
              setActiveIndex(menuPageItemKeys[c] || -1);
            }, 400);
        }));
  }, [setActiveIndex, menuPageItemKeys, currentPageKey, isHome, isMobile]);

  // useEffect(() => {
  //   resetFrames();
  // }, [resetFrames]);
  useEffect(() => {
    resetFrame();
  }, []);
  const lastNavOpen = useRef(navIsOpen);

  const lenis = useLenis();
  useEffect(() => {
    lenis && lenis[navIsOpen ? "stop" : "start"]();
    document.body.classList[navIsOpen ? "add" : "remove"]("menu__open");
    const needsResizing =
      lastResize.current === 0 || lastResize.current !== resizeTime;
    // toggleMenuCallback({
    //   isNavOpen: navIsOpen,
    //
    //   needsResizing,
    //   top,
    //   right,
    //   bottom,
    //   left,
    //   isAndroid,
    //   isMobile
    // });
    toggM({ needsResizing });
    if (lastNavOpen.current !== navIsOpen || needsResizing) {
      lastResize.current = resizeTime;
    }
    lastNavOpen.current = navIsOpen;
    navIsOpen || setNavItemHovered(-1);
  }, [
    navIsOpen,
    resizeTime,
    setNavItemHovered,
    // toggleMenuCallback,
    lenis,
    // top,
    // right,
    // bottom,
    // left,
    isAndroid,
    isMobile
  ]);

  const onMouseEnter = useCallback(() => {
    setCursorTheme("dark");
  }, [setCursorTheme]);
  const onMouseLeave = useCallback(() => {
    resetCursorTheme();
  }, [resetCursorTheme]);
  return (
    <>
      <div
        ref={menuWrap}
        className={cn("menu__body", { menu__open: navIsOpen })}
      >
        <div
          className="menu__window-pos"
          ref={(el) => {
            el && ((navWindow.current = el), setNavOpeningElement(el));
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={() => {
            setNavIsOpen(false);
            resetCursorTheme();
          }}
          id={B}
        />
        <nav className="menu__navigation">
          <ul
            className="menu__nav-items-list scroll__items"
            ref={navigationList}
          >
            {links.map((l, index) => {
              const theKey = menuPageItemKeys[index];
              const href = l.link.url;
              return (
                <li
                  className="menu__nav-item"
                  key={index + "nav_item"}
                  ref={(el) => {
                    el && (navItems.current[index] = el);
                  }}
                  data-is-active={currentPageKey === theKey}
                  data-themed="color"
                  style={{}}
                >
                  <Link
                    ref={(el: HTMLAnchorElement) => {
                      el && (navButtons.current[index] = el);
                    }}
                    href={href}
                    key={index + "-" + theKey}
                    className={"button__scroll lift__button"}
                    onMouseEnter={() =>
                      handlePagePreviewMouseEnter(theKey || -1)
                    }
                    onMouseLeave={() =>
                      isMobile || handlePagePreviewMouseLeave()
                    }
                    onClick={() => {
                      handlePagePreviewClick(theKey || "default");
                    }}
                  >
                    {l.link.label}
                  </Link>
                  <span className="menu__item-line-container">
                    <span
                      className="menu__item-line"
                      data-themed="background-color"
                      style={{
                        translate: "none",
                        rotate: "none",
                        scale: "none",
                        transform: "translate(102%, 0px)"
                      }}
                      ref={(el) => {
                        el && (navLines.current[index] = el);
                      }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="menu__noti-scroller">
          <div
            className="notifications__list"
            style={{ opacity: 0, visibility: "hidden" }}
          />
        </div>
        <p ref={er} className="menu__year" data-themed="color">
          {`\xa9${lastAdjustRealTime}`}
        </p>
        <div>
          {frames.map((frame, ind) => {
            return (
              <div
                className={cn("menu__frame", `frame-${frame}`)}
                id={`frame-${frame}`}
                ref={(el) => {
                  if (el) {
                    menuFrames.current[ind] = el;
                    keyedFrames.current[`${frame}`] = `frame-${frame}`;
                  }
                }}
                data-themed="background-color"
                key={`${frame + ind}`}
              />
            );
          })}
          {corners.map((corner, ind) => {
            return (
              <div
                className={cn(["menu__frame-corner", `corner-${corner}`])}
                ref={(el) => {
                  if (el) {
                    menuCorners.current[ind] = el;
                    keyedCorners.current[`${corner}`] = `corner-${corner}`;
                  }
                }}
                id={`corner-${corner}`}
                key={corner + "frame"}
              >
                <m.div
                  className="menu__corner-svg"
                  ref={(el) => {
                    if (el) {
                      menuSVgs.current[ind] = el;
                      keyedSvg.current[`${corner}`] = `svg-${corner}`;
                    }
                  }}
                  id={`svg-${corner}`}
                  style={{
                    position: "relative",
                    translate: "none",
                    rotate: "none",
                    scale: "none",
                    transform: "translate(0px, 0px)",
                    width: size,
                    height: size
                  }}
                >
                  <CornerStone
                    side={corner}
                    path={corn[isMobile ? "mobile" : "desktop"][corner]}
                    size={size}
                    viewbox={"0 0 270 270"}
                    pathVariants={pathVariants}
                  />
                </m.div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const CornerStone = (
  props: {
    side: CornerSide;
    path: string;
    size: MotionValue<string>;
    viewbox: MotionValue<string> | string;
    pathVariants: Variants;
  } & SVGAttributes<SVGPathElement>
) => {
  const ref = useRef<SVGSVGElement>(null);

  const { side, path, size, viewbox, pathVariants } = props;

  const theme = useTheme((state) => state.theme);

  return (
    <m.svg
      id={`cs_${side}`}
      ref={ref}
      className={"absolute inset-0 inline-block"}
      viewBox={viewbox}
      style={{ width: size, height: size }}
      variants={{
        initial: {
          opacity: 0,
          visibility: "hidden"
        },
        animate: {
          opacity: 1,
          visibility: "visible",
          transition: {
            duration: 0.4,

            ease: "easeInOut",
            type: "tween"
          }
        },
        exit: {
          opacity: 0,
          visibility: "hidden",
          transition: {
            duration: 0.4,

            ease: "easeInOut",
            type: "tween"
          }
        }
      }}
      animate="animate"
      exit="exit"
    >
      <m.path
        d={path}
        data-themed={theme === "dark" ? "stroke,color" : "fill,color"}
        clipRule="evenodd"
        fillRule="evenodd"
        strokeWidth={theme === "dark" ? 1.2 : 0}
        stroke={
          theme === "dark" ? "oklch(from var(--n-s-bbg) l c h/.04)" : "none"
        }
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pathVariants}
        transition={{
          duration: 0.2,
          ease: EASING.power2.out,
          type: "tween"
        }}
      />
    </m.svg>
  );
};
