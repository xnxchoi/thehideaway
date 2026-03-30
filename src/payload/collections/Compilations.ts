import { ACField } from "@/AccessControlled/plugin";
import { authenticated } from "@/payload/plugins/locker/access/accessCheckers";
import { idField } from "@/payload/fields/IDField";
import { hideIfNotAdmin } from "./helpers";
import { nanoid } from "nanoid";
import type { Access, CollectionConfig, Where } from "payload";

export const compilationItemTypes = [
  "posts",
  "surf",
  "profile",
  "albums",
  "playlists",
  "tracks",
  "userMedia"
] as const;

export type CompilationItemType = (typeof compilationItemTypes)[number];

const compilationReadAccess: Access = ({ req }) => {
  if (req.user?.role === "admin") return true;
  if (!req.user) return { visibility: { equals: "public" } } as Where;
  return {
    or: [
      { visibility: { equals: "public" } },
      { author: { equals: req.user.id } }
    ]
  } as Where;
};

const compilationMutateAccess: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === "admin") return true;
  return { author: { equals: req.user.id } } as Where;
};

export const Compilations: CollectionConfig = {
  slug: "compilations",

  access: {
    create: authenticated,
    read: compilationReadAccess,
    update: compilationMutateAccess,
    delete: compilationMutateAccess
  },

  admin: {
    useAsTitle: "title",
    hidden: hideIfNotAdmin
  },

  forceSelect: {
    title: true,
    hashId: true,
    visibility: true,
    author: true
  },

  fields: [
    idField(),

    {
      name: "title",
      type: "text",
      required: true,
      index: true,
      admin: {
        components: ACField("text")
      }
    },

    {
      name: "hashId",
      type: "text",
      index: true,
      unique: true,
      required: true,
      defaultValue: () => nanoid(11),
      access: {
        read: () => true,
        update: () => false
      },
      admin: { hidden: true }
    },

    {
      name: "description",
      type: "textarea",
      admin: {
        components: ACField("textarea")
      }
    },

    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
      index: true,
      maxDepth: 1,
      access: {
        update: () => false
      },
      admin: {
        components: ACField("relationship")
      }
    },

    {
      name: "visibility",
      type: "select",
      options: [
        { label: "Public", value: "public" },
        { label: "Private", value: "private" }
      ],
      defaultValue: "private",
      required: true,
      admin: {
        components: ACField("select")
      }
    },

    {
      name: "coverImage",
      type: "relationship",
      relationTo: "media",
      hasMany: false,
      maxDepth: 1,
      admin: {
        components: ACField("relationship")
      }
    },

    {
      name: "items",
      type: "relationship",
      relationTo: [...compilationItemTypes],
      hasMany: true,
      maxDepth: 2,
      admin: {
        components: ACField("relationship")
      }
    }
  ],

  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        if (operation === "create" && req.user && !data.author) {
          data.author = req.user.id;
        }
        return data;
      }
    ],
    afterRead: []
  }
};
