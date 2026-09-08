"use client";

/**
 * @dev-only — Client-only slot for the auth lab.
 * AuthShell is a server component on Instant UI routes. Importing
 * DevAuthLab there pulls a client+server-action module into the
 * prefetch graph and Next cannot validate `instant`. This wrapper
 * keeps that module off the RSC/prefetch path (`ssr: false`).
 */

import dynamic from "next/dynamic";

const DevAuthLab = dynamic(
  () => import("./DevAuthLab").then((mod) => ({ default: mod.DevAuthLab })),
  { ssr: false }
);

export function DevAuthLabMount() {
  if (process.env.NODE_ENV === "production") return null;
  return <DevAuthLab />;
}
