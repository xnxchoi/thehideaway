"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore } from "../store/ambientStore";

export function AmbientContextMenu() {
  const [editor] = useLexicalComposerContext();
  const contextMenuOpen = useAmbientStore((s) => s.contextMenuOpen);
  const x = useAmbientStore((s) => s.contextMenuX);
  const y = useAmbientStore((s) => s.contextMenuY);
  const openContextMenu = useAmbientStore((s) => s.openContextMenu);
  const closeContextMenu = useAmbientStore((s) => s.closeContextMenu);
  const enterSelectMode = useAmbientStore((s) => s.enterSelectMode);

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const onContextMenu = (event: Event) => {
      const me = event as MouseEvent;
      me.preventDefault();
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

  if (!contextMenuOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="menu"
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: y,
        left: x,
        zIndex: 9998,
        minWidth: 200,
        background: "var(--background, #111)",
        border: "1px solid var(--border, #222)",
        borderRadius: 4,
        boxShadow: "0 10px 40px rgba(0,0,0,.35)",
        padding: 4
      }}
    >
      <button
        type="button"
        role="menuitem"
        className="w-full cursor-pointer px-3 py-2 text-left font-mono text-[11px] text-foreground/80 hover:bg-accent/50"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          enterSelectMode();
          closeContextMenu();
        }}
      >
        Add ambient audio…
      </button>
    </div>,
    document.body
  );
}
