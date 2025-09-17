import type { CollectionConfig } from "payload";
import { standardUpdateAccess } from "@/payload/plugins/locker/access/accessCheckers";
import { hideIfNotAdmin } from "./helpers";

export const Categories: CollectionConfig = {
  slug: "categories",
  access: {
    create: standardUpdateAccess,
    delete: async ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === "admin") {
        return {
          title: {
            not_equals: "uncategorized"
          }
        };
      }
      return false;
    },
    read: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === "admin" || user.role === "editor") {
        return {
          title: {
            not_equals: "uncategorized"
          }
        };
      }
      return false;
    }
  },
  admin: {
    useAsTitle: "title",
    hidden: hideIfNotAdmin
  },
  defaultPopulate: {
    title: true,
    slug: true
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      index: true
    },
    {
      name: "relatedCategories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      defaultValue: [],
      maxDepth: 0,
      index: true
    },
    {
      name: "description",
      type: "textarea",
      index: true,
      defaultValue: () => ""
    },
    {
      type: "text",
      name: "slug",
      required: true,
      hooks: {
        afterRead: [({ value }) => decodeURIComponent(value)],
        beforeChange: [
          ({ value }) => {
            return encodeURIComponent(value);
          }
        ]
      }
    }
  ],
  hooks: {
    afterRead: []
  }
};
