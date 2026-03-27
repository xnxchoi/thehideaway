"use client";

import type { ReactNode } from "react";

import { RPage } from "@/components/UX/Transition";
import { useRPStore } from "@/providers/RP_Pro";
import { useEffect } from "react";

export default function PageClient({ children }: { children: ReactNode }) {
  const setHeaderVisible = useRPStore((r) => r.setHeaderVisibility);
  const setSideDrawerRendered = useRPStore((r) => r.setSideDrawerRendered);
  useEffect(() => {
    setHeaderVisible(false);
    setSideDrawerRendered(false);
    return () => {
      setHeaderVisible(true);
      setSideDrawerRendered(true);
    };
  }, [setHeaderVisible, setSideDrawerRendered]);

  return (
    <RPage type="account" slug={["notifications"]}>
      {children}
    </RPage>
  );
}
