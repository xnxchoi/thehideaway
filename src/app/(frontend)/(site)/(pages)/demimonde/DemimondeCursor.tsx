"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor tracker — writes normalized `--cursor-x` and `--cursor-y` CSS
 * variables (0..1) onto `<html>` (document.documentElement), plus a
 * centered pair (`--cursor-dx/dy`, -0.5..0.5) and raw pixel position
 * (`--cursor-vx/vy`).
 *
 * Targeting documentElement instead of a specific shell is intentional:
 * the page is wrapped in <RPage> (a third-party-ish transition component
 * that doesn't forward arbitrary props), so we cannot tag a known DOM
 * node from outside it. Setting on <html> works regardless because CSS
 * custom properties cascade.
 *
 * Updates run inside requestAnimationFrame to coalesce per-frame work
 * (multiple pointermove events per frame collapse into one DOM write).
 * On touch-primary devices we attach nothing — the variables stay at
 * their defaults (center), and the page still feels intentional.
 *
 * Renders nothing.
 */
export function DemimondeCursor() {
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isCoarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (isCoarse) return;

    const root = document.documentElement;

    const flush = () => {
      frame.current = null;
      const pos = pending.current;
      if (!pos) return;
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      root.style.setProperty("--cursor-x", String(pos.x / w));
      root.style.setProperty("--cursor-y", String(pos.y / h));
      root.style.setProperty("--cursor-dx", String(pos.x / w - 0.5));
      root.style.setProperty("--cursor-dy", String(pos.y / h - 0.5));
      root.style.setProperty("--cursor-vx", `${pos.x}px`);
      root.style.setProperty("--cursor-vy", `${pos.y}px`);
    };

    const onMove = (e: PointerEvent) => {
      pending.current = { x: e.clientX, y: e.clientY };
      if (frame.current == null) {
        frame.current = requestAnimationFrame(flush);
      }
    };

    // Seed defaults so vars are defined before the first move.
    root.style.setProperty("--cursor-x", "0.5");
    root.style.setProperty("--cursor-y", "0.5");
    root.style.setProperty("--cursor-dx", "0");
    root.style.setProperty("--cursor-dy", "0");

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current != null) cancelAnimationFrame(frame.current);
      // Clean up so other pages don't inherit our drift.
      root.style.removeProperty("--cursor-x");
      root.style.removeProperty("--cursor-y");
      root.style.removeProperty("--cursor-dx");
      root.style.removeProperty("--cursor-dy");
      root.style.removeProperty("--cursor-vx");
      root.style.removeProperty("--cursor-vy");
    };
  }, []);

  return null;
}
