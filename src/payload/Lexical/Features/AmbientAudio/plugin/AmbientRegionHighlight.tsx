"use client";

import { $getRoot } from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAmbientStore } from "../store/ambientStore";
import { $groupRangeIndices, $listGroups } from "../utils/anchors";
import { getGroupColor, groupColorOklch } from "../utils/groupColors";

interface RegionBand {
  groupId: string;
  top: number;
  left: number;
  width: number;
  height: number;
  active: boolean;
}

/**
 * Always-on indicator for settled ambient regions. Paints a full-width block
 * band spanning the group's block range. Two tiers:
 *
 * 1. **Subtle (default)** — a soft editorial wash, just enough to mark the
 *    region as ambient-scoped.
 * 2. **Pronounced (active)** — bumped alpha + accent border, used when the
 *    group is hovered via its anchor chip, or when either anchor is part of
 *    the current node selection.
 *
 * Distinct from `SelectionFollowOverlay`, which paints the live range preview
 * during placement. This layer is hidden while the user is placing new
 * anchors so the two overlays don't fight for attention.
 */
export function AmbientRegionHighlight() {
  const [editor] = useLexicalComposerContext();
  const phase = useAmbientStore((s) => s.phase);
  const hoveredGroupId = useAmbientStore((s) => s.hoveredGroupId);
  const activeCtxGroupId = useAmbientStore((s) => s.activeCtxGroupId);
  const [bands, setBands] = useState<RegionBand[]>([]);

  const enabled =
    phase === "idle" || phase === "settled" || phase === "pickingTrack";

  useEffect(() => {
    if (!enabled) {
      setBands([]);
      return;
    }

    let rafId: number | null = null;

    const measure = () => {
      const rootEl = editor.getRootElement();
      if (!rootEl) {
        setBands([]);
        return;
      }
      const rr = rootEl.getBoundingClientRect();
      const next: RegionBand[] = [];
      editor.getEditorState().read(() => {
        const children = $getRoot().getChildren();
        for (const pair of $listGroups()) {
          if (!pair.start || !pair.end) continue;
          const range = $groupRangeIndices(pair.start, pair.end);
          if (!range) continue;

          const sEl = editor.getElementByKey(pair.start.getKey());
          const eEl = editor.getElementByKey(pair.end.getKey());
          const isSelected = !!(
            sEl?.querySelector('[data-selected="true"]') ||
            eEl?.querySelector('[data-selected="true"]') ||
            sEl?.getAttribute("data-selected") === "true" ||
            eEl?.getAttribute("data-selected") === "true"
          );
          const active =
            pair.groupId === hoveredGroupId ||
            pair.groupId === activeCtxGroupId ||
            isSelected;

          let top = Number.POSITIVE_INFINITY;
          let bottom = Number.NEGATIVE_INFINITY;
          for (let i = range.startIdx; i <= range.endIdx; i++) {
            const block = children[i];
            if (!block) continue;
            const el = editor.getElementByKey(block.getKey());
            if (!el) continue;
            const br = el.getBoundingClientRect();
            // Clip the first/last blocks against the anchor positions so
            // inline anchors that land mid-paragraph only tint the portion
            // actually inside the region, not the whole containing block.
            let blockTop = br.top;
            let blockBottom = br.bottom;
            if (i === range.startIdx && sEl && el.contains(sEl)) {
              const sr = sEl.getBoundingClientRect();
              if (sr.top > blockTop) blockTop = sr.top;
            }
            if (i === range.endIdx && eEl && el.contains(eEl)) {
              const er = eEl.getBoundingClientRect();
              if (er.bottom < blockBottom) blockBottom = er.bottom;
            }
            if (blockBottom <= blockTop) continue;
            if (blockTop < top) top = blockTop;
            if (blockBottom > bottom) bottom = blockBottom;
          }
          if (!Number.isFinite(top) || !Number.isFinite(bottom)) continue;
          if (bottom <= top) continue;

          next.push({
            groupId: pair.groupId,
            top,
            left: rr.left,
            width: rr.width,
            height: bottom - top,
            active
          });
        }
      });
      setBands(next);
    };

    const throttle = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        measure();
      });
    };

    measure();
    const off = editor.registerUpdateListener(throttle);
    window.addEventListener("scroll", throttle, { passive: true });
    window.addEventListener("resize", throttle);
    return () => {
      off();
      window.removeEventListener("scroll", throttle);
      window.removeEventListener("resize", throttle);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [editor, enabled, hoveredGroupId, activeCtxGroupId]);

  if (!enabled || typeof document === "undefined") return null;
  if (bands.length === 0) return null;

  return createPortal(
    <div aria-hidden style={{ pointerEvents: "none" }}>
      {bands.map((b) => {
        const color = getGroupColor(b.groupId);
        const bgAlpha = b.active ? 0.1 : 0.035;
        const borderAlpha = b.active ? 0.4 : 0.14;
        return (
          <div
            key={b.groupId}
            data-ambient-region-highlight={b.groupId}
            data-active={b.active ? "true" : "false"}
            style={{
              position: "fixed",
              top: b.top,
              left: b.left,
              width: b.width,
              height: b.height,
              zIndex: 10013,
              pointerEvents: "none",
              background: groupColorOklch(color, bgAlpha),
              borderLeft: `2px solid ${groupColorOklch(color, borderAlpha)}`,
              mixBlendMode: "multiply",
              transition:
                "background-color 160ms ease, border-left-color 160ms ease"
            }}
          />
        );
      })}
    </div>,
    document.body
  );
}
