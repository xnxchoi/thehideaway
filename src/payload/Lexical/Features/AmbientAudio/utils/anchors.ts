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
