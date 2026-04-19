import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
  type LexicalNode
} from "@payloadcms/richtext-lexical/lexical";
import { nanoid } from "nanoid";

import {
  $createAmbientAudioEndNode,
  $isAmbientAudioEndNode,
  AmbientAudioEndNode
} from "../nodes/AmbientAudioEndNode";
import {
  $createAmbientAudioStartNode,
  $isAmbientAudioStartNode,
  AmbientAudioStartNode
} from "../nodes/AmbientAudioStartNode";
import type { AmbientTrackRef, AnchorKind } from "../nodes/types";

export interface AnchorPair {
  groupId: string;
  start: AmbientAudioStartNode | null;
  end: AmbientAudioEndNode | null;
}

export function createGroupId(): string {
  return `g_${nanoid(10)}`;
}

/**
 * Insert a single anchor at the current caret/selection focus.
 * Returns the inserted node's key, or null on failure.
 */
export function $insertAnchor(
  kind: AnchorKind,
  groupId: string,
  track: AmbientTrackRef
): string | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;

  const node =
    kind === "start"
      ? $createAmbientAudioStartNode({ groupId, track })
      : $createAmbientAudioEndNode({ groupId, track });

  selection.insertNodes([node]);
  return node.getKey();
}

/**
 * Insert a paired start+end around the current selection.
 * For collapsed selection both land at the caret.
 * For a range selection we insert END first (so the earlier START insert
 * does not shift the END index), then locate END and insertBefore START.
 */
export function $insertAnchorPair(
  track: AmbientTrackRef,
  groupId: string = createGroupId()
): { groupId: string; startKey: string | null; endKey: string | null } {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return { groupId, startKey: null, endKey: null };
  }

  if (selection.isCollapsed()) {
    const startNode = $createAmbientAudioStartNode({ groupId, track });
    const endNode = $createAmbientAudioEndNode({ groupId, track });
    selection.insertNodes([startNode, endNode]);
    return {
      groupId,
      startKey: startNode.getKey(),
      endKey: endNode.getKey()
    };
  }

  const isBackward = selection.isBackward();
  const endSide = isBackward ? "anchor" : "focus";

  const endNode = $createAmbientAudioEndNode({ groupId, track });
  const collapseEnd = selection.clone();
  const endPoint = selection[endSide];
  const otherKey = endSide === "focus" ? "anchor" : "focus";
  collapseEnd[otherKey].set(endPoint.key, endPoint.offset, endPoint.type);
  collapseEnd.insertNodes([endNode]);

  // START goes immediately before the original range's earlier edge. After
  // inserting END the selection collapsed there; re-read it to find the
  // earlier anchor's position.
  const afterEnd = $getSelection();
  const startNode = $createAmbientAudioStartNode({ groupId, track });
  if ($isRangeSelection(afterEnd)) {
    // The collapsed selection is now next to END. Walk to the other side of
    // the original range by collapsing to the ORIGINAL start side.
    const startSide = isBackward ? "focus" : "anchor";
    const startPoint = selection[startSide];
    const collapseStart = afterEnd.clone();
    collapseStart.anchor.set(
      startPoint.key,
      startPoint.offset,
      startPoint.type
    );
    collapseStart.focus.set(startPoint.key, startPoint.offset, startPoint.type);
    collapseStart.insertNodes([startNode]);
  } else {
    endNode.getLatest().insertBefore(startNode);
  }

  return {
    groupId,
    startKey: startNode.getKey(),
    endKey: endNode.getKey()
  };
}

/**
 * Walk the document tree to find the start/end pair for a group.
 */
export function $findAnchorPair(groupId: string): AnchorPair {
  const root = $getRoot();
  let start: AmbientAudioStartNode | null = null;
  let end: AmbientAudioEndNode | null = null;

  const walk = (node: LexicalNode): void => {
    if ($isAmbientAudioStartNode(node) && node.getGroupId() === groupId) {
      start = node;
    } else if ($isAmbientAudioEndNode(node) && node.getGroupId() === groupId) {
      end = node;
    }
    const anyNode = node as LexicalNode & {
      getChildren?: () => LexicalNode[];
    };
    if (typeof anyNode.getChildren === "function") {
      for (const child of anyNode.getChildren()) walk(child);
    }
  };

  walk(root);
  return { groupId, start, end };
}

/**
 * Collect every anchor group present in the document.
 */
export function $listGroups(): AnchorPair[] {
  const root = $getRoot();
  const map = new Map<string, AnchorPair>();

  const ensure = (gid: string): AnchorPair => {
    let pair = map.get(gid);
    if (!pair) {
      pair = { groupId: gid, start: null, end: null };
      map.set(gid, pair);
    }
    return pair;
  };

  const walk = (node: LexicalNode): void => {
    if ($isAmbientAudioStartNode(node)) {
      ensure(node.getGroupId()).start = node;
    } else if ($isAmbientAudioEndNode(node)) {
      ensure(node.getGroupId()).end = node;
    }
    const anyNode = node as LexicalNode & {
      getChildren?: () => LexicalNode[];
    };
    if (typeof anyNode.getChildren === "function") {
      for (const child of anyNode.getChildren()) walk(child);
    }
  };

  walk(root);
  return Array.from(map.values());
}

