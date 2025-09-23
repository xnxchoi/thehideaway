"use client";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { useMenu, useRPStore } from "@/providers/RP_Pro";
import { useRef } from "react";
import { AnimatePresence } from "motion/react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useShallow } from "zustand/shallow";

export const FXFrame = () => {
  const showFXFrame = useRPStore(useShallow((l) => l.showFXFrame));
  const fxWrapperRef = useRef<HTMLDivElement>(null!);
  const { right, left, bottom } = useMenu(useShallow((r) => r.frames));
  const showHeader = useRPStore(useShallow((r) => r.showHeader));
  useGSAP(
    () => {
      if (fxWrapperRef.current) {
        gsap.to(fxWrapperRef.current, {
          autoAlpha: showFXFrame ? 1 : 0,
          left: left,
          right: right,
          bottom: bottom,
          duration: 0.4,
          ease: "power3.easeInOut"
        });
        gsap.to("[data-footer-fx]", {
          bottom: bottom,
          duration: 0.4,
          ease: "power3.easeInOut"
        });
      }
    },
    { dependencies: [showFXFrame, bottom, left, right], scope: fxWrapperRef }
  );
  return (
    <AnimatePresence>
      {showFXFrame && showHeader && (
        <m.div
          ref={fxWrapperRef}
          initial={{ visibility: "hidden", opacity: 0 }}
          animate={{
            visibility: "visible",
            opacity: 1,
            transition: {
              duration: 0.3,
              ease: "easeIn"
            }
          }}
          exit={{
            opacity: 0,
            transition: {
              duration: 0.2,
              ease: "easeOut"
            }
          }}
          className={cn(
            "margin-left-auto margin-right-auto position-fixed pointer-events-none inset-0 z-10 data-[visible=false]:animate-out data-[visible=false]:fade-out-0 data-[visible=true]:animate-in data-[visible=true]:fade-in-0"
          )}
        >
          {/*bottom-fx soft */}
          <div
            data-footer-fx
            data-themed={"background-color"}
            className="pointer-events-none absolute fixed top-auto bottom-[20px] z-10 h-[80px] w-full bg-[oklch(var(--black)/0)] mask-[linear-gradient(transparent,oklch(var(--black)/1))] opacity-75 backdrop-filter-[brightness(100%)_blur(5px)_contrast(500%)_saturate(1500%)]"
          ></div>
          <div
            data-footer-fx
            data-themed={"background-color"}
            className="pointer-events-none fixed top-auto bottom-[20px] z-10 h-[60px] w-full mask-[linear-gradient(transparent,oklch(var(--black)/1))] opacity-75 backdrop-filter-[hue-rotate(0deg)_brightness(110%)_blur(5px)_contrast(500%)_saturate(1500%)]"
          ></div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
