import {
  populate,
  type AfterReadNodeHook
} from "@payloadcms/richtext-lexical";
import type { SelectType } from "payload";

import type {
  SerializedAmbientAudioEndNode,
  SerializedAmbientAudioStartNode
} from "../nodes/types";

type SerializedAnchor =
  | SerializedAmbientAudioStartNode
  | SerializedAmbientAudioEndNode;

const TRACKS_SLUG = "tracks";

/**
 * afterRead hook (REST): populate `__region.source.track` when the region's
 * provider is `internal` and a `trackId` is present. Mutates the serialized
 * node in place via `populate()` and schedules the promise on
 * `populationPromises` so Payload awaits it before returning the response.
 *
 * URL / YouTube providers are self-contained and pass through untouched.
 */
export const populateRegionAfterRead: AfterReadNodeHook<SerializedAnchor> = ({
  currentDepth,
  depth,
  draft,
  node,
  overrideAccess,
  populateArg,
  populationPromises,
  req,
  showHiddenFields
}) => {
  const region = node?.__region;
  const source = region?.source;
  if (!source || source.provider !== "internal" || !source.trackId) {
    return node;
  }
  const collection = req.payload.collections[TRACKS_SLUG];
  if (!collection) return node;

  populationPromises.push(
    populate({
      id: source.trackId,
      collectionSlug: TRACKS_SLUG,
      currentDepth,
      data: source,
      depth,
      draft,
      key: "track",
      overrideAccess,
      req,
      select: (populateArg?.[TRACKS_SLUG] ??
        collection.config.defaultPopulate) as SelectType | undefined,
      showHiddenFields
    })
  );
  return node;
};
