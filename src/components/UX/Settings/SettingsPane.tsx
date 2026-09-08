"use client";

import * as m from "motion/react-m";
import type { ReactNode } from "react";

import { useSettingsNav } from "./SettingsNav";

/**
 * Inner settings pane. A rail click starts the fade immediately; the new
 * section mounts into the same slot when it is ready.
 */
export function SettingsPane({ children }: { children: ReactNode }) {
  const { pathname, pendingHref } = useSettingsNav();
  const leaving = Boolean(pendingHref && pendingHref !== pathname);

  return (
    <div className="relative w-full overflow-x-hidden [&_.min-h-screen]:min-h-0 [&_.w-screen]:w-full">
      <m.div
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
      >
        {children}
      </m.div>
    </div>
  );
}
