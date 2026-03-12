"use client";

import { AnimatePresence } from "motion/react";
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

      {/* Overlays */}
      <AnimatePresence>
        {regActive && <RegistrationTour key="reg-tour" />}
      </AnimatePresence>

      <InterfaceTour />
    </>
  );
}
