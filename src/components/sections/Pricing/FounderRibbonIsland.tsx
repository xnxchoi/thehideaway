"use client";

import dynamic from "next/dynamic";

export const FounderRibbonIsland = dynamic(
  () => import("./FounderRibbon").then((m) => ({ default: m.FounderRibbon })),
  {
    ssr: false,
    loading: () => (
      <section
        aria-hidden
        style={{
          minHeight: "90vh",
          background: "oklch(0.1 0.005 240)"
        }}
      />
    )
  }
);
