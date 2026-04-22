"use client";

import { Button } from "@/components/core/Button";
import { useRadioMode } from "../RadioModeContext";
import { ShowcaseHero } from "./ShowcaseHero";
import { ShowcaseStory } from "./ShowcaseStory";
import { ShowcaseConnect } from "./ShowcaseConnect";

/**
 * Showcase editorial mode — scroll-driven storytelling about the
 * music creator and their collaboration with The Hideaway.
 *
 * Lazy-loaded via React.lazy in RadioPage.tsx.
 */
export function ShowcaseMode() {
  const { setMode } = useRadioMode();

  return (
    <div className="relative min-h-screen">
      {/* Fixed return nav */}
      <div className="fixed top-0 right-0 left-0 z-50 border-b border-border/20 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 xl:px-10">
          <span className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
            The Hideaway Sessions
          </span>
          <Button
            onClick={() => setMode("station")}
            className="font-mono text-[11px] tracking-widest text-foreground/60 uppercase transition-colors hover:text-foreground"
          >
            Back to Station
          </Button>
        </div>
      </div>

      {/* Grain overlay (carries through from Station mode aesthetic) */}
      <div
        className="pointer-events-none fixed inset-0 z-[3]"
        style={{
          backgroundImage: "url(/assets/noise.png)",
          backgroundRepeat: "repeat",
          opacity: 0.04,
          mixBlendMode: "overlay"
        }}
        aria-hidden="true"
      />

      {/* Content sections */}
      <ShowcaseHero />
      <ShowcaseStory />
      <ShowcaseConnect />
    </div>
  );
}
