"use client";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { useMenu, useRPStore } from "@/providers/RP_Pro";
import { useEffect, useRef } from "react";
import { AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useShallow } from "zustand/shallow";
import { springGSAP } from "@/constants/animations";

export const FXFrame = () => {
  const showFXFrame = useRPStore(useShallow((l) => l.showFXFrame));
  const setShowFXFrame = useRPStore((l) => l.setFXFrameVisibility);
  const fxWrapperRef = useRef<HTMLDivElement>(null!);
  const left = useMenu(useShallow((l) => l.left));
  const right = useMenu(useShallow((l) => l.right));
  const bottom = useMenu(useShallow((l) => l.bottom));
  const showHeader = useRPStore(useShallow((r) => r.showHeader));

  const l = useSpring(left, {
    ...springGSAP.power3.inOut,
    visualDuration: 0.4
  });
  const r = useSpring(right, {
    ...springGSAP.power3.inOut,
    visualDuration: 0.4
  });
  const b = useSpring(bottom, {
    ...springGSAP.power3.inOut,
    visualDuration: 0.4
  });
  useGSAP(
    () => {
      if (fxWrapperRef.current) {
        gsap.to(fxWrapperRef.current, {
          autoAlpha: showFXFrame ? 1 : 0,

          duration: 0.4,
          ease: "power3.inOut"
        });
      }
    },
    { dependencies: [showFXFrame, bottom, left, right], scope: fxWrapperRef }
  );
  useEffect(() => {
    if (fxWrapperRef.current) {
      b.set(bottom);
      l.set(left);
      r.set(right);
    }
  }, [b, bottom, l, left, r, right]);
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
          style={{
            left: l,
            right: r,
            bottom: b
          }}
        >
          {/*bottom-fx soft */}
          <m.div
            data-footer-fx
            data-themed={"background-color"}
            className="pointer-events-none absolute fixed top-auto z-10 h-[80px] w-full bg-black/0 mask-[linear-gradient(transparent,var(--black))] opacity-75 backdrop-filter-[brightness(100%)_blur(5px)_contrast(500%)_saturate(1500%)]"
            style={{
              bottom: b
            }}
          ></m.div>
          <m.div
            data-footer-fx
            data-themed={"background-color"}
            className="pointer-events-none fixed top-auto z-10 h-[60px] w-full mask-[linear-gradient(transparent,var(--black))] opacity-75 backdrop-filter-[hue-rotate(0deg)_brightness(110%)_blur(5px)_contrast(500%)_saturate(1500%)]"
            style={{
              bottom: b
            }}
          ></m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
