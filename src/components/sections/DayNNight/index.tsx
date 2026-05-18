"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useTheme } from "@/providers/Theme";
import { useFooterVisibility } from "@/components/Shells/Footer/footer-visibility";
import { SimplifiedView } from "./SimplifiedView";
import { ImmersiveView } from "./Immersive";
import { ViewToggle } from "./ViewToggle";
import { useViewPref, type DayNNightView } from "./useViewPref";
import s from "./styles.module.scss";

interface DayNNightLandingProps {
  initialView: DayNNightView;
}

/**
 * Day n Night landing — top-level entry.
 *
 * Owns the simplified ↔ immersive view state (cookie-backed), the dark-theme
 * lock for the immersive view, and the floating ViewToggle.
 *
 * The two views are rendered conditionally so the immersive R3F scene only
 * mounts when actually selected — keeps cold simplified loads light.
 */
export function DayNNightLanding({ initialView }: DayNNightLandingProps) {
  const { view, setView } = useViewPref({ initial: initialView });
  const setPageTheme = useTheme(useShallow((r) => r.setPageTheme));
  const clearPageTheme = useTheme(useShallow((r) => r.clearPageTheme));

  // Hide the site's legal footer for both views — the landing owns its own
  // bottom-of-page treatment and the global colophon competes with it.
  useFooterVisibility("hide");

  // The immersive view forces dark to match its night-mode endpoint;
  // the simplified view defers to the user's theme.
  useEffect(() => {
    if (view === "immersive") {
      setPageTheme("dark", true);
    } else {
      clearPageTheme();
    }
    return () => {
      clearPageTheme();
    };
  }, [view, setPageTheme, clearPageTheme]);

  return (
    <div className={s.shell} data-view={view}>
      <ViewToggle value={view} onChange={setView} />
      {view === "immersive" ? <ImmersiveView /> : <SimplifiedView />}
    </div>
  );
}

export default DayNNightLanding;
