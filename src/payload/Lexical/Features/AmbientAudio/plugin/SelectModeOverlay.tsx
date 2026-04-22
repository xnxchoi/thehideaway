"use client";

import { Button } from "@/components/core/Button";
import { Popover } from "@base-ui/react";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

import { useAmbientStore } from "../store/ambientStore";

interface VirtualAnchor {
  getBoundingClientRect: () => DOMRect;
}

/**
 * Compact status indicator, shown above the caret during placement. Uses
 * base-ui Popover with a virtual anchor that resolves in priority order:
 *   1. focused block (once CaretNavigator has armed)
 *   2. live window selection rect (while caret is in the editor)
 *   3. editor root top edge (initial entry, no caret movement yet)
 * Hidden during `pickingTrack` (TrackPicker owns the UI) and `settled`.
 */
export function SelectModeOverlay() {
  const [editor] = useLexicalComposerContext();
  const phase = useAmbientStore((s) => s.phase);
  const focusedNodeKey = useAmbientStore((s) => s.focusedNodeKey);
  const exitSelectMode = useAmbientStore((s) => s.exitSelectMode);

  const active = phase === "placingStart" || phase === "placingEnd";

  // Keep the latest values in a ref so the virtual anchor function (stable
  // identity for base-ui's positioner) always reads fresh state.
  const stateRef = useRef({ editor, focusedNodeKey });
  stateRef.current = { editor, focusedNodeKey };

  const virtualAnchor = useMemo<VirtualAnchor>(
    () => ({
      getBoundingClientRect: () => {
        const { editor: ed, focusedNodeKey: fkey } = stateRef.current;
        if (fkey) {
          const el = ed.getElementByKey(fkey);
          if (el) return el.getBoundingClientRect();
        }
        if (typeof window !== "undefined") {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const r = sel.getRangeAt(0).getBoundingClientRect();
            if (r.top !== 0 || r.left !== 0 || r.width !== 0) return r;
          }
        }
        const root = ed.getRootElement();
        if (root) {
          const rr = root.getBoundingClientRect();
          return new DOMRect(rr.left + 16, rr.top + 16, 0, 0);
        }
        return new DOMRect(16, 16, 0, 0);
      }
    }),
    []
  );

  const label = phase === "placingStart" ? "Start" : "End";

  return (
    <Popover.Root
      open={active}
      onOpenChange={(next, details) => {
        if (next || !active) return;
        // Only honor intentional dismiss gestures. Clicking inside the editor
        // fires `outsidePress` (the editor is outside the popup), which would
        // otherwise cancel placement — suppress that case.
        if (details.reason === "escape-key") exitSelectMode();
      }}
      modal={false}
    >
      <Popover.Portal>
        <Popover.Positioner
          anchor={virtualAnchor}
          side="top"
          align="start"
          sideOffset={8}
          className="outline-none"
        >
          <Popover.Popup
            data-ambient-portal="select-mode-overlay"
            initialFocus={false}
            finalFocus={false}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "z-[45] flex origin-[var(--transform-origin)] items-center gap-3",
              "border border-border/40 bg-background/90 px-3 py-1.5 backdrop-blur-md",
              "transition-[transform,scale,opacity]",
              "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
            )}
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
            <Button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={exitSelectMode}
              className="border border-border/30 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-muted-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
            >
              Esc
            </Button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
