"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";
import Lenis from "lenis";
import { useLenis } from "lenis/react";
import { useCallback, useEffect, useRef } from "react";
import * as m from "motion/react-m";

const ScrollAreaRoot = m.create(ScrollAreaPrimitive.Root);
const ScrollAreaViewport = m.create(ScrollAreaPrimitive.Viewport);
function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaRoot>) {
  const wrapperRef = useRef<HTMLDivElement>(null!);
  const scrollRef = useRef<HTMLDivElement>(null!);
  const lenisRef = useRef<Lenis>(null!);
  const ogLenis = useLenis();
  const onEnter = useCallback(() => {
    ogLenis?.stop();
  }, [ogLenis]);
  const onLeave = useCallback(() => {
    ogLenis?.start();
  }, [ogLenis]);
  const onScroll = useCallback(
    (lenis: Lenis) => {
      const { progress, isScrolling, direction } = lenis;
      if (isScrolling) {
        const isNearEnd =
          (direction === 1 && progress < 0.01) ||
          (progress > 0.99 && direction === -1);

        if (isNearEnd) {
          // requestAnimationFrame(() => {
          //   return requestAnimationFrame(() => {
          //     if (lenis.direction === direction) {
          //       const isStillSame =
          //         direction === 1
          //           ? lenis.progress < progress
          //           : lenis.progress > progress;
          //       if (isStillSame) {
          //         ogLenis?.start();
          //       }
          //     }
          //   });
          // });
        }
      }
    },
    [ogLenis]
  );
  useEffect(() => {
    if (lenisRef.current) return;
    const content = scrollRef.current;
    const wrapper = wrapperRef.current;
    const container = wrapper.parentElement;
    if (!content || !wrapper || !container)
      return console.log("No content or wrapper");
    console.log("wrapper and content found");
    const lenny = new Lenis({
      wrapper,
      content,
      autoRaf: true
    });
    lenisRef.current = lenny;
    lenny.on("scroll", onScroll);
    container.addEventListener("mouseover", onEnter);
    container.addEventListener("mouseout", onLeave);
    return () => {
      if (lenisRef.current) {
        lenisRef.current.off("scroll", onScroll);
        container.removeEventListener("mouseover", onEnter);
        container.removeEventListener("mouseout", onLeave);
        lenisRef.current.destroy();
        ogLenis?.start();
        lenisRef.current = null!;
      }
    };
  }, [onScroll, onEnter, onLeave, ogLenis]);

  return (
    <ScrollAreaRoot
      ref={wrapperRef}
      data-slot="scroll-area"
      className={cn(
        "relative mb-4 max-h-[80vh] w-full flex-col items-center justify-start overflow-y-auto overscroll-contain px-3 py-6",
        className
      )}
      layoutScroll={true}
      {...props}
    >
      <ScrollAreaViewport
        ref={scrollRef}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        data-slot="scroll-area-viewport"
        className={"flex flex-col gap-2.5"}
      >
        {children}
      </ScrollAreaViewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaRoot>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-4 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-4 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
