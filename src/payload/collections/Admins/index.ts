import { Media } from "@/payload-types";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { CollectionConfig, FilterOptionsProps, Where } from "payload";
import { hideIfNotAdmin } from "../helpers";
import { uuidv7 } from "uuidv7";

export const Admins: CollectionConfig = {
  slug: "admins",
  access: {
    create: isAdmin,
    delete: ({ req: { user }, id }) => {
      if (!user) return false;
      if (user.collection !== "admins") return false;
      return user.id === id;
    }
  },
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true
  },
  defaultPopulate: {
    email: true,
    name: true,
    slug: true
  },
  admin: {
    hidden: hideIfNotAdmin,
    useAsTitle: "email"
  },
  fields: [
    {
      name: "id",
      type: "text",
      admin: {
        readOnly: true
      },
      defaultValue: uuidv7,
      required: true
    },
    {
      name: "name",
      type: "text",
      defaultValue: "Admin",
      index: true,
      required: true,
      virtual: true
    },
    {
      name: "email",
      type: "email",
      required: true,
      index: true,
      unique: true
    },
    {
      name: "role",
      type: "select",
      options: [
        "admin",

      ],
      defaultValue: "admin",
      required: true,
      virtual: true
    },
    {
      name: "foto",
      type: "upload",
      relationTo: "media",
      filterOptions: ({ req, user }: FilterOptionsProps<Media>) => {
        const w: Where = {
          and: [
            {
              filesize: {
                less_than: 2560000
              }
            },
            {
              author: {
                equals: user?.id
              }
            },
            {
              "author.relationTo": {
                equals: user?.collection
              }
            },
            {
              mimeType: {
                contains: "image/"
              }
            }
          ]
        };
        return w;
      },
      admin: {
        description: "Upload your profile picture here."
      }
    },

    {
      type: "row",
      fields: [
        {
          name: "firstName",
          type: "text",
          label: "First Name",
          index: true,
          defaultValue: "R",
          virtual: true
        },
        {
          name: "lastName",
          type: "text",
          label: "Last Name",
          index: true,
          defaultValue: "P",
          virtual: true
        }
      ]
    },

    {
      name: "link",
      type: "text",
      admin: {
        description:
          "Your Personal Link- anything from your website to your twitter handle"
      }
    },

    {
      name: "bio",
      type: "text",
      index: true,
      label: "Intro",
      defaultValue: "A Patron of The Hideaway.",
      admin: {
        description:
          "A short description of yourself, your passion, work, interest, anything- just keep it interesting."
      }
    }
  ],
  timestamps: true,
  versions: {
    drafts: false,
    maxPerDoc: 50
  }
};
