"use server";

import { getPayload } from "@/lib/payload";
import { Album, Media, Playlist, Track } from "@/payload-types";
import { cache } from "react";

/**
 * The /radio archive lists every published release (album OR playlist),
 * chronologically newest-first. The catalog is small by design (one
 * release a quarter at most), so we fetch all of them in one pass.
 *
 * Returns a normalised summary so the archive list doesn't need to
 * re-shape each row at render time.
 */
export interface ReleaseSummary {
  kind: "album" | "playlist";
  id: string;
  slug: string;
  title: string;
  artist?: string | null;
  cover?: Media | null;
  releaseDate?: string | null;
  trackCount: number;
  runtimeSec: number;
}

const PUBLISHED_FILTER = { _status: { equals: "published" } } as const;

export const queryAllReleases = cache(async (): Promise<ReleaseSummary[]> => {
  const payload = await getPayload();

  const [albumsRes, playlistsRes] = await Promise.all([
    payload
      .find({
        collection: "albums",
        where: PUBLISHED_FILTER,
        limit: 100,
        depth: 1,
        overrideAccess: false
      })
      .catch(() => null),
    payload
      .find({
        collection: "playlists",
        where: PUBLISHED_FILTER,
        limit: 100,
        depth: 1,
        overrideAccess: false
      })
      .catch(() => null)
  ]);

  const albums = albumsRes?.docs ?? [];
  const playlists = playlistsRes?.docs ?? [];

  // Pull track counts + runtimes for albums (their tracks live in a
  // separate collection joined by `album`). One bulk query keeps this
  // a single round-trip per page request.
  const albumIds = albums.map((a) => a.id);
  const albumTracks =
    albumIds.length > 0
      ? await payload
          .find({
            collection: "tracks",
            where: {
              ...PUBLISHED_FILTER,
              album: { in: albumIds }
            },
            limit: 1000,
            depth: 0,
            overrideAccess: false
          })
          .catch(() => null)
      : null;

  const tracksByAlbum = new Map<string, Track[]>();
  for (const t of albumTracks?.docs ?? []) {
    const albumId = typeof t.album === "string" ? t.album : t.album?.id;
    if (!albumId) continue;
    const list = tracksByAlbum.get(albumId) ?? [];
    list.push(t);
    tracksByAlbum.set(albumId, list);
  }

  const albumSummaries: ReleaseSummary[] = albums
    .filter((a): a is Album & { slug: string } => Boolean(a.slug))
    .map((a) => {
      const tracks = tracksByAlbum.get(a.id) ?? [];
      return {
        kind: "album",
        id: a.id,
        slug: a.slug,
        title: a.title ?? "",
        artist: a.artist ?? null,
        cover: typeof a.cover === "object" ? (a.cover as Media) : null,
        releaseDate: a.release_date ?? a.publishedAt ?? null,
        trackCount: tracks.length,
        runtimeSec: tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0)
      };
    });

  const playlistSummaries: ReleaseSummary[] = playlists
    .filter((p): p is Playlist & { slug: string } => Boolean(p.slug))
    .map((p) => {
      const tracks = Array.isArray(p.tracks)
        ? (p.tracks.filter(
            (t) => typeof t === "object" && t !== null
          ) as Track[])
        : [];
      return {
        kind: "playlist",
        id: p.id,
        slug: p.slug,
        title: p.title ?? "",
        artist: null,
        cover: typeof p.cover === "object" ? (p.cover as Media) : null,
        releaseDate: p.publishedAt ?? null,
        trackCount: tracks.length,
        runtimeSec: tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0)
      };
    });

  // Newest first; missing dates sort to the end.
  return [...albumSummaries, ...playlistSummaries].sort((a, b) => {
    const ad = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const bd = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    return bd - ad;
  });
});
