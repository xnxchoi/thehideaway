import fs from "fs/promises";
import path from "path";
import config from "@payload-config";
import payload, { getPayload } from "payload";
import { parseFile } from "music-metadata";
import { formatSlug } from "@/payload/fields/slug/formatSlug";
import { nanoid } from "nanoid";
import { User } from "@payload-types";
import { tags } from "@/payload-generated-schema";

export const initializeCMS = async () => {
  try {
    const uid = await payload.find({
      collection: "users", where: {
        and: [{
          role: {
            equals: "admin"
          }
        }, {
          name: {
            equals: "concierge"
          }
        }]
      }, overrideAccess: true, select: {
        slug: true
      }, pagination: false, limit: 1
    }).then(async ({ docs }) => {
      if (!docs[0]) {
        return await payload.create({
          collection: "users", draft: false, data: {
            name: "concierge",
            role: "admin",
            slug: "concierge",
            email: "sean.sungyoon.choi@gmail.com",
            username: "concierge",
            emailVerified: true,
            verified: true,
            firstName: "The",
            lastName: "Concierge",
            onboarded: true,
            banned: false,
            twoFactorEnabled: false
          }
        }).then(({ id }) => id);
      } else {
        return (docs[0] as User).id;
      }
    }).catch((e) => {
      payload.logger.error("Error creating user concierge:", e);
    });

    if (typeof uid === "string") {

      const trackMediaPath = path.resolve(process.cwd(), "public", "track_media");
      await fs.mkdir(trackMediaPath, { recursive: true });
      const directoryContents = await fs.readdir(trackMediaPath);
      const oggFiles = directoryContents.filter(item => path.extname(item).toLowerCase() === ".ogg");
      if (oggFiles.length > 0) {
        const payload = await getPayload({ config });
        const tracksToCreate: {
          artist: string; title: string; album: string; no: number; duration: number; url: string;
        }[] = [];
        // 4) Loop through and read each .ogg file
        for (const file of oggFiles) {
          // Create the absolute path to the specific file
          const fullFilePath = path.join(trackMediaPath, file);
          const metadata = await parseFile(fullFilePath, {
            duration: true
          });
          if (!!metadata) {
            const { title, artist, track: { no }, album } = metadata.common || {};
            const { duration } = metadata.format || {};
            if (!!title && !!artist && !!no && !!album && !!duration) {
              tracksToCreate.push({
                artist, title, album, no, duration, url: `/track_media/${file}`
              });
            }

          }
        }
        if (tracksToCreate.length > 0) {
          const tracksCreate = tracksToCreate.map(
            async ({ artist, title, album, no, duration, url }) => await payload.create({
              collection: "tracks", draft: false, data: {
                artist,
                title,
                album,
                slugLock: true,
                hashId: nanoid(11),
                author: uid,
                slug: formatSlug(title),
                visibility: "public",
                track_number: no
              }
            }));
          const createdTracks = await Promise.allSettled(tracksCreate).
            then((r) => r.filter((x) => x.status === "fulfilled")).then((g) => g.map((xx) => xx.value));
          console.log("Tracks created:", createdTracks);
          const playlist = await payload.create({
            collection: "playlists", draft: false, data: {
              author: [uid],
              title: "RP.FM '26 vol.1",
              slug: formatSlug("RP.FM '26 vol.1"),
              slugLock: true,
              visibility: "public",
              _status: "published",
              tracks: createdTracks.map(r => r.id),
              hashId: nanoid(11)
            }
          });
        }
      )
      }
      const pr = tags.map(([title, slug]) => payload.count({
        collection: "tags", overrideAccess: true, where: {
          title: {
            equals: title
          }
        }
      }).then((r) => r.totalDocs < 1 ? ([title, slug] as [string, string]) : slug).
        catch((e) => payload.logger.error("Error while querying for unitinialized tag " + slug + ": ", e)));
      const results = await Promise.allSettled(pr);
      const notErrored = results.filter((v) => v.status === "fulfilled");
      const errored = results.filter((r) => r.status === "rejected");
      const left = notErrored.map((rx) => rx.value).filter((t) => Array.isArray(t));
      if (left.length > 0) {
        const over = left.map(([title, slug]) => payload.create({
          collection: "tags", draft: false, overrideAccess: true, data: {
            title, slug, hashId: nanoid(11), slugLock: true, tagCount: 0, author: uid
          }
        }).then((r) => r.slug));
        await Promise.allSettled(over).then((r) => r.filter((x) => x.status === "fulfilled")).
          then((g) => g.map((xx) => xx.value)).then((s) => console.log("Tags created:", s));
      }
    } else {
      payload.logger.error("Error in locating admin user with name concierge");
    }

  } catch (error: any) {

  }
};