"use client";

import { Button } from "@/components/core/Button";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

import { useAmbientStore } from "../store/ambientStore";

/**
 * Sticky banner shown while in select-mode. Reflects the current phase and
 * the commit affordance appropriate to it.
 */
export function SelectModeOverlay() {
  const phase = useAmbientStore((s) => s.phase);
  const exitSelectMode = useAmbientStore((s) => s.exitSelectMode);

  if (phase === "idle") return null;

  const label =
    phase === "placingStart"
      ? "Mark the start"
      : phase === "placingEnd"
        ? "Mark the end"
        : phase === "pickingTrack"
          ? "Pick a track"
          : "Adjust or Esc to finish";

  const hint =
    phase === "placingStart" || phase === "placingEnd"
      ? "Move caret · ⌘⏎ to set · Esc to finish"
      : phase === "pickingTrack"
        ? "Search above · Esc to finish"
        : "Tap an anchor · click range to reset · Esc to finish";

  return (
    <AnimatePresence initial={false}>
      <m.div
        key={phase}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ type: "spring", bounce: 0.2, visualDuration: 0.26 }}
        className="pointer-events-none sticky top-2 z-40 mx-auto mb-2 flex w-fit items-center gap-3 rounded-full border border-border/40 bg-background/85 px-3.5 py-1.5 backdrop-blur-md"
        style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: 10 }}
      >
        <span className="tracking-widest text-foreground/80 uppercase">
          Ambient audio · {label}
        </span>
        <span
          aria-hidden
          className="text-muted-foreground/50"
          style={{ letterSpacing: "0.08em" }}
        >
          {hint}
        </span>
        <Button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={exitSelectMode}
          className="pointer-events-auto tracking-widest text-foreground/60 uppercase hover:text-foreground"
        >
          Esc
        </Button>
      </m.div>
    </AnimatePresence>
  );
}
