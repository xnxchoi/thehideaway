/**
 * Loads the full roll of Payload `tracks` docs and hydrates each into the
 * minimal `RP_Track` shape the HideawayFM runtime actually renders. A single
 * REST call with `depth=2` is used so the album relation arrives populated —
 * cheaper than a second per-track album fetch and simpler than stitching
 * together two response sets.
 *
 * `pickSeed` owns the radio-station "feel" on first load: we either resume a
 * fresh-enough persisted position or pick a random index and drop the
 * playhead somewhere in the first 70% of the track. The 30% tail is avoided
 * so the seed never lands inside a natural outro, which otherwise makes the
 * station feel stale the instant it opens.
 *
 * Errors are soft: a failed fetch resolves to `[]` so the provider can still
 * render its empty-state. The provider is the one that decides how to report
 * the error to the user — this module stays pure and side-effect-light.
 */

import type { Album, Media, Track } from "@/payload-types";
import { getRadio } from "@/providers/getRadio";
import { uuidv7 } from "uuidv7";

import { SESSION_RESUME_TTL_MIN } from "../constants";
import type { RP_Track } from "../types";

interface PayloadListResponse<T> {
  docs: T[];
  totalDocs?: number;
  hasNextPage?: boolean;
}

export interface PersistedSeed {
  index?: number;
  time?: number;
  ts?: number;
}

export interface SeedResult {
  index: number;
  seekSec: number;
}

const TRACKS_ENDPOINT = "/api/tracks?limit=200&depth=2";
const STREAM_PREFIX = "/api/tracks/stream";
const SEEK_WINDOW = 0.7;
const TTL_MS = SESSION_RESUME_TTL_MIN * 60 * 1000;

/**
 * Static fallback roll. Used when running in dev (no Payload media seeded)
 * or when a production fetch returns zero tracks — keeps the player audible
 * instead of dropping to an empty-state. IDs are deterministic so React keys
 * stay stable across renders. `duration` is a placeholder — Howler reports
 * the real value once the source loads.
 */
const FALLBACK_DURATION_SEC = 300;
const FALLBACK_TITLES = [
  "Shibuya Nights",
  "Part 2",
  "Part 3",
  "Part 4",
  "Part 5",
  "Part 6",
  "Part 7",
  "Part 8",
  "Part 9"
] as const;
const FALLBACK_TRACKS: RP_Track[] = [
  {
    id: uuidv7(),
    album: "",
    duration: 60,
    title: "Shibuya Nights",
    url: `/track_media/Track_1.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 2",
    album: "",
    duration: 60,
    url: `/track_media/Track_2.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 3",
    album: "",
    duration: 60,
    url: `/track_media/Track_3.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 4",
    album: "",
    duration: 60,
    url: `/track_media/Track_4.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 5",
    album: "",
    duration: 60,
    url: `/track_media/Track_5.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 6",
    album: "",
    duration: 60,
    url: `/track_media/Track_6.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 7",
    album: "",
    duration: 60,
    url: `/track_media/Track_7.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 8",
    album: "",
    duration: 60,
    url: `/track_media/Track_8.ogg`,
    artist: "YM.FM"
  },
  {
    id: uuidv7(),
    title: "Part 9",
    album: "",
    duration: 60,
    url: `/track_media/Track_9.ogg`,
    artist: "YM.FM"
  }
];

const isAlbumObject = (album: Track["album"]): album is Album =>
  typeof album === "object" && album !== null;

const isMediaObject = (cover: Album["cover"]): cover is Media =>
  typeof cover === "object" && cover !== null;

const resolveCover = (album: Track["album"]): string | null => {
  if (!isAlbumObject(album)) return null;
  const { cover } = album;
  if (!cover) return null;
  if (isMediaObject(cover)) return cover.url ?? null;
  return null;
};

const toRPTrack = (track: Track): RP_Track | null => {
  if (!track.url || !(track.duration > 0)) return null;

  const albumObject = isAlbumObject(track.album) ? track.album : null;

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: albumObject?.title ?? "",
    albumId: albumObject?.id,
    albumSlug: albumObject?.slug ?? track.albumSlug ?? undefined,
    slug: track.slug,
    duration: track.duration,
    url: `${STREAM_PREFIX}/${track.id}`,
    cover: resolveCover(track.album)
  };
};

const withFallback = async (tracks: RP_Track[]) =>
  tracks.length > 0 && process.env.NODE_ENV !== "development"
    ? tracks
    : await getRadio(
        FALLBACK_TRACKS.map((r) => ({ artist: r.artist, url: r.url, id: r.id }))
      );

export async function fetchTracks(): Promise<RP_Track[]> {
  if (process.env.NODE_ENV === "development") {
    return await getRadio(
      FALLBACK_TRACKS.map((r) => ({ artist: r.artist, url: r.url, id: r.id }))
    );
  }

  try {
    const response = await fetch(TRACKS_ENDPOINT, {
      credentials: "include",
      headers: { accept: "application/json" }
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[HideawayFM] fetchTracks failed: ${response.status} ${response.statusText}`
        );
      }
      return await withFallback([]);
    }

    const payload = (await response.json()) as PayloadListResponse<Track>;
    const docs = Array.isArray(payload.docs) ? payload.docs : [];

    const mapped = docs.reduce<RP_Track[]>((acc, doc) => {
      const result = toRPTrack(doc);
      if (result) acc.push(result);
      return acc;
    }, []);

    return await withFallback(mapped);
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[HideawayFM] fetchTracks threw", error);
    }
    return await withFallback([]);
  }
}

const isFreshSeed = (
  persisted: PersistedSeed | null,
  now: number
): persisted is Required<Pick<PersistedSeed, "index" | "time" | "ts">> => {
  if (!persisted) return false;
  const { index, time, ts } = persisted;
  if (typeof index !== "number" || index < 0) return false;
  if (typeof time !== "number" || !Number.isFinite(time) || time < 0) {
    return false;
  }
  if (typeof ts !== "number" || !Number.isFinite(ts)) return false;
  return now - ts < TTL_MS;
};

export function pickSeed(
  tracks: RP_Track[],
  persisted: PersistedSeed | null
): SeedResult {
  if (tracks.length === 0) {
    throw new Error("HideawayFM: no tracks available to seed");
  }

  const now = Date.now();

  if (isFreshSeed(persisted, now) && persisted.index < tracks.length) {
    const track = tracks[persisted.index];
    const clampedSeek = Math.min(
      Math.max(persisted.time, 0),
      Math.max(track.duration - 1, 0)
    );
    return { index: persisted.index, seekSec: clampedSeek };
  }

  const index = Math.floor(Math.random() * tracks.length);
  const track = tracks[index];
  const seekSec = Math.random() * track.duration * SEEK_WINDOW;
  return { index, seekSec };
}
