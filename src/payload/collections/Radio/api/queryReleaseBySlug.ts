"use server";

import { getPayload } from "@/lib/payload";
import { Album, Playlist, Track } from "@/payload-types";
import { cache } from "react";

/**
 * A release is either an Album or a Playlist. The /radio/[slug] route
 * resolves a single slug across both collections — albums take priority
 * (a slug collision is rare given the small catalog, and albums are
 * the more common case).
 *
 * Returns a discriminated union so the page can render either kind
 * without re-fetching.
 *
 * NOTE: the slug "tape" is reserved for /radio/tape/* and must not be
 * used by any release.
 */
export type ReleaseAlbum = {
  kind: "album";
  data: Album;
  tracks: Track[];
};

export type ReleasePlaylist = {
  kind: "playlist";
  data: Playlist;
  tracks: Track[];
};

export type Release = ReleaseAlbum | ReleasePlaylist;

const RESERVED_SLUGS = new Set([
  "tape",
  "tapes",
  "artists",
  "albums",
  "playlists"
]);

export const queryReleaseBySlug = cache(
  async (slug: string): Promise<Release | null> => {
    if (!slug || RESERVED_SLUGS.has(slug)) return null;

    const payload = await getPayload();

    // 1) Try albums first.
    const albumRes = await payload
      .find({
        collection: "albums",
        where: {
          slug: { equals: slug },
          _status: { equals: "published" }
        },
        limit: 1,
        depth: 2,
        overrideAccess: false
      })
      .catch(() => null);

    const album = albumRes?.docs?.[0];
    if (album) {
      const tracksRes = await payload
        .find({
          collection: "tracks",
          where: {
            album: { equals: album.id },
            _status: { equals: "published" }
          },
          sort: "track_number",
          limit: 100,
          depth: 1,
          overrideAccess: false
        })
        .catch(() => null);

      return {
        kind: "album",
        data: album,
        tracks: tracksRes?.docs ?? []
      };
    }

    // 2) Fall back to playlists.
    const playlistRes = await payload
      .find({
        collection: "playlists",
        where: {
          slug: { equals: slug },
          _status: { equals: "published" }
        },
        limit: 1,
        depth: 2,
        overrideAccess: false
      })
      .catch(() => null);

    const playlist = playlistRes?.docs?.[0];
    if (playlist) {
      // Playlists carry their tracks as a relationship array; depth: 2
      // populates them already. Normalize to a plain Track[] in source order.
      const tracks = Array.isArray(playlist.tracks)
        ? (playlist.tracks.filter(
            (t) => typeof t === "object" && t !== null
          ) as Track[])
        : [];

      return {
        kind: "playlist",
        data: playlist,
        tracks
      };
    }

    return null;
  }
);
