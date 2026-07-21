import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectInventoryLotWrite } from "../inventoryOperationAccess";

export const InventoryLots: CollectionConfig = {
  slug: "inventory-lots",
  labels: {
    singular: "Inventory Lot",
    plural: "Inventory Lots"
  },
  lockDocuments: false,
  admin: {
    useAsTitle: "operation_key",
    defaultColumns: [
      "receipt_line",
      "external_lot_code",
      "received_quantity",
      "received_at"
    ]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeOperation: [protectInventoryLotWrite]
  },
  fields: [
    {
      name: "operation_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { hidden: true, readOnly: true }
    },
    {
      name: "receipt_line",
      type: "relationship",
      relationTo: "inventory-receipt-lines",
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "external_lot_code",
      type: "text",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "received_quantity",
      type: "number",
      required: true,
      min: 1,
      admin: { readOnly: true }
    },
    {
      name: "received_at",
      type: "date",
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "actor",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      admin: { readOnly: true }
    }
  ]
};
