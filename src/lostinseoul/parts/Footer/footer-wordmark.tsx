"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "motion/react";
import { useIsMobile } from "@/providers/MiddleMan";

const FootShader = dynamic(
  () =>
    import("./footer-wordmark-shader").then((module) => module.LISLogoScene),
  { ssr: false }
);

export function LostFooterWordmark() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useIsMobile();
  const [shaderFailed, setShaderFailed] = useState(false);
  const handleReady = useCallback(() => undefined, []);
  const handleFailure = useCallback(() => setShaderFailed(true), []);

  const inView = useInView(hostRef);

  return (
    <div
      className={cn(
        "relative isolate font-sans text-[clamp(3.5rem,15.7vw,30rem)] leading-[0.72] font-bold tracking-[-0.065em] text-foreground uppercase"
      )}
      ref={hostRef}
    >
      <span className="sr-only">LOSTINSEOUL</span>
      <span aria-hidden className="block text-center whitespace-nowrap">
        LOSTINSEOUL
      </span>
      {!isMobile && inView && !shaderFailed ? (
        <FootShader
          onFailure={handleFailure}
          onReady={handleReady}
          text="LOSTINSEOUL"
        />
      ) : null}
    </div>
  );
}
