import { NavEventsProvider } from "@/providers/Navigation/_client-nav-events";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { TransitionRouter } from "next-transition-router";
import { useShallow } from "zustand/shallow";

import type { PortalFrameTransitions } from "@/components/UX/Transition";
import { useCursor, useRPStore } from "@/providers/RP_Pro";
import { createTransStore, type RPT } from "@/stores/RP_Ui";
import { useGSAP } from "@gsap/react";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef
} from "react";
import { useStore } from "zustand";
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
  const setIsTransitioningWipe = useRPStore((r) => r.setIsTransitioningWipe);

  const isTransitioningWipe = useRPStore((r) => r.isTransitioningWipe);
  const transitionWipeRef = useRef(false);
  useEffect(() => {
    transitionWipeRef.current = isTransitioningWipe;
  }, [isTransitioningWipe]);

  const hasRun = useRef(false);
  const lenis = useLenis();

  const frameRefs = useRef<HTMLDivElement[]>([]),
    cornerRefs = useRef<HTMLDivElement[]>([]),
    svgRefs = useRef<HTMLDivElement[]>([]),
    m = useRef(null),
    { isMobile: isMobile } = useIsMobile();
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

  useEffect(() => {
    if (!navOpeningElement.current) {
      const promi = async () => {
        while (!document.getElementById("navWindow")) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        navOpeningElement.current = document.getElementById(
          "navWindow"
        ) as HTMLDivElement;
      };
      promi();
    }
  }, []);
  const animateIn = useRef<((next: () => void) => void) | null>(null!);

  const animateOut = useRef<((next: () => void) => void) | null>(null!);
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
  useGSAP(() => {
    !animateIn.current &&
      (animateIn.current = (next: () => void) => {
        if (
          !frameRefs.current.length ||
          !cornerRefs.current.length ||
          !svgRefs.current.length ||
          !navOpeningElement.current
        ) {
          console.log("transition failed");
          return;
        }
        gsap.killTweensOf(".rp-container");

        gsap.to(".rp-container", {
          autoAlpha: 1,
          duration: 0.3,
          onComplete: () => {
            next();
            completeEntry();
          },
          ease: "power3.inOut"
        });
        frameRefs.current.forEach((l, c) => {
          if (!l) return;
          gsap.killTweensOf(l);
          let xMove: number | string = 0,
            yMove: number | string = 0;

          switch (c) {
            case 0:
              yMove = "-100%";
              break;
            case 1:
              xMove = "100%";
              break;
            case 2:
              yMove = "100%";
              break;
            case 3:
              xMove = "-100%";
          }

          gsap.to(l, {
            x: xMove,
            y: yMove,
            duration: 0.7,
            ease: "power3.inOut"
          });
        });
        cornerRefs.current.forEach((l) => {
          if (!l) return;
          gsap.killTweensOf(l);
        });
        gsap.to(cornerRefs.current, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "power3.inOut"
        });
        svgRefs.current.forEach((l) => {
          if (!l) return;
          gsap.killTweensOf(l);
        });
        gsap.to(svgRefs.current, {
          scale: 1,
          duration: 0.7,
          ease: "power3.inOut"
        });
      });
    !animateOut.current &&
      (animateOut.current = (next: () => void) => {
        if (
          !frameRefs.current.length ||
          !cornerRefs.current.length ||
          !svgRefs.current.length ||
          !navOpeningElement.current
        ) {
          console.log("transition failed");
          return;
        }
        const v = navOpeningElement.current.getBoundingClientRect().top;
        gsap.killTweensOf(".rp-container");

        gsap.to(".rp-container", {
          autoAlpha: 0,
          duration: 0.3,

          ease: "power3.inOut"
        });
        frameRefs.current.forEach((l) => {
          if (!l) return;
          gsap.killTweensOf(l);
        });
        gsap.to(frameRefs.current, {
          x: 0,
          y: 0,
          duration: 0.7,
          onComplete: () => {
            completeExfil();
            next();
          },
          ease: "power4.inOut"
        });
        cornerRefs.current.forEach((l, c) => {
          if (!l) return;
          gsap.killTweensOf(l);
          let d = 0;
          let p = 0;
          const m = 0.5 * window.innerWidth;

          switch (c) {
            case 0:
              ((p = v - 1), (d = m - 1));
              break;
            case 1:
              ((p = v - 1), (d = -m + 1));
              break;
            case 2:
              ((d = -m + 1), (p = -v + 1));
              break;
            case 3:
              ((d = m - 1), (p = -v + 1));
          }
          gsap.to(l, {
            x: d,
            y: p,
            duration: 0.7,
            ease: "power4.inOut"
          });
        });
        svgRefs.current.forEach((l) => {
          if (!l) return;
          gsap.killTweensOf(l);
        });
        gsap.to(svgRefs.current, {
          scale: 0,
          duration: 0.7,
          ease: "power4.inOut"
        });
        hasRun.current = true;
        setTimeout(() => {
          hasRun.current = false;
        }, 700);
      });
  }, [completeExfil, completeEntry]);
  const animateTransition = useCallback(
    (animateOut: boolean, onComplete?: () => void | Promise<void>) => {
      if (
        !frameRefs.current.length ||
        !cornerRefs.current.length ||
        !svgRefs.current.length ||
        !navOpeningElement.current
      ) {
	      // console.log("transition failed");
        return;
      }
      const g = navOpeningElement.current.getBoundingClientRect(),
        v = g.top;
      frameRefs.current.forEach((l, c) => {
        if (!l) return;
        gsap.killTweensOf(l);
        let xMove: number | string = 0,
          yMove: number | string = 0;
        if (!animateOut) {
          switch (c) {
            case 0:
              yMove = "-100%";
              break;
            case 1:
              xMove = "100%";
              break;
            case 2:
              yMove = "100%";
              break;
            case 3:
              xMove = "-100%";
          }
        }
        gsap.to(l, {
          x: xMove,
          y: yMove,
          duration: 0.7,
          ease: animateOut ? "power4.inOut" : "power3.inOut",
          onComplete: () => {
            0 === c && onComplete && onComplete();
          }
        });
        gsap.killTweensOf(".rp-container");
        gsap.to(".rp-container", {
          autoAlpha: 1,
          duration: 0.3,
          ease: "power3.inOut",
          onStart: () => {
	          // console.log("curtain here setting rp to visible");
          }
        });
      });
      cornerRefs.current.forEach((l, c) => {
        if (!l) return;
        gsap.killTweensOf(l);
        let d = 0;
        let p = 0;
        const m = 0.5 * window.innerWidth;
        if (animateOut) {
          switch (c) {
            case 0:
              ((p = v - 1), (d = m - 1));
              break;
            case 1:
              ((p = v - 1), (d = -m + 1));
              break;
            case 2:
              ((d = -m + 1), (p = -v + 1));
              break;
            case 3:
              ((d = m - 1), (p = -v + 1));
          }
        }
        gsap.to(l, {
          x: d,
          y: p,
          duration: 0.7,
          ease: animateOut ? "power4.inOut" : "power3.inOut"
        });
      });
      svgRefs.current.forEach((l) => {
        l &&
          (gsap.killTweensOf(l),
          gsap.to(l, {
            scale: animateOut ? 1 : 0,
            duration: 0.7,
            ease: animateOut ? "power4.inOut" : "power3.inOut"
          }));
      });
      if (!animateOut) {
        gsap.killTweensOf(".rp-container");
        gsap.to(".rp-container", {
          autoAlpha: 1,
          duration: 0.3,
          ease: "power3.inOut",
          onStart: () => {
	          // console.log("curtain here setting rp to visible");
          }
        });
      }
    },
    []
  );
  const fadeInPage = useCallback(() => {
    gsap.killTweensOf(".rp-container");
    gsap.to(".rp-container", {
      autoAlpha: 1,
      duration: 0.3,
      ease: "power3.inOut",
      onStart: () => {
	      // console.log("curtain here setting rp to visible");
      }
    });
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

  return (
    <TransitionRouter
      leave={(next: () => void, from?: string, to?: string) => {
        if (navIsOpen || transitionOutType !== null || hasRun.current) {
	        // console.log("transitioning out, not wipe");
          completeExfil();
          next();
        } else {
	        // console.log("transitioning out, wipe");
          animateOut.current?.(next);
        }
      }}
      enter={(next: () => void, from?: string, to?: string) => {
        animateIn.current?.(next);
        setIsTransitioningWipe(false);
        setTransitionOutType(null);
      }}
    >
      {children}
      <div ref={m} className="pt_container">
        {frameDir.map((v, index) => (
          <div
            data-themed="background-color"
            className={`pt_mask pt_${v}`}
            key={v + "pt"}
            ref={(el) => {
              el && (frameRefs.current[index] = el);
            }}
          ></div>
        ))}
        {Object.entries(cornDir).map(([key, value], index) => (
          <div
            className={`pt_cornerstones pt_${key}`}
            key={key + "corner"}
            ref={(el) => {
              el && (cornerRefs.current[index] = el);
            }}
          >
            <div
              className="pt_cs_svg"
              ref={(el) => {
                el && (svgRefs.current[index] = el);
              }}
            >
              <svg viewBox="0 0 500 500" fill="none">
                <path
                  d={value}
                  {...{
                    fillRule: "evenodd",
                    clipRule: "evenodd",
                    fill: "currentColor",
                    "data-themed": "fill,color"
                  }}
                />
              </svg>
            </div>
          </div>
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
