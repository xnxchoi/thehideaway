import {
  $createRangeSelection,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  type LexicalEditor,
  type LexicalNode
} from "@payloadcms/richtext-lexical/lexical";
import { nanoid } from "nanoid";

import {
  $createInlineBlockNode,
  $isInlineBlockNode,
  type InlineBlockNode
} from "@payloadcms/richtext-lexical/client";
import type { InlineBlockFields } from "@payloadcms/richtext-lexical";
import type { AmbientAudioAnchorBlock, Track } from "@/payload-types";

import { AMBIENT_AUDIO_ANCHOR_SLUG } from "../blocks/AmbientAudioAnchorBlock";
import type {
  AmbientPlayback,
  AmbientRegionData,
  AnchorKind
} from "../nodes/types";

/**
 * An ambient-audio anchor is a stock Lexical `InlineBlockNode` whose
 * `fields.blockType === "ambientAudioAnchor"`. We don't subclass — doing
 * so is incompatible with Lexical's strict type/klass identity invariants
 * when the on-disk serialized type needs to stay `"inlineBlock"` for
 * Payload's populate/afterDelete pipeline. The "anchor-ness" is purely a
 * runtime predicate on the inline block's fields.
 */
export type AmbientAnchorNode = InlineBlockNode;
export type AmbientAnchorFields = InlineBlockFields<AmbientAudioAnchorBlock>;

/**
 * Persisted-side shapes. `AmbientAnchorFields` (the generated Payload type
 * wrapped in `InlineBlockFields`) is what lives on the Lexical node. The
 * runtime `AmbientRegionData` is a superset carrying display fields pulled
 * from the populated Track relationship — `encodeRegion` / `decodeRegion`
 * bridge the two.
 */
type AnchorFieldSource = AmbientAnchorFields["source"];
type AnchorFieldPlayback = NonNullable<AmbientAnchorFields["playback"]>;

export interface AnchorPair {
  groupId: string;
  start: AmbientAnchorNode | null;
  end: AmbientAnchorNode | null;
}

/**
 * A caret snapshot captured by CaretNavigator. Enough information to rebuild
 * a collapsed RangeSelection inside an editor.update() later, so the anchor
 * can be inserted between characters rather than at a block edge.
 */
export interface SavedCaretPoint {
  nodeKey: string;
  offset: number;
  type: "text" | "element";
}

export function createGroupId(): string {
  return `g_${nanoid(10)}`;
}

function getAmbientAnchorFields(node: AmbientAnchorNode): AmbientAnchorFields {
  return node.getFields() as AmbientAnchorFields;
}

export function $isAmbientAnchor(
  node: LexicalNode | null | undefined
): node is AmbientAnchorNode {
  if (!$isInlineBlockNode(node)) return false;
  return (
    (node.getFields() as AmbientAnchorFields).blockType ===
    AMBIENT_AUDIO_ANCHOR_SLUG
  );
}

export function $isAmbientStartAnchor(
  node: LexicalNode | null | undefined
): node is AmbientAnchorNode {
  return (
    $isAmbientAnchor(node) && getAmbientAnchorFields(node).kind === "start"
  );
}

export function $isAmbientEndAnchor(
  node: LexicalNode | null | undefined
): node is AmbientAnchorNode {
  return $isAmbientAnchor(node) && getAmbientAnchorFields(node).kind === "end";
}

export function getAnchorKind(node: AmbientAnchorNode): AnchorKind {
  return getAmbientAnchorFields(node).kind;
}

export function getAnchorGroupId(node: AmbientAnchorNode): string {
  return getAmbientAnchorFields(node).groupId;
}

export function getAnchorRegion(node: AmbientAnchorNode): AmbientRegionData {
  return decodeRegion(getAmbientAnchorFields(node));
}

/**
 * Write a region snapshot back into the inline-block's fields. Second arg
 * `true` on setFields suppresses the drawer form-state update — this is a
 * plugin-side mutation, not a form submission.
 */
export function $setAnchorRegion(
  node: AmbientAnchorNode,
  region: AmbientRegionData
): void {
  const existing = getAmbientAnchorFields(node);
  const encoded = encodeRegion(region);
  node.setFields(
    {
      ...existing,
      source: encoded.source,
      playback: encoded.playback ?? {}
    },
    true
  );
}
/**
 * Create a new ambient-anchor inline-block node. `id` is auto-populated
 * by `$createInlineBlockNode` when omitted.
 */
