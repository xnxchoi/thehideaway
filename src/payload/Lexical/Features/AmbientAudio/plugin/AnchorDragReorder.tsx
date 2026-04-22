"use client";

import { $getNodeByKey, $getRoot } from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore, useAmbientStoreApi } from "../store/ambientStore";
import {
  $findAnchorPair,
  $isAmbientAnchor,
  $isAmbientStartAnchor,
  $reorderAnchor,
  getAnchorGroupId
} from "../utils/anchors";
import { getGroupColor, groupColorOklch } from "../utils/groupColors";

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

  // Resolve the dragged anchor's groupId once per drag session, so the
  // indicator bar can adopt the group's palette hue and stay visually
  // coherent with the anchor chip itself.
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const groupColor = useMemo(
    () => getGroupColor(draggedGroupId ?? "__dragging__"),
    [draggedGroupId]
  );

  // Soft spring for the bar's vertical position. Bouncy enough to signal
  // snap, damped enough that it settles within ~1 slot change. Horizontal
  // and width swaps use the style attributes directly — only Y benefits
  // from the spring because that's the axis the user perceives as motion.
  const springY = useSpring(0, { stiffness: 320, damping: 22, mass: 0.6 });
  const transformY = useTransform(springY, (v) => `translate3d(0, ${v}px, 0)`);

  useEffect(() => {
    if (!dragState) {
      setIndicator(null);
      setDraggedGroupId(null);
      return;
    }

    editor.getEditorState().read(() => {
      const node = $getNodeByKey(dragState.nodeKey);
      if ($isAmbientAnchor(node)) {
        setDraggedGroupId(getAnchorGroupId(node));
      }
    });

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
        if (!$isAmbientAnchor(draggedNode)) return;
        const isStart = $isAmbientStartAnchor(draggedNode);

        const groupId = getAnchorGroupId(draggedNode);
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

  useEffect(() => {
    if (indicator) springY.set(indicator.top);
  }, [indicator, springY]);

  if (!dragState || !indicator || typeof document === "undefined") return null;

  return createPortal(
    <m.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        x: indicator.denied ? [0, -4, 4, -2, 2, 0] : 0
      }}
      transition={
        indicator.denied
          ? { duration: 0.18, ease: "easeOut" }
          : { duration: 0.12 }
      }
      style={{
        position: "fixed",
        top: 0,
        left: indicator.left,
        width: indicator.width,
        height: 2,
        borderRadius: 2,
        transform: transformY,
        background: indicator.denied
          ? "oklch(0.78 0.15 28 / 0.85)"
          : groupColorOklch(groupColor, 0.85),
        zIndex: 10025,
        pointerEvents: "none",
        willChange: "transform"
      }}
    />,
    document.body
  );
}
