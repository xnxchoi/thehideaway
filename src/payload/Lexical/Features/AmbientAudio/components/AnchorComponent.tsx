"use client";

import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@payloadcms/richtext-lexical/lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@payloadcms/richtext-lexical/lexical/utils";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef } from "react";

import type { AmbientRegionData } from "../nodes/types";
import { useAmbientStore, useAmbientStoreApi } from "../store/ambientStore";
import {
  $removeGroupByKey,
  type AmbientAnchorFields,
  decodeRegion,
  isPlaceholderRegion
} from "../utils/anchors";
import { getGroupColor, groupColorOklch } from "../utils/groupColors";

const DRAG_HOLD_MS = 180;
const DRAG_SLOP_PX = 4;

function deriveAnchorLabel(
  region: AmbientRegionData,
  isPlaceholder: boolean
): { label: string; sub: string | null } {
  if (isPlaceholder) return { label: "Set track", sub: null };
  const src = region.source;
  if (src.provider === "internal") {
    return {
      label: src.title ?? "unknown",
      sub: src.artist ?? null
    };
  }
  if (src.provider === "youtube") {
    return {
      label: src.title ?? src.videoId,
      sub: src.author ?? "YouTube"
    };
  }
  return {
    label: src.title ?? src.url,
    sub: src.artist ?? null
  };
}

interface AnchorComponentProps {
  nodeKey: string;
  fields: AmbientAnchorFields;
}

export function AnchorComponent({
  nodeKey,
  fields
}: AnchorComponentProps): ReturnType<typeof m.span> {
  const kind = fields.kind ?? "start";
  const groupId = fields.groupId;
  const region: AmbientRegionData = decodeRegion(fields);
  const [editor] = useLexicalComposerContext();
  const storeApi = useAmbientStoreApi();
  const ref = useRef<HTMLSpanElement>(null);
  const [isSelected] = useLexicalNodeSelection(nodeKey);
  const isPlaceholder = isPlaceholderRegion(region);
  const isDragging = useAmbientStore((s) => s.dragState?.nodeKey === nodeKey);
  const setHoveredGroupId = useAmbientStore((s) => s.setHoveredGroupId);

  // Backspace / Delete while selected → remove whole group.
  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (!isSelected) return false;
      if (!$isNodeSelection($getSelection())) return false;
      const node = $getNodeByKey(nodeKey);
      if (!node) return false;
      event.preventDefault();
      $removeGroupByKey(editor, nodeKey);
      return true;
    },
    [editor, isSelected, nodeKey]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
    );
  }, [editor, onDelete]);

  // Native DOM pointer handling. React's synthetic event system runs inside
  // Lexical/Payload's editor DOM tree where some handlers on ancestor nodes
  // stopPropagation() on capture phase, which was swallowing our React
  // onPointerDown. Binding directly to the element sidesteps that entirely.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let holdTimer: number | null = null;
    let activePointerId: number | null = null;
    let originX = 0;
    let originY = 0;
    let dragStarted = false;

    const clearHold = () => {
      if (holdTimer !== null) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const promoteToDrag = (e: PointerEvent) => {
      dragStarted = true;
      storeApi.getState().startDrag({
        nodeKey,
        pointerId: e.pointerId,
        originX: e.clientX,
        originY: e.clientY,
        proposedSlotKey: null,
        denied: false
      });
    };

    const onMove = (e: PointerEvent) => {
      if (activePointerId === null || e.pointerId !== activePointerId) return;
      if (dragStarted) return;
      const dx = e.clientX - originX;
      const dy = e.clientY - originY;
      if (dx * dx + dy * dy > DRAG_SLOP_PX * DRAG_SLOP_PX) {
        clearHold();
        promoteToDrag(e);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (activePointerId === null || e.pointerId !== activePointerId) return;
      cleanup();
    };

    const onCancel = (e: PointerEvent) => {
      if (activePointerId === null || e.pointerId !== activePointerId) return;
      cleanup();
    };

    const cleanup = () => {
      clearHold();
      activePointerId = null;
      dragStarted = false;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Prevent Lexical text-selection from swallowing the gesture.
      e.stopPropagation();
      e.preventDefault();

      activePointerId = e.pointerId;
      originX = e.clientX;
      originY = e.clientY;
      dragStarted = false;

      clearHold();
      holdTimer = window.setTimeout(() => {
        holdTimer = null;
        promoteToDrag(e);
      }, DRAG_HOLD_MS);

      window.addEventListener("pointermove", onMove, true);
      window.addEventListener("pointerup", onUp, true);
      window.addEventListener("pointercancel", onCancel, true);
    };

    el.addEventListener("pointerdown", onDown);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      cleanup();
    };
  }, [nodeKey, storeApi]);

  const { label, sub } = deriveAnchorLabel(region, isPlaceholder);
  const groupColor = getGroupColor(groupId);
  const textAlpha = isPlaceholder ? 0.55 : 0.9;
  const borderAlpha = isPlaceholder ? 0.35 : isSelected ? 0.85 : 0.55;

  return (
    <m.span
      ref={ref}
      data-ambient-anchor={kind}
      data-ambient-group={groupId}
      data-ambient-group-color={groupColor.token}
      data-ambient-placeholder={isPlaceholder ? "true" : "false"}
      data-selected={isSelected ? "true" : "false"}
      role="button"
      tabIndex={-1}
      className={
        "ambient-anchor inline-flex items-center gap-1 border-b align-baseline font-mono text-xs tracking-wider select-none"
      }
      onPointerEnter={() => setHoveredGroupId(groupId)}
      onPointerLeave={() => setHoveredGroupId(null)}
      animate={{
        scale: isDragging ? 1.08 : 1,
        y: isDragging ? -1 : 0
      }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{
        borderBottomStyle: isSelected ? "solid" : "dotted",
        borderBottomWidth: 1,
        borderBottomColor: groupColorOklch(groupColor, borderAlpha),
        padding: "0 3px",
        color: groupColorOklch(groupColor, textAlpha),
        opacity: isPlaceholder ? 0.75 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isDragging
          ? `0 6px 16px -4px ${groupColorOklch(groupColor, 0.4)}`
          : undefined,
        touchAction: "none"
      }}
    >
      <m.span
        aria-hidden
        style={{
          display: "inline-block",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "currentColor",
          opacity: isPlaceholder ? 0.35 : 0.7,
          clipPath: kind === "start" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)"
        }}
      />
      <span className="truncate">
        {label}
        {sub ? ` · ${sub}` : ""}
      </span>
    </m.span>
  );
}
