"use client";

import {
  $getNodeByKey,
  type LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEffect, useMemo } from "react";
import type { StoreApi } from "zustand";

import {
  useCtxMenuStore,
  useRegisterContextMenuContributor
} from "@/payload/Lexical/Features/RP_CtxMenu";
import type {
  ContextMenuContributor,
  ContextMenuGroup,
  ContextMenuItem,
  EditorContext
} from "@/payload/Lexical/Features/RP_CtxMenu";

import type { AmbientRegionData } from "../nodes/types";
import {
  useAmbientStoreApi,
  type AmbientStoreState
} from "../store/ambientStore";
import {
  $findAnchorPair,
  $isAmbientAnchor,
  $listGroups,
  $removeGroup,
  $updateGroupRegion,
  getAnchorGroupId,
  getAnchorRegion,
  isPlaceholderRegion
} from "../utils/anchors";
import { getTrackById } from "../utils/tracks";

type AmbientStoreApi = StoreApi<AmbientStoreState>;

interface RegionHit {
  groupId: string;
  anchorEl: HTMLElement | null;
  nodeKey: string | null;
  region: AmbientRegionData | null;
}

/**
 * Walk up from the click target looking for a rendered ambient anchor. When
 * no anchor is hit directly, fall back to a Y-axis intersection test against
 * every group's anchor pair — mirrors the legacy plugin's `onContextMenu`
 * behaviour so right-clicking inside a region reliably resolves to it.
 */
function resolveRegionHit(
  editor: LexicalEditor,
  context: EditorContext
): RegionHit | null {
  const domTarget = context.domTarget;
  if (domTarget instanceof HTMLElement) {
    const anchorEl = domTarget.closest<HTMLElement>("[data-ambient-anchor]");
    if (anchorEl) {
      const groupId = anchorEl.getAttribute("data-ambient-group");
      const kind = anchorEl.getAttribute("data-ambient-anchor");
      if (groupId) {
        let nodeKey: string | null = null;
        let region: AmbientRegionData | null = null;
        editor.getEditorState().read(() => {
          const pair = $findAnchorPair(groupId);
          const node = kind === "start" ? pair.start : pair.end;
          if (node) {
            nodeKey = node.getKey();
            region = getAnchorRegion(node);
          } else if (pair.start || pair.end) {
            const any = pair.start ?? pair.end;
            if (any) region = getAnchorRegion(any);
          }
        });
        return { groupId, anchorEl, nodeKey, region };
      }
    }
  }

  let hit: RegionHit | null = null;
  editor.getEditorState().read(() => {
    for (const pair of $listGroups()) {
      if (!pair.start || !pair.end) continue;
      const startEl = editor.getElementByKey(pair.start.getKey());
      const endEl = editor.getElementByKey(pair.end.getKey());
      if (!startEl || !endEl) continue;
      const sr = startEl.getBoundingClientRect();
      const er = endEl.getBoundingClientRect();
      if (context.y >= sr.top && context.y <= er.bottom) {
        hit = {
          groupId: pair.groupId,
          anchorEl: startEl,
          nodeKey: pair.start.getKey(),
          region: getAnchorRegion(pair.start)
        };
        return;
      }
    }
  });
  return hit;
}

/**
 * Read the region for a node key when the hit-test didn't surface one (e.g. a
 * fallback Y-hit where the matching anchor was already recorded in the store).
 */
function $readRegionByNodeKey(
  editor: LexicalEditor,
  nodeKey: string | null
): AmbientRegionData | null {
  if (!nodeKey) return null;
  let out: AmbientRegionData | null = null;
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    if (!$isAmbientAnchor(node)) return;
    out = getAnchorRegion(node);
    void getAnchorGroupId(node);
  });
  return out;
}

interface BuildArgs {
  editor: LexicalEditor;
  storeApi: AmbientStoreApi;
}

/**
 * Factory: build the ambient-audio context-menu contributor. Kept outside the
 * React tree so consumers could register programmatically if needed, but the
 * typical wiring is through `<AmbientContributorRegistrar />`.
 */
