import { Tag } from "@/payload-types";
import { authorFields } from "@/payload/fields/AuthorField/AuthorField";
import { sanitizeAuthor } from "@/payload/fields/AuthorField/hooks";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { KeysOfValue } from "@/utilities/typeUtilities";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  CollectionConfig,
  CollectionSlug,
  DataFromCollectionSlug
} from "payload";
import { uuidv7 } from "uuidv7";
import { slugField } from "../fields/slug";
import {
  isAdminOrEditor,
  standardCreateAccess
} from "../plugins/locker/access/accessCheckers";

export type TaggedCollection = Extract<
  DataFromCollectionSlug<Exclude<CollectionSlug, "delta">>,
  {
    tagged?: (Tag | string)[] | null;
  }
>;
export type TaggedCollectionSlug = KeysOfValue<CollectionMap, TaggedCollection>;
const tagPop = {
  title: true,
  id: true,
  slug: true
} as const;
export type DefaultTag = typeof tagPop;
export const Tags: CollectionConfig<"tags"> = {
  slug: "tags",
  admin: {
    useAsTitle: "title"
  },
  access: {
    read: () => true,
    create: standardCreateAccess,
    update: ({ req }) =>
      req.context.overrideAccess === true || isAdminOrEditor({ req }),
    delete: isAdminOrEditor
  },
  lockDocuments: false,
  defaultPopulate: tagPop,
  fields: [
    {
      name: "id",
      type: "text",
      defaultValue: uuidv7,
      access: {
        update: () => false
      },
      required: true,
      admin: {
        hidden: true
      }
    },
    {
      name: "title",
      type: "text",
      required: true,
      unique: true,
      index: true,
      access: {
        read: () => true,
        create: standardCreateAccess,
        update: isAdminOrEditor
      }
    },

    ...authorFields(false),
    ...slugField("title", false),
    {
      name: "tagCount",
      type: "number",
      defaultValue: 0,
      min: 0,
      admin: {
        hidden: true
      },
      required: true,
      index: true
    },
    {
      name: "taggedItems",
      type: "join",
      on: "tagged",
      defaultLimit: 20,
      collection: [
        "posts",
        "surf",
        "playlists",
        "albums",
        "profile",
        "pages",
        "tracks"
      ]
    }
  ],
  hooks: {
    beforeChange: [sanitizeAuthor(false)],
    afterChange: [
      ({ collection, operation, doc, previousDoc }) => {
        revalidateTag("tag-data", "max");

        switch (operation) {
          case "create":
            {
            }
            break;
          case "update":
            {
              revalidatePath("/tagged/" + doc.slug, "page");
              if (previousDoc?.slug !== doc?.slug) {
                revalidatePath("/tagged/" + previousDoc.slug, "page");
              }
              revalidateTag("tag-" + (doc as Tag).slug, "max");
            }
            break;
        }
      }
    ]
  }
};