/**
 * Remove both anchors in a group.
 */
export function $removeGroup(groupId: string): void {
  const { start, end } = $findAnchorPair(groupId);
  if (start) (start as AmbientAudioStartNode).remove();
  if (end) (end as AmbientAudioEndNode).remove();
}

/**
 * Remove the group associated with a single anchor node key.
 */
export function $removeGroupByKey(
  _editor: LexicalEditor,
  nodeKey: string
): void {
  const node = $getNodeByKey(nodeKey);
  if (!node) return;
  if ($isAmbientAudioStartNode(node) || $isAmbientAudioEndNode(node)) {
    $removeGroup(node.getGroupId());
  }
}

/**
 * Update the track bound to a group (both anchors kept in sync).
 */
export function $updateGroupTrack(
  groupId: string,
  track: AmbientTrackRef
): void {
  const { start, end } = $findAnchorPair(groupId);
  if (start) (start as AmbientAudioStartNode).setTrack(track);
  if (end) (end as AmbientAudioEndNode).setTrack(track);
}

/**
 * A track ref representing a placeholder (no track picked yet). Frontend
 * converters / runtime filter these out; editor renders them with a muted
 * "set track" affordance.
 */
export const PLACEHOLDER_TRACK: AmbientTrackRef = { trackId: "" };

export function isPlaceholderTrack(
  t: AmbientTrackRef | undefined | null
): boolean {
  return !t || !t.trackId || t.trackId.length === 0;
}

/**
 * Return the top-level block that contains this node (the direct child of
 * $getRoot() whose subtree includes the node). Returns null if not found.
 */
export function $findBlockAncestor(node: LexicalNode): LexicalNode | null {
  let cur: LexicalNode | null = node;
  const root = $getRoot();
  while (
    cur &&
    cur.getParent() &&
    cur.getParent()!.getKey() !== root.getKey()
  ) {
    cur = cur.getParent();
  }
  return cur;
}

/**
 * Find the block-level node that sits at the viewport center. Walks up/down
 * to the nearest content block if the center hits whitespace.
 */
export function $findViewportCenterBlock(
  editor: LexicalEditor
): LexicalNode | null {
  const rootEl = editor.getRootElement();
  if (!rootEl) return null;
  if (typeof window === "undefined") return null;
  const centerY = window.innerHeight * 0.5;

  const lexicalRoot = $getRoot();
  const children = lexicalRoot.getChildren();
  if (children.length === 0) return null;

  const measured: Array<{ node: LexicalNode; top: number; bottom: number }> =
    [];
  for (const child of children) {
    const el = editor.getElementByKey(child.getKey());
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    measured.push({ node: child, top: rect.top, bottom: rect.bottom });
  }
  if (measured.length === 0) return null;

  // Prefer a block whose rect contains the center.
  for (const m of measured) {
    if (m.top <= centerY && m.bottom >= centerY) return m.node;
  }

  // Otherwise: block closest to center by midpoint distance.
  let best: { node: LexicalNode; dist: number } | null = null;
  for (const m of measured) {
    const mid = (m.top + m.bottom) / 2;
    const dist = Math.abs(mid - centerY);
    if (!best || dist < best.dist) best = { node: m.node, dist };
  }
  return best?.node ?? null;
}

/**
 * Compute this anchor group's [startIdx, endIdx] range in the document,
 * where indices are the position of each node's nearest block-level
 * ancestor in $getRoot().getChildren(). Used by the overlap guard.
 */
export function $groupRangeIndices(
  start: AmbientAudioStartNode | null,
  end: AmbientAudioEndNode | null
): { startIdx: number; endIdx: number } | null {
  if (!start && !end) return null;
  const root = $getRoot();
  const children = root.getChildren();
  const indexOfBlock = (n: LexicalNode | null): number => {
    if (!n) return -1;
    const block = $findBlockAncestor(n);
    if (!block) return -1;
    return children.findIndex((c) => c.getKey() === block.getKey());
  };
  const s = indexOfBlock(start);
  const e = indexOfBlock(end);
  if (s === -1 && e === -1) return null;
  const startIdx = s === -1 ? e : s;
  const endIdx = e === -1 ? s : e;
  return { startIdx, endIdx };
}

export interface RangeValidation {
  ok: boolean;
  reason?: "overlap" | "invalid";
}

/**
 * Check a candidate range [startIdx, endIdx] (block indices in the document
 * root) does not overlap any existing anchor group, optionally excluding
 * `excludeGroupId` when re-placing one end of an existing group.
 */
export function $validateProposedRange(args: {
  startIdx: number;
  endIdx: number;
  excludeGroupId?: string;
}): RangeValidation {
  const { startIdx, endIdx, excludeGroupId } = args;
  if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) {
    return { ok: false, reason: "invalid" };
  }
  for (const pair of $listGroups()) {
    if (excludeGroupId && pair.groupId === excludeGroupId) continue;
    const r = $groupRangeIndices(pair.start, pair.end);
    if (!r) continue;
    if (!(endIdx < r.startIdx || startIdx > r.endIdx)) {
      return { ok: false, reason: "overlap" };
    }
  }
  return { ok: true };
}