export function buildAmbientContributor({
  editor,
  storeApi
}: BuildArgs): ContextMenuContributor {
  return {
    id: "ambientAudio",
    order: 20,
    resolve(context) {
      const hit = resolveRegionHit(editor, context);

      if (hit) {
        const region = hit.region ?? $readRegionByNodeKey(editor, hit.nodeKey);
        const showReload =
          !!region &&
          !isPlaceholderRegion(region) &&
          region.source.provider === "internal" &&
          !region.source.url;

        const groupId = hit.groupId;
        const items: ContextMenuItem[] = [
          {
            kind: "item",
            key: "ambient:change-track",
            label: "Change track",
            order: 10,
            onSelect: () => {
              storeApi.getState().openPicker({
                anchorEl: hit.anchorEl,
                groupId
              });
              storeApi.getState().setPhase("pickingTrack");
            }
          },
          {
            kind: "item",
            key: "ambient:adjust-range",
            label: "Adjust range",
            order: 20,
            onSelect: () => {
              editor.update(() => {
                const pair = $findAnchorPair(groupId);
                if (pair.start) pair.start.remove();
                if (pair.end) pair.end.remove();
              });
              const s = storeApi.getState();
              s.setPendingStartKey(null);
              s.setPendingEndKey(null);
              s.setPendingGroupId(groupId);
              s.setPhase("placingStart");
            }
          }
        ];

        if (showReload) {
          items.push({
            kind: "item",
            key: "ambient:reload-track",
            label: "Reload track info",
            order: 30,
            onSelect: () => {
              const src = region?.source;
              if (!src || src.provider !== "internal" || !src.trackId) return;
              void getTrackById(src.trackId)
                .then((fresh) => {
                  if (!fresh) return;
                  editor.update(() => {
                    $updateGroupRegion(groupId, { source: fresh });
                  });
                })
                .catch(() => {
                  // noop — stale cache is acceptable here
                });
            }
          });
        }

        items.push(
          { kind: "separator", key: "ambient:sep", order: 90 },
          {
            kind: "item",
            key: "ambient:remove",
            label: "Remove this region",
            tone: "danger",
            order: 100,
            onSelect: () => {
              editor.update(() => {
                $removeGroup(groupId);
              });
            }
          }
        );

        const group: ContextMenuGroup = {
          key: "ambient",
          label: "Ambient audio",
          order: 20,
          items
        };
        return [group];
      }

      if (!context.hasTextSelection) return null;

      const group: ContextMenuGroup = {
        key: "ambient",
        order: 20,
        items: [
          {
            kind: "item",
            key: "ambient:add",
            label: "Add ambient audio…",
            order: 10,
            onSelect: () => {
              storeApi.getState().enterSelectMode();
            }
          }
        ]
      };
      return [group];
    }
  };
}

/**
 * Hidden component: registers the ambient contributor against the RP_CtxMenu
 * registry. Must be mounted inside the editor tree (below both
 * `<ContextMenuRegistryProvider>` and `<AmbientAudioProvider>`) — the typical
 * mount point is alongside the other ambient-audio plugin children.
 */
export function AmbientContributorRegistrar() {
  const [editor] = useLexicalComposerContext();
  const storeApi = useAmbientStoreApi();
  const ctxMenuOpen = useCtxMenuStore((s) => s.open);
  const ctxMenuContext = useCtxMenuStore((s) => s.context);
  const contributor = useMemo(
    () => buildAmbientContributor({ editor, storeApi }),
    [editor, storeApi]
  );
  useRegisterContextMenuContributor(contributor);

  // Publish the ctx-menu target so AmbientRegionHighlight can bump the tint
  // of the region being acted on. Runs after render (avoids the setState-in-
  // render warning that a contributor-resolve write would cause), and clears
  // when the menu closes.
  useEffect(() => {
    if (!ctxMenuOpen || !ctxMenuContext) {
      storeApi.getState().setActiveCtxGroupId(null);
      return;
    }
    const hit = resolveRegionHit(editor, ctxMenuContext);
    storeApi.getState().setActiveCtxGroupId(hit ? hit.groupId : null);
  }, [ctxMenuOpen, ctxMenuContext, editor, storeApi]);

  return null;
}
