"use client";
import type { PortalFrameTransitions } from "@/components/UX/Transition";
import { TE } from "@/constants/animations";
import { NavEventsProvider } from "@/providers/Navigation/_client-nav-events";
import { useCursor, useRPStore } from "@/providers/RP_Pro";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { createTransStore, type RPT } from "@/stores/RP_Ui";
import { motionCallback } from "@/utilities/motionHelpers";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { AnimationSequence, Segment } from "motion";
import {
  animate,
  useMotionTemplate,
  useMotionValue,
  useTransform
} from "motion/react";
import * as m from "motion/react-m";
import { TransitionRouter } from "next-transition-router";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef
} from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";
import { useIsMobile } from "./MiddleMan";
import { useTheme } from "./Theme";
export type TransAPI = ReturnType<typeof createTransStore>;
export const TransContext = createContext<TransAPI | undefined>(undefined);

const TransitionManager = ({ children }: { children: ReactNode }) => {
  const clearPageTheme = useTheme((l) => l.clearPageTheme);
  const pageType = useVoyageur((l) => l.pageType);
  const scroll = useLenis();
  gsap.registerPlugin(ScrollTrigger);
  const frameDir: Array<PortalFrameTransitions> = useMemo(
    () => ["top", "right", "bottom", "left"],
    []
  );
  const cornDir = useMemo(
    () => ({
      topleft: "M500 0H0V500C0 223.858 223.858 0 500 0Z",
      topright:
        "M500 500L500 4.19617e-05L1.90735e-05 -2.18557e-05C276.142 0.000249614 500 223.858 500 500Z",
      bottomright: "M0 500L500 500L500 0C500 276.142 276.142 500 0 500Z",
      bottomleft:
        "M-2.18557e-05 0L0 500L500 500C223.858 500 -9.78513e-06 276.142 -2.18557e-05 0Z"
    }),
    []
  );
  const cc = useMemo(() => Object.entries(cornDir), [cornDir]);
  const setIsTransitioningWipe = useRPStore((r) => r.setIsTransitioningWipe);

  const isTransitioningWipe = useRPStore(
    useShallow((r) => r.isTransitioningWipe)
  );
  const transitionWipeRef = useRef(false);
  useEffect(() => {
    transitionWipeRef.current = isTransitioningWipe;
  }, [isTransitioningWipe]);

  const hasRun = useRef(false);
  const lenis = useLenis();

  const frameRefs = useRef<HTMLDivElement[]>([]),
    cornerRefs = useRef<HTMLDivElement[]>([]),
    svgRefs = useRef<HTMLDivElement[]>([]),
    { isMobile } = useIsMobile();
  const setTransitionOutType = useRPStore((r) => r.setTransitionOutType);
  const transitionOutType = useRPStore(
    useShallow((state) => state.transitionOutType)
  );
  const scrollRefresher = useCallback(() => {
    scroll && scroll.resize();
  }, [scroll]);
  const slug = useVoyageur((l) => l.slug);
  const pageRef = useRef({ type: pageType, pageSlug: slug });
  const to = useRef<ReturnType<typeof setTimeout>>(null!);
  const rpContainerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const navIsOpen = useRPStore((l) => l.navIsOpen);
  const setPageIsTransitioning = useRPStore((l) => l.setPageIsTransitioning);
  const setCursor = useCursor((r) => r.setCursorState);
  const resetCursorTheme = useCursor((r) => r.resetCursorTheme);
  const resetCursor = useCallback(
    () => (setCursor(null), resetCursorTheme()),
    [resetCursorTheme, setCursor]
  );
  const navisopref = useRef(navIsOpen);
  useEffect(() => {
    navisopref.current = navIsOpen;
  }, [navIsOpen]);
  const setCanInteract = useRPStore((r) => r.setCanInteract);
  const navOpeningElement = useRef<HTMLDivElement>(null!);
  const navElValue = useMotionValue<HTMLDivElement | false>(false);
  useEffect(() => {
    if (!navOpeningElement.current) {
      const promi = async () => {
        while (!document.getElementById("navWindow")) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        const r = document.getElementById("navWindow") as HTMLDivElement;
        navOpeningElement.current = r;
        navElValue.set(r);
      };
      promi();
    }
  }, []);
  const animateIn = useRef<((next: () => void) => void) | null>(null!);

  const animateOut = useRef<((next: () => void) => void) | null>(null!);
  const animationProgress = useMotionValue(0);
  const _svgScale = useTransform(animationProgress, [0, 1], [0, 1]);
  const _frameMoves = useTransform(animationProgress, [0, 1], [100, 0]);
  const _cornerX = useTransform(() => {
    const progress = animationProgress.get();
    const zeroValue = 0;
    const oneValue = 0.5 * window.innerWidth - 1;
    return progress * oneValue;
  });
  const _cornerY = useTransform(() => {
    const progress = animationProgress.get();
    const nEl = navElValue.get();
    const zeroValue = 0;
    const oneValue =
      (!nEl ? window.innerHeight / 2 : nEl.getBoundingClientRect().top) - 1;
    return progress * oneValue;
  });
  const _cornerTLX = useMotionTemplate`${_cornerX}`;
  const _cornerTLY = useMotionTemplate`${_cornerY}`;
  const _cornerTRX = useMotionTemplate`-${_cornerX}`;
  const _cornerTRY = useMotionTemplate`${_cornerY}`;
  const _cornerBRX = useMotionTemplate`-${_cornerX}`;
  const _cornerBRY = useMotionTemplate`-${_cornerY}`;
  const _cornerBLX = useMotionTemplate`${_cornerX}`;
  const _cornerBLY = useMotionTemplate`-${_cornerY}`;
  const _frameT = useMotionTemplate`-${_frameMoves}%`;
  const _frameR = useMotionTemplate`${_frameMoves}%`;
  const _frameB = useMotionTemplate`${_frameMoves}%`;
  const _frameL = useMotionTemplate`-${_frameMoves}%`;
  const _containerOp = useTransform(animationProgress, [0, 0.45], [1, 0]);
  const _containerVis = useTransform(() =>
    _containerOp.get() > 0 ? "visible" : "hidden"
  );

  const completeEntry = useCallback(() => {
    (window.scroll(0, 0),
      ScrollTrigger.refresh(),
      lenis &&
        lenis.scrollTo(0, {
          immediate: !0
        }),
      lenis && lenis.resize(),
      document.body.style.setProperty("pointer-events", "auto"));
    setCanInteract(true);
  }, [lenis, setCanInteract]);
  const completeExfil = useCallback(() => {
    setCanInteract(false);
    (window.scroll(0, 0),
      lenis &&
        lenis.scrollTo(0, {
          immediate: !0
        }));
  }, [lenis, setCanInteract]);

  // useEffect(() => {
  //   !animateIn.current &&
  //     (animateIn.current = (next: () => void) => {
  //       if (
  //         !frameRefs.current.length ||
  //         !cornerRefs.current.length ||
  //         !svgRefs.current.length ||
  //         !navOpeningElement.current ||
  //         !rpContainerRef.current
  //       ) {
  //         console.log("transition failed");
  //         return;
  //       }
  //       const seq: AnimationSequence = [];
  //       seq.push([
  //         rpContainerRef.current,
  //         {
  //           opacity: 1,
  //           visibility: "visible"
  //         },
  //         {
  //           duration: 0.3,
  //           ease: TE.power3.inOut,
  //           at: 0.1,
  //           type: "tween"
  //         }
  //       ]);
  //
  //       seq.push(
  //         ...frameRefs.current.map((l, c) => {
  //           let xMove: number | string = 0,
  //             yMove: number | string = 0;
  //           switch (c) {
  //             case 0:
  //               yMove = "-100%";
  //               break;
  //             case 1:
  //               xMove = "100%";
  //               break;
  //             case 2:
  //               yMove = "100%";
  //               break;
  //             case 3:
  //               xMove = "-100%";
  //           }
  //
  //           return [
  //             l,
  //             { x: xMove, y: yMove },
  //             {
  //               duration: 0.7,
  //               ease: TE.power3.inOut,
  //               at: 0.1,
  //               type: "tween"
  //             }
  //           ] satisfies Segment;
  //         })
  //       );
  //       seq.push(
  //         ...cornerRefs.current.map(
  //           (l) =>
  //             [
  //               l,
  //               {
  //                 x: 0,
  //                 y: 0
  //               },
  //               {
  //                 duration: 0.7,
  //                 ease: TE.power3.inOut,
  //                 type: "tween",
  //                 at: 0.1
  //               }
  //             ] satisfies Segment
  //         ),
  //         ...svgRefs.current.map(
  //           (l) =>
  //             [
  //               l,
  //               { scale: 1 },
  //               {
  //                 ease: TE.power3.inOut,
  //                 duration: 0.7,
  //                 at: 0.1,
  //                 type: "tween"
  //               }
  //             ] satisfies Segment
  //         ),
  //         [
  //           motionCallback(() => {
  //             completeEntry();
  //             next();
  //           }),
  //           {
  //             duration: 0
  //           }
  //         ]
  //       );
  //
  //       animate(seq);
  //     });
  //   !animateOut.current &&
  //     (animateOut.current = (next: () => void) => {
  //       if (
  //         !frameRefs.current.length ||
  //         !cornerRefs.current.length ||
  //         !svgRefs.current.length ||
  //         !navOpeningElement.current
  //       ) {
  //         console.log("transition failed");
  //         return;
  //       }
  //       const v = navOpeningElement.current.getBoundingClientRect().top;
  //       animate([
  //         ...frameRefs.current.map((l) => {
  //           return [
  //             l,
  //             {
  //               x: 0,
  //               y: 0
  //             },
  //             { duration: 0.7, ease: TE.power4.inOut, at: 0, type: "tween" }
  //           ] satisfies Segment;
  //         }),
  //
  //         ...cornerRefs.current.map((l, c) => {
  //           let d = 0;
  //           let p = 0;
  //           const m = 0.5 * window.innerWidth;
  //
  //           switch (c) {
  //             case 0:
  //               ((p = v - 1), (d = m - 1));
  //               break;
  //             case 1:
  //               ((p = v - 1), (d = -m + 1));
  //               break;
  //             case 2:
  //               ((d = -m + 1), (p = -v + 1));
  //               break;
  //             case 3:
  //               ((d = m - 1), (p = -v + 1));
  //           }
  //           return [
  //             l,
  //             {
  //               x: d,
  //               y: p
  //             },
  //             {
  //               duration: 0.7,
  //               ease: TE.power4.inOut,
  //               type: "tween",
  //               at: 0
  //             }
  //           ] satisfies Segment;
  //         }),
  //         ...svgRefs.current.map((l) => {
  //           return [
  //             l,
  //             {
  //               scale: 0
  //             },
  //             { duration: 0.7, ease: TE.power4.inOut, at: 0, type: "tween" }
  //           ] satisfies Segment;
  //         }),
  //         [
  //           motionCallback(() => {
  //             completeExfil();
  //             next();
  //           }),
  //           {
  //             duration: 0
  //           }
  //         ] satisfies Segment
  //       ]);
  //
  //       hasRun.current = true;
  //       setTimeout(() => {
  //         hasRun.current = false;
  //       }, 700);
  //     });
  // }, [completeExfil, completeEntry]);
  // const animateTransition = useCallback(
  //   (animateOut: boolean, onComplete?: () => void | Promise<void>) => {
  //     if (
  //       !frameRefs.current.length ||
  //       !cornerRefs.current.length ||
  //       !svgRefs.current.length ||
  //       !navOpeningElement.current
  //     ) {
  //       // console.log("transition failed");
  //       return;
  //     }
  //     const g = navOpeningElement.current.getBoundingClientRect(),
  //       v = g.top;
  //     frameRefs.current.forEach((l, c) => {
  //       if (!l) return;
  //       gsap.killTweensOf(l);
  //       let xMove: number | string = 0,
  //         yMove: number | string = 0;
  //       if (!animateOut) {
  //         switch (c) {
  //           case 0:
  //             yMove = "-100%";
  //             break;
  //           case 1:
  //             xMove = "100%";
  //             break;
  //           case 2:
  //             yMove = "100%";
  //             break;
  //           case 3:
  //             xMove = "-100%";
  //         }
  //       }
  //       gsap.to(l, {
  //         x: xMove,
  //         y: yMove,
  //         duration: 0.7,
  //         ease: animateOut ? "power4.inOut" : "power3.inOut",
  //         onComplete: () => {
  //           0 === c && onComplete && onComplete();
  //         }
  //       });
  //       gsap.killTweensOf(".rp-container");
  //       gsap.to(".rp-container", {
  //         autoAlpha: 1,
  //         duration: 0.3,
  //         ease: "power3.inOut",
  //         onStart: () => {
  //           // console.log("curtain here setting rp to visible");
  //         }
  //       });
  //     });
  //     cornerRefs.current.forEach((l, c) => {
  //       if (!l) return;
  //       gsap.killTweensOf(l);
  //       let d = 0;
  //       let p = 0;
  //       const m = 0.5 * window.innerWidth;
  //       if (animateOut) {
  //         switch (c) {
  //           case 0:
  //             ((p = v - 1), (d = m - 1));
  //             break;
  //           case 1:
  //             ((p = v - 1), (d = -m + 1));
  //             break;
  //           case 2:
  //             ((d = -m + 1), (p = -v + 1));
  //             break;
  //           case 3:
  //             ((d = m - 1), (p = -v + 1));
  //         }
  //       }
  //       gsap.to(l, {
  //         x: d,
  //         y: p,
  //         duration: 0.7,
  //         ease: animateOut ? "power4.inOut" : "power3.inOut"
  //       });
  //     });
  //     svgRefs.current.forEach((l) => {
  //       l &&
  //         (gsap.killTweensOf(l),
  //         gsap.to(l, {
  //           scale: animateOut ? 1 : 0,
  //           duration: 0.7,
  //           ease: animateOut ? "power4.inOut" : "power3.inOut"
  //         }));
  //     });
  //     if (!animateOut) {
  //       gsap.killTweensOf(".rp-container");
  //       gsap.to(".rp-container", {
  //         autoAlpha: 1,
  //         duration: 0.3,
  //         ease: "power3.inOut",
  //         onStart: () => {
  //           // console.log("curtain here setting rp to visible");
  //         }
  //       });
  //     }
  //   },
  //   []
  // );
  // const fadeInPage = useCallback(() => {
  //   gsap.killTweensOf(".rp-container");
  //   gsap.to(".rp-container", {
  //     autoAlpha: 1,
  //     duration: 0.3,
  //     ease: "power3.inOut",
  //     onStart: () => {
  //       // console.log("curtain here setting rp to visible");
  //     }
  //   });
  // }, []);
  const entry = useCallback((next: () => void) => {
    const seq: AnimationSequence = [
      [
        animationProgress,
        0,
        { duration: 0.3, ease: TE.power3.inOut, type: "tween" }
      ],
      [
        motionCallback(() => {
          completeEntry();
          next();
        })
      ]
    ];
    animate(seq);
  }, []);
  const exit = useCallback((next: () => void) => {
    const seq: AnimationSequence = [
      [
        animationProgress,
        1,
        { duration: 0.7, ease: TE.power4.inOut, at: 0, type: "tween" }
      ],
      [
        motionCallback(() => {
          completeExfil();
          next();
        })
      ]
    ];
    animate(seq);
  }, []);
  // const fire = useCallback(async () => {
  //   hasRun.current = true;

  //   await delay(50);

  //   animateTransition(true, completeExfil);
  // }, [animateTransition, completeExfil]);
  // useEffect(() => {
  //   if (transitionOutType !== null || !isTransitioningWipe || hasRun.current)
  //     return;
  //   fire();
  // }, [
  //   animateTransition,
  //   transitionOutType,
  //   isTransitioningWipe,
  //   fadeInPage,
  //   completeExfil,
  //   fire
  // ]);
  const scrollToTop = useCallback(() => window.scroll(0, 0), []);
  const navOpenRef = useRef(navIsOpen);
  useEffect(() => {
    navOpenRef.current = navIsOpen;
  }, [navIsOpen]);
  const indexToI = useCallback((index: number) => {
    switch (index) {
      case 0:
        return {
          x: _cornerTLX,
          y: _cornerTLY
        };
      case 1:
        return {
          x: _cornerTRX,
          y: _cornerTRY
        };
      case 2:
        return {
          x: _cornerBRX,
          y: _cornerBRY
        };
      case 3:
        return {
          x: _cornerBLX,
          y: _cornerBLY
        };
    }
  }, []);
  const indexToFrame = useCallback((index: number) => {
    switch (index) {
      case 0:
        return {
          x: 0,
          y: _frameT
        };
      case 1:
        return { x: _frameR, y: 0 };
      case 2:
        return { x: 0, y: _frameB };
      case 3:
        return { x: _frameL, y: 0 };
    }
  }, []);
  return (
    <TransitionRouter
      leave={(next: () => void, from?: string, to?: string) => {
        if (navIsOpen || transitionOutType !== null || hasRun.current) {
          // console.log("transitioning out, not wipe");
          completeExfil();
          next();
        } else {
          // console.log("transitioning out, wipe");
          exit(next);
        }
      }}
      enter={(next: () => void, from?: string, to?: string) => {
        entry(next);
        setIsTransitioningWipe(false);
        setTransitionOutType(null);
      }}
    >
      <m.div
        className="rp-container"
        ref={rpContainerRef}
        data-themed={"background-color"}
        style={{
          opacity: _containerOp,
          visibility: _containerVis
        }}
      >
        {children}
      </m.div>
      <div ref={portalRef} className="pt_container">
        {frameDir.map((v, index) => (
          <m.div
            data-themed="background-color"
            className={`pt_mask pt_${v}`}
            key={v + "pt"}
            ref={(el) => {
              el && (frameRefs.current[index] = el);
            }}
            style={{
              ...indexToFrame(index)
            }}
          ></m.div>
        ))}
        {cc.map(([key, value], index) => (
          <m.div
            className={`pt_cornerstones pt_${key}`}
            key={key + "corner"}
            ref={(el) => {
              el && (cornerRefs.current[index] = el);
            }}
            style={{
              ...indexToI(index)
            }}
          >
            <m.div
              className="pt_cs_svg"
              ref={(el) => {
                el && (svgRefs.current[index] = el);
              }}
              style={{
                scale: _svgScale
              }}
            >
              <m.svg viewBox="0 0 500 500" fill="none">
                <m.path
                  d={value}
                  {...{
                    fillRule: "evenodd",
                    clipRule: "evenodd",
                    fill: "currentColor",
                    "data-themed": "fill,color"
                  }}
                />
              </m.svg>
            </m.div>
          </m.div>
        ))}
      </div>
    </TransitionRouter>
  );
};
const TransContextProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<TransAPI>(undefined);
  if (!storeRef.current) {
    storeRef.current = createTransStore();
  }
  return (
    <TransContext.Provider value={storeRef.current}>
      {children}{" "}
    </TransContext.Provider>
  );
};
export const TransitionProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TransContextProvider>
      <TransitionManager>
        <NavEventsProvider>{children}</NavEventsProvider>
      </TransitionManager>
    </TransContextProvider>
  );
};
export const useRPTransition = <T,>(selector: (store: RPT) => T): T => {
  const transContext = useContext(TransContext);
  if (!transContext) {
    throw new Error("useRPTransition must be used within TransProvider");
  }
  return useStore(transContext, selector);
};
