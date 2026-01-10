import {Tag} from "@/payload-types";
import {CollectionConfig} from "payload";
import {uuidv7} from "uuidv7";
import {AuthorField} from "../fields/AuthorFields/AuthorField";
import {sanitizeAuthor} from "../fields/AuthorFields/hooks";
import {slugField} from "../fields/slug";
import {isAdminOrEditor, standardCreateAccess} from "../plugins/locker/access/accessCheckers";

const tagPop = {
  title: true,
  id: true,
  slug: true
} as const;
export type DefaultTag = typeof tagPop;
export type P_Tag = Pick<Tag, keyof DefaultTag>;
export const Tags: CollectionConfig<"tags"> = {
  slug: "tags",
  admin: {
    useAsTitle: "title"
  },
  access: {
    read: () => true,
    create: standardCreateAccess,
    update: isAdminOrEditor,
    delete: isAdminOrEditor
  },
  lockDocuments: false,
  defaultPopulate: tagPop,
  fields: [{
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
    {
      name: "tagged",
      type: "join",
      on: "tagged",
      hasMany: true,
      collection: ["delta", "posts", "pages", "profile", "albums", "playlists", "tracks"],

      where: {
        _status: {
          equals: "published"
        }
      }
    },
    ...AuthorField(false),
    ...slugField("title")
  ],
  hooks: {
    beforeChange: [sanitizeAuthor(false)]
  }
};
