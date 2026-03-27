"use client";

import { useHighlighter } from "@/components/UX/Highlightr/providers/HighlighterProvider";
import {
  HIGHLIGHT_PALETTE,
  HighlightColors,
  HighlightPalette,
  Palettes
} from "@/components/UX/Highlightr/stores";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import type { PayloadPreference } from "@payload-types";
import { useQuery } from "@tanstack/react-query";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

export function LayoutClient({ children }: { children: ReactNode }) {
  const setCurrentColor = useHighlighter((r) => r.setCurrentColor);
  const currentColor = useHighlighter(
    useShallow((r) => r.currentColor)
  ) as HighlightColors;
  const [currentPalette, setCurrentPalette] = useState<
    HIGHLIGHT_PALETTE[HighlightColors]
  >(HighlightPalette[currentColor]);
  const uId = useRPSession(useShallow((r) => r.id as string | null));

  const [userId, setUserId] = useState(uId || "");
  const [loggedIn, setLoggedIn] = useState(!!uId);
  useEffect(() => {
    setUserId(uId || "");
    setLoggedIn(!!uId);
  }, [uId]);
  const {
    data: color,
    refetch: colorUpdate,
    isLoading: colorLoading,
    isPending: colorPending
  } = useQuery<HighlightColors, Error, HighlightColors, ["color", string]>({
    queryKey: ["color", userId],
    queryFn: async ({ queryKey: [color, userId] }) => {
      const r = await fetch("/api/payload-preferences/highlight-color", {
        method: "GET",
        credentials: "include"
      })
        .then((t) => {
          if (t.ok) return t;
          throw new Error("Failed to fetch color preference");
        })
        .then(
          async (r) =>
            (await r.json()) as Omit<
              PayloadPreference,
              "id" | "user" | "key" | "value"
            > & {
              _id: string;
              _v: number;
              user: string;
              key: string;
              value: HighlightColors;
            }
        )
        .then((r) => {
          if (r.key === "highlight-color") {
            if (Palettes.some((s) => (s as string) === r.value))
              return r.value as HighlightColors;
            throw new Error("Invalid color preference");
          }
        });
      if (!r) throw new Error("Invalid color");
      return r;
    },
    enabled: loggedIn,
    placeholderData: "BLUE",
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    gcTime: 60 * 1000
  });
  useEffect(() => {
    if (color) {
      setCurrentColor(color);
    }
  }, [setCurrentColor, colorPending, colorLoading, color]);
  useEffect(() => {
    setCurrentPalette(HighlightPalette[currentColor]);
  }, [currentColor, setCurrentPalette]);

  return (
    <div style={{ "--currentHighlight": currentPalette } as CSSProperties}>
      {children}
    </div>
  );
}
