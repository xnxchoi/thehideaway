"use client";
import { cn } from "@/lib/utils";
import { useRPStore } from "@/providers/RP_Pro";
import { useWindowResize } from "@/utilities/use_window_resize";
import { gsap } from "gsap";
import { useMotionValue } from "motion/react";
import { Fragment, ReactNode, useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";

export function ContentMask(l: { children: ReactNode }) {
  const windowResize = useWindowResize({ detectHeightChange: true });

  const canInteract = useRPStore(useShallow((l) => l.canInteract));
  const clipType = "content-mask-clipping",
    k = 1.8,
    { children: c } = l,
    svgRef = useRef<SVGSVGElement>(null!),
    rectRef = useRef<SVGRectElement>(null!),
    middlePositioningRef = useRef<HTMLDivElement>(null!),
    contentMaskRef = useRef<HTMLDivElement>(null!),
    contentRef = useRef<HTMLDivElement>(null!),
    isPreloader = useRPStore(useShallow((l) => l.isPreloader)),
    setIsPreloader = useRPStore((l) => l.setIsPreloader),
    setIsAnimatingOutPreloader = useRPStore(
      (l) => l.setIsAnimatingOutPreloader
    ),
    enablePreloaderAnimation = useRPStore((l) => l.enablePreloaderAnimation),
    timelineRef = useRef<GSAPTimeline>(null),
    preloaderAnimationType = useRPStore(
      useShallow((l) => l.preloaderAnimationType)
    );
  const svgWidth = useMotionValue(1440);
  const svgHeight = useMotionValue(950);
  useEffect(() => {
    svgWidth.set(window.innerWidth);
    svgHeight.set(window.innerHeight);
  }, [svgHeight, svgWidth]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--vh",
      window.innerHeight * 0.01 + "px"
    );
    svgWidth.set(window.innerWidth);
    svgHeight.set(window.innerHeight);
  }, [svgHeight, svgWidth, windowResize]);
  const setPositioningRectDimensions = useCallback(() => {
      if (
        !svgRef.current ||
        !rectRef.current ||
        !middlePositioningRef.current ||
        !contentMaskRef.current
      )
        return;
      gsap.set(svgRef.current, {
        width: window.innerWidth,
        height: window.innerHeight
      });
      const c = middlePositioningRef.current.offsetHeight,
        h = middlePositioningRef.current.getBoundingClientRect().top;
      gsap.set(rectRef.current, {
        width: 0,
        height: c,
        attr: {
          y: h,
          x: 0.5 * window.innerWidth,
          rx: 0
        }
      });
    }, []),
    setPreloaderAnimation = useCallback(() => {
      if (!middlePositioningRef.current) return;
      (timelineRef.current && timelineRef.current.kill(),
        (timelineRef.current = gsap.timeline({
          onComplete: () => {
            setIsPreloader(!1);
          }
        })));
      const d = middlePositioningRef.current.offsetWidth,
        { left: h } = middlePositioningRef.current.getBoundingClientRect() || {
          left: 0
        };
      "FAST" === preloaderAnimationType
        ? gsap.set(rectRef.current, {
            attr: {
              rx: 15
            }
          })
        : timelineRef.current.to(rectRef.current, {
            width: d,
            attr: {
              x: h,
              rx: 15
            },
            delay: 0.2,
            duration: 1,
            ease: "power3.inOut"
          });
      const delayTime = "FAST" === preloaderAnimationType ? 0 : 3,
        g = k;
      timelineRef.current.to(
        rectRef.current,
        {
          width: window.innerWidth,
          height: window.innerHeight,
          attr: {
            y: 0,
            x: 0,
            rx: 0
          },
          duration: g,
          ease: "power3.inOut",
          delay: delayTime,
          onStart: () => {
            setIsAnimatingOutPreloader(!0);
          }
        },
        0
      );
    }, [setIsPreloader, preloaderAnimationType, setIsAnimatingOutPreloader]);

  useEffect(() => {
    (setPositioningRectDimensions(),
      enablePreloaderAnimation && setPreloaderAnimation());
  }, [
    setPreloaderAnimation,
    windowResize,
    enablePreloaderAnimation,
    setPositioningRectDimensions
  ]);
  return (
    <Fragment>
      {isPreloader && (
        <div ref={middlePositioningRef} className="middlePositioning" />
      )}
      <div
        ref={contentMaskRef}
        className={cn("content-mask", { ["isPreloader"]: isPreloader })}
        style={isPreloader ? { clipPath: `url("#${clipType}")` } : undefined}
      >
        <div
          style={{ pointerEvents: canInteract ? "auto" : "none" }}
          ref={contentRef}
          className={"mask__content"}
        >
          {c}
        </div>
        {isPreloader && (
          <svg ref={svgRef} className="svg-content">
            <defs>
              <clipPath id={clipType}>
                <rect
                  className="rect"
                  ref={rectRef}
                  fill="white"
                  y={0}
                  x={0}
                  rx={0}
                  width={0}
                  height={0}
                />
              </clipPath>
            </defs>
          </svg>
        )}
      </div>
    </Fragment>
  );
}
