"use client";
import { MainInternal } from "@/components/core/MainInternal";
import { Linus } from "@/components/UX/Scroll";
import { useTourStore } from "@/components/UX/Tour/TourProvider";
import { useRPStore } from "@/providers/RP_Pro";
import { ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { Frameloop } from "@react-three/fiber";

export const Main = ({ children }: { children: ReactNode }) => {
  const mainRef = useRef<HTMLElement>(null!);
  const navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  // Pause the render loop while the registration tour is covering the screen.
  // The tour's slide + blur animations are GPU-intensive; running them alongside
  // the canvas render loop risks a WebGL context loss on lower-end devices.
  const regActive = useTourStore((s) => s.regActive);
  const [frameLoop, setFrameLoop] = useState<Frameloop>(
    regActive ? "never" : "always"
  );
  useEffect(() => {
    setFrameLoop(regActive ? "never" : "always");
  }, [regActive]);
  return (
    <main ref={mainRef} className={"root"}>
      {children}
      <Suspense>
        <MainInternal
          eventSource={mainRef}
          frameloop={"always"}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: navIsOpen ? 120 : 40,
            width: "100vw",
            height: "100vh"
          }}
        />
      </Suspense>
      <Linus root={true} />
    </main>
  );
};
