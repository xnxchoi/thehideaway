"use client";
import { useIsMobile } from "@/providers/MiddleMan";
import { Tape3DScene } from "@/components/UX/TapePlayer/visuals/Tape3DScene";
import { Suspense } from "react";
import { StationHideawayHero } from "@/components/sections/StationHideaway/block";

export default function RadioClient() {
  const { isMobile } = useIsMobile();
  return (
    <>
      {!isMobile && (
        <Suspense>
          <StationHideawayHero />
        </Suspense>
      )}
    </>
  );
}
