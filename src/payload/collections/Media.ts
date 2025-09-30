import { CollectionConfig, Where } from "payload";

import { populatePublishedAt } from "@/hooks/populatePublishedAt";
import { hideIfNotAdmin } from "@/payload/collections/helpers";
import { AuthorField } from "@/payload/fields/AuthorFields/AuthorField";
import { sanitizeAuthor } from "@/payload/fields/AuthorFields/hooks";
import {
  authenticated,
  standardUpdateAccess
} from "@/payload/plugins/locker/access/accessCheckers";
import { extractImageInfo } from "@/utilities/extractImageInfo";
import path from "path";
import { fileURLToPath } from "url";
import type { User } from "@/payload-types";
import { webpConversionHook } from "./Media/hooks/webpConversionHook";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const MediaFields: CollectionConfig["fields"] = [
  {
    name: "alt",
    type: "text",
    defaultValue: "an image"
  },
  {
    name: "caption",
    type: "text"
  },
  {
    name: "darkmode",
    type: "checkbox",
    defaultValue: false,
    index: true
  },
  ...AuthorField(false),
  {
    name: "publishedAt",
    type: "date",
    admin: {
      date: {
        pickerAppearance: "dayAndTime"
      }
    }
  }
];

export const Media: CollectionConfig = {
  slug: "media",
  lockDocuments: false,
  admin: {
    hidden: hideIfNotAdmin
  },
  defaultPopulate: {
    url: true,
    filename: true,
    mimeType: true,
    width: true,
    height: true,
    darkmode: true
  },

  access: {
    create: authenticated,
    delete: standardUpdateAccess,
    read: ({ req }) => {
      const user = req.user;
      if (!user || !user.role)
        return {
          _status: {
            equals: "published"
          }
        };
      if (["editor", "admin"].includes(user?.role)) return true;
      const stat: Where = {
        _status: { equals: "published" }
      };
      return {
        or: [
          stat,
          {
            author: {
              equals: user.id
            }
          }
        ]
      } as Where;
    },
    update: standardUpdateAccess
  },
  fields: MediaFields,
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, "../../../public/media"),
    adminThumbnail: "thumbnail",
    focalPoint: true,
    filenameCompoundIndex: ["filename", "alt"],
    formatOptions: { format: "webp" },
    mimeTypes: ["image/*", "video/*", "audio/*", "application/pdf"],
    imageSizes: [
      {
        name: "thumbnail",
        width: 300,
        formatOptions: {
          format: "webp"
        }
      },
      {
        name: "square",
        width: 500,
        height: 500,
        formatOptions: {
          format: "webp"
        }
      },
      {
        name: "small",
        width: 600,
        formatOptions: {
          format: "webp"
        }
      },
      {
        name: "medium",
        width: 900,
        formatOptions: {
          format: "webp"
        }
      },
      {
        name: "large",
        width: 1400,
        formatOptions: {
          format: "webp"
        }
      },
      {
        name: "xlarge",
        width: 1920,
        formatOptions: {
          format: "webp"
        }
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        crop: "center",
        formatOptions: {
          format: "webp"
        }
      }
    ]
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
    beforeChange: [sanitizeAuthor(false), populatePublishedAt]
    // afterOperation: [webpConversionHook]
  },
  versions: {
    drafts: {
      autosave: {
        interval: 1500 // We set this interval for optimal live preview
      },
      schedulePublish: true
    },
    maxPerDoc: 5
  }
};
