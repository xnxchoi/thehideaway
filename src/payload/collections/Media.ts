import {CollectionConfig} from "payload";

import {populatePublishedAt} from "@/hooks/populatePublishedAt";
import type {User} from "@/payload-types";
import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField";
import {sanitizeAuthor} from "@/payload/fields/AuthorFields/hooks";
import {authenticated, standardUpdateAccess} from "@/payload/plugins/locker/access/accessCheckers";
import {extractImageInfo} from "@/utilities/extractImageInfo";
import path from "path";
import {fileURLToPath} from "url";
import {uuidv7} from "uuidv7";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const MediaFields: CollectionConfig["fields"] = [

	...AuthorField(false),

];

export const Media: CollectionConfig = {
  slug: "media",
  lockDocuments: false,
  admin: {
	  // hidden: hideIfNotAdmin
	  baseFilter: ({req}) => {
		  const user = req.user;
		  if (!user) {
			  return {
				  author: {
					  exists: false
				  }
			  };
		  }
		  if (["editor", "admin"].some((r) => r === user.role)) {
			  return null;
		  }
		  return {
			  author: {
				  equals: user.id
			  }
		  };
	  }
  },
  defaultPopulate: {
    url: true,
    filename: true,
    mimeType: true,
    width: true,
    thumbnailURL: true,
    blurDataURL: true,
    height: true,
    darkmode: true
  },

  access: {
    create: authenticated,
    delete: standardUpdateAccess,
    read: () => true,
    update: standardUpdateAccess
  },
  fields: MediaFields,
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, "../../../public/media"),

	  mimeTypes: ["video/*", "audio/*", "application/pdf"],
     
  },
  hooks: {
    beforeOperation: [
      async ({ operation, context, req, args }) => {
        if (operation === "create") {
          if (req.file && req.file.mimetype.startsWith("image/")) {
            const targetUser =
              (req.data?.author as User["id"] | undefined) ??
              req.user?.id ??
              null;
            if (!targetUser) {
              throw new Error("Target user not found.");
            }
            const targetUserDoc = await req.payload.findByID({
              collection: "users",
              id: targetUser,
              overrideAccess: true,
              select: {
                id: true,
                banned: true
              }
            });
            if (!targetUserDoc) {
              req.payload.logger.error("Target user not found.");
              throw new Error("Target user not found.");
            }
            if (targetUserDoc?.banned) {
              req.payload.logger.error("This user is banned.");
              throw new Error("This user is banned.");
            }

            const file = req.file as unknown as { md5: string };
            const hash = file.md5;
            req.file.name = `${targetUserDoc.id.toString()}_${hash.slice(
              0,
              2
            )}_${hash.slice(2, 4)}_${req.file.name}`;

            const { darkmode } = await extractImageInfo({ req: req });
            if (typeof darkmode === "boolean") {
              context.darkmode = darkmode;
            }
          }
        }
      }
    ],
    beforeValidate: [
      async ({ req, context, operation, data, originalDoc }) => {
        let dt = data;
        if (operation === "create") {
          if (context.sourceId && context.sourceId.length > 0) {
            dt = {
              ...dt,
              source: {
                sourceId: context.sourceId,
                provider: "unsplash"
              }
            };
          }
        } else {
          dt = {
            ...dt,
            source: {
              ...originalDoc.source
            }
          };
        }
        context.sourceId = undefined;
        return dt;
      }
    ],
    beforeChange: [sanitizeAuthor(false), populatePublishedAt]
    // afterOperation: [webpConversionHook]
  }
};
