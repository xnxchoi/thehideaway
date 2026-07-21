import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { INVENTORY_DISPOSITIONS } from "../InventoryLevels/dispositions";
import { protectInventoryOperationCreateOnly } from "../inventoryOperationAccess";

export const InventoryCycleCountLines: CollectionConfig = {
  slug: "inventory-cycle-count-lines",
  labels: {
    singular: "Inventory Cycle Count Line",
    plural: "Inventory Cycle Count Lines"
  },
  admin: {
    useAsTitle: "count_aggregate_key",
    defaultColumns: ["count", "sku", "disposition", "variance"]
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
      fields: ["count", "sku", "disposition"],
      unique: true
    }
  ],
  fields: [
    {
      name: "count_aggregate_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true }
    },
    {
      name: "count",
      type: "relationship",
      relationTo: "inventory-cycle-counts",
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
      name: "disposition",
      type: "select",
      options: [...INVENTORY_DISPOSITIONS],
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "counted_quantity",
      type: "number",
      required: true,
      min: 0,
      admin: { readOnly: true }
    },
    {
      name: "system_quantity",
      type: "number",
      required: true,
      min: 0,
      admin: { readOnly: true }
    },
    {
      name: "movement_count_snapshot",
      type: "number",
      required: true,
      min: 0,
      admin: { readOnly: true }
    },
    {
      name: "variance",
      type: "number",
      required: true,
      admin: { readOnly: true }
    }
  ]
};
