"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore } from "../store/ambientStore";
import { getGroupColor, groupColorOklch } from "../utils/groupColors";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface BlockBand {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Calendar-date-range-picker style overlay with two layers:
 *
 * 1. **Block band (subtle)** — a soft wash spanning the hovered block, so the
 *    user always knows which block the focus is currently in even when the
 *    pointer is between lines.
 * 2. **Character range (stronger)** — per-line rects built from a live DOM
 *    `Range` between the committed anchor and the pointer caret, mimicking
 *    the behaviour of a native drag-select.
 *
 * Re-measures on every pointer move via `pendingPointerPoint` (rAF-throttled
 * at the source in `AmbientAudioPlugin`), plus on scroll/resize.
 */
export function SelectionFollowOverlay() {
  const [editor] = useLexicalComposerContext();
  const phase = useAmbientStore((s) => s.phase);
  const pendingGroupId = useAmbientStore((s) => s.pendingGroupId);
  const pendingStartKey = useAmbientStore((s) => s.pendingStartKey);
  const pendingEndKey = useAmbientStore((s) => s.pendingEndKey);
  const focusedNodeKey = useAmbientStore((s) => s.focusedNodeKey);
  const pointerPoint = useAmbientStore((s) => s.pendingPointerPoint);

  const active = phase === "placingStart" || phase === "placingEnd";
  // If no groupId is pending yet (first anchor not committed), fall back to a
  // neutral hue derived from a stable sentinel so colors stay consistent
  // across re-renders of the same placement session.
  const groupColor = getGroupColor(pendingGroupId ?? "__pending__");

  const [blockBand, setBlockBand] = useState<BlockBand | null>(null);
  const [rangeRects, setRangeRects] = useState<Rect[]>([]);

  useEffect(() => {
    if (!active) {
      setBlockBand(null);
      setRangeRects([]);
      return;
    }

    const measure = () => {
      // --- Block band -----------------------------------------------------
      const focusedEl = focusedNodeKey
        ? editor.getElementByKey(focusedNodeKey)
        : null;
      const rootEl = editor.getRootElement();
      if (focusedEl && rootEl) {
        const br = focusedEl.getBoundingClientRect();
        const rr = rootEl.getBoundingClientRect();
        setBlockBand({
          top: br.top,
          left: rr.left,
          width: rr.width,
          height: br.height
        });
      } else {
        setBlockBand(null);
      }

      // --- Character range -----------------------------------------------
      const anchorKey = pendingStartKey ?? pendingEndKey;
      if (!anchorKey || !pointerPoint) {
        setRangeRects([]);
        return;
      }
      const anchorEl = editor.getElementByKey(anchorKey);
      if (!anchorEl) {
        setRangeRects([]);
        return;
      }

      const caret = caretRangeFromPoint(pointerPoint.x, pointerPoint.y);
      if (!caret) {
        setRangeRects([]);
        return;
      }

      try {
        const range = document.createRange();
        range.selectNode(anchorEl);
        // comparePoint(-1|0|1) tells us if caret precedes / is inside / follows
        // the probe range. selectNode spans [before..after] the anchor, so any
        // caret outside the anchor produces -1 or +1.
        const cmp = range.comparePoint(caret.node, caret.offset);
        if (cmp < 0) {
          range.setStart(caret.node, caret.offset);
          range.setEndBefore(anchorEl);
        } else {
          range.setStartAfter(anchorEl);
          range.setEnd(caret.node, caret.offset);
        }
        const rects = Array.from(range.getClientRects())
          .filter((r) => r.width > 0 && r.height > 0)
          .map<Rect>((r) => ({
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height
          }));
        setRangeRects(rects);
      } catch {
        setRangeRects([]);
      }
    };

    measure();
    const onScrollOrResize = () => measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [
    editor,
    active,
    phase,
    focusedNodeKey,
    pendingStartKey,
    pendingEndKey,
    pointerPoint
  ]);

  if (!active) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div aria-hidden style={{ pointerEvents: "none" }}>
      {blockBand && (
        <div
          style={{
            position: "fixed",
            top: blockBand.top,
            left: blockBand.left,
            width: blockBand.width,
            height: blockBand.height,
            zIndex: 10014,
            pointerEvents: "none",
            background: groupColorOklch(groupColor, 0.05),
            borderLeft: `2px solid ${groupColorOklch(groupColor, 0.35)}`
          }}
        />
      )}
      {rangeRects.map((r, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            zIndex: 10015,
            pointerEvents: "none",
            background: groupColorOklch(groupColor, 0.22),
            mixBlendMode: "multiply"
          }}
        />
      ))}
    </div>,
    document.body
  );
}

interface CaretHit {
  node: Node;
  offset: number;
}

/**
 * Cross-browser caret-from-point helper. Firefox and older Safari expose
 * `caretPositionFromPoint`; Chrome and modern Safari expose
 * `caretRangeFromPoint`. Returns a normalised {node, offset} or null when
 * the point is outside any text node.
 */
function caretRangeFromPoint(x: number, y: number): CaretHit | null {
  type DocumentWithCaret = Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  const doc = document as DocumentWithCaret;
  if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      return { node: pos.offsetNode, offset: pos.offset };
    }
  }
  if (typeof doc.caretRangeFromPoint === "function") {
    const range = doc.caretRangeFromPoint(x, y);
    if (range) return { node: range.startContainer, offset: range.startOffset };
  }
  return null;
}
