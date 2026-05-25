"use client";
import { MainInternal } from "./MainInternal";
import { Linus } from "@/components/UX/Scroll";
import { useTourStore } from "@/components/UX/Tour/TourProvider";
import { useRPStore } from "@/providers/RP_Pro";
import { ReactNode, Suspense, useRef } from "react";
import { useShallow } from "zustand/shallow";
import { useResolvedFrameloop } from "@/stores/CanvasFrameloop";

export const Main = ({ children }: { children: ReactNode }) => {
  const mainRef = useRef<HTMLElement>(null!);
  const navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  // Frameloop resolution — priority order:
  //   1. Tour active           → "never"   (highest priority; the
  //                                          registration tour's heavy
  //                                          DOM animations risk a
  //                                          WebGL context-loss on
  //                                          weak GPUs)
  //   2. Any 3D consumer       → "always"  (consumers call
  //                                          useCanvasClaim() while
  //                                          mounted; see
  //                                          stores/CanvasFrameloop.ts)
  //   3. No claims             → "demand"  (idle — only renders on
  //                                          explicit invalidate())
  const regActive = useTourStore((s) => s.regActive);
  const resolvedFrameloop = useResolvedFrameloop();
  const frameloop = regActive ? "never" : resolvedFrameloop;
  return (
    <main ref={mainRef} className={"root"}>
      {children}
      <Suspense>
        <MainInternal
          eventSource={mainRef}
          frameloop={frameloop}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: navIsOpen ? 247 : 40,
            width: "100vw",
            height: "100vh"
          }}
        />
      </Suspense>
      <Linus root={true} />
    </main>
  );
};
