"use client";

import { useRPStore } from "@/providers/RP_Pro";
import { AnimatePresence } from "motion/react";
import { ReactNode, useEffect, useRef } from "react";

import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { useShallow } from "zustand/shallow";
import { LoaderLottie } from "../../../components/UX/Loader/LoaderLottie";
import { cn } from "../../../lib/utils";

export function Layout(l: { children: ReactNode }) {
  const { children } = l;
  const pageType = useVoyageur((r) => r.pageType);
  const pageSlug = useVoyageur((r) => r.slug);
  const lastPage = useRef({
    type: pageType,
    slug: pageSlug
  });
  const setPageIsTransitioning = useRPStore((l) => l.setPageIsTransitioning);
  const canInteract = useRPStore(useShallow((l) => l.canInteract));
  const isPreloader = useRPStore(useShallow((l) => l.isPreloader));
  const pageIsTransitioning = useRPStore(
    useShallow((l) => l.pageIsTransitioning)
  );

  const to = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const { type, slug } = lastPage.current;
    if (type !== pageType || slug !== pageSlug) {
      to.current && clearTimeout(to.current);
      to.current = setTimeout(() => setPageIsTransitioning(false), 400);
    }
    lastPage.current = {
      type: pageType,
      slug: pageSlug
    };
  }, [pageType, pageSlug, setPageIsTransitioning]);

  useEffect(() => {
    if (isPreloader) {
      document.body.dataset.enableInteraction = "false";
      return;
    }
    document.body.dataset.enableInteraction = `${canInteract}`;
  }, [isPreloader, canInteract]);

  const containerRef = useRef<HTMLDivElement>(null!);

  return (
    <div
      ref={containerRef}
      className="rp-container"
      data-themed={"background-color"}
    >
      <AnimatePresence mode="sync" propagate={false}>
        {children}
      </AnimatePresence>
    </div>
  );
}
