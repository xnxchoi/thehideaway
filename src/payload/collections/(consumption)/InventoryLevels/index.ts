import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { INVENTORY_DISPOSITIONS } from "./dispositions";
import {
  protectInventoryProjection,
  protectInventoryProjectionIdentity
} from "./protectInventoryProjection";

const immutableFieldAccess = { update: () => false };

export const InventoryLevels: CollectionConfig = {
  slug: "inventory-levels",
  labels: {
    singular: "Inventory Level",
    plural: "Inventory Levels"
  },
  admin: {
    useAsTitle: "aggregate_key",
    defaultColumns: [
      "sku",
      "location",
      "disposition",
      "quantity",
      "movement_count"
    ]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeOperation: [protectInventoryProjection],
    beforeValidate: [protectInventoryProjectionIdentity]
  },
  indexes: [
    {
      fields: ["sku", "location", "disposition"],
      unique: true
    }
  ],
  fields: [
    {
      name: "aggregate_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      access: immutableFieldAccess,
      admin: { hidden: true, readOnly: true }
    },
    {
      name: "sku",
      type: "relationship",
      relationTo: "product-variants",
      required: true,
      index: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "location",
      type: "relationship",
      relationTo: "stock-locations",
      required: true,
      index: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "disposition",
      type: "select",
      required: true,
      options: [...INVENTORY_DISPOSITIONS],
      index: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "quantity",
      type: "number",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: { readOnly: true }
    },
    {
      name: "movement_count",
      type: "number",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: { readOnly: true }
    }
  ]
};
