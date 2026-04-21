import {cleanupBookmarksAfterDelete} from "@/payload/hooks/cleanupBookmarksAfterDelete";
import { scrubAmbientRefsOnTrackDelete } from "@/payload/Lexical/Features/AmbientAudio/server/scrubOnTrackDelete";
import { StreamHandler } from "@/payload/collections/Radio/endpoints/stream";
import { authorFields } from "@/payload/fields/AuthorField/AuthorField";
import { sanitizeAuthor } from "@/payload/fields/AuthorField/hooks";
import { slugField } from "@/payload/fields/slug";
import {
  isAdmin,
  standardCreateAccess,
  standardUpdateAccess
} from "@/payload/plugins/locker/access/accessCheckers";
import { filterDocByCurrentUser } from "@/payload/utilities/filterDocByCurrentUser";
import path from "path";
import { CollectionConfig, Where } from "payload";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Tracks: CollectionConfig = {
  slug: "tracks",
  lockDocuments: false,

  admin: {
    useAsTitle: "filename",
    baseFilter: filterDocByCurrentUser
  },
  defaultPopulate: {
    title: true,
    artist: true,
    track_number: true,
    url: true,
    filename: true,
    mimeType: true,
    duration: true
  },
  access: {
    create: standardCreateAccess,
    delete: standardUpdateAccess,
    read: ({ req: { user } }) => {
      if (!user)
        return {
          _status: {
            equals: "published"
          }
        };
      if (["admin", "editor"].includes(user?.role ?? "")) return true;
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
  fields: [
    {
      name: "title",
      type: "text",
      required: true
    },
    {
      name: "publishedAt",
      type: "date"
    },
    {
      name: "track_number",
      type: "number",
      required: true
    },
    {
      name: "album",
      type: "relationship",
      relationTo: "albums",
      hasMany: false,
      required: true,
      admin: {
        allowCreate: true
      },
      hooks: {
        beforeChange: [
          async ({ req, siblingData, value }) => {
            if (value) {
              const album = await req.payload
                .findByID({
                  collection: "albums",
                  id: value,
                  select: {
                    slug: true
                  }
                })
                .catch((e) => {
                  req.payload.logger.error("Errpr");
                  return null;
                });
              if (album) {
                siblingData.albumSlug = album.slug;
              }
              return value;
            }
          }
        ]
      }
    },
    {
      name: "duration",
      type: "number",
      required: true,
      min: 0
    },
    {
      name: "albumSlug",
      type: "text"
    },
    {
      name: "bookmarks",
      collection: "bookmarks",
      type: "join",
      on: "target"
    },
    {
      name: "tagged",
      label: "Tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,

      admin: {
        allowCreate: true,
        allowEdit: false
      },
      access: {
        read: () => true
      },
      maxDepth: 1,
      maxRows: 5,
      index: true
    },
    {
      name: "artist",
      type: "text",
      required: true
    },
    { name: "description", type: "text" },
    {
      name: "visibility",
      type: "select",
      hasMany: false,
      required: true,
      options: ["public", "private"],
      defaultValue: "public"
    },
    ...authorFields(),
    ...slugField("title", true, {
      checkboxOverrides: {
        admin: {
          readOnly: !isAdmin
        }
      }
    })
  ],
  indexes: [
    {
      fields: ["artist", "album"]
    }
  ],
  upload: {
    staticDir: path.resolve(dirname, "../../../../public/track_media"),
    adminThumbnail: "thumbnail",
    filenameCompoundIndex: ["filename"],
    mimeTypes: ["audio/mpeg", "audio/wav", "audio/aac", "audio/ogg"]
  },
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
        showSaveDraftButton: true
      }
    },
    maxPerDoc: 3
  },
  endpoints: [{ path: "stream/:id", method: "get", handler: StreamHandler }],
  hooks: {
    afterChange: [],
    afterDelete: [
      cleanupBookmarksAfterDelete("tracks"),
      scrubAmbientRefsOnTrackDelete
    ],
    beforeChange: [sanitizeAuthor(false)]
  }
};
