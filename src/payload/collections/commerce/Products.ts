import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";

export const CommerceProducts: CollectionConfig = {
  slug: "commerce-products",
  labels: {
    singular: "Commerce Product",
    plural: "Commerce Products"
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "active", "unit_amount", "max_quantity"],
    description: "Products available through the minimal commerce system."
  },
  access: {
    read: ({ req: { user } }) =>
      user?.role === "admin" ? true : { active: { equals: true } },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  fields: [
    {
      name: "name",
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
      name: "unit_amount",
      type: "number",
      required: true,
      min: 1
    },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW"]
    },
    {
      name: "max_quantity",
      type: "number",
      required: true,
      defaultValue: 1,
      min: 1,
      max: 99
    },
    {
      name: "summary",
      type: "textarea"
    },
    {
      name: "description",
      type: "richText",
      editor: lexicalEditor({})
    },
    {
      name: "details",
      type: "textarea"
    },
    {
      name: "care",
      type: "textarea"
    },
    {
      name: "shipping_returns",
      type: "textarea"
    },
    {
      name: "hero_media",
      type: "upload",
      relationTo: "media"
    },
    {
      name: "gallery",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      maxRows: 12
    },
    {
      name: "sort",
      type: "number",
      defaultValue: 0,
      index: true
    }
  ]
};
