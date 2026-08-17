"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { shouldRenderLostFooterShader } from "./footer-wordmark-texture";

const LostFooterWordmarkShader = dynamic(
  () =>
    import("./footer-wordmark-shader").then(
      (module) => module.LostFooterWordmarkShader
    ),
  { ssr: false }
);

const WORDMARK_CLASS =
  "lost-footer-wordmark font-mono text-[clamp(3.5rem,15.7vw,30rem)] leading-[0.72] font-bold tracking-[-0.065em] text-foreground uppercase";

export function LostFooterWordmark() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shaderFailed, setShaderFailed] = useState(false);
  const handleReady = useCallback(() => undefined, []);
  const handleFailure = useCallback(() => setShaderFailed(true), []);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncCapability = () => {
      setFinePointer(finePointer.matches);
      setReducedMotion(reducedMotion.matches);
    };

    syncCapability();
    finePointer.addEventListener("change", syncCapability);
    reducedMotion.addEventListener("change", syncCapability);

    return () => {
      finePointer.removeEventListener("change", syncCapability);
      reducedMotion.removeEventListener("change", syncCapability);
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(Boolean(entry?.isIntersecting)),
      { rootMargin: "300px" }
    );
    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  const shouldRenderShader = shouldRenderLostFooterShader({
    finePointer,
    nearViewport,
    reducedMotion,
    shaderFailed
  });

  return (
    <div className={`${WORDMARK_CLASS} relative isolate`} ref={hostRef}>
      <span className="sr-only">LOSTINSEOUL</span>
      <span aria-hidden className="block text-center whitespace-nowrap">
        LOSTINSEOUL
      </span>
      {shouldRenderShader ? (
        <LostFooterWordmarkShader
          onFailure={handleFailure}
          onReady={handleReady}
          text="LOSTINSEOUL"
        />
      ) : null}
    </div>
  );
}
