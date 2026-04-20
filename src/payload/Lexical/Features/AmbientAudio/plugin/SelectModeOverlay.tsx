"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore } from "../store/ambientStore";

/**
 * Caret-adjacent status pill, Notion-style: a compact indicator floating
 * just above the focused block during placement. TrackPicker owns the UI
 * during `pickingTrack`, and `settled` is implicit — so the overlay only
 * renders while the user is actively navigating to place start or end.
 */
export function SelectModeOverlay() {
  const [editor] = useLexicalComposerContext();
  const phase = useAmbientStore((s) => s.phase);
  const focusedNodeKey = useAmbientStore((s) => s.focusedNodeKey);
  const exitSelectMode = useAmbientStore((s) => s.exitSelectMode);

  const active = phase === "placingStart" || phase === "placingEnd";

  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!active || !focusedNodeKey) {
      setPos(null);
      return;
    }
    const measure = () => {
      const el = editor.getElementByKey(focusedNodeKey);
      if (!el) {
        setPos(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setPos({ top: r.top - 34, left: r.left });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [editor, focusedNodeKey, active]);

  if (typeof document === "undefined") return null;

  const label = phase === "placingStart" ? "Start" : "End";
  const visible = active && pos !== null;

  return createPortal(
    <AnimatePresence initial={false}>
      {visible ? (
        <m.div
          key={phase}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ type: "spring", bounce: 0.12, visualDuration: 0.22 }}
          className="pointer-events-none fixed z-[45] flex items-center gap-3 border border-border/40 bg-background/90 px-3 py-1.5 backdrop-blur-md"
          style={{ top: pos!.top, left: Math.max(8, pos!.left) }}
        >
          <span
            aria-hidden
            className="font-mono text-[9px] tracking-[0.24em] text-muted-foreground/50 uppercase"
          >
            Ambient
          </span>
          <span className="font-mono text-[10px] tracking-widest text-foreground/85 uppercase">
            {label}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={exitSelectMode}
            className="pointer-events-auto border border-border/30 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
          >
            Esc
          </button>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
