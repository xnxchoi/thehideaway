import { CollectionConfig } from "payload";
import {
  isAdminOrEditor,
  standardCreateAccess
} from "../plugins/locker/access/accessCheckers";
import { slugField } from "../fields/slug";
import { AuthorField } from "../fields/AuthorFields/AuthorField";
import { sanitizeAuthor } from "../fields/AuthorFields/hooks";
import { Tag } from "@/payload-types";

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
  fields: [
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

    ...AuthorField(false),
    ...slugField("title")
  ],
  hooks: {
    beforeChange: [sanitizeAuthor(false)]
  }
};
