import type { NodeValidation } from "@payloadcms/richtext-lexical";

import type {
  SerializedAmbientAudioEndNode,
  SerializedAmbientAudioStartNode
} from "../nodes/types";

type SerializedAnchor =
  | SerializedAmbientAudioStartNode
  | SerializedAmbientAudioEndNode;

/**
 * Structural validation for an ambient-audio anchor node. Runs alongside
 * normal field validations on save, so the write fails fast if the region
 * snapshot is malformed.
 *
 * Checks per provider:
 *   - internal: non-empty `trackId` (empty string is the placeholder sentinel;
 *     treated as "no track selected yet" and left to the UI to resolve — so
 *     the save is not blocked for a placeholder, only for a malformed record)
 *   - youtube:  non-empty `videoId`
 *   - url:      non-empty `url` string
 *
 * Existence of the referenced Track is NOT checked here — Payload's
 * afterRead/populate path will surface a null doc, which the runtime can
 * render as an unresolved region without blocking edits.
 */
export const validateAmbientAnchor: NodeValidation<SerializedAnchor> = ({
  node
}) => {
  const region = node?.__region;
  const source = region?.source;
  if (!source || !source.provider) {
    return "Ambient audio region is missing a source.";
  }
  if (source.provider === "internal") {
    if (typeof source.trackId !== "string") {
      return "Ambient audio internal source requires a trackId.";
    }
    return true;
  }
  if (source.provider === "youtube") {
    if (typeof source.videoId !== "string" || source.videoId.length === 0) {
      return "Ambient audio YouTube source requires a videoId.";
    }
    return true;
  }
  if (source.provider === "url") {
    if (typeof source.url !== "string" || source.url.length === 0) {
      return "Ambient audio URL source requires a url.";
    }
    return true;
  }
  return "Ambient audio region has an unknown provider.";
};
