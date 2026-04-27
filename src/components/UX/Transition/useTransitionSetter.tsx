"use client";

import { useRPStore } from "@/providers/RP_Pro";
import { useTransitionRouter } from "next-transition-router";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";
import type { PageTransitionType } from "./index";
import { pickTransitionType, type TransitionDecision } from "./pageGroups";
import { recordTransitionDecision } from "./transitionDevHistory";

type TransitionSetOptions = {
  override?: PageTransitionType | null;
};

export const useTransitionSetter = () => {
  const navisopref = useRef(false);
  const currentPathRef = useRef("/");
  const setTransitionOutType = useRPStore((l) => l.setTransitionOutType),
    setNavigationPageItemSelected = useRPStore(
      (l) => l.setNavigationPageItemSelected
    ),
    setIsTransitioningWipe = useRPStore((l) => l.setIsTransitioningWipe),
    router = useTransitionRouter(),
    navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  const currentPath = usePathname();
  useEffect(() => {
    navisopref.current = navIsOpen;
  }, [navIsOpen]);
  useEffect(() => {
    currentPathRef.current = currentPath || "/";
  }, [currentPath]);

  const setGenericPageTransition = useCallback(
    (
      targetHref?: string,
      options?: TransitionSetOptions
    ): TransitionDecision => {
      const fromHref = currentPathRef.current;
      const toHref = targetHref ?? fromHref;
      const decision = pickTransitionType({
        fromHref,
        toHref,
        navIsOpen: navisopref.current,
        override: options?.override ?? null
      });
      setTransitionOutType(decision.type);
      setIsTransitioningWipe(decision.type === "CURTAIN");
      setNavigationPageItemSelected(-1);
      recordTransitionDecision({ fromHref, toHref, decision });
      return decision;
    },
    [
      setTransitionOutType,
      setIsTransitioningWipe,
      setNavigationPageItemSelected
    ]
  );
  const goToPage = useCallback(
    (l: string, options?: TransitionSetOptions) => {
      setGenericPageTransition(l, options);
      setTimeout(() => {
        l &&
          router.push(l, {
            scroll: false
          });
      }, 120);
    },
    [router, setGenericPageTransition]
  );
  return {
    goToPage,
    setGenericPageTransition
  };
};
