import { revalidateHeader } from "@/components/core/Header/hooks/revalidateHeader";

import { link } from "@/payload/fields/link";
import type { GlobalConfig } from "payload";
import { uuidv7 } from "uuidv7";

export const Header: GlobalConfig = {
  slug: "header",
  access: {
    read: () => true
  },
  admin: {
    hidden: ({ user }) => {
      if (!user) return true;

      return !(user?.role === "admin");
    }
  },
  fields: [
    {
      name: "id",
      type: "text",
      defaultValue: () => uuidv7(),
      access: {
        update: () => false
      }
    },
    {
      name: "radio",
      type: "relationship",
      relationTo: "playlists",
      hasMany: true // Enables an order-sensitive list of relationships
    },
    {
      name: "navItems",
      type: "array",
      required: true,
      fields: [
        link({
          appearances: ["default"],
          overrides: {
            required: false
          }
        }),
        {
          name: "previewMedia",
          type: "group",
          fields: [
            {
              name: "desktop",
              type: "relationship",
              relationTo: "media",
              required: false,
              hasMany: false
            },
            {
              name: "mobile",
              type: "relationship",
              relationTo: "media",
              required: false,
              hasMany: false
            }
          ]
        }
      ],
      maxRows: 6
    }
  ],
  hooks: {
    afterChange: [revalidateHeader]
  }
};
