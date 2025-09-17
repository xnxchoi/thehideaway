// collections/UserViews.ts
import { CollectionConfig } from "payload";
import { userViewHandler } from "./api/handler";
import { hideIfNotAdmin } from "../helpers";

export const UserViews: CollectionConfig = {
  slug: "userViews",
  admin: {
    useAsTitle: "id",
    hidden: hideIfNotAdmin
  },
  timestamps: true,
  access: {
    read: () => true,
    create: ({ req }) => {
      return req.user?.role === "admin";
    },
    update: ({ req }) => {
      return req.user?.role === "admin";
    },
    delete: ({ req }) => {
      return req.user?.role === "admin";
    }
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      access: {
        update: () => false
      },
      maxDepth: 0,
      required: true,
      hasMany: false,
      index: true
    },
    {
      name: "target",
      type: "relationship",
      relationTo: [
        "posts",
        "delta",
        "playlists",
        "profile",
        "albums",
        "tracks"
      ],
      access: {
        update: () => false
      },
      required: true,
      maxDepth: 0,
      hasMany: false,
      index: true
    },
    {
      name: "version",
      type: "text",

      defaultValue: "0",
      required: true,
      admin: {
        description: "ID of the content's version when viewed"
      }
    },
    {
      name: "viewed",
      type: "checkbox",
      defaultValue: false,
      required: true,
      index: true,
      admin: {
        description: "Whether the user has viewed the content"
      }
    },
    {
      name: "progress",
      type: "number",
      min: 0.0,
      max: 1.0,
      defaultValue: 0.0,
      required: true,
      index: true,
      admin: {
        description:
          "How much of the content the user has viewed; 0.00 - 1.00, 0.00 = not viewed, 1.00 = fully viewed. Note the two decimal places."
      }
    },
    {
      name: "lastViewed",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime"
        },
        description:
          "The date and time the user last viewed the content, if viewed is true"
      }
    }
  ],
  indexes: [],
  endpoints: [
    {
      path: "/updateView",
      method: "post",
      handler: userViewHandler
    }
  ]
};
