"use client";

import { StationHideawayHero } from "@/components/sections/StationHideaway/block";
import { TapePlayer } from "@/components/UX/TapePlayer";
import { useIsMobile } from "@/providers/MiddleMan";
import { Suspense } from "react";
import { useRadioMode } from "../RadioModeContext";
import {
  AmbientBackground,
  AmbientBackgroundFallback
} from "./AmbientBackground";

export function StationMode() {
  const { isMobile } = useIsMobile();
  const { setMode } = useRadioMode();

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background — R3F on desktop, CSS on mobile */}
      {!isMobile ? (
        <Suspense>
          <AmbientBackground />
        </Suspense>
      ) : (
        <AmbientBackgroundFallback />
      )}

      {/* Hero section with scroll-linked tape reels */}
      <TapePlayer variant="hero" />

      {/* Full parallax section with 3D model (desktop only) */}
      <section className="flex flex-1 items-start justify-center">
        {!isMobile && (
          <Suspense>
            <StationHideawayHero
              onShowcaseActivate={() => setMode("showcase")}
            />
          </Suspense>
        )}
      </section>
    </div>
  );
}
