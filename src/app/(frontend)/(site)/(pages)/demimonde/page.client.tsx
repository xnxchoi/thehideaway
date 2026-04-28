"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useTheme } from "@/providers/Theme";

export default function DemimondePageClient() {
  const setPageTheme = useTheme(useShallow((r) => r.setPageTheme));
  const clearPageTheme = useTheme(useShallow((r) => r.clearPageTheme));

  useEffect(() => {
    setPageTheme("dark", true);
    return () => {
      clearPageTheme();
    };
  }, [setPageTheme, clearPageTheme]);

  return null;
}
