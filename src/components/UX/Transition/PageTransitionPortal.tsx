"use client";
import { useRPStore } from "@/providers/RP_Pro";

import { useLenis } from "lenis/react";

import { useMemo, useRef } from "react";

import { useIsMobile } from "@/utilities/getBreakpoints";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useShallow } from "zustand/shallow";
import { portalFrameTransitions, PortalFrameTransitions } from ".";
import { usePortaller } from "./Portaller";
export const PageTransitionPortal = () => {
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
  const frameRefs = useRef<HTMLDivElement[]>([]),
    cornerRefs = useRef<HTMLDivElement[]>([]),
    svgRefs = useRef<HTMLDivElement[]>([]),
    m = useRef(null),
    { isMobile: isMobile } = useIsMobile(),
    pageIsTransitioning = useRPStore(useShallow((l) => l.pageIsTransitioning)),
    transitionOutType = useRPStore(useShallow((l) => l.transitionOutType)),
    setIsTransitioningWipe = useRPStore((l) => l.setIsTransitioningWipe),
    setCanInteract = useRPStore((l) => l.setCanInteract),
    isTransitioningWipe = useRPStore(useShallow((l) => l.isTransitioningWipe)),
    alreadyReset = useRef(false),
    scroll = useLenis();
  const setAnimateFn = usePortaller((l) => l.setAnimateFn);
  const animateTransition = useRef<(h: boolean, p?: () => void) => void>(null!);
  useGSAP(() => {
    ((animateTransition.current = (h: boolean, p?: () => void) => {
      const navOpeningElement = document.getElementById("navWindow");
      if (
        !frameRefs.current.length ||
        !cornerRefs.current.length ||
        !svgRefs.current.length ||
        !navOpeningElement
      ) {
        console.log("transition failed");
        return;
      }
      const g = navOpeningElement.getBoundingClientRect(),
        v = g.top;
      frameRefs.current.forEach((l, c) => {
        if (!l) return;
        gsap.killTweensOf(l);
        let xMove: number | string = 0,
          yMove: number | string = 0;
        if (!h)
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
          ease: h ? "power4.inOut" : "power3.inOut",
          onComplete: () => {
            0 === c && p && p();
          }
        });
      });
      cornerRefs.current.forEach((l, c) => {
        if (!l) return;
        gsap.killTweensOf(l);
        let d = 0;
        let p = 0;
        const m = 0.5 * window.innerWidth;
        if (h)
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
          ease: h ? "power4.inOut" : "power3.inOut"
        });
      });
      svgRefs.current.forEach((l) => {
        l &&
          (gsap.killTweensOf(l),
          gsap.to(l, {
            scale: h ? 1 : 0,
            duration: 0.7,
            ease: h ? "power4.inOut" : "power3.inOut"
          }));
      });
      setAnimateFn(animateTransition.current);
    }),
      []);
  });

  return (
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
  );
};
