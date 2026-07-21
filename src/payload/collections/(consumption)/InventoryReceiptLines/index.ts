import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectInventoryOperationCreateOnly } from "../inventoryOperationAccess";

export const InventoryReceiptLines: CollectionConfig = {
  slug: "inventory-receipt-lines",
  labels: {
    singular: "Inventory Receipt Line",
    plural: "Inventory Receipt Lines"
  },
  admin: {
    useAsTitle: "receipt_sku_key",
    defaultColumns: ["receipt", "sku", "expected_quantity", "updatedAt"]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeOperation: [protectInventoryOperationCreateOnly]
  },
  indexes: [
    {
      fields: ["receipt", "sku"],
      unique: true
    }
  ],
  fields: [
    {
      name: "receipt_sku_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true }
    },
    {
      name: "receipt",
      type: "relationship",
      relationTo: "inventory-receipts",
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "sku",
      type: "relationship",
      relationTo: "product-variants",
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "expected_quantity",
      type: "number",
      min: 1,
      admin: { readOnly: true }
    }
  ]
};
