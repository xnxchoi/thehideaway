"use client";
import { MainInternal } from "@/components/core/MainInternal";
import { Linus } from "@/components/UX/Scroll";
import { useRPStore } from "@/providers/RP_Pro";
import dynamic from "next/dynamic";
import { ReactNode, Suspense, useRef } from "react";
import { useShallow } from "zustand/shallow";

export const Main = ({ children }: { children: ReactNode }) => {
  const mainRef = useRef<HTMLElement>(null!);
  const navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  return (
    <main ref={mainRef} className={"root"}>
      {children}
      <Suspense>
        <MainInternal
          eventSource={mainRef}
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