export function $createAmbientAnchor(
  kind: AnchorKind,
  groupId: string,
  region: AmbientRegionData
): AmbientAnchorNode {
  const encoded = encodeRegion(region);
  return $createInlineBlockNode({
    blockType: AMBIENT_AUDIO_ANCHOR_SLUG,
    groupId,
    kind,
    source: encoded.source,
    playback: encoded.playback ?? {}
  } as AmbientAnchorFields);
}

function encodeRegion(region: AmbientRegionData): {
  source: AnchorFieldSource;
  playback: AnchorFieldPlayback | undefined;
} {
  const src = region.source;
  let source: AnchorFieldSource;
  if (src.provider === "internal") {
    source = {
      provider: "internal",
      track: src.trackId && src.trackId.length > 0 ? src.trackId : null
    };
  } else if (src.provider === "youtube") {
    source = {
      provider: "youtube",
      videoId: src.videoId,
      startSeconds: src.startSeconds ?? null,
      endSeconds: src.endSeconds ?? null
    };
  } else {
    source = {
      provider: "url",
      url: src.url
    };
  }
  const playback = region.playback
    ? {
        volume: region.playback.volume ?? null,
        loop: region.playback.loop ?? null,
        fadeInMs: region.playback.fadeInMs ?? null,
        fadeOutMs: region.playback.fadeOutMs ?? null
      }
    : undefined;
  return { source, playback };
}

function resolveCoverUrl(track: Track): string | null {
  const album = track.album;
  if (!album || typeof album !== "object") return null;
  const cover = album.cover;
  if (!cover || typeof cover !== "object") return null;
  return cover.url ?? cover.sizes?.thumb?.url ?? null;
}

function trackToInternalSource(trackId: string, track: Track) {
  const staticUrl = track.filename
    ? `/track_media/${encodeURIComponent(track.filename)}`
    : (track.url ?? undefined);
  return {
    provider: "internal" as const,
    trackId,
    title: track.title ?? undefined,
    artist: track.artist ?? undefined,
    url: staticUrl,
    duration: track.duration ?? undefined,
    cover: resolveCoverUrl(track),
    track
  };
}

/**
 * Bridge the persisted block fields to the runtime region shape consumed
 * by the editor glyph and the frontend scroll-coupled runtime. For
 * `provider: "internal"`, when Payload has populated the `track`
 * relationship (depth >= 1) we extract title/artist/cover/url/duration
 * directly from the Track doc — otherwise we fall back to just the id.
 */
export function decodeRegion(fields: AmbientAnchorFields): AmbientRegionData {
  const src = fields.source;
  const playback = decodePlayback(fields.playback);
  if (!src) {
    return {
      source: { provider: "internal", trackId: "" },
      ...(playback ? { playback } : {})
    };
  }
  if (src.provider === "youtube") {
    return {
      source: {
        provider: "youtube",
        videoId: src.videoId ?? "",
        startSeconds: src.startSeconds ?? undefined,
        endSeconds: src.endSeconds ?? undefined
      },
      ...(playback ? { playback } : {})
    };
  }
  if (src.provider === "url") {
    return {
      source: { provider: "url", url: src.url ?? "" },
      ...(playback ? { playback } : {})
    };
  }
  const track = src.track;
  if (track && typeof track === "object") {
    return {
      source: trackToInternalSource(String(track.id), track),
      ...(playback ? { playback } : {})
    };
  }
  return {
    source: {
      provider: "internal",
      trackId: typeof track === "string" ? track : ""
    },
    ...(playback ? { playback } : {})
  };
}

function decodePlayback(
  raw: AnchorFieldPlayback | null | undefined
): AmbientPlayback | undefined {
  if (!raw) return undefined;
  const out: AmbientPlayback = {};
  if (raw.volume != null) out.volume = raw.volume;
  if (raw.loop != null) out.loop = raw.loop;
  if (raw.fadeInMs != null) out.fadeInMs = raw.fadeInMs;
  if (raw.fadeOutMs != null) out.fadeOutMs = raw.fadeOutMs;
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Insert a single anchor at the current caret/selection focus.
 * Returns the inserted node's key, or null on failure.
 */
export function $insertAnchor(
  kind: AnchorKind,
  groupId: string,
  region: AmbientRegionData
): string | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const node = $createAmbientAnchor(kind, groupId, region);
  selection.insertNodes([node]);
  return node.getKey();
}

/**
 * Insert a single anchor at a previously saved caret point. Restores the
 * selection from the snapshot, then delegates to `insertNodes` so the anchor
 * lands between characters (or on an element boundary) exactly where the
 * user had the caret — not forced to a block edge.
 *
 * Caller is responsible for wrapping this in editor.update().
 */
