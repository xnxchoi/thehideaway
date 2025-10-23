import { extractImageInfo } from "@/utilities/extractImageInfo";
import path from "path";
import { CollectionConfig } from "payload";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";
import { hideIfNotAdmin } from "./helpers";
import type { ImageCollectionOverview } from "@/components/UX/Media/types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export const Assets: CollectionConfig = {
  slug: "assets",
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
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) {
        return false;
      }
      if (user?.role === "admin") {
        return true;
      }
      return false;
    },
    update: ({ req: { user } }) => {
      if (!user) {
        return false;
      }
      if (user?.role === "admin") {
        return true;
      }
      return false;
    },
    delete: ({ req: { user } }) => {
      if (!user) {
        return false;
      }
      if (user?.role === "admin") {
        return true;
      }
      return false;
    }
  },
  admin: {
    hidden: hideIfNotAdmin,
    useAsTitle: "filename"
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      defaultValue: ({ req }) => {
        return "";
      }
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
    }
  ],

  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, "../../../public/assets/media"),
    adminThumbnail: "thumbnail",
    focalPoint: true,
    formatOptions: { format: "webp" },
    imageSizes: [
      {
        name: "thumbnail",
        width: 300
      },
      {
        name: "square",
        width: 500,
        height: 500
      },
      {
        name: "small",
        width: 600
      },
      {
        name: "medium",
        width: 900
      },
      {
        name: "large",
        width: 1400
      },
      {
        name: "xlarge",
        width: 1920
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        crop: "center"
      }
    ]
  },
  hooks: {
    beforeOperation: [
      async ({ operation, req, context }) => {
        if (operation === "create" || operation === "update") {
          if (req.file && req.file.mimetype.indexOf("image") > -1) {
            req.payload.logger.info({
              message: "Extracting image info",
              origin: "beforeOperation",
              date: DateTime.now().toISO(),
              file: req.file,
              user: req.user?.id
            });
            const { darkmode } = await extractImageInfo({ req: req });
            if (typeof darkmode === "boolean") {
              context.darkmode = darkmode;
            }
          }
        }
      }
    ],
    beforeChange: [
      async ({ data, collection, operation, req, context }) => {
        if (operation === "create" || operation === "update") {
          if (req.file && req.file.mimetype.indexOf("image") > -1 && context) {
            data.darkmode = context.darkmode ?? false;
          }
        }
        return data;
      }
    ]
  }
};
