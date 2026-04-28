"use client";

import dynamic from "next/dynamic";

export const DemimondeArchiveIsland = dynamic(
  () =>
    import("./DemimondeArchive").then((m) => ({
      default: m.DemimondeArchive
    })),
  { ssr: false }
);
