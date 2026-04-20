"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useMotionValue, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore } from "../store/ambientStore";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const EMPTY_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 };

/**
 * Calendar-date-range-picker style overlay. While `placingStart`/`placingEnd`
 * it draws a translucent fill spanning from the committed start anchor (or
 * from the focused block when no start yet) down to the currently focused
 * block. Updates live as the caret moves, giving the user a preview of the
 * region they're about to commit.
 *
 * Compositor-friendly: only transform/opacity animate; top/left/width/height
 * are applied directly through motion values so the browser can skip layout
 * work between caret moves.
 */
export function SelectionFollowOverlay() {
  const [editor] = useLexicalComposerContext();
  const phase = useAmbientStore((s) => s.phase);
  const pendingStartKey = useAmbientStore((s) => s.pendingStartKey);
  const pendingEndKey = useAmbientStore((s) => s.pendingEndKey);
  const focusedNodeKey = useAmbientStore((s) => s.focusedNodeKey);

  const active = phase === "placingStart" || phase === "placingEnd";
  const rect = useMotionValue<Rect>(EMPTY_RECT);
  const opacity = useMotionValue(0);

  useLayoutEffect(() => {
    if (!active) {
      opacity.set(0);
      return;
    }

    const measure = () => {
      const rootEl = editor.getRootElement();
      if (!rootEl) return;

      const focusedEl = focusedNodeKey
        ? editor.getElementByKey(focusedNodeKey)
        : null;
      const startEl = pendingStartKey
        ? editor.getElementByKey(pendingStartKey)
        : null;
      const endEl = pendingEndKey
        ? editor.getElementByKey(pendingEndKey)
        : null;

      const rootRect = rootEl.getBoundingClientRect();

      // Decide which two rects bound the preview range.
      //   placingStart + no start committed → follow focused block only.
      //   placingEnd   + start committed    → from start anchor to focus.
      //   placingStart + start committed    → from focus to end (adjusting).
      const anchorRect = (() => {
        if (phase === "placingEnd" && startEl) {
          return startEl.getBoundingClientRect();
        }
        if (phase === "placingStart" && endEl) {
          return endEl.getBoundingClientRect();
        }
        return null;
      })();

      const focusRect = focusedEl
        ? focusedEl.getBoundingClientRect()
        : anchorRect;
      if (!focusRect) {
        opacity.set(0);
        return;
      }

      const top = anchorRect
        ? Math.min(anchorRect.top, focusRect.top)
        : focusRect.top;
      const bottom = anchorRect
        ? Math.max(anchorRect.bottom, focusRect.bottom)
        : focusRect.bottom;

      rect.set({
        top,
        left: rootRect.left,
        width: rootRect.width,
        height: Math.max(bottom - top, focusRect.height)
      });
      opacity.set(1);
    };

    measure();
    const onScrollOrResize = () => measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    const raf = window.requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.cancelAnimationFrame(raf);
    };
  }, [
    editor,
    active,
    phase,
    focusedNodeKey,
    pendingStartKey,
    pendingEndKey,
    rect,
    opacity
  ]);

  const top = useTransform(() => rect.get().top);
  const left = useTransform(() => rect.get().left);
  const width = useTransform(() => rect.get().width);
  const height = useTransform(() => rect.get().height);

  if (!active) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <m.div
      aria-hidden
      style={{
        position: "fixed",
        top,
        left,
        width,
        height,
        opacity,
        pointerEvents: "none",
        zIndex: 10015,
        borderRadius: 8,
        background:
          "linear-gradient(180deg, oklch(0.7 0.1 250 / 0.08), oklch(0.7 0.1 250 / 0.12))",
        boxShadow: "inset 0 0 0 1px oklch(0.7 0.1 250 / 0.18)"
      }}
      transition={{ type: "spring", bounce: 0.1, visualDuration: 0.2 }}
    />,
    document.body
  );
}
