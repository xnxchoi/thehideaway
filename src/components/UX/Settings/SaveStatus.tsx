"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface SaveStatusProps {
  state: SaveState;
  errorMessage?: string;
  className?: string;
}

const FADE_AFTER_MS = 2400;

export const SaveStatus = ({
  state,
  errorMessage,
  className
}: SaveStatusProps) => {
  const [visible, setVisible] = useState(state !== "idle");

  useEffect(() => {
    if (state === "saved") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), FADE_AFTER_MS);
      return () => clearTimeout(t);
    }
    if (state === "idle") {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [state]);

  if (!visible) return null;

  return (
    <span
      className={cn(
        "font-mono text-[9px] tracking-[0.22em] uppercase transition-opacity duration-500",
        state === "error"
          ? "text-rouge-500"
          : "text-foreground/65 dark:text-foreground/55",
        className
      )}
      aria-live="polite"
    >
      {state === "saving" && "Saving…"}
      {state === "saved" && "Saved"}
      {state === "error" && (errorMessage ?? "Couldn't save")}
    </span>
  );
};