/**
 * Insert an anchor at the start-edge of a block. Placed as first child if
 * the block is an ElementNode, otherwise inserted before the block.
 */
export function $insertAnchorAtBlockStart(
  block: LexicalNode,
  kind: AnchorKind,
  groupId: string,
  track: AmbientTrackRef
): string | null {
  const node =
    kind === "start"
      ? $createAmbientAudioStartNode({ groupId, track })
      : $createAmbientAudioEndNode({ groupId, track });
  const anyBlock = block as LexicalNode & {
    getChildren?: () => LexicalNode[];
    splice?: (
      start: number,
      deleteCount: number,
      nodes: LexicalNode[]
    ) => void;
  };
  if (typeof anyBlock.getChildren === "function" && anyBlock.splice) {
    anyBlock.splice(0, 0, [node]);
  } else {
    block.insertBefore(node);
  }
  return node.getKey();
}

/**
 * Insert an anchor at the end-edge of a block. Placed as last child if the
 * block is an ElementNode, otherwise inserted after the block.
 */
export function $insertAnchorAtBlockEnd(
  block: LexicalNode,
  kind: AnchorKind,
  groupId: string,
  track: AmbientTrackRef
): string | null {
  const node =
    kind === "start"
      ? $createAmbientAudioStartNode({ groupId, track })
      : $createAmbientAudioEndNode({ groupId, track });
  const anyBlock = block as LexicalNode & {
    getChildren?: () => LexicalNode[];
    append?: (...children: LexicalNode[]) => void;
  };
  if (typeof anyBlock.getChildren === "function" && anyBlock.append) {
    anyBlock.append(node);
  } else {
    block.insertAfter(node);
  }
  return node.getKey();
}

/**
 * Finalize placement based on what the user has already done. Never
 * destructive: every exit path ends up with a valid (possibly placeholder)
 * region.
 *
 * Resolution:
 *   - 0 anchors   → place both at the viewport-center block edges.
 *   - 1 anchor    → place the missing one at the end of the existing
 *                   anchor's block.
 *   - 2 anchors   → leave as-is.
 *   - No track    → PLACEHOLDER_TRACK; frontend skips.
 *
 * Caller is responsible for wrapping this in editor.update().
 */
export function $finalizePlacement(args: {
  editor: LexicalEditor;
  pendingStartKey: string | null;
  pendingEndKey: string | null;
  pendingGroupId: string | null;
  track?: AmbientTrackRef;
}): { groupId: string; startKey: string; endKey: string } | null {
  const { pendingStartKey, pendingEndKey } = args;
  const pendingGroupId = args.pendingGroupId ?? createGroupId();
  const track = args.track ?? PLACEHOLDER_TRACK;

  const startNode = pendingStartKey
    ? ($getNodeByKey(pendingStartKey) as AmbientAudioStartNode | null)
    : null;
  const endNode = pendingEndKey
    ? ($getNodeByKey(pendingEndKey) as AmbientAudioEndNode | null)
    : null;

  if (startNode && endNode) {
    return {
      groupId: pendingGroupId,
      startKey: startNode.getKey(),
      endKey: endNode.getKey()
    };
  }

  if (startNode && !endNode) {
    const block = $findBlockAncestor(startNode);
    if (!block) return null;
    const endKey = $insertAnchorAtBlockEnd(block, "end", pendingGroupId, track);
    if (!endKey) return null;
    return { groupId: pendingGroupId, startKey: startNode.getKey(), endKey };
  }

  if (!startNode && endNode) {
    const block = $findBlockAncestor(endNode);
    if (!block) return null;
    const startKey = $insertAnchorAtBlockStart(
      block,
      "start",
      pendingGroupId,
      track
    );
    if (!startKey) return null;
    return { groupId: pendingGroupId, startKey, endKey: endNode.getKey() };
  }

  const block = $findViewportCenterBlock(args.editor);
  if (!block) return null;
  const startKey = $insertAnchorAtBlockStart(
    block,
    "start",
    pendingGroupId,
    track
  );
  const latestBlock = block.getLatest();
  const endKey = $insertAnchorAtBlockEnd(
    latestBlock,
    "end",
    pendingGroupId,
    track
  );
  if (!startKey || !endKey) return null;
  return { groupId: pendingGroupId, startKey, endKey };
}

/**
 * Move an anchor to a new slot. Caller must ensure the move does not cross
 * the partner anchor.
 */
export function $reorderAnchor(
  nodeKey: string,
  proposedSlotKey: string
): boolean {
  const node = $getNodeByKey(nodeKey);
  const target = $getNodeByKey(proposedSlotKey);
  if (!node || !target) return false;
  if (!($isAmbientAudioStartNode(node) || $isAmbientAudioEndNode(node))) {
    return false;
  }
  target.insertBefore(node);
  return true;
}
