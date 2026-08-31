import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import type { Access } from "payload";

import { lockProductUpdate } from "@/payload/collections/(consumption)/Products/lockProductUpdate";
import {
  isAdmin,
  isAdminOrEditor
} from "@/payload/plugins/locker/access/accessCheckers";

const catalogRead: Access = ({ req: { user } }) => {
  if (["admin", "editor"].includes(user?.role ?? "")) return true;
  return {
    and: [{ _status: { equals: "published" } }, { active: { equals: true } }]
  };
};

export const productsCollectionOverride: CollectionOverride = ({
  defaultCollection
}) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    useAsTitle: "name",
    description: "LOSTINSEOUL storefront products.",
    defaultColumns: [
      "name",
      "slug",
      "active",
      "standard_enabled",
      "request_to_order_enabled",
      "private_order_enabled"
    ],
    hidden: ({ user }) =>
      !["admin", "editor"].some((role) => user?.role === role)
  },
  defaultPopulate: {
    ...defaultCollection.defaultPopulate,
    id: true,
    name: true,
    slug: true,
    active: true,
    storefront: true,
    standard_enabled: true,
    request_to_order_enabled: true,
    private_order_enabled: true
  },
  access: {
    ...defaultCollection.access,
    read: catalogRead,
    create: isAdmin,
    update: isAdminOrEditor,
    delete: isAdmin
  },
  hooks: {
    ...defaultCollection.hooks,
    beforeOperation: [
      lockProductUpdate,
      ...(defaultCollection.hooks?.beforeOperation ?? [])
    ]
  },
  fields: [
    ...(defaultCollection.fields ?? []),
    {
      name: "name",
      type: "text",
      required: true,
      unique: true
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
      defaultValue: false,
      required: true,
      index: true
    },
    {
      name: "storefront",
      type: "text",
      defaultValue: "lostinseoul",
      required: true,
      index: true
    },
    {
      name: "drop",
      type: "relationship",
      relationTo: "product-drops",
      index: true
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "product-category",
      index: true
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
      relationTo: "media",
      index: true
    },
    {
      name: "gallery",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      maxRows: 12
    },
    {
      name: "compare_at_amount",
      type: "number",
      min: 0
    },
    {
      name: "max_order_quantity",
      type: "number",
      required: true,
      index: true,
      min: 1,
      defaultValue: 1
    },
    {
      name: "min_order_quantity",
      type: "number",
      required: true,
      index: true,
      min: 1,
      defaultValue: 1
    },
    {
      name: "standard_enabled",
      type: "checkbox",
      defaultValue: true,
      required: true,
      index: true
    },
    {
      name: "request_to_order_enabled",
      type: "checkbox",
      defaultValue: false,
      required: true,
      index: true
    },
    {
      name: "private_order_enabled",
      type: "checkbox",
      defaultValue: false,
      required: true,
      index: true
    },
    {
      name: "private_preset_price_enabled",
      type: "checkbox",
      defaultValue: false,
      required: true
    },
    {
      name: "private_unit_amount",
      type: "number",
      min: 0
    },
    {
      name: "private_tier_gate",
      type: "select",
      defaultValue: "anyone",
      options: ["anyone", "resident", "patron", "cofounder", "staff"],
      required: true,
      index: true
    },
    {
      name: "sort",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: { position: "sidebar" }
    }
  ]
});
