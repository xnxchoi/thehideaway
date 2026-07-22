import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { lockProductVariantUpdate } from "./hooks/lockProductVariantUpdate";
import { normalizeProductVariant } from "./hooks/normalizeProductVariant";
import { rejectCampaignReferencedProductReassignment } from "./hooks/rejectCampaignReferencedProductReassignment";

function isCatalogStaff({ req }: { req: { user?: { role?: string } | null } }) {
  return ["admin", "editor"].includes(req.user?.role ?? "");
}

export const ProductVariants: CollectionConfig = {
  slug: "product-variants",
  labels: { singular: "Product SKU", plural: "Product SKUs" },
  defaultPopulate: {
    id: true,
    product: true,
    active: true,
    identity_locked: true,
    sku: true,
    label: true,
    options: true,
    price_override_amount: true,
    weight_grams: true,
    length_mm: true,
    width_mm: true,
    height_mm: true,
    tax_category: true,
    inventory: true,
    stock_state: true,
    sort: true
  },
  admin: {
    useAsTitle: "sku",
    disableBulkEdit: true,
    defaultColumns: ["sku", "product", "active", "inventory", "stock_state"],
    description: "Stable product SKUs used by checkout.",
    hidden: ({ user }) => !["admin", "editor"].includes(user?.role ?? "")
  },
  access: {
    read: isCatalogStaff,
    create: isAdmin,
    update: isCatalogStaff,
    delete: () => false
  },
  hooks: {
    beforeOperation: [lockProductVariantUpdate],
    beforeValidate: [normalizeProductVariant],
    beforeChange: [rejectCampaignReferencedProductReassignment]
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
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
      name: "identity_locked",
      type: "checkbox",
      required: true,
      defaultValue: false,
      admin: { hidden: true, readOnly: true }
    },
    { name: "sku", type: "text", unique: true, index: true },
    { name: "label", type: "text" },
    {
      name: "options",
      type: "array",
      // WHY-OVERRIDE-PAYLOAD: Payload 3.86 writes 24-character array-row IDs
      // at runtime even when the PostgreSQL adapter uses UUID document IDs.
      // The generated migration is corrected to match the generated schema.
      fields: [
        { name: "key", type: "text", required: true },
        { name: "value", type: "text", required: true }
      ]
    },
    {
      name: "option_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true }
    },
    { name: "price_override_amount", type: "number", min: 1 },
    { name: "barcode", type: "text", unique: true, index: true },
    { name: "weight_grams", type: "number", min: 1 },
    { name: "length_mm", type: "number", min: 1 },
    { name: "width_mm", type: "number", min: 1 },
    { name: "height_mm", type: "number", min: 1 },
    { name: "tax_category", type: "text" },
    {
      name: "legacy_variant_ref",
      type: "text",
      index: true,
      admin: { description: "Temporary legacy cart identifier." }
    },
    {
      name: "legacy_key",
      type: "text",
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true }
    },
    {
      name: "inventory",
      type: "number",
      min: 0,
      index: true,
      access: { update: () => false },
      admin: {
        hidden: true,
        readOnly: true,
        description:
          "Historical scalar. Inventory availability comes from the ledger."
      }
    },
    {
      name: "stock_state",
      type: "select",
      options: ["in_stock", "out_of_stock", "pre_order", "on_request"],
      index: true,
      access: { update: () => false },
      admin: { hidden: true, readOnly: true }
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
