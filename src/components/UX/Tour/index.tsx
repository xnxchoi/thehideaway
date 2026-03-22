"use client";

import { AnimatePresence } from "motion/react";
import { Suspense } from "react";
import { InterfaceTour, InterfaceTourTrigger } from "./InterfaceTour";
import { RegistrationTour, RegistrationTourTrigger } from "./RegistrationTour";
import { useTourStore } from "./TourProvider";

export { TourProvider } from "./TourProvider";
export { useTourStore } from "./TourProvider";

/**
 * Drop this once inside the provider tree (at layout level).
 * It mounts both tour overlays and their activation triggers.
 */
export function TourOrchestrator() {
  const regActive = useTourStore((s) => s.regActive);

  return (
    <>
      {/* Triggers — zero-render, keyboard/session listeners */}
      <RegistrationTourTrigger />
      <InterfaceTourTrigger />

      {/* Overlays — Suspense here contains any lazy-loaded children so they
          don't bubble up to the layout-level Suspense and unmount the canvas */}
      <Suspense>
        <AnimatePresence>
          {regActive && <RegistrationTour key="reg-tour" />}
        </AnimatePresence>
      </Suspense>

      <InterfaceTour />
    </>
  );
}
