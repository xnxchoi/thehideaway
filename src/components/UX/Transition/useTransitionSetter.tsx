"use client";

import { useRPStore } from "@/providers/RP_Pro";
import { useTransitionRouter } from "next-transition-router";
import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";
export const useTransitionSetter = () => {
  const navisopref = useRef(false);
  const setTransitionOutType = useRPStore((l) => l.setTransitionOutType),
    setNavigationPageItemSelected = useRPStore(
      (l) => l.setNavigationPageItemSelected
    ),
    setIsTransitioningWipe = useRPStore((l) => l.setIsTransitioningWipe),
    router = useTransitionRouter(),
    navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  useEffect(() => {
    navisopref.current = navIsOpen;
  }, [navIsOpen]);
  const setGenericPageTransition = useCallback(() => {
    navisopref.current ||
      ((setTransitionOutType(null), setIsTransitioningWipe(true)),
      setNavigationPageItemSelected(-1));
  }, [
    setTransitionOutType,
    setIsTransitioningWipe,
    setNavigationPageItemSelected
  ]);
  const goToPage = useCallback(
    (l: string) => {
      (setGenericPageTransition(),
        setTimeout(() => {
          l &&
            router.push(l, {
              scroll: false
            });
        }, 120));
    },
    [router, setGenericPageTransition]
  );
  return {
    goToPage,
    setGenericPageTransition
  };
};
