"use client";

import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  type NodeKey
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@payloadcms/richtext-lexical/lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@payloadcms/richtext-lexical/lexical/utils";
import { useMotionValue, useTransform } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import * as m from "motion/react-m";
import type { AmbientTrackRef, AnchorKind } from "../nodes/types";
import { useAmbientStore } from "../store/ambientStore";
import { $removeGroupByKey } from "../utils/anchors";

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
  const ref = useRef<HTMLSpanElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const openPicker = useAmbientStore((s) => s.openPicker);
  const selectedValue = useMotionValue(isSelected);
  useEffect(() => {
    selectedValue.set(isSelected);
  }, [selectedValue, isSelected]);
  const borderStyle = useTransform(() =>
    selectedValue.get() ? "solid" : "dotted"
  );
  const onClick = useCallback(
    (event: MouseEvent) => {
      const el = ref.current;
      if (!el) return false;
      if (event.target !== el && !el.contains(event.target as Node)) {
        return false;
      }
      if (!event.shiftKey) clearSelection();
      setSelected(true);
      openPicker({ anchorEl: el, groupId });
      return true;
    },
    [clearSelection, setSelected, openPicker, groupId]
  );

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
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
    );
  }, [editor, onClick, onDelete]);

  const label = track.title ?? "unknown";
  const sub = track.artist;

  return (
    <m.span
      ref={ref}
      data-ambient-anchor={kind}
      data-ambient-group={groupId}
      data-selected={isSelected ? "true" : "false"}
      role="button"
      tabIndex={-1}
      className={
        "ambient-anchor inline-flex items-center gap-1 border-b-1 align-baseline font-mono text-xs tracking-wider text-foreground/70 select-none"
      }
      style={{
        borderBottomStyle: borderStyle,
        padding: "0 2px"
      }}
    >
      <m.span
        aria-hidden
        style={{
          display: "inline-block",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "currentColor",
          opacity: 0.5,
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
