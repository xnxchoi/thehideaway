import type { CollectionConfig, Field } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectInventoryOperationWrite } from "../inventoryOperationAccess";
import { protectInventoryReceiptUpdate } from "./protectInventoryReceiptUpdate";

const transitionFields = (
  transition: "opened" | "closed" | "cancelled"
): Field[] => [
  {
    name: `${transition}_at`,
    type: "date",
    index: true,
    admin: { readOnly: true }
  },
  {
    name: `${transition}_by`,
    type: "relationship",
    relationTo: "users",
    index: true,
    admin: { readOnly: true }
  }
];

export const InventoryReceipts: CollectionConfig = {
  slug: "inventory-receipts",
  labels: {
    singular: "Inventory Receipt",
    plural: "Inventory Receipts"
  },
  admin: {
    useAsTitle: "external_reference",
    defaultColumns: ["location", "status", "external_reference", "updatedAt"]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeOperation: [protectInventoryOperationWrite],
    beforeValidate: [protectInventoryReceiptUpdate]
  },
  fields: [
    {
      name: "location",
      type: "relationship",
      relationTo: "stock-locations",
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: ["draft", "open", "closed", "cancelled"],
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "supplier_name",
      type: "text",
      admin: { readOnly: true }
    },
    {
      name: "external_reference",
      type: "text",
      index: true,
      admin: { readOnly: true }
    },
    ...transitionFields("opened"),
    ...transitionFields("closed"),
    ...transitionFields("cancelled")
  ]
};
