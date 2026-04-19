"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore, useAmbientStoreApi } from "../store/ambientStore";

/**
 * Ephemeral "Tap again nearby to reset" tooltip shown after a click inside
 * a settled range. Auto-dismisses when the reset-window expires; the plugin
 * handles the actual second-click detection.
 */
export function ResetPrompt() {
  const store = useAmbientStoreApi();
  const resetWindow = useAmbientStore((s) => s.resetWindow);

  useEffect(() => {
    if (!resetWindow) return;
    const remaining = resetWindow.expiresAt - performance.now();
    if (remaining <= 0) {
      store.getState().closeResetWindow();
      return;
    }
    const t = window.setTimeout(() => {
      store.getState().closeResetWindow();
    }, remaining);
    return () => window.clearTimeout(t);
  }, [resetWindow, store]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {resetWindow ? (
        <m.div
          key="reset"
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0.2, visualDuration: 0.24 }}
          style={{
            position: "fixed",
            top: resetWindow.y + 14,
            left: resetWindow.x - 90,
            zIndex: 10023,
            pointerEvents: "none",
            padding: "6px 10px",
            borderRadius: 999,
            background: "oklch(0.14 0 0 / 0.88)",
            backdropFilter: "blur(12px) saturate(1.2)",
            WebkitBackdropFilter: "blur(12px) saturate(1.2)",
            color: "oklch(0.96 0 0 / 0.92)",
            fontFamily: "var(--font-mono, ui-monospace)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            whiteSpace: "nowrap"
          }}
        >
          Tap again nearby to reset
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
