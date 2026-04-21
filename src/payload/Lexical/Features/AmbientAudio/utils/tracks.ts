import { stringify } from "qs-esm";

import type { AmbientSourceInternal } from "../nodes/types";

interface RawTrackDoc {
  id: string;
  title?: string;
  artist?: string;
  url?: string;
  filename?: string;
  mimeType?: string;
  duration?: number;
  cover?:
    | string
    | {
        url?: string;
        sizes?: { thumbnail?: { url?: string } };
      }
    | null;
}

interface TrackListResponse {
  docs: RawTrackDoc[];
  totalDocs: number;
}

function resolveCover(cover: RawTrackDoc["cover"]): string | null {
  if (!cover) return null;
  if (typeof cover === "string") return cover;
  if (cover.url) return cover.url;
  if (cover.sizes?.thumbnail?.url) return cover.sizes.thumbnail.url;
  return null;
}

function toSource(doc: RawTrackDoc): AmbientSourceInternal {
  // The Tracks collection stores uploads in /public/track_media, served
  // statically by Next at /track_media/<filename>. That path works without
  // any auth / custom endpoint and supports range requests for streaming.
  const staticUrl = doc.filename
    ? `/track_media/${encodeURIComponent(doc.filename)}`
    : doc.url;
  return {
    provider: "internal",
    trackId: doc.id,
    title: doc.title,
    artist: doc.artist,
    url: staticUrl,
    duration: doc.duration,
    cover: resolveCover(doc.cover)
  };
}

/**
 * Search published tracks by title / artist.
 */
export async function searchTracks(
  query: string,
  signal?: AbortSignal
): Promise<AmbientSourceInternal[]> {
  const trimmed = query.trim();
  const where = trimmed
    ? {
        or: [
          { title: { contains: trimmed } },
          { artist: { contains: trimmed } }
        ]
      }
    : undefined;

  const qs = stringify(
    {
      where,
      depth: 1,
      limit: 20
    },
    { addQueryPrefix: true }
  );

  const res = await fetch(`/api/tracks${qs}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    signal
  });

  if (!res.ok) throw new Error(`Track search failed: ${res.status}`);

  const json = (await res.json()) as TrackListResponse;
  return (json.docs ?? []).map(toSource);
}

/**
 * Fetch a single track by id (used by the runtime to hydrate minimal refs).
 */
export async function getTrackById(
  id: string,
  signal?: AbortSignal
): Promise<AmbientSourceInternal | null> {
  const qs = stringify({ depth: 1 }, { addQueryPrefix: true });

  const res = await fetch(`/api/tracks/${encodeURIComponent(id)}${qs}`, {
    method: "GET",
    credentials: "include",
    signal
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Track fetch failed: ${res.status}`);

  const doc = (await res.json()) as RawTrackDoc;
  return toSource(doc);
}
