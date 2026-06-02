"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useTheme } from "@/providers/Theme";

/**
 * Locks the page to dark theme via the project's setPageTheme contract.
 * Restores the previous theme when the route unmounts.
 */
export default function PlansPageClient() {
  const setPageTheme = useTheme(useShallow((r) => r.setPageTheme));
  const clearPageTheme = useTheme(useShallow((r) => r.clearPageTheme));

  useEffect(() => {
    setPageTheme("dark", true);
    document.body.dataset.plansSurface = "true";

    return () => {
      delete document.body.dataset.plansSurface;
      clearPageTheme();
    };
  }, [setPageTheme, clearPageTheme]);

  return null;
}
