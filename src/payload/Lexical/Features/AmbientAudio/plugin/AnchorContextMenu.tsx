"use client";

import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions
} from "@floating-ui/react";
import {
  $getNodeByKey,
  type LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import {
  $isAmbientAudioEndNode,
  type AmbientAudioEndNode
} from "../nodes/AmbientAudioEndNode";
import {
  $isAmbientAudioStartNode,
  type AmbientAudioStartNode
} from "../nodes/AmbientAudioStartNode";
import type { AmbientTrackRef } from "../nodes/types";
import { useAmbientStore, useAmbientStoreApi } from "../store/ambientStore";
import {
  $removeGroup,
  $updateGroupTrack,
  isPlaceholderTrack
} from "../utils/anchors";
import { getTrackById } from "../utils/tracks";

interface AnchorContextMenuProps {
  onOpenPickerForGroup: (args: {
    anchorEl: HTMLElement | null;
    groupId: string;
  }) => void;
  onAdjustRange: (groupId: string) => void;
}

function $readGroupState(
  editor: LexicalEditor,
  nodeKey: string
): {
  groupId: string | null;
  track: AmbientTrackRef | null;
  isPlaceholder: boolean;
} {
  let out = {
    groupId: null as string | null,
    track: null as AmbientTrackRef | null,
    isPlaceholder: false
  };
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    if (!node) return;
    if ($isAmbientAudioStartNode(node) || $isAmbientAudioEndNode(node)) {
      const n = node as AmbientAudioStartNode | AmbientAudioEndNode;
      const track = n.getTrack();
      out = {
        groupId: n.getGroupId(),
        track,
        isPlaceholder: isPlaceholderTrack(track)
      };
    }
  });
  return out;
}

/**
 * Notion-styled context menu attached to an anchor. Items:
 *   1. Change track
 *   2. Adjust range
 *   3. Reload track info (conditional — only when stale/missing url)
 *   4. Remove this region (danger, divided)
 *
 * "Copy region" (planned) is deferred — needs paste-side plumbing.
 */
export function AnchorContextMenu({
  onOpenPickerForGroup,
  onAdjustRange
}: AnchorContextMenuProps) {
  const [editor] = useLexicalComposerContext();
  const store = useAmbientStoreApi();
  const anchorMenuKey = useAmbientStore((s) => s.anchorMenuKey);
  const anchorMenuEl = useAmbientStore((s) => s.anchorMenuEl);
  const open = !!anchorMenuKey && !!anchorMenuEl;

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (o) => {
      if (!o) store.getState().closeAnchorMenu();
    },
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate
  });

  useEffect(() => {
    if (anchorMenuEl) refs.setReference(anchorMenuEl);
  }, [anchorMenuEl, refs]);

  const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true });
  const { getFloatingProps } = useInteractions([dismiss]);

  const close = useCallback(() => {
    store.getState().closeAnchorMenu();
  }, [store]);

  const handleChangeTrack = useCallback(() => {
    if (!anchorMenuKey) return;
    const { groupId } = $readGroupState(editor, anchorMenuKey);
    if (!groupId) return close();
    onOpenPickerForGroup({ anchorEl: anchorMenuEl, groupId });
    close();
  }, [anchorMenuKey, anchorMenuEl, editor, onOpenPickerForGroup, close]);

  const handleAdjustRange = useCallback(() => {
    if (!anchorMenuKey) return;
    const { groupId } = $readGroupState(editor, anchorMenuKey);
    if (!groupId) return close();
    onAdjustRange(groupId);
    close();
  }, [anchorMenuKey, editor, onAdjustRange, close]);

  const handleRemove = useCallback(() => {
    if (!anchorMenuKey) return;
    editor.update(() => {
      const s = $readGroupState(editor, anchorMenuKey);
      if (s.groupId) $removeGroup(s.groupId);
    });
    close();
  }, [anchorMenuKey, editor, close]);

  const handleReloadTrack = useCallback(async () => {
    if (!anchorMenuKey) return;
    const snapshot = $readGroupState(editor, anchorMenuKey);
    if (!snapshot.groupId || !snapshot.track?.trackId) return close();
    try {
      const fresh = await getTrackById(snapshot.track.trackId);
      if (fresh) {
        editor.update(() => {
          $updateGroupTrack(snapshot.groupId!, fresh);
        });
      }
    } catch {
      // noop
    }
    close();
  }, [anchorMenuKey, editor, close]);

  const snapshot = anchorMenuKey
    ? $readGroupState(editor, anchorMenuKey)
    : null;
  const showReload = !!(snapshot && snapshot.track && !snapshot.track.url);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          ref={refs.setFloating}
          {...getFloatingProps()}
          initial={{ opacity: 0, y: -4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={{ type: "spring", bounce: 0.18, visualDuration: 0.22 }}
          style={{
            ...floatingStyles,
            zIndex: 10024,
            minWidth: 220,
            padding: 4,
            borderRadius: 8,
            border: "1px solid oklch(0.3 0 0 / 0.4)",
            background: "oklch(0.13 0 0 / 0.92)",
            backdropFilter: "blur(16px) saturate(1.3)",
            WebkitBackdropFilter: "blur(16px) saturate(1.3)",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.35), 0 2px 10px rgba(0,0,0,0.2)",
            color: "oklch(0.96 0 0 / 0.92)",
            fontFamily: "var(--font-sans, system-ui)",
            fontSize: 12
          }}
        >
          <MenuItem onClick={handleChangeTrack}>Change track</MenuItem>
          <MenuItem onClick={handleAdjustRange}>Adjust range</MenuItem>
          {showReload ? (
            <MenuItem onClick={handleReloadTrack}>Reload track info</MenuItem>
          ) : null}
          <MenuDivider />
          <MenuItem onClick={handleRemove} tone="danger">
            Remove this region
          </MenuItem>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function MenuItem({
  children,
  onClick,
  tone
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "8px 10px",
        textAlign: "left",
        background: "transparent",
        border: "none",
        color:
          tone === "danger"
            ? "oklch(0.78 0.15 28 / 0.95)"
            : "oklch(0.96 0 0 / 0.92)",
        cursor: "pointer",
        borderRadius: 6,
        fontSize: 12,
        letterSpacing: "0.01em"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "oklch(0.2 0 0 / 0.6)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function MenuDivider() {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        margin: "4px 0",
        background: "oklch(0.3 0 0 / 0.4)"
      }}
    />
  );
}
