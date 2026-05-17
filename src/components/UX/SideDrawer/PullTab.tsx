"use client";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import { useRPStore } from "@/providers/RP_Pro";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/shallow";

/**
 * Closed-state pull-up affordance for the mobile SideDrawer.
 *
 * Lives as a fixed-position pill at the bottom of the viewport on
 * touch-mobile when the drawer is closed. Tapping it opens the drawer
 * — same `setSideDrawerOpen(true)` semantics as any other open trigger.
 *
 * Design intent: discoverability without visual noise. The pill matches
 * the in-drawer `Drawer.Handle` (44×6px, rounded-full, `bg-foreground/70`)
 * so once the drawer opens and the in-drawer handle reveals at the top,
 * the user reads them as the same affordance — one closed, one open.
 *
 * Stacking + vertical placement:
 *   - z-[238]  pull tab (this component)        ← lower
 *   - z-[239]  SideDrawer Mrawer / shell        ← rises above when open
 *   - z-[249]  Controlbar (persistent bottom strip — ~88px tall)
 *   - z-[260]  SearchSheet overlay (full screen)
 *
 * Because the Controlbar now floats at the bottom of the viewport at a
 * higher z-index, the pill's `bottom` offset must clear the Controlbar's
 * footprint (h-16 + pb-12 + safe-area) plus a small gap. We don't pin
 * the pill directly to the Controlbar's top edge — that read as a UI
 * seam; leaving a small gap makes the pill float as an indicator.
 *
 * Hit area is intentionally inflated by transparent padding to ~84×30
 * (Apple's minimum tap target) while the visible pill stays 32×4.
 */
export const SideDrawerPullTab = () => {
  const { isMobile, isTouch } = useIsMobile();
  const sidebarOpen = useRPStore(useShallow((s) => s.sidebarOpen));
  // Also gate on the full-screen Menu's open state. When the Menu is up,
  // its own bottom frame paints over the bottom of the viewport — the
  // pill would either sit behind it (invisible) or fight the frame's
  // z-index. Hiding the pill is the correct call here: the Menu already
  // exposes navigation, search, account, etc., so the pill is redundant
  // in that state. Avoids touching the Menu's CSS.
  const navIsOpen = useRPStore(useShallow((s) => s.navIsOpen));
  const setSideDrawerOpen = useRPStore((s) => s.setSideDrawerOpen);
  // Portal target must be resolved client-side. Initial null suppresses
  // SSR rendering of the pill entirely (correct — it's touch-only UI).
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Drag-up to open. The hit area is a generous strip (see render
  // below) so the user doesn't have to hunt for the visible pill; the
  // activation threshold is intentionally HIGH (24px) so a tap or
  // incidental brush never opens the drawer — only a deliberate
  // upward pull. Tapping still works as a fallback path via `onClick`.
  const DRAG_OPEN_PX = 24;
  const dragStartY = useRef<number | null>(null);
  const dragFired = useRef(false);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? null;
    dragFired.current = false;
  }, []);
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragFired.current || dragStartY.current == null) return;
      const dy = (e.touches[0]?.clientY ?? 0) - dragStartY.current;
      if (dy < -DRAG_OPEN_PX) {
        dragFired.current = true;
        setSideDrawerOpen(true);
      }
    },
    [setSideDrawerOpen]
  );
  const onTouchEnd = useCallback(() => {
    dragStartY.current = null;
  }, []);
  const onClick = useCallback(() => {
    // Suppress the synthetic click that fires after a drag — drawer
    // already opened mid-gesture; calling setOpen(true) again is
    // harmless but the early-return keeps intent explicit.
    if (dragFired.current) {
      dragFired.current = false;
      return;
    }
    setSideDrawerOpen(true);
  }, [setSideDrawerOpen]);

  if (!(isMobile && isTouch) || !portalTarget) return null;

  // Portal to <body>. The pill is fixed-positioned, and any transformed
  // ancestor (Lenis wrappers, ContentMask's motion.divs, the LazyMotion
  // tree) turns `position: fixed` into ancestor-relative positioning,
  // which is what shifted the pill off-center on real iOS.
  return createPortal(
    <AnimatePresence>
      {!sidebarOpen && !navIsOpen && (
        <m.button
          key="side-drawer-pull-tab"
          type="button"
          aria-label="Open navigation"
          onClick={onClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          className={cn(
            // Full-width hit strip sized to the FXFrame footer area
            // (~80px tall). Lives just above the floating Controlbar
            // so a deliberate upward pull anywhere across the bottom
            // band activates the drawer. The visible pill stays small;
            // it's a hint, not the target.
            "fixed inset-x-0 z-[238] touch-none",
            "flex h-20 items-center justify-center"
          )}
          style={{
            // Sits directly on top of the floating Controlbar's upper
            // edge. 76px ≈ Controlbar content height (h-16 + pb-12 +
            // safe-area). No additional gap — we want the strip to
            // start right where the bar ends.
            bottom: "calc(env(safe-area-inset-bottom) + 76px)"
          }}
        >
          <span
            aria-hidden="true"
            className={cn(
              // Visible pill stays small; the hit area around it is
              // what the user actually targets.
              "block h-[4px] w-[36px] rounded-full",
              "bg-foreground/70",
              "shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_2px_8px_-4px_rgb(0_0_0/0.2)]"
            )}
          />
        </m.button>
      )}
    </AnimatePresence>,
    portalTarget
  );
};
