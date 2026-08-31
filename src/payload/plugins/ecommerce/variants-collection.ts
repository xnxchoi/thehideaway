import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

import { lockProductVariantUpdate } from "@/payload/collections/(consumption)/ProductVariants/hooks/lockProductVariantUpdate";
import { rejectCampaignReferencedProductReassignment } from "@/payload/collections/(consumption)/ProductVariants/hooks/rejectCampaignReferencedProductReassignment";
import {
  isAdmin,
  isAdminOrEditor
} from "@/payload/plugins/locker/access/accessCheckers";

import { normalizePluginVariant } from "./normalize-variant";

const catalogStaffRead = ({
  req: { user }
}: {
  req: { user?: { role?: string } | null };
}) => {
  if (["admin", "editor"].includes(user?.role ?? "")) return true;
  return {
    and: [{ _status: { equals: "published" } }, { active: { equals: true } }]
  };
};

export const variantsCollectionOverride: CollectionOverride = ({
  defaultCollection
}) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    useAsTitle: "sku",
    disableBulkEdit: true,
    defaultColumns: ["sku", "product", "active", "label", "sort"],
    description: "Stable product SKUs used by checkout.",
    hidden: ({ user }) => !["admin", "editor"].includes(user?.role ?? "")
  },
  access: {
    ...defaultCollection.access,
    read: catalogStaffRead,
    create: isAdmin,
    update: isAdminOrEditor,
    delete: () => false
  },
  hooks: {
    ...defaultCollection.hooks,
    beforeOperation: [
      lockProductVariantUpdate,
      ...(defaultCollection.hooks?.beforeOperation ?? [])
    ],
    beforeValidate: [
      normalizePluginVariant,
      ...(defaultCollection.hooks?.beforeValidate ?? [])
    ],
    beforeChange: [
      ...(defaultCollection.hooks?.beforeChange ?? []),
      rejectCampaignReferencedProductReassignment
    ]
  },
  fields: [
    ...(defaultCollection.fields ?? []),
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
      name: "option_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true }
    },
    { name: "barcode", type: "text", unique: true, index: true },
    { name: "weight_grams", type: "number", min: 1 },
    { name: "length_mm", type: "number", min: 1 },
    { name: "width_mm", type: "number", min: 1 },
    { name: "height_mm", type: "number", min: 1 },
    { name: "tax_category", type: "text" },
    {
      name: "sort",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: { position: "sidebar" }
    }
  ]
});
