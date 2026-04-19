"use client";

import {
  $getNodeByKey,
  $getRoot
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  $isAmbientAudioEndNode,
  type AmbientAudioEndNode
} from "../nodes/AmbientAudioEndNode";
import {
  $isAmbientAudioStartNode,
  type AmbientAudioStartNode
} from "../nodes/AmbientAudioStartNode";
import { useAmbientStore, useAmbientStoreApi } from "../store/ambientStore";
import { $findAnchorPair, $reorderAnchor } from "../utils/anchors";

interface SlotCandidate {
  key: string;
  top: number;
  height: number;
}

/**
 * Drag-reorder handler for anchors. Activated by AnchorComponent after a
 * 250ms pointer-hold. Computes the nearest sibling-slot as the pointer
 * moves, renders a thin indicator bar at that slot, and commits on
 * pointer-up — unless the proposed slot would cross the partner anchor,
 * in which case the bar pins at the partner-adjacent slot and flashes
 * a short shake.
 */
export function AnchorDragReorder() {
  const [editor] = useLexicalComposerContext();
  const store = useAmbientStoreApi();
  const dragState = useAmbientStore((s) => s.dragState);

  const [indicator, setIndicator] = useState<{
    top: number;
    left: number;
    width: number;
    denied: boolean;
  } | null>(null);

  useEffect(() => {
    if (!dragState) {
      setIndicator(null);
      return;
    }

    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const readCandidates = (): {
      candidates: SlotCandidate[];
      partnerIdx: number;
      selfIdx: number;
    } => {
      const candidates: SlotCandidate[] = [];
      let partnerIdx = -1;
      let selfIdx = -1;
      editor.getEditorState().read(() => {
        const draggedNode = $getNodeByKey(dragState.nodeKey);
        if (!draggedNode) return;
        const isStart = $isAmbientAudioStartNode(draggedNode);
        const isEnd = $isAmbientAudioEndNode(draggedNode);
        if (!isStart && !isEnd) return;

        const groupId = (
          draggedNode as AmbientAudioStartNode | AmbientAudioEndNode
        ).getGroupId();
        const pair = $findAnchorPair(groupId);
        const partner = isStart ? pair.end : pair.start;

        const rootChildren = $getRoot().getChildren();
        rootChildren.forEach((child, idx) => {
          const el = editor.getElementByKey(child.getKey());
          if (!el) return;
          const r = el.getBoundingClientRect();
          candidates.push({
            key: child.getKey(),
            top: r.top,
            height: r.height
          });
          if (partner) {
            const partnerEl = editor.getElementByKey(partner.getKey());
            if (partnerEl && el.contains(partnerEl)) partnerIdx = idx;
          }
          const draggedEl = editor.getElementByKey(dragState.nodeKey);
          if (draggedEl && el.contains(draggedEl)) selfIdx = idx;
        });
      });
      return { candidates, partnerIdx, selfIdx };
    };

    let latest = readCandidates();

    const onMove = (e: PointerEvent) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const y = e.clientY;
      let bestIdx = -1;
      let bestDist = Infinity;
      latest.candidates.forEach((c, idx) => {
        const mid = c.top + c.height / 2;
        const dist = Math.abs(mid - y);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      if (bestIdx < 0) return;
      const { partnerIdx, selfIdx } = latest;

      let proposedIdx = bestIdx;
      let denied = false;
      if (partnerIdx >= 0 && selfIdx >= 0) {
        const isStart = selfIdx <= partnerIdx;
        if (isStart && proposedIdx >= partnerIdx) {
          proposedIdx = Math.max(0, partnerIdx - 1);
          denied = true;
        } else if (!isStart && proposedIdx <= partnerIdx) {
          proposedIdx = Math.min(latest.candidates.length - 1, partnerIdx + 1);
          denied = true;
        }
      }
      const target = latest.candidates[proposedIdx];
      if (target) {
        const rect = rootEl.getBoundingClientRect();
        setIndicator({
          top: target.top - 2,
          left: rect.left,
          width: rect.width,
          denied
        });
        store.getState().updateDrag({
          proposedSlotKey: target.key,
          denied
        });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const current = store.getState().dragState;
      if (current && !current.denied && current.proposedSlotKey) {
        editor.update(() => {
          $reorderAnchor(current.nodeKey, current.proposedSlotKey!);
        });
      }
      store.getState().endDrag();
      setIndicator(null);
    };

    const onRefresh = () => {
      latest = readCandidates();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("scroll", onRefresh, { passive: true });
    window.addEventListener("resize", onRefresh);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("scroll", onRefresh);
      window.removeEventListener("resize", onRefresh);
    };
  }, [dragState, editor, store]);

  if (!dragState || !indicator || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence initial={false}>
      <m.div
        key={`bar-${indicator.top}-${indicator.denied}`}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          x: indicator.denied ? [0, -4, 4, -2, 2, 0] : 0
        }}
        exit={{ opacity: 0 }}
        transition={
          indicator.denied
            ? { duration: 0.18, ease: "easeOut" }
            : { duration: 0.1 }
        }
        style={{
          position: "fixed",
          top: indicator.top,
          left: indicator.left,
          width: indicator.width,
          height: 2,
          borderRadius: 2,
          background: indicator.denied
            ? "oklch(0.78 0.15 28 / 0.85)"
            : "oklch(0.7 0.1 250 / 0.85)",
          zIndex: 10025,
          pointerEvents: "none"
        }}
      />
    </AnimatePresence>,
    document.body
  );
}
