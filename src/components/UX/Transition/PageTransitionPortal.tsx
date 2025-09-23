"use client";
import { useCursorStore, useRPStore } from "@/providers/RP_Pro";

import { useLenis } from "lenis/react";

import { useCallback, useEffect, useRef } from "react";

import { useIsMobile } from "@/utilities/getBreakpoints";
import { wait } from "@/utilities/wait";
import { SvgIco } from "../svgIco";
import { portalFrameTransitions, PortalFrameTransitions } from ".";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useShallow } from "zustand/shallow";

export const PageTransitionPortal = () => {
  const frameDir: Array<PortalFrameTransitions> = [
    "top",
    "right",
    "bottom",
    "left"
  ];
  const cornDir: Array<[string, string]> = [
    ["topLeft", "M500 0H0V500C0 223.858 223.858 0 500 0Z"],
    [
      "topRight",
      "M500 500L500 4.19617e-05L1.90735e-05 -2.18557e-05C276.142 0.000249614 500 223.858 500 500Z"
    ],
    ["bottomRight", "M0 500L500 500L500 0C500 276.142 276.142 500 0 500Z"],
    [
      "bottomLeft",
      "M-2.18557e-05 0L0 500L500 500C223.858 500 -9.78513e-06 276.142 -2.18557e-05 0Z"
    ]
  ];
  const frameRefs = useRef<HTMLElement[]>([]),
    cornerRefs = useRef<HTMLElement[]>([]),
    svgRefs = useRef<HTMLElement[]>([]),
    m = useRef(null),
    { isMobile: isMobile } = useIsMobile(),
    pageIsTransitioning = useRPStore(useShallow((l) => l.pageIsTransitioning)),
    transitionOutType = useRPStore(useShallow((l) => l.transitionOutType)),
    setIsTransitioningWipe = useRPStore((l) => l.setIsTransitioningWipe),
    setCanInteract = useRPStore((l) => l.setCanInteract),
    isTransitioningWipe = useRPStore(useShallow((l) => l.isTransitioningWipe)),
    alreadyReset = useRef(false),
    scroll = useLenis(),
    navOpeningElement = useRPStore(useShallow((l) => l.navOpeningElement));
  const VW = useRPStore(useShallow((r) => r.viewportWidth));
  const VH = useRPStore(useShallow((r) => r.viewportHeight));
  const animateTransition = useCallback(
    (h: boolean, p: () => void) => {
      if (
        !frameRefs.current.length ||
        !cornerRefs.current.length ||
        !svgRefs.current.length ||
        !navOpeningElement
      )
        return;
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
          ease: h ? "Power4.easeInOut" : "Power3.easeInOut",
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
        const m = 0.5 * VW;
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
          ease: h ? "Power4.easeInOut" : "Power3.easeInOut"
        });
      });
      svgRefs.current.forEach((l) => {
        l &&
          (gsap.killTweensOf(l),
          gsap.to(l, {
            scale: h ? 1 : 0,
            duration: 0.7,
            ease: h ? "Power4.easeInOut" : "Power3.easeInOut"
          }));
      });
    },
    [frameRefs, cornerRefs, svgRefs]
  );
  const setCur = useCursorStore((r) => r.setCursorState);
  useEffect(() => {
    if (pageIsTransitioning) {
      setCur(null);
    }
  }, [pageIsTransitioning]);
  useEffect(() => {
    if (!isTransitioningWipe || alreadyReset.current) return;
    alreadyReset.current = true;
    const fire = async () => {
      (await wait(10),
        animateTransition(!0, async () => {
          (setCanInteract(!1),
            window.scroll(0, 0),
            scroll &&
              scroll.scrollTo(0, {
                immediate: !0
              }),
            await wait(500),
            window.scroll(0, 0),
            ScrollTrigger.refresh(),
            scroll &&
              scroll.scrollTo(0, {
                immediate: !0
              }),
            scroll && scroll.resize(),
            animateTransition(!1, () => {
              (setIsTransitioningWipe(!1),
                setCanInteract(!0),
                (alreadyReset.current = false),
                scroll && scroll.resize(),
                ScrollTrigger.refresh());
            }));
        }));
    };
    fire();
  }, [
    isMobile,
    pageIsTransitioning,
    transitionOutType,
    animateTransition,
    isTransitioningWipe,
    setIsTransitioningWipe,
    setCanInteract,
    scroll
  ]);
  return (
    <div ref={m} className="pt_container">
      {frameDir.map((v, index) => (
        <div
          data-themed="background-color"
          className={`pt_mask` + ` pt_${v}`}
          style={{
            transform: `translate(${
              portalFrameTransitions.get(v)?.x
            },${portalFrameTransitions.get(v)?.y})`
          }}
          key={v + "pt"}
          ref={(el) => {
            frameRefs.current[index] = el!;
          }}
        ></div>
      ))}
      {cornDir.map((v, index) => (
        <div
          className={`pt_cornerstones pt_${v[0]}`}
          key={v[0] + "corner"}
          ref={(el) => {
            cornerRefs.current[index] = el!;
          }}
        >
          <div
            className="pt_cs_svg"
            ref={(el) => {
              svgRefs.current[index] = el!;
            }}
          >
            <SvgIco
              viewBox="0 0 500 500"
              fill="none"
              paths={[
                v[1]!,
                {
                  fillRule: "evenodd",
                  clipRule: "evenodd",
                  fill: "currentColor",
                  "data-themed": "fill,color"
                }
              ]}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
