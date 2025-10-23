"use client";

import { cssVariables } from "@/cssVariables";
import { useRPStore } from "@/providers/RP_Pro";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import type { AspectRatio, ViewportSizes } from "../types";

export const useAspectRatio = (aspect: AspectRatio) => {
  const [ar, setAr] = useState<number>(typeof aspect === "number" ? aspect : 1);
  const viewportSize = useRPStore(useShallow((r) => r.viewportSize));
  useEffect(() => {
    if (typeof aspect === "number") {
      setAr(aspect);
    } else {
      const { def, ...rest } = aspect;
      const current = Object.entries(rest).reduce((prev, [key, value]) => {
        if (
          cssVariables.breakpoints[key as ViewportSizes] <
          cssVariables.breakpoints[viewportSize]
        ) {
          return value;
        }
        return prev;
      }, def);
      setAr(current);
    }
  }, [aspect, viewportSize]);
  return ar;
};
