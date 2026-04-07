"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { lazy, Suspense } from "react";
import { RadioModeProvider, useRadioMode } from "./RadioModeContext";
import { StationMode } from "./Station/StationMode";

const ShowcaseMode = lazy(() =>
  import("./Showcase/ShowcaseMode").then((mod) => ({
    default: mod.ShowcaseMode
  }))
);

function RadioModeSwitch() {
  const { mode } = useRadioMode();

  return (
    <AnimatePresence mode="wait">
      {mode === "station" ? (
        <m.div
          key="station"
          className="z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <StationMode />
        </m.div>
      ) : (
        <m.div
          key="showcase"
          className="z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Suspense
            fallback={
              <div className="z-50 flex min-h-screen items-center justify-center">
                <span className="font-mono text-[11px] tracking-widest text-muted-foreground/50 uppercase">
                  Loading...
                </span>
              </div>
            }
          >
            <ShowcaseMode />
          </Suspense>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function RadioPage() {
  return (
    <RadioModeProvider>
      <RadioModeSwitch />
    </RadioModeProvider>
  );
}
