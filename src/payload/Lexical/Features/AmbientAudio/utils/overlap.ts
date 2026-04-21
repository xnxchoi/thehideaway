import {
  $getRoot,
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode
} from "@payloadcms/richtext-lexical/lexical";

import type { AmbientRegionData, AnchorKind } from "../nodes/types";
import {
  $findAnchorPair,
  $insertAnchorAtSelection,
  $listGroups,
  $removeGroup,
  getAnchorGroupId,
  getAnchorRegion,
  isPlaceholderRegion,
  type AmbientAnchorNode,
  type AnchorPair,
  type SavedCaretPoint
} from "./anchors";

/**
 * Linear character offset of a node in the document. Walks the root depth-
 * first, counting TextNode content as characters. ElementNodes recurse.
 * Inline blocks and decorators contribute 0 (zero-width markers).
 *
 * Returns the number of characters that appear before the node in doc order.
 * Caller must wrap in editor.read()/editor.update().
 */
export function $linearPositionOf(node: LexicalNode): number {
  const target = node.getKey();
  let position = 0;
  let found = false;

  const walk = (current: LexicalNode): boolean => {
    if (found) return true;
    if (current.getKey() === target) {
      found = true;
      return true;
    }
    if ($isTextNode(current)) {
      position += current.getTextContent().length;
      return false;
    }
    if ($isElementNode(current)) {
      for (const child of current.getChildren()) {
        if (walk(child)) return true;
      }
      return false;
    }
    return false;
  };

  walk($getRoot());
  return position;
}

/**
 * Convert a linear char offset back into a SavedCaretPoint anchored inside
 * the text node that contains that position. If the target falls past the
 * last text node, anchors at the end of the last element.
 */
export function $caretPointAtLinear(target: number): SavedCaretPoint | null {
  let position = 0;
  let result: SavedCaretPoint | null = null;
  let lastElementKey: string | null = null;

  const walk = (current: LexicalNode): boolean => {
    if (result) return true;
    if ($isTextNode(current)) {
      const len = current.getTextContent().length;
      if (position + len >= target) {
        const offset = Math.max(0, Math.min(len, target - position));
        result = { nodeKey: current.getKey(), offset, type: "text" };
        return true;
      }
      position += len;
      return false;
    }
    if ($isElementNode(current)) {
      lastElementKey = current.getKey();
      for (const child of current.getChildren()) {
        if (walk(child)) return true;
      }
      return false;
    }
    return false;
  };

  walk($getRoot());
  if (result) return result;
  if (!lastElementKey) return null;
  return { nodeKey: lastElementKey, offset: 0, type: "element" };
}

interface Span {
  start: number;
  end: number;
  length: number;
}

export function $measureGroupSpan(pair: AnchorPair): Span | null {
  if (!pair.start || !pair.end) return null;
  const s = $linearPositionOf(pair.start);
  const e = $linearPositionOf(pair.end);
  if (e < s) return null;
  return { start: s, end: e, length: e - s };
}

function overlapOf(a: Span, b: Span): Span | null {
  const start = Math.max(a.start, b.start);
  const end = Math.min(a.end, b.end);
  if (end <= start) return null;
  return { start, end, length: end - start };
}

function encases(outer: Span, inner: Span): boolean {
  return outer.start <= inner.start && outer.end >= inner.end;
}

/**
 * Split the contested overlap between two regions proportional to their
 * overall lengths. The smaller region's share is rounded UP (protective —
 * prevents tiny regions from being crushed to zero). Bigger region gets the
 * remainder. Returns A's share of the overlap.
 */
function proportionalSplit(
  aLen: number,
  bLen: number,
  overlapLen: number
): number {
  if (aLen === bLen) return Math.floor(overlapLen / 2);
  if (aLen < bLen) {
    const aRaw = (overlapLen * aLen) / (aLen + bLen);
    return Math.min(overlapLen, Math.ceil(aRaw));
  }
  const bRaw = (overlapLen * bLen) / (aLen + bLen);
  return overlapLen - Math.min(overlapLen, Math.ceil(bRaw));
}

interface GroupInfo {
  groupId: string;
  span: Span;
  hasMedia: boolean;
  region: AmbientRegionData;
}

type ResolutionAction =
  | { kind: "accept" }
  | { kind: "remove-candidate" }
  | { kind: "remove-existing"; existingGroupId: string }
  | {
      kind: "trim";
      candidate?: { start?: number; end?: number };
      existing?: { groupId: string; start?: number; end?: number };
    };

