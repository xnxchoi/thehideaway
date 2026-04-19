"use client";

import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type NodeKey
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@payloadcms/richtext-lexical/lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@payloadcms/richtext-lexical/lexical/utils";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef } from "react";

import type { AmbientTrackRef, AnchorKind } from "../nodes/types";
import { useAmbientStoreApi } from "../store/ambientStore";
import { $removeGroupByKey, isPlaceholderTrack } from "../utils/anchors";

const DRAG_HOLD_MS = 250;

interface AnchorComponentProps {
  kind: AnchorKind;
  nodeKey: NodeKey;
  groupId: string;
  track: AmbientTrackRef;
}

export function AnchorComponent({
  kind,
  nodeKey,
  groupId,
  track
}: AnchorComponentProps) {
  const [editor] = useLexicalComposerContext();
  const storeApi = useAmbientStoreApi();
  const ref = useRef<HTMLSpanElement>(null);
  const [isSelected] = useLexicalNodeSelection(nodeKey);
  const isPlaceholder = isPlaceholderTrack(track);

  const holdTimerRef = useRef<number | null>(null);

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

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      const el = ref.current;
      if (!el) return;
      e.stopPropagation();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // noop
      }
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null;
        // Promote to drag. AnchorDragReorder takes over from here.
        storeApi.getState().startDrag({
          nodeKey,
          pointerId: e.pointerId,
          originX: e.clientX,
          originY: e.clientY,
          proposedSlotKey: null,
          denied: false
        });
      }, DRAG_HOLD_MS);
    },
    [nodeKey, storeApi]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      const el = ref.current;
      if (holdTimerRef.current) {
        window.clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      const dragActive = storeApi.getState().dragState;
      if (dragActive) return; // DragReorder handles the lift.
      if (!el) return;
      storeApi.getState().openAnchorMenu(nodeKey, el);
      e.stopPropagation();
    },
    [nodeKey, storeApi]
  );

  const onPointerCancel = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const label = isPlaceholder ? "Set track" : (track.title ?? "unknown");
  const sub = isPlaceholder ? null : (track.artist ?? null);

  return (
    <m.span
      ref={ref}
      data-ambient-anchor={kind}
      data-ambient-group={groupId}
      data-ambient-placeholder={isPlaceholder ? "true" : "false"}
      data-selected={isSelected ? "true" : "false"}
      role="button"
      tabIndex={-1}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={
        "ambient-anchor inline-flex items-center gap-1 border-b align-baseline font-mono text-xs tracking-wider select-none"
      }
      style={{
        borderBottomStyle: isSelected ? "solid" : "dotted",
        borderBottomWidth: 1,
        padding: "0 3px",
        color: isPlaceholder
          ? "oklch(0.7 0 0 / 0.55)"
          : "oklch(0.7 0 0 / 0.9)",
        opacity: isPlaceholder ? 0.75 : 1,
        cursor: "pointer"
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
          opacity: isPlaceholder ? 0.35 : 0.55,
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
