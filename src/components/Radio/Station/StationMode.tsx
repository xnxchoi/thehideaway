"use client";

import { TapePlayer } from "@/components/UX/TapePlayer";
import { StationHideawayHero } from "@/components/sections/StationHideaway/block";
import { useIsMobile } from "@/providers/MiddleMan";
import { Suspense } from "react";
import { useIdleDetection } from "../hooks/useIdleDetection";
import { useAudioAnalyser } from "../hooks/useAudioAnalyser";
import { useRadioMode } from "../RadioModeContext";
import { useRadioStore } from "@/providers/RadioProvider";
import { useShallow } from "zustand/shallow";
import {
  AmbientBackground,
  AmbientBackgroundFallback
} from "./AmbientBackground";

export function StationMode() {
  const { isMobile } = useIsMobile();
  const { setMode } = useRadioMode();
  const playing = useRadioStore(useShallow((s) => s.playing));

  // Single instances of hooks — passed to both desktop and mobile backgrounds
  const { fogProgress } = useIdleDetection({
    timeout: 8000,
    maxFogTime: 15000,
    clearDuration: 350
  });
  const { audioLevel } = useAudioAnalyser({
    fftSize: 256,
    smoothing: 0.85
  });

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background — R3F on desktop, CSS on mobile */}
      {!isMobile ? (
        <Suspense>
          <AmbientBackground
            fogProgress={fogProgress}
            audioLevel={audioLevel}
          />
        </Suspense>
      ) : (
        <AmbientBackgroundFallback fogProgress={fogProgress} playing={playing} />
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
