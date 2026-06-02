"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useTheme } from "../../../../../../src/providers/Theme";

/**
 * Locks the page to the light/cream theme — the cookout surface is
 * sun-bleached paper, so the dark global theme would fight it. Released
 * on unmount so other pages return to user preference.
 */
export default function DemimondePageClient() {
  const setPageTheme = useTheme(useShallow((r) => r.setPageTheme));
  const clearPageTheme = useTheme(useShallow((r) => r.clearPageTheme));

  useEffect(() => {
    setPageTheme("light", true);
    return () => {
      clearPageTheme();
    };
  }, [setPageTheme, clearPageTheme]);

  return null;
}
