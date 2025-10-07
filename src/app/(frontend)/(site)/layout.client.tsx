"use client";

import { useRPStore } from "@/providers/RP_Pro";
import { AnimatePresence } from "motion/react";
import { ReactNode, useEffect, useRef } from "react";

import { useShallow } from "zustand/shallow";

export function Layout(l: { children: ReactNode }) {
  const { children } = l;

  const canInteract = useRPStore(useShallow((l) => l.canInteract));
  const isPreloader = useRPStore(useShallow((l) => l.isPreloader));

  useEffect(() => {
    if (isPreloader) {
      document.body.dataset.enableInteraction = "false";
      return;
    }
    document.body.dataset.enableInteraction = `${canInteract}`;
  }, [isPreloader, canInteract]);

  return (
    <div className="rp-container" data-themed={"background-color"}>
      <AnimatePresence mode="sync" propagate={false}>
        {children}
      </AnimatePresence>
    </div>
  );
}
