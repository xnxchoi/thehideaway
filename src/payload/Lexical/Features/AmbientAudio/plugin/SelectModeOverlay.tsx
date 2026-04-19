"use client";
import { Button } from "@/components/core/Button";
import * as m from "motion/react-m";
import { useAmbientStore } from "../store/ambientStore";

export function SelectModeOverlay() {
  const mode = useAmbientStore((s) => s.mode);
  const pendingAnchor = useAmbientStore((s) => s.pendingAnchor);
  const pendingGroupId = useAmbientStore((s) => s.pendingGroupId);
  const exitSelectMode = useAmbientStore((s) => s.exitSelectMode);

  if (mode !== "selecting") return null;

  const hint = pendingGroupId
    ? pendingAnchor === "start"
      ? "⌘↓ drop start · ⌘↑ drop end"
      : "⌘↑ drop end to finish"
    : "⌘↓ drop start · ⌘↑ drop end · Esc cancel";

  return (
    <m.div
      role="status"
      aria-live="polite"
      className="pointer-events-none sticky top-2 z-40 mx-auto mb-2 flex w-fit items-center gap-3 rounded-sm border border-border/40 bg-background/85 px-3 py-1.5 backdrop-blur-md"
      style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: 10 }}
    >
      <span className="tracking-widest text-foreground/70 uppercase">
        Ambient audio · selecting
      </span>
      <span className="text-muted-foreground/60">{hint}</span>
      <Button
        type="button"
        onClick={exitSelectMode}
        className="pointer-events-auto tracking-widest text-foreground/60 uppercase hover:text-foreground"
      >
        Esc
      </Button>
    </m.div>
  );
}
