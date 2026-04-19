"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import * as m from "motion/react-m";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore } from "../store/ambientStore";

interface CommitChipProps {
  onCommit: () => void;
}

/**
 * Floating capsule button anchored below the focused node. Primary commit
 * path on mobile (where ⌘⏎ isn't practical) and a secondary fast path on
 * PC. Visible only while in a placement phase with a focused node.
 */
export function CommitChip({ onCommit }: CommitChipProps) {
  const [editor] = useLexicalComposerContext();
  const phase = useAmbientStore((s) => s.phase);
  const focusedNodeKey = useAmbientStore((s) => s.focusedNodeKey);
  const active = phase === "placingStart" || phase === "placingEnd";

  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!active || !focusedNodeKey) {
      setPos(null);
      return;
    }
    const measure = () => {
      const el = editor.getElementByKey(focusedNodeKey);
      if (!el) {
        setPos(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.right - 140 });
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [editor, focusedNodeKey, active]);

  if (!active || !pos || typeof document === "undefined") return null;

  const label = phase === "placingStart" ? "Set as start" : "Set as end";

  return createPortal(
    <m.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCommit();
      }}
      initial={{ opacity: 0, y: -4, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", bounce: 0.24, visualDuration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      style={{
        position: "fixed",
        top: pos.top,
        left: Math.max(8, pos.left),
        zIndex: 10022,
        padding: "6px 14px",
        borderRadius: 999,
        border: "1px solid oklch(0.7 0.1 250 / 0.4)",
        background: "oklch(0.16 0 0 / 0.88)",
        backdropFilter: "blur(14px) saturate(1.3)",
        WebkitBackdropFilter: "blur(14px) saturate(1.3)",
        color: "oklch(0.98 0 0 / 0.95)",
        fontFamily: "var(--font-mono, ui-monospace)",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
        whiteSpace: "nowrap"
      }}
    >
      {label}
    </m.button>,
    document.body
  );
}
