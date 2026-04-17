// import { formatSlug } from "@/payload/fields/slug/formatSlug";
// import { readRadioTrack } from "@/providers/readRadioTrack";
// import fs from "fs/promises";
// import { parseFile } from "music-metadata";
// import { nanoid } from "nanoid";
// import path from "path";
// import { Payload, Where } from "payload";
// import { fileURLToPath } from "url";
//
// const _filename = fileURLToPath(import.meta.url);
// const _dirname = path.dirname(_filename);
// const trackDirectory = path.resolve(
//   _dirname,
//   "../../..",
//   "public",
//   "track_media"
// );
//
// interface TrackMeta {
//   artist: string;
//   title: string;
//   album: string;
//   duration: number;
//   track_number: number;
//   url: string;
// }
// type CompoundKey = `${string}|||${string}`;
// export async function syncTrackMedia(payload: Payload, uid: string) {
//   // Stage 1: Read directory
//   const allFiles = await fs.readdir(trackDirectory).catch((e) => {
//     payload.logger.error("[syncTrackMedia] Failed to read track_media dir:", e);
//     return [] as string[];
//   });
//   const oggFiles = allFiles.filter(
//     (f) => path.extname(f).toLowerCase() === ".ogg"
//   );
//
//   if (oggFiles.length === 0) {
//     payload.logger.info("[syncTrackMedia] No .ogg files found. Skipping.");
//     return;
//   }
//   payload.logger.info(
//     `[syncTrackMedia] Found ${oggFiles.length} .ogg file(s).`
//   );
//   const transactionID = await payload.db.beginTransaction();
//   if (!transactionID) throw new Error("Failed to start transaction");
//   payload.logger.info(`[syncTrackMedia] Started transaction ${transactionID}`);
//   try {
//     // Stage 2: Parse metadata in parallel (pure FS I/O — no DB)
//     const metadataResults = await Promise.allSettled(
//       oggFiles.map(async (file) => {
//         const filePath = path.join(trackDirectory, file);
//         const meta = await parseFile(filePath, { duration: true });
//         const {
//           artist,
//           track: { no: track_number },
//           title,
//           album
//         } = meta.common || {};
//         const { duration } = meta.format || {};
//
//         if (!duration || !artist || !title || !album || !track_number) {
//           throw new Error(`Incomplete metadata for "${file}"`);
//         }
//
//         return {
//           artist,
//           title,
//           album,
//           duration,
//           track_number,
//           url: `/track_media/${file}`,
//           filePath
//         } satisfies TrackMeta & { filePath: string };
//       })
//     );
//     const validTracks = metadataResults
//       .filter(
//         (r): r is PromiseFulfilledResult<TrackMeta & { filePath: string }> =>
//           r.status === "fulfilled"
//       )
//       .map((r) => r.value);
//
//     const failedCount = metadataResults.filter(
//       (r) => r.status === "rejected"
//     ).length;
//     if (failedCount > 0) {
//       payload.logger.warn(
//         `[syncTrackMedia] ${failedCount} file(s) had incomplete/invalid metadata and were skipped.`
//       );
//     }
//
//     if (validTracks.length === 0) {
//       payload.logger.warn(
//         "[syncTrackMedia] No valid tracks after metadata parse. Aborting."
//       );
//       return;
//     }
//     payload.logger.info(
//       `[syncTrackMedia] ${validTracks.length} track(s) with valid metadata.`
//     );
//     const existingAlbums: Map<CompoundKey, string> = new Map();
//     const existingTracks = await payload
//       .find({
//         collection: "tracks",
//         pagination: false,
//         overrideAccess: true,
//         where: {
//           or: validTracks.map(
//             (t) =>
//               ({
//                 and: [
//                   { title: { equals: t.title } },
//                   { artist: { equals: t.artist } }
//                 ]
//               }) as Where
//           )
//         },
//         req: { transactionID },
//         select: {
//           album: true,
//           artist: true,
//           title: true,
//           track_number: true
//         }
//       })
//       .then(({ docs }) => new Set(docs));
//     // Stage 3: Batch idempotency check — slug cannot be used (it is auto-generated as
//     // encodeURIComponent(formatSlug(title) + "-" + hashId) and the hashId is random per
//     // creation). Use title + track_number — both plain stored fields with no transform hooks.
//     //const existingKeys = new Set(
//     //
//
//     //
//     // payload.logger.info(
//     //   `[syncTrackMedia] ${existingKeys.size} track(s) already exist, ${newTracks.length} new track(s) to create.`
//     // );
//
//     // Stage 5: Sequential album find-or-create (only for albums needed by new tracks)
//
//     const albumsReferenced: `${string}|||${string}`[] = validTracks.map(
//       ({ album, artist }) => `${album}|||${artist}` as `${string}|||${string}`
//     );
//     const requiredAlbums = validTracks.filter(
//       (t) => !existingTracks.has(`${t.title}|||${t.track_number}`)
//     );
//
//     const albumRecords = new Map<string, string>(); // "title|||artist" -> albumId
//
//     if (requiredAlbums.length > 0) {
//       payload.logger.info(
//         `[syncTrackMedia] Processing ${requiredAlbums.length} album(s)...`
//       );
//     }
//
//     //const key = `${title}|||${artist}`;
//     const existingA = await payload
//       .find({
//         collection: "albums",
//         pagination: false,
//         where: {
//           or: requiredAlbums.map(
//             ({ title, artist }) =>
//               ({
//                 and: [
//                   {
//                     title: { equals: title }
//                   },
//                   {
//                     artist: {
//                       equals: artist
//                     }
//                   }
//                 ]
//               }) as Where
//           )
//         },
//         overrideAccess: true,
//         req: { transactionID },
//         select: { title: true, artist: true }
//       })
//       .then((r) => r.docs);
//     const creationsReq = requiredAlbums.filter(
//       (i) =>
//         !existingA.some((a) => a.title === i.title && a.artist === i.artist)
//     );
//
//     requiredAlbums.forEach(({ title, artist }) => {
//       payload.logger.info(
//         `[syncTrackMedia] Album exists: "${title}" by ${artist}`
//       );
//     });
//
//     await Promise.all(
//       creationsReq.map(({ title, artist }) =>
//         payload
//           .create({
//             collection: "albums",
//             draft: false,
//             overrideAccess: true,
//             data: {
//               title,
//               artist,
//               visibility: "public",
//               slug: formatSlug(title + "-" + artist),
//               slugLock: false,
//               hashId: nanoid(11),
//               author: uid,
//               _status: "published"
//             },
//             select: {
//               title: true,
//               artist: true
//             },
//             req: {
//               transactionID
//             }
//           })
//           .then((r) => {
//             const { id: albumId, title, artist } = r;
//             payload.logger.info(
//               `[syncTrackMedia] Created album: "${title}" by ${artist}`
//             );
//
//             const albumkey = `${title}|||${artist}`;
//             albumRecords.set(albumkey, albumId);
//             return albumId;
//           })
//       )
//     );
//     // Stage 6: Create new tracks sequentially
//     if (newTracks.length > 0) {
//       newTracks.sort((a, b) => a.track_number - b.track_number);
//       payload.logger.info(
//         `[syncTrackMedia] Creating ${newTracks.length} new track(s)...`
//       );
//
//       const tps = newTracks
//         .filter((trackInfo) => {
//           const albumKey = `${trackInfo.album}|||${trackInfo.artist}`;
//           const albumId = albumRecords.get(albumKey);
//           return Boolean(albumId);
//         })
//         .map((trackInfo) => {
//           const albumKey = `${trackInfo.album}|||${trackInfo.artist}`;
//           const albumId = albumRecords.get(albumKey);
//           if (!albumId) throw new Error("No album for ");
//           return readRadioTrack({ url: trackInfo.filePath })
//             .then((metadata) => {
//               const duration = metadata.format.duration || 90;
//               payload.create({
//                 collection: "tracks",
//                 draft: false,
//                 overrideAccess: true,
//                 data: {
//                   author: uid,
//                   title: trackInfo.title,
//                   slug: formatSlug(trackInfo.title + "-" + trackInfo.artist),
//                   slugLock: false,
//                   hashId: nanoid(11),
//                   visibility: "public",
//                   duration,
//                   artist: trackInfo.artist,
//                   track_number: trackInfo.track_number,
//                   album: albumId,
//
//                   _status: "published"
//                 },
//                 filePath: trackInfo.filePath,
//                 req: { transactionID }
//               });
//               payload.logger.info(
//                 `[syncTrackMedia] Created track: "${trackInfo.title}" (#${trackInfo.track_number})`
//               );
//             })
//             .catch((e: any) => {
//               throw new Error(
//                 `[syncTrackMedia] Failed to create track "${trackInfo.title}"${(e instanceof Error && ": " + e.message) || ""}`
//               );
//             });
//         });
//       await Promise.all(tps);
//     }
//     // Stage 7: Fetch all tracks matching our metadata for final sorted playlist assembly
//     const allTrackDocs = await payload
//       .find({
//         collection: "tracks",
//         where: { title: { in: validTracks.map((t) => t.title) } },
//         pagination: false,
//         overrideAccess: true,
//         select: { title: true, track_number: true },
//         req: { transactionID }
//       })
//       .catch(() => ({
//         docs: [] as { title: string; track_number: number; id: string }[]
//       }));
//
//     const titleToTrackNumber = new Map(
//       validTracks.map((t) => [t.title, t.track_number])
//     );
//     const sortedAllIds = allTrackDocs.docs
//       .sort(
//         (a, b) =>
//           (titleToTrackNumber.get(a.title) ?? 999) -
//           (titleToTrackNumber.get(b.title) ?? 999)
//       )
//       .map((d) => d.id as string);
//
//     if (sortedAllIds.length === 0) {
//       payload.logger.warn(
//         "[syncTrackMedia] No track IDs assembled — skipping playlist step."
//       );
//       return;
//     }
//
//     // Stage 8: Playlist idempotency — find by title, update tracks if found, create if not.
//     // Playlist title is derived from the first (or only) album.
//     const playlistTitle =
//       requiredAlbums[0]?.title ??
//       (albumMap.size > 0
//         ? Array.from(albumMap.values())[0].title
//         : validTracks[0].album);
//
//     payload.logger.info(
//       `[syncTrackMedia] Processing playlist: "${playlistTitle}"...`
//     );
//
//     const existingPlaylist = await payload
//       .find({
//         collection: "playlists",
//         where: { title: { equals: playlistTitle } },
//         pagination: false,
//         limit: 1,
//         overrideAccess: true,
//         select: { title: true, tracks: true },
//         req: { transactionID }
//       })
//       .then((r) => r.docs[0] ?? null)
//       .catch(() => null);
//
//     let playlistId: string;
//
//     if (existingPlaylist) {
//       payload.logger.info(
//         `[syncTrackMedia] Playlist exists — updating track list.`
//       );
//       const updated = await payload
//         .update({
//           collection: "playlists",
//           id: existingPlaylist.id as string,
//           data: { tracks: sortedAllIds },
//           overrideAccess: true,
//           req: { transactionID }
//         })
//         .catch((e) => {
//           throw new Error(
//             "[syncTrackMedia] Failed to update existing playlist:",
//             e
//           );
//         });
//       if (!updated) return;
//       playlistId = updated.id as string;
//     } else {
//       payload.logger.info(
//         `[syncTrackMedia] Creating new playlist: "${playlistTitle}"`
//       );
//       const created = await payload
//         .create({
//           collection: "playlists",
//           draft: false,
//           overrideAccess: true,
//           data: {
//             title: playlistTitle,
//             author: [uid],
//             visibility: "public",
//             slug: formatSlug(playlistTitle),
//             slugLock: false,
//             hashId: nanoid(11),
//             tracks: sortedAllIds
//           },
//           req: { transactionID }
//         })
//         .catch((e) => {
//           payload.logger.error(
//             "[syncTrackMedia] Failed to create playlist:",
//             e
//           );
//           return null;
//         });
//       if (!created) return;
//       playlistId = created.id as string;
//       payload.logger.info(`[syncTrackMedia] Playlist created: ${playlistId}`);
//     }
//
//     // Stage 9: Register playlist in Header global
//     const header = await payload.findGlobal({
//       slug: "header",
//       depth: 0,
//       overrideAccess: true,
//       req: { transactionID }
//     });
//     const currentRadio = Array.isArray(header.radio)
//       ? (header.radio as string[])
//       : [];
//
//     if (!currentRadio.includes(playlistId)) {
//       await payload.updateGlobal({
//         slug: "header",
//         overrideAccess: true,
//         data: { radio: [...currentRadio, playlistId] },
//         req: { transactionID }
//       });
//       payload.logger.info(
//         `[syncTrackMedia] Appended playlist ${playlistId} to Header.radio.`
//       );
//     } else {
//       payload.logger.info(
//         "[syncTrackMedia] Playlist already registered in Header.radio."
//       );
//     }
//
//     payload.logger.info("[syncTrackMedia] Sync complete.");
//     await payload.db.commitTransaction(transactionID);
//   } catch (e: any) {
//     await payload.db.rollbackTransaction(transactionID);
//   }
// }
