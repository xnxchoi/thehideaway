import type { CollectionAfterDeleteHook } from "payload";

import type { Post } from "@/payload-types";

import { AMBIENT_AUDIO_ANCHOR_SLUG } from "../blocks/AmbientAudioAnchorBlock";

interface InlineBlockFieldsShape {
  blockType?: string;
  source?: {
    provider?: string;
    track?: string | { id?: string | number } | null;
  };
  [key: string]: unknown;
}

interface LexicalNodeShape {
  [key: string]: unknown;
  type?: string;
  children?: LexicalNodeShape[];
  fields?: InlineBlockFieldsShape;
}

type PostContent = Post["content"];

function matchesDeletedTrack(
  fields: InlineBlockFieldsShape,
  deletedTrackId: string
): boolean {
  const src = fields.source;
  if (!src || src.provider !== "internal") return false;
  const track = src.track;
  if (typeof track === "string") return track === deletedTrackId;
  if (track && typeof track === "object") {
    return String(track.id) === deletedTrackId;
  }
  return false;
}

function resetMatchingAnchors(
  node: LexicalNodeShape,
  deletedTrackId: string
): boolean {
  let changed = false;
  if (
    node.type === "inlineBlock" &&
    node.fields?.blockType === AMBIENT_AUDIO_ANCHOR_SLUG &&
    matchesDeletedTrack(node.fields, deletedTrackId)
  ) {
    node.fields = {
      ...node.fields,
      source: { provider: "internal", track: null }
    };
    changed = true;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (resetMatchingAnchors(child, deletedTrackId)) changed = true;
    }
  }
  return changed;
}

/**
 * Rich-text integrity hook: when a Track is deleted, reset every ambient-audio
 * anchor in Posts that referenced it back to the placeholder region. Payload
 * does not cascade through embedded Lexical refs on its own, so we walk the
 * content tree per-post and rewrite matches in place.
 *
 * Older versions retain the stale reference by design (version history). The
 * runtime also tolerates null-populated `source.track`, so a partial scrub is
 * never a correctness hazard — just a cleanliness one.
 */
export const scrubAmbientRefsOnTrackDelete: CollectionAfterDeleteHook = async ({
  id,
  req
}) => {
  const trackId = String(id);
  const { payload } = req;
  const pageSize = 100;
  let page = 1;

  while (true) {
    const result = await payload.find({
      collection: "posts",
      depth: 0,
      limit: pageSize,
      page,
      overrideAccess: true,
      draft: true,
      pagination: true
    });
    for (const doc of result.docs) {
      const content = doc.content as PostContent | undefined;
      const root = content?.root as LexicalNodeShape | undefined;
      if (!root) continue;
      if (!resetMatchingAnchors(root, trackId)) continue;
      await payload.update({
        collection: "posts",
        id: doc.id,
        data: { content },
        overrideAccess: true,
        draft: true
      });
    }
    if (page >= (result.totalPages ?? 1)) break;
    page += 1;
  }
};