function decideOne(
  candidate: GroupInfo,
  existing: GroupInfo,
  overlap: Span
): ResolutionAction {
  // Rule 1: asymmetric media — filled region claims the entire overlap.
  if (candidate.hasMedia !== existing.hasMedia) {
    const winner = candidate.hasMedia ? candidate : existing;
    const loser = candidate.hasMedia ? existing : candidate;
    if (encases(winner.span, loser.span)) {
      return candidate.hasMedia
        ? { kind: "remove-existing", existingGroupId: existing.groupId }
        : { kind: "remove-candidate" };
    }
    // Trim loser's edge back so it no longer overlaps the winner.
    const trimLoserTo =
      loser.span.start < winner.span.start
        ? { end: winner.span.start }
        : { start: winner.span.end };
    return candidate.hasMedia
      ? {
          kind: "trim",
          existing: { groupId: existing.groupId, ...trimLoserTo }
        }
      : { kind: "trim", candidate: trimLoserTo };
  }

  // Rule 2: encasement — larger wins, smaller removed.
  if (encases(candidate.span, existing.span)) {
    return { kind: "remove-existing", existingGroupId: existing.groupId };
  }
  if (encases(existing.span, candidate.span)) {
    return { kind: "remove-candidate" };
  }

  // Rule 3: proportional split of the partial overlap.
  const candShare = proportionalSplit(
    candidate.span.length,
    existing.span.length,
    overlap.length
  );
  if (candidate.span.start <= existing.span.start) {
    // Candidate on the left; it keeps its start, gives up past splitAt.
    const splitAt = overlap.start + candShare;
    return {
      kind: "trim",
      candidate: { end: splitAt },
      existing: { groupId: existing.groupId, start: splitAt }
    };
  }
  const splitAt = overlap.end - candShare;
  return {
    kind: "trim",
    candidate: { start: splitAt },
    existing: { groupId: existing.groupId, end: splitAt }
  };
}

function infoFor(pair: AnchorPair): GroupInfo | null {
  const span = $measureGroupSpan(pair);
  if (!span) return null;
  const node = pair.start ?? pair.end;
  if (!node) return null;
  const region = getAnchorRegion(node);
  return {
    groupId: getAnchorGroupId(node),
    span,
    region,
    hasMedia: !isPlaceholderRegion(region)
  };
}

function moveAnchor(
  anchor: AmbientAnchorNode,
  targetLinear: number,
  kind: AnchorKind
): void {
  const current = $linearPositionOf(anchor);
  if (current === targetLinear) return;
  const region = getAnchorRegion(anchor);
  const groupId = getAnchorGroupId(anchor);
  const point = $caretPointAtLinear(targetLinear);
  if (!point) return;
  anchor.remove();
  $insertAnchorAtSelection(kind, groupId, region, point);
}

function moveGroupEdges(
  groupId: string,
  targets: { start?: number; end?: number }
): void {
  // End-first, then start — moving start can change end's linear position if
  // the start anchor's removal collapses surrounding text nodes. End first
  // keeps its absolute char offset stable relative to the document head.
  if (targets.end != null) {
    const pair = $findAnchorPair(groupId);
    if (pair.end) moveAnchor(pair.end, targets.end, "end");
  }
  if (targets.start != null) {
    const pair = $findAnchorPair(groupId);
    if (pair.start) moveAnchor(pair.start, targets.start, "start");
  }
}

function applyAction(
  action: ResolutionAction,
  candidateGroupId: string
): { candidateSurvived: boolean } {
  if (action.kind === "accept") return { candidateSurvived: true };
  if (action.kind === "remove-candidate") {
    $removeGroup(candidateGroupId);
    return { candidateSurvived: false };
  }
  if (action.kind === "remove-existing") {
    $removeGroup(action.existingGroupId);
    return { candidateSurvived: true };
  }
  if (action.candidate) moveGroupEdges(candidateGroupId, action.candidate);
  if (action.existing) {
    moveGroupEdges(action.existing.groupId, {
      start: action.existing.start,
      end: action.existing.end
    });
  }
  return { candidateSurvived: true };
}

/**
 * Resolve every overlap between the freshly-committed candidate group and
 * every other group in the document. Must be called inside editor.update().
 *
 * Returns whether the candidate group still exists after resolution.
 */
export function $resolveCandidateOverlaps(
  _editor: LexicalEditor,
  candidateGroupId: string
): { candidateSurvived: boolean } {
  const existingIds = $listGroups()
    .map((g) => g.groupId)
    .filter((id) => id !== candidateGroupId);

  for (const existingId of existingIds) {
    const candidateInfo = infoFor($findAnchorPair(candidateGroupId));
    if (!candidateInfo) return { candidateSurvived: false };
    const existingInfo = infoFor($findAnchorPair(existingId));
    if (!existingInfo) continue;
    const ov = overlapOf(candidateInfo.span, existingInfo.span);
    if (!ov) continue;

    const action = decideOne(candidateInfo, existingInfo, ov);
    const { candidateSurvived } = applyAction(action, candidateGroupId);
    if (!candidateSurvived) return { candidateSurvived: false };
  }
  return { candidateSurvived: true };
}