export function $insertAnchorAtSelection(
  kind: AnchorKind,
  groupId: string,
  region: AmbientRegionData,
  savedPoint: SavedCaretPoint
): string | null {
  const target = $getNodeByKey(savedPoint.nodeKey);
  if (!target) return null;

  const selection = $createRangeSelection();
  selection.anchor.set(savedPoint.nodeKey, savedPoint.offset, savedPoint.type);
  selection.focus.set(savedPoint.nodeKey, savedPoint.offset, savedPoint.type);
  $setSelection(selection);

  const sel = $getSelection();
  if (!$isRangeSelection(sel)) return null;

  const node = $createAmbientAnchor(kind, groupId, region);
  sel.insertNodes([node]);
  return node.getKey();
}

/**
 * Insert a paired start+end around the current selection.
 * For collapsed selection both land at the caret.
 * For a range selection we insert END first (so the earlier START insert
 * does not shift the END index), then locate END and insertBefore START.
 */
export function $insertAnchorPair(
  region: AmbientRegionData,
  groupId: string = createGroupId()
): { groupId: string; startKey: string | null; endKey: string | null } {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return { groupId, startKey: null, endKey: null };
  }

  if (selection.isCollapsed()) {
    const startNode = $createAmbientAnchor("start", groupId, region);
    const endNode = $createAmbientAnchor("end", groupId, region);
    selection.insertNodes([startNode, endNode]);
    return {
      groupId,
      startKey: startNode.getKey(),
      endKey: endNode.getKey()
    };
  }

  const isBackward = selection.isBackward();
  const endSide = isBackward ? "anchor" : "focus";

  const endNode = $createAmbientAnchor("end", groupId, region);
  const collapseEnd = selection.clone();
  const endPoint = selection[endSide];
  const otherKey = endSide === "focus" ? "anchor" : "focus";
  collapseEnd[otherKey].set(endPoint.key, endPoint.offset, endPoint.type);
  collapseEnd.insertNodes([endNode]);

  // START goes immediately before the original range's earlier edge. After
  // inserting END the selection collapsed there; re-read it to find the
  // earlier anchor's position.
  const afterEnd = $getSelection();
  const startNode = $createAmbientAnchor("start", groupId, region);
  if ($isRangeSelection(afterEnd)) {
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
  let start: AmbientAnchorNode | null = null;
  let end: AmbientAnchorNode | null = null;

  const walk = (node: LexicalNode): void => {
    if ($isAmbientAnchor(node) && getAnchorGroupId(node) === groupId) {
      const kind = getAnchorKind(node);
      if (kind === "start") start = node;
      else end = node;
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
    if ($isAmbientAnchor(node)) {
      const gid = getAnchorGroupId(node);
      const pair = ensure(gid);
      if (getAnchorKind(node) === "start") pair.start = node;
      else pair.end = node;
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
  if (start) start.remove();
  if (end) end.remove();
}

/**
 * Remove the group associated with a single anchor node key.
 */
export function $removeGroupByKey(
  _editor: LexicalEditor,
  nodeKey: string
): void {
  const node = $getNodeByKey(nodeKey);
  if (!node || !$isAmbientAnchor(node)) return;
  $removeGroup(getAnchorGroupId(node));
}

/**
 * Update the region bound to a group (both anchors kept in sync).
 */
export function $updateGroupRegion(
  groupId: string,
  region: AmbientRegionData
): void {
  const { start, end } = $findAnchorPair(groupId);
  if (start) $setAnchorRegion(start, region);
  if (end) $setAnchorRegion(end, region);
}

/**
 * Reconcile the region payload across a group's anchor pair. Both anchors
 * are meant to carry the same snapshot; if they drift (e.g., after a partial
 * update) we pick the non-placeholder winner and write it back to both.
 * Caller is responsible for wrapping in editor.update().
 */
export function $reconcileGroupData(groupId: string): void {
  const { start, end } = $findAnchorPair(groupId);
  if (!start || !end) return;
  const startRegion = getAnchorRegion(start);
  const endRegion = getAnchorRegion(end);
  const startPlaceholder = isPlaceholderRegion(startRegion);
  const endPlaceholder = isPlaceholderRegion(endRegion);
  if (startPlaceholder && !endPlaceholder) {
    $setAnchorRegion(start, endRegion);
    return;
  }
  if (!startPlaceholder && endPlaceholder) {
    $setAnchorRegion(end, startRegion);
    return;
  }
  // Both real or both placeholder — keep start as source of truth.
  if (JSON.stringify(startRegion) !== JSON.stringify(endRegion)) {
    $setAnchorRegion(end, startRegion);
  }
}

/**
 * A region representing "no source picked yet". Internal provider with an
 * empty trackId. Frontend converters / runtime filter these out; editor
 * renders them with a muted "set track" affordance.
 */
export const PLACEHOLDER_REGION: AmbientRegionData = {
  source: { provider: "internal", trackId: "" }
};

export function isPlaceholderRegion(
  region: AmbientRegionData | undefined | null
): boolean {
  if (!region) return true;
  const src = region.source;
  if (src.provider === "internal") {
    return !src.trackId || src.trackId.length === 0;
  }
  if (src.provider === "youtube") {
    return !src.videoId || src.videoId.length === 0;
  }
  if (src.provider === "url") {
    return !src.url || src.url.length === 0;
  }
  return true;
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
 * Try viewport-center first; if that block overlaps an existing anchor
 * group, fall back to the first non-overlapping block adjacent (above, then
 * below) to each existing group. Returns null when nothing is placeable —
 * the caller should warn and skip creation rather than spawn an encasing
 * region at viewport center.
 */
export function $findPlaceableBlockForEmptyExit(
  editor: LexicalEditor
): LexicalNode | null {
  const root = $getRoot();
  const children = root.getChildren();
  if (children.length === 0) return null;

  const indexOf = (n: LexicalNode): number =>
    children.findIndex((c) => c.getKey() === n.getKey());

  const validate = (idx: number): boolean => {
    if (idx < 0 || idx >= children.length) return false;
    return $validateProposedRange({ startIdx: idx, endIdx: idx }).ok;
  };

  const center = $findViewportCenterBlock(editor);
  if (center) {
    const idx = indexOf(center);
    if (validate(idx)) return center;
  }

  // Walk outward from each existing group's edges, preferring slots closest
  // to where the user was looking.
  const centerIdx = center ? indexOf(center) : -1;
  const candidates: Array<{ idx: number; dist: number }> = [];
  for (const pair of $listGroups()) {
    const range = $groupRangeIndices(pair.start, pair.end);
    if (!range) continue;
    for (const idx of [range.startIdx - 1, range.endIdx + 1]) {
      if (!validate(idx)) continue;
      const dist = centerIdx >= 0 ? Math.abs(centerIdx - idx) : idx;
      candidates.push({ idx, dist });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);
  if (candidates.length > 0) return children[candidates[0]!.idx] ?? null;

  return null;
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
  start: AmbientAnchorNode | null,
  end: AmbientAnchorNode | null
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
  region: AmbientRegionData
): string | null {
  const node = $createAmbientAnchor(kind, groupId, region);
  const anyBlock = block as LexicalNode & {
    getChildren?: () => LexicalNode[];
    splice?: (start: number, deleteCount: number, nodes: LexicalNode[]) => void;
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
  region: AmbientRegionData
): string | null {
  const node = $createAmbientAnchor(kind, groupId, region);
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
 *   - No region   → PLACEHOLDER_REGION; frontend skips.
 *
 * Caller is responsible for wrapping this in editor.update().
 */
export function $finalizePlacement(args: {
  editor: LexicalEditor;
  pendingStartKey: string | null;
  pendingEndKey: string | null;
  pendingGroupId: string | null;
  region?: AmbientRegionData;
}): { groupId: string; startKey: string; endKey: string } | null {
  const { pendingStartKey, pendingEndKey } = args;
  const pendingGroupId = args.pendingGroupId ?? createGroupId();
  const region = args.region ?? PLACEHOLDER_REGION;

  const startCandidate = pendingStartKey
    ? $getNodeByKey(pendingStartKey)
    : null;
  const endCandidate = pendingEndKey ? $getNodeByKey(pendingEndKey) : null;
  const startNode = $isAmbientStartAnchor(startCandidate)
    ? startCandidate
    : null;
  const endNode = $isAmbientEndAnchor(endCandidate) ? endCandidate : null;

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
    const endKey = $insertAnchorAtBlockEnd(
      block,
      "end",
      pendingGroupId,
      region
    );
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
      region
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
    region
  );
  const latestBlock = block.getLatest();
  const endKey = $insertAnchorAtBlockEnd(
    latestBlock,
    "end",
    pendingGroupId,
    region
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
  if (!$isAmbientAnchor(node)) return false;
  target.insertBefore(node);
  return true;
}
