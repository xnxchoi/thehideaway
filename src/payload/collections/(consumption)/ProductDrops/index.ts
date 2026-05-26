import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import type { CollectionConfig } from "payload";

export const ProductDrops: CollectionConfig = {
  slug: "product-drops",
  labels: {
    singular: "Product Drop",
    plural: "Product Drops"
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "active", "sort"],
    description: "LOSTINSEOUL seasonal drops and collections."
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "active",
      type: "checkbox",
      required: true,
      defaultValue: false,
      index: true
    },
    {
      name: "kicker",
      type: "text"
    },
    {
      name: "lede",
      type: "textarea"
    },
    {
      name: "hero_media",
      type: "upload",
      relationTo: "media"
    },
    {
      name: "sort",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: { position: "sidebar" }
    }
  ]
};
