"use server";
import { formatSlug } from "@/payload/fields/slug/formatSlug";
import fs from "fs/promises";
import { parseFile } from "music-metadata";
import { nanoid } from "nanoid";
import path from "path";
import { Payload } from "payload";
import { fileURLToPath } from "url";

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);
const trackDirectory = path.resolve(
  _dirname,
  "../../..",
  "public",
  "track_media"
);

interface TrackMeta {
  artist: string;
  title: string;
  album: string;
  duration: number;
  track_number: number;
  url: string;
}

export async function syncTrackMedia(
  payload: Payload,
  uid: string
): Promise<void> {
  // Stage 1: Read directory
  const allFiles = await fs.readdir(trackDirectory).catch((e) => {
    payload.logger.error("[syncTrackMedia] Failed to read track_media dir:", e);
    return [] as string[];
  });
  const oggFiles = allFiles.filter(
    (f) => path.extname(f).toLowerCase() === ".ogg"
  );

  if (oggFiles.length === 0) {
    payload.logger.info("[syncTrackMedia] No .ogg files found. Skipping.");
    return;
  }
  payload.logger.info(
    `[syncTrackMedia] Found ${oggFiles.length} .ogg file(s).`
  );

  // Stage 2: Parse metadata in parallel (pure FS I/O — no DB)
  const metadataResults = await Promise.allSettled(
    oggFiles.map(async (file) => {
      const filePath = path.join(trackDirectory, file);
      const meta = await parseFile(filePath, { duration: true });
      const {
        artist,
        track: { no: track_number },
        title,
        album
      } = meta.common || {};
      const { duration } = meta.format || {};

      if (!duration || !artist || !title || !album || !track_number) {
        throw new Error(`Incomplete metadata for "${file}"`);
      }

      return {
        artist,
        title,
        album,
        duration,
        track_number,
        url: `/track_media/${file}`,
        filePath
      } satisfies TrackMeta & { filePath: string };
    })
  );

  const validTracks = metadataResults
    .filter(
      (r): r is PromiseFulfilledResult<TrackMeta & { filePath: string }> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);

  const failedCount = metadataResults.filter(
    (r) => r.status === "rejected"
  ).length;
  if (failedCount > 0) {
    payload.logger.warn(
      `[syncTrackMedia] ${failedCount} file(s) had incomplete/invalid metadata and were skipped.`
    );
  }

  if (validTracks.length === 0) {
    payload.logger.warn(
      "[syncTrackMedia] No valid tracks after metadata parse. Aborting."
    );
    return;
  }
  payload.logger.info(
    `[syncTrackMedia] ${validTracks.length} track(s) with valid metadata.`
  );

  // Stage 3: Batch idempotency check — slug cannot be used (it is auto-generated as
  // encodeURIComponent(formatSlug(title) + "-" + hashId) and the hashId is random per
  // creation). Use title + track_number — both plain stored fields with no transform hooks.
  const existingTrackDocs = await payload
    .find({
      collection: "tracks",
      pagination: false,
      overrideAccess: true,
      select: { title: true, track_number: true }
    })
    .catch((e) => {
      payload.logger.error(
        "[syncTrackMedia] Failed to query existing tracks:",
        e
      );
      return {
        docs: [] as { title: string; track_number: number; id: string }[]
      };
    });

  const existingKeys = new Set(
    existingTrackDocs.docs.map((d) => `${d.title}|||${d.track_number}`)
  );
  const newTracks = validTracks.filter(
    (t) => !existingKeys.has(`${t.title}|||${t.track_number}`)
  );

  payload.logger.info(
    `[syncTrackMedia] ${existingKeys.size} track(s) already exist, ${newTracks.length} new track(s) to create.`
  );

  // Stage 5: Sequential album find-or-create (only for albums needed by new tracks)
  const albumMap = new Map<string, { title: string; artist: string }>();
  for (const { album, artist } of newTracks) {
    albumMap.set(`${album}|||${artist}`, { title: album, artist });
  }
  const requiredAlbums = Array.from(albumMap.values());

  const albumRecords = new Map<string, string>(); // "title|||artist" -> albumId

  if (requiredAlbums.length > 0) {
    payload.logger.info(
      `[syncTrackMedia] Processing ${requiredAlbums.length} album(s)...`
    );
  }

  for (const { title, artist } of requiredAlbums) {
    const key = `${title}|||${artist}`;
    try {
      const existing = await payload
        .find({
          collection: "albums",
          pagination: false,
          limit: 1,
          where: {
            and: [{ title: { equals: title } }, { artist: { equals: artist } }]
          },
          overrideAccess: true,
          select: { title: true }
        })
        .then((r) => r.docs[0] ?? null);

      if (existing) {
        payload.logger.info(
          `[syncTrackMedia] Album exists: "${title}" by ${artist}`
        );
        albumRecords.set(key, existing.id as string);
      } else {
        const created = await payload.create({
          collection: "albums",
          draft: false,
          overrideAccess: true,
          data: {
            title,
            artist,
            visibility: "public",
            slug: formatSlug(title + "-" + artist),
            slugLock: false,
            hashId: nanoid(11),
            author: uid,
            _status: "published"
          }
        });
        payload.logger.info(
          `[syncTrackMedia] Created album: "${title}" by ${artist}`
        );
        albumRecords.set(key, created.id as string);
      }
    } catch (e: any) {
      payload.logger.error(
        `[syncTrackMedia] Failed to find/create album "${title}" by ${artist}:`,
        e
      );
    }
  }

  // Stage 6: Create new tracks sequentially
  if (newTracks.length > 0) {
    newTracks.sort((a, b) => a.track_number - b.track_number);
    payload.logger.info(
      `[syncTrackMedia] Creating ${newTracks.length} new track(s)...`
    );
  }

  for (const trackInfo of newTracks) {
    const albumKey = `${trackInfo.album}|||${trackInfo.artist}`;
    const albumId = albumRecords.get(albumKey);

    if (!albumId) {
      payload.logger.error(
        `[syncTrackMedia] No album ID for track "${trackInfo.title}" — skipping.`
      );
      continue;
    }

    try {
      await payload.create({
        collection: "tracks",
        draft: false,
        overrideAccess: true,
        data: {
          author: uid,
          title: trackInfo.title,
          slug: formatSlug(trackInfo.title + "-" + trackInfo.artist),
          slugLock: false,
          hashId: nanoid(11),
          visibility: "public",
          artist: trackInfo.artist,
          track_number: trackInfo.track_number,
          album: albumId,
          url: trackInfo.url,
          _status: "published"
        },
        filePath: trackInfo.filePath
      });
      payload.logger.info(
        `[syncTrackMedia] Created track: "${trackInfo.title}" (#${trackInfo.track_number})`
      );
    } catch (e: any) {
      payload.logger.error(
        `[syncTrackMedia] Failed to create track "${trackInfo.title}":`,
        e
      );
    }
  }

  // Stage 7: Fetch all tracks matching our metadata for final sorted playlist assembly
  const allTrackDocs = await payload
    .find({
      collection: "tracks",
      where: { title: { in: validTracks.map((t) => t.title) } },
      pagination: false,
      overrideAccess: true,
      select: { title: true, track_number: true }
    })
    .catch(() => ({
      docs: [] as { title: string; track_number: number; id: string }[]
    }));

  const titleToTrackNumber = new Map(
    validTracks.map((t) => [t.title, t.track_number])
  );
  const sortedAllIds = allTrackDocs.docs
    .sort(
      (a, b) =>
        (titleToTrackNumber.get(a.title) ?? 999) -
        (titleToTrackNumber.get(b.title) ?? 999)
    )
    .map((d) => d.id as string);

  if (sortedAllIds.length === 0) {
    payload.logger.warn(
      "[syncTrackMedia] No track IDs assembled — skipping playlist step."
    );
    return;
  }

  // Stage 8: Playlist idempotency — find by title, update tracks if found, create if not.
  // Playlist title is derived from the first (or only) album.
  const playlistTitle =
    requiredAlbums[0]?.title ??
    (albumMap.size > 0
      ? Array.from(albumMap.values())[0].title
      : validTracks[0].album);

  payload.logger.info(
    `[syncTrackMedia] Processing playlist: "${playlistTitle}"...`
  );

  const existingPlaylist = await payload
    .find({
      collection: "playlists",
      where: { title: { equals: playlistTitle } },
      pagination: false,
      limit: 1,
      overrideAccess: true,
      select: { title: true, tracks: true }
    })
    .then((r) => r.docs[0] ?? null)
    .catch(() => null);

  let playlistId: string;

  if (existingPlaylist) {
    payload.logger.info(
      `[syncTrackMedia] Playlist exists — updating track list.`
    );
    const updated = await payload
      .update({
        collection: "playlists",
        id: existingPlaylist.id as string,
        data: { tracks: sortedAllIds },
        overrideAccess: true
      })
      .catch((e) => {
        payload.logger.error(
          "[syncTrackMedia] Failed to update existing playlist:",
          e
        );
        return null;
      });
    if (!updated) return;
    playlistId = updated.id as string;
  } else {
    payload.logger.info(
      `[syncTrackMedia] Creating new playlist: "${playlistTitle}"`
    );
    const created = await payload
      .create({
        collection: "playlists",
        draft: false,
        overrideAccess: true,
        data: {
          title: playlistTitle,
          author: [uid],
          visibility: "public",
          slug: formatSlug(playlistTitle),
          slugLock: false,
          hashId: nanoid(11),
          tracks: sortedAllIds
        }
      })
      .catch((e) => {
        payload.logger.error("[syncTrackMedia] Failed to create playlist:", e);
        return null;
      });
    if (!created) return;
    playlistId = created.id as string;
    payload.logger.info(`[syncTrackMedia] Playlist created: ${playlistId}`);
  }

  // Stage 9: Register playlist in Header global
  try {
    const header = await payload.findGlobal({
      slug: "header",
      depth: 0,
      overrideAccess: true
    });
    const currentRadio = Array.isArray(header.radio)
      ? (header.radio as string[])
      : [];

    if (!currentRadio.includes(playlistId)) {
      await payload.updateGlobal({
        slug: "header",
        overrideAccess: true,
        data: { radio: [...currentRadio, playlistId] }
      });
      payload.logger.info(
        `[syncTrackMedia] Appended playlist ${playlistId} to Header.radio.`
      );
    } else {
      payload.logger.info(
        "[syncTrackMedia] Playlist already registered in Header.radio."
      );
    }
  } catch (e: any) {
    payload.logger.error("[syncTrackMedia] Failed to update Header global:", e);
  }

  payload.logger.info("[syncTrackMedia] Sync complete.");
}
