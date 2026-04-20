"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore } from "../store/ambientStore";
import { $listGroups, $removeGroup } from "../utils/anchors";

interface ContextTarget {
  groupId: string | null;
  anchorEl: HTMLElement | null;
}

interface AmbientContextMenuProps {
  onOpenPickerForGroup: (args: {
    anchorEl: HTMLElement | null;
    groupId: string;
  }) => void;
  onAdjustRange: (groupId: string) => void;
}

const EMPTY_TARGET: ContextTarget = { groupId: null, anchorEl: null };

/**
 * Right-click menu on the editor root. Context-sensitive:
 *   - Inside an existing ambient region → change track / adjust range / remove.
 *   - Outside → add ambient audio (enter select mode).
 *
 * Region detection runs at contextmenu time against `$listGroups()`: a hit is
 * any group whose start/end block rects vertically bracket the click Y.
 */
export function AmbientContextMenu({
  onOpenPickerForGroup,
  onAdjustRange
}: AmbientContextMenuProps) {
  const [editor] = useLexicalComposerContext();
  const contextMenuOpen = useAmbientStore((s) => s.contextMenuOpen);
  const x = useAmbientStore((s) => s.contextMenuX);
  const y = useAmbientStore((s) => s.contextMenuY);
  const openContextMenu = useAmbientStore((s) => s.openContextMenu);
  const closeContextMenu = useAmbientStore((s) => s.closeContextMenu);
  const enterSelectMode = useAmbientStore((s) => s.enterSelectMode);

  const [target, setTarget] = useState<ContextTarget>(EMPTY_TARGET);

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const onContextMenu = (event: Event) => {
      const me = event as MouseEvent;
      me.preventDefault();

      let hit: ContextTarget = EMPTY_TARGET;
      editor.getEditorState().read(() => {
        for (const pair of $listGroups()) {
          if (!pair.start || !pair.end) continue;
          const startEl = editor.getElementByKey(pair.start.getKey());
          const endEl = editor.getElementByKey(pair.end.getKey());
          if (!startEl || !endEl) continue;
          const sr = startEl.getBoundingClientRect();
          const er = endEl.getBoundingClientRect();
          if (me.clientY >= sr.top && me.clientY <= er.bottom) {
            hit = { groupId: pair.groupId, anchorEl: startEl };
            break;
          }
        }
      });

      setTarget(hit);
      openContextMenu(me.clientX, me.clientY);
    };

    rootEl.addEventListener("contextmenu", onContextMenu);
    return () => rootEl.removeEventListener("contextmenu", onContextMenu);
  }, [editor, openContextMenu]);

  useEffect(() => {
    if (!contextMenuOpen) return;
    const onDocClick = () => closeContextMenu();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContextMenu();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextMenuOpen, closeContextMenu]);

  const handleAdd = useCallback(() => {
    enterSelectMode();
    closeContextMenu();
  }, [enterSelectMode, closeContextMenu]);

  const handleChangeTrack = useCallback(() => {
    if (!target.groupId) return;
    onOpenPickerForGroup({
      anchorEl: target.anchorEl,
      groupId: target.groupId
    });
    closeContextMenu();
  }, [target, onOpenPickerForGroup, closeContextMenu]);

  const handleAdjustRange = useCallback(() => {
    if (!target.groupId) return;
    onAdjustRange(target.groupId);
    closeContextMenu();
  }, [target, onAdjustRange, closeContextMenu]);

  const handleRemove = useCallback(() => {
    if (!target.groupId) return;
    const gid = target.groupId;
    editor.update(() => {
      $removeGroup(gid);
    });
    closeContextMenu();
  }, [target, editor, closeContextMenu]);

  if (!contextMenuOpen || typeof document === "undefined") return null;

  const insideRegion = target.groupId !== null;

  return createPortal(
    <div
      role="menu"
      data-ambient-portal="context-menu"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: y,
        left: x,
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
      {insideRegion ? (
        <>
          <MenuItem onClick={handleChangeTrack}>Change track</MenuItem>
          <MenuItem onClick={handleAdjustRange}>Adjust range</MenuItem>
          <MenuDivider />
          <MenuItem onClick={handleRemove} tone="danger">
            Remove ambient audio
          </MenuItem>
        </>
      ) : (
        <MenuItem onClick={handleAdd}>Add ambient audio…</MenuItem>
      )}
    </div>,
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
      role="menuitem"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
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
