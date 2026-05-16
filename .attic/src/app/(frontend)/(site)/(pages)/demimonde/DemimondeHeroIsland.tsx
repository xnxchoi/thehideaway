"use client";

import dynamic from "next/dynamic";

export const DemimondeHeroIsland = dynamic(
  () => import("./DemimondeHero").then((m) => ({ default: m.DemimondeHero })),
  { ssr: false }
);
