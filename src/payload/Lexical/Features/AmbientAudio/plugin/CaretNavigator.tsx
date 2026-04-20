"use client";

import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { AnimatePresence, useMotionValue, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore, useAmbientStoreApi } from "../store/ambientStore";
import { $findBlockAncestor } from "../utils/anchors";

const CARET_DWELL_MS = 700;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Reads the caret position from Lexical, computes the focused block-level
 * node, renders a thin outline overlay on it, and (after a short dwell)
 * a tooltip inviting the user to commit via ⌘⏎. Active while in a
 * placement phase only.
 */
export function CaretNavigator() {
  const [editor] = useLexicalComposerContext();
  const store = useAmbientStoreApi();
  const phase = useAmbientStore((s) => s.phase);
  const focusedNodeKey = useAmbientStore((s) => s.focusedNodeKey);
  const active = phase === "placingStart" || phase === "placingEnd";

  const rect = useMotionValue<Rect>({
    left: 10,
    top: 10,
    width: 40,
    height: 20
  });
  const [showDwell, setShowDwell] = useState(false);
  const dwellTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const updateFocusedNode = () => {
      editor.getEditorState().read(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        const point = sel.isBackward() ? sel.focus : sel.anchor;
        const node = point.getNode();
        const block = $findBlockAncestor(node);
        if (!block) return;
        const st = store.getState();
        const nextKey = block.getKey();
        if (st.focusedNodeKey !== nextKey) {
          st.setFocusedNodeKey(nextKey);
        }
        const prev = st.pendingCaretPoint;
        if (
          !prev ||
          prev.nodeKey !== point.key ||
          prev.offset !== point.offset ||
          prev.type !== point.type
        ) {
          st.setPendingCaretPoint({
            nodeKey: point.key,
            offset: point.offset,
            type: point.type
          });
        }
      });
    };
    const unregister = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateFocusedNode();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    updateFocusedNode();
    return unregister;
  }, [editor, active, store]);

  useLayoutEffect(() => {
    if (!active || !focusedNodeKey) {
      rect.set({ top: 10, left: 10, width: 40, height: 20 });
      return;
    }
    const measure = () => {
      const el = editor.getElementByKey(focusedNodeKey);
      if (!el) {
        rect.set({ top: 10, left: 10, width: 40, height: 20 });
        return;
      }
      const r = el.getBoundingClientRect();
      rect.set({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const raf = window.requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(raf);
    };
  }, [editor, focusedNodeKey, active, rect]);
  const top = useTransform(() => rect.get().top - 3);
  const left = useTransform(() => rect.get().left - 3);
  const width = useTransform(() => rect.get().width + 6);
  const height = useTransform(() => rect.get().height + 6);
  const top2 = useTransform(() => rect.get().top + rect.get().height + 6),
    left2 = useTransform(() => rect.get().left);
  useEffect(() => {
    if (dwellTimerRef.current) {
      window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    setShowDwell(false);
    if (!active || !focusedNodeKey) return;
    dwellTimerRef.current = window.setTimeout(() => {
      setShowDwell(true);
      dwellTimerRef.current = null;
    }, CARET_DWELL_MS);
    return () => {
      if (dwellTimerRef.current) {
        window.clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };
  }, [focusedNodeKey, active]);

  if (!active || !rect) return null;
  if (typeof document === "undefined") return null;

  const hint =
    phase === "placingStart"
      ? "Press ⌘⏎ to mark start"
      : "Press ⌘⏎ to mark end";

  return createPortal(
    <>
      <m.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        style={{
          position: "fixed",
          top,
          left,
          width,
          height,
          border: "1px solid oklch(0.7 0.1 250 / 0.55)",
          borderRadius: 6,
          pointerEvents: "none",
          zIndex: 10020,
          boxShadow: "0 0 0 4px oklch(0.7 0.1 250 / 0.08)"
        }}
      />
      <AnimatePresence initial={false}>
        {showDwell ? (
          <m.div
            key="dwell"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: "spring", bounce: 0.2, visualDuration: 0.28 }}
            style={{
              position: "fixed",
              top: top2,
              left: left2,
              zIndex: 10021,
              pointerEvents: "none",
              padding: "6px 10px",
              borderRadius: 999,
              background: "oklch(0.12 0 0 / 0.85)",
              backdropFilter: "blur(12px) saturate(1.3)",
              WebkitBackdropFilter: "blur(12px) saturate(1.3)",
              color: "oklch(0.96 0 0 / 0.9)",
              fontFamily: "var(--font-mono, ui-monospace)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              whiteSpace: "nowrap"
            }}
          >
            {hint}
          </m.div>
        ) : null}
      </AnimatePresence>
    </>,
    document.body
  );
}
