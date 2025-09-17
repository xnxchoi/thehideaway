"use client";
import { ReactNode, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";

gsap.registerPlugin(ScrollTrigger);
export const Name = ({
  children,
  colorMatrix,
  composite
}: {
  children: ReactNode;
  colorMatrix: ReactNode;
  composite: ReactNode;
}) => {
  const feBlur = useRef<SVGFEGaussianBlurElement>(null!);

  const feTurbulence = useRef<SVGFETurbulenceElement>(null!);
  const feDisplacementMap = useRef<SVGFEDisplacementMapElement>(null!);
  const primitiveValues = useRef({
    stdDeviation: 0,
    scale: 0,
    baseFrequency: 0
  });
  const titleRef = useRef<HTMLHeadingElement>(null!);
  const animationTimeline = useRef<GSAPTimeline>(null!);
  const scroll = useLenis();
  useEffect(() => {
    scroll?.on("scroll", (e) => ScrollTrigger.update());
    return () => {
      scroll?.off("scroll", (e) => ScrollTrigger.update());
    };
  }, [scroll]);
  useGSAP(() => {
    animationTimeline.current = gsap
      .timeline({
        defaults: {
          duration: 2,
          ease: "expo"
        }, // On every update, set the appropriate attributes in the SVG filters
        onUpdate: () => {
          feBlur.current.setAttribute(
            "stdDeviation",
            "" + primitiveValues.current.stdDeviation
          );
          feDisplacementMap.current.setAttribute(
            "scale",
            primitiveValues.current.scale + ""
          );
          feTurbulence.current.setAttribute(
            "baseFrequency",
            primitiveValues.current.baseFrequency + ""
          );
        },
        scrollTrigger: {
          trigger: titleRef.current, // Trigger the animation when the text enters the viewport
          start: "center bottom"
        }
      })
      .to(
        primitiveValues.current,
        {
          startAt: {
            stdDeviation: 20, // Start with a strong blur
            scale: 100, // Start with a high displacement
            baseFrequency: 0.1 // Start with a higher turbulence frequency
          },
          stdDeviation: 0,
          scale: 0,
          baseFrequency: 0.05
        },
        0
      )
      .to(
        titleRef.current,
        {
          startAt: {
            opacity: 0
          },
          opacity: 1
        },
        0
      );
  });
  return (
    <>
      <filter id="goo-2">
        <feGaussianBlur
          ref={feBlur}
          in="SourceGraphic"
          stdDeviation="0"
          result="blur"
        ></feGaussianBlur>
        {colorMatrix}
        <feTurbulence
          ref={feTurbulence}
          type="turbulence"
          baseFrequency="1"
          numOctaves="1"
          seed="2"
          result="noise"
        ></feTurbulence>
        <feDisplacementMap
          ref={feDisplacementMap}
          in="goo"
          in2="noise"
          scale="0"
          result="displacement"
        ></feDisplacementMap>
        {composite}
      </filter>
      <h2
        ref={titleRef}
        style={{
          filter: `url(#goo-2)`
        }}
        data-filter="goo-2"
        data-script="filter2"
        className="size-xlarge spaced blendmode-1 font-2 color-1 center"
      >
        {children}
      </h2>
    </>
  );
};
