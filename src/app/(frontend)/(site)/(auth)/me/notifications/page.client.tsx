"use client";

import type { ReactNode } from "react";

import { RPage } from "@/components/UX/Transition";
import { useRPStore } from "@/providers/RP_Pro";
import { useEffect } from "react";

export default function PageClient({ children }: { children: ReactNode }) {
  const setHeaderVisible = useRPStore((r) => r.setHeaderVisibility);
  const setSideDrawerOpen = useRPStore((r) => r.setSideDrawerOpen);
  useEffect(() => {
    setHeaderVisible(false);
    setSideDrawerOpen(false);
    return () => {
      setHeaderVisible(true);
    };
  }, [setHeaderVisible]);

  return (
    <RPage type="account" slug={["notifications"]}>
      {children}
    </RPage>
  );
}
