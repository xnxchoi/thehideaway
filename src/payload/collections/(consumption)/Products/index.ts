import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Product",
    plural: "Products"
  },
  defaultPopulate: {
    id: true,
    name: true,
    slug: true,
    active: true,
    currency: true,
    unit_amount: true,
    standard_enabled: true,
    request_to_order_enabled: true,
    private_order_enabled: true
  },
  admin: {
    useAsTitle: "name",
    description: "LOSTINSEOUL storefront products.",
    defaultColumns: [
      "name",
      "slug",
      "active",
      "stock_state",
      "standard_enabled",
      "request_to_order_enabled",
      "private_order_enabled"
    ],
    hidden: ({ user }) =>
      !["admin", "editor"].some((role) => user?.role === role)
  },
  access: {
    read: ({ req: { user } }) => {
      if (["admin", "editor"].some((role) => user?.role === role)) return true;
      return { active: { equals: true } };
    },
    create: isAdmin,
    update: ({ req: { user } }) =>
      ["admin", "editor"].some((role) => user?.role === role),
    delete: isAdmin
  },
  fields: [
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
      index: true,
      admin: {
        description: "URL-safe product slug used at /products/{slug}."
      }
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
      hasMany: false,
      index: true
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "product-category",
      hasMany: false,
      index: true
    },
    {
      name: "summary",
      type: "textarea",
      admin: {
        description: "Short catalog/card copy."
      }
    },
    {
      name: "description",
      type: "richText",
      editor: lexicalEditor({})
    },
    {
      name: "details",
      type: "textarea",
      admin: {
        description: "Product detail accordion copy."
      }
    },
    {
      name: "care",
      type: "textarea",
      admin: {
        description: "Care instructions."
      }
    },
    {
      name: "shipping_returns",
      type: "textarea",
      admin: {
        description: "Shipping and returns copy."
      }
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
      maxRows: 12,
      admin: {
        description: "Product gallery images shown on detail pages."
      }
    },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW", "USD", "JPY", "EUR"],
      index: true
    },
    {
      name: "unit_amount",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
      index: true
    },
    {
      name: "compare_at_amount",
      type: "number",
      min: 0
    },
    {
      name: "stock_state",
      type: "select",
      options: ["in_stock", "out_of_stock", "pre_order", "on_request"],
      required: true,
      index: true,
      defaultValue: "on_request"
    },
    {
      name: "inventory",
      type: "number",
      index: true,
      min: 0,
      defaultValue: 0
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
      name: "variants",
      type: "json",
      admin: {
        description:
          "Array of { id, sku, label, size, color, amount?, inventory?, stock_state? }."
      }
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
      min: 0,
      admin: {
        description:
          "Optional private-order price. Blank means the buyer requests a quote first."
      }
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
};
