"use client";

import { Menu } from "@base-ui/react";
import {
  $getNodeByKey,
  type LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import type { ComponentProps } from "react";
import { useCallback, useMemo } from "react";

import { cn } from "@/lib/utils";

import { AmbienceHandle } from "./AmbientAudioPlugin";
import type { AmbientRegionData } from "../nodes/types";
import { useAmbientStore } from "../store/ambientStore";
import {
  $findAnchorPair,
  $isAmbientAnchor,
  $removeGroup,
  $updateGroupRegion,
  getAnchorGroupId,
  getAnchorRegion,
  isPlaceholderRegion
} from "../utils/anchors";
import { getTrackById } from "../utils/tracks";

interface AmbientContextMenuProps {
  onOpenPickerForGroup: (args: {
    anchorEl: HTMLElement | null;
    groupId: string;
  }) => void;
  onAdjustRange: (groupId: string) => void;
}

function makeVirtualAnchor(x: number, y: number) {
  const rect = {
    x,
    y,
    top: y,
    left: x,
    right: x,
    bottom: y,
    width: 0,
    height: 0,
    toJSON() {
      return this;
    }
  };
  return { getBoundingClientRect: () => rect as DOMRect };
}

/**
 * Read the current group/track snapshot for an anchor node key. Used to decide
 * whether the "Reload track info" item should be shown.
 */
function $readGroupFromNode(
  editor: LexicalEditor,
  nodeKey: string | null
): { groupId: string | null; region: AmbientRegionData | null } {
  if (!nodeKey) return { groupId: null, region: null };
  let out = {
    groupId: null as string | null,
    region: null as AmbientRegionData | null
  };
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    if (!$isAmbientAnchor(node)) return;
    out = { groupId: getAnchorGroupId(node), region: getAnchorRegion(node) };
  });
  return out;
}

function $readGroupRegion(
  editor: LexicalEditor,
  groupId: string
): AmbientRegionData | null {
  let region: AmbientRegionData | null = null;
  editor.getEditorState().read(() => {
    const pair = $findAnchorPair(groupId);
    const node = pair.start ?? pair.end;
    if (node) region = getAnchorRegion(node);
  });
  return region;
}

/**
 * Unified context menu for ambient audio regions. Opens on right-click anywhere
 * in the editor root and on left-click of an anchor. Branches on the current
 * target (from the store):
 *   - inside an existing region → Change track / Adjust range / (Reload info) / Remove
 *   - outside                   → Add ambient audio
 */
export function AmbientContextMenu({
  onOpenPickerForGroup,
  onAdjustRange
}: AmbientContextMenuProps) {
  const [editor] = useLexicalComposerContext();
  const open = useAmbientStore((s) => s.contextMenuOpen);
  const x = useAmbientStore((s) => s.contextMenuX);
  const y = useAmbientStore((s) => s.contextMenuY);
  const target = useAmbientStore((s) => s.contextMenuTarget);
  const closeContextMenu = useAmbientStore((s) => s.closeContextMenu);
  const enterSelectMode = useAmbientStore((s) => s.enterSelectMode);

  const virtualAnchor = useMemo(() => makeVirtualAnchor(x, y), [x, y]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) closeContextMenu();
    },
    [closeContextMenu]
  );

  const handleAdd = useCallback(() => {
    enterSelectMode();
    closeContextMenu();
  }, [enterSelectMode, closeContextMenu]);

  const handleChangeTrack = useCallback(() => {
    if (!target?.groupId) return;
    onOpenPickerForGroup({
      anchorEl: target.anchorEl,
      groupId: target.groupId
    });
    closeContextMenu();
  }, [target, onOpenPickerForGroup, closeContextMenu]);

  const handleAdjustRange = useCallback(() => {
    if (!target?.groupId) return;
    onAdjustRange(target.groupId);
    closeContextMenu();
  }, [target, onAdjustRange, closeContextMenu]);

  const handleRemove = useCallback(() => {
    if (!target?.groupId) return;
    const gid = target.groupId;
    editor.update(() => {
      $removeGroup(gid);
    });
    closeContextMenu();
  }, [target, editor, closeContextMenu]);

  const handleReloadTrack = useCallback(async () => {
    if (!target?.groupId) return;
    const gid = target.groupId;
    const snapshot = target.nodeKey
      ? $readGroupFromNode(editor, target.nodeKey)
      : { groupId: gid, region: $readGroupRegion(editor, gid) };
    const src = snapshot.region?.source;
    if (!src || src.provider !== "internal" || !src.trackId) {
      closeContextMenu();
      return;
    }
    try {
      const fresh = await getTrackById(src.trackId);
      if (fresh) {
        editor.update(() => {
          $updateGroupRegion(gid, { source: fresh });
        });
      }
    } catch {
      // noop
    }
    closeContextMenu();
  }, [target, editor, closeContextMenu]);

  const insideRegion = !!target?.groupId;
  const currentRegion = insideRegion
    ? target.nodeKey
      ? $readGroupFromNode(editor, target.nodeKey).region
      : $readGroupRegion(editor, target.groupId!)
    : null;
  const showReload =
    insideRegion &&
    !!currentRegion &&
    !isPlaceholderRegion(currentRegion) &&
    currentRegion.source.provider === "internal" &&
    !currentRegion.source.url;

  return (
    <Menu.Root
      handle={AmbienceHandle}
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
    >
      <Menu.Portal>
        <Menu.Positioner
          anchor={virtualAnchor}
          side="bottom"
          align="start"
          sideOffset={4}
          className="outline-none"
        >
          <Menu.Popup
            data-ambient-portal="context-menu"
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "max-w-[265px] min-w-[220px] origin-[var(--transform-origin)] rounded-md bg-[canvas] py-1.5 outline outline-1 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0"
            )}
          >
            {insideRegion ? (
              <>
                <AmbientMenuItem onClick={handleChangeTrack}>
                  Change track
                </AmbientMenuItem>
                <AmbientMenuItem onClick={handleAdjustRange}>
                  Adjust range
                </AmbientMenuItem>
                {showReload ? (
                  <AmbientMenuItem onClick={handleReloadTrack}>
                    Reload track info
                  </AmbientMenuItem>
                ) : null}
                <AmbientMenuDivider />
                <AmbientMenuItem onClick={handleRemove} tone="danger">
                  Remove this region
                </AmbientMenuItem>
              </>
            ) : (
              <AmbientMenuItem onClick={handleAdd}>
                Add ambient audio…
              </AmbientMenuItem>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function AmbientMenuItem({
  className,
  tone,
  ...props
}: ComponentProps<typeof Menu.Item> & { tone?: "danger" }) {
  return (
    <Menu.Item
      className={className}
      render={({ className: rc, ...rp }) => (
        <div
          className={cn(
            "relative z-0 flex min-h-11 w-full gap-3 rounded-[6px] px-3.5 py-3.5 text-sm leading-[120%] transition-colors duration-150 ease-out-power2 outline-none select-none before:absolute before:inset-x-1 before:inset-y-0 before:z-[-1] before:rounded-sm before:bg-transparent before:transition-colors before:duration-150 before:ease-out-power2 data-[highlighted]:before:bg-muted-faded-background",
            tone === "danger"
              ? "data-[highlighted]:text-rouge-400"
              : "data-[highlighted]:text-foreground",
            rc
          )}
          {...rp}
          role="button"
        />
      )}
      {...props}
    />
  );
}

function AmbientMenuDivider() {
  return (
    <div
      aria-hidden
      className="mx-1 my-1 h-px bg-border/30"
    />
  );
}
