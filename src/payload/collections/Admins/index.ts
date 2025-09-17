import { Media } from "@/payload-types";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { isHangul } from "@/utilities/rp_utils";
import { CollectionConfig, FilterOptionsProps, Where } from "payload";
import { uuidv7 } from "uuidv7";
import { hideIfNotAdmin } from "../helpers";

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
      name: "name",
      type: "text",
      defaultValue: () => uuidv7(),
      index: true
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
      options: ["admin", "user", "patron", "editor", "author"],
      defaultValue: "admin",
      required: true
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
          hooks: {
            beforeChange: [
              ({ siblingData, value, operation }) => {
                if (!value || typeof value !== "string" || value.length === 0) {
                  if (siblingData.name) {
                    if (typeof siblingData.name === "string") {
                      const name = siblingData.name.trim();
                      if (name.length > 0) {
                        if (isHangul(name.charAt(0))) {
                          if (name.length > 4) {
                            return name.slice(0, 2);
                          }
                          return name.slice(0, 1);
                        }
                        const firstName =
                          (name.indexOf(" ") > 0
                            ? name.split(" ")[0]
                            : name.indexOf("-")
                              ? name.split("-")[0]
                              : name) ?? "R";
                        return (
                          firstName.slice(0, 1).toUpperCase() +
                          firstName.slice(1).toLowerCase()
                        );
                      }
                    }
                  }
                  return (
                    siblingData.email.split("@")[0].slice(0, 1).toUpperCase() +
                    siblingData.email.split("@")[0].slice(1).toLowerCase()
                  );
                }
                return isHangul(value.charAt(0))
                  ? value
                  : value.slice(0, 1).toUpperCase() +
                      value.slice(1).toLowerCase();
              }
            ]
          }
        },
        {
          name: "lastName",
          type: "text",
          label: "Last Name",
          index: true,
          defaultValue: "P",
          hooks: {
            beforeChange: [
              ({ siblingData, value, operation }) => {
                if (!value || typeof value !== "string" || value.length === 0) {
                  if (siblingData.name) {
                    if (typeof siblingData.name === "string") {
                      const name = siblingData.name.trim();
                      if (name.length > 0) {
                        if (isHangul(name.charAt(0))) {
                          if (name.length > 3) {
                            return name.slice(2);
                          }
                          return name.slice(1);
                        }
                        const lastName =
                          (name.indexOf(" ") > 0
                            ? name.split(" ")[1]
                            : name.indexOf("-")
                              ? name.split("-")[1]
                              : name) ?? "P";
                        return (
                          lastName.slice(0, 1).toUpperCase() +
                          lastName.slice(1).toLowerCase()
                        );
                      }
                    }
                  }
                  return (
                    siblingData.email.split("@")[0].slice(0, 1).toUpperCase() +
                    siblingData.email.split("@")[0].slice(1).toLowerCase()
                  );
                }
                return isHangul(value.charAt(0))
                  ? value
                  : value.slice(0, 1).toUpperCase() +
                      value.slice(1).toLowerCase();
              }
            ]
          }
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
