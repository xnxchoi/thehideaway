import type { CollectionConfig, Field } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectInventoryOperationWrite } from "../inventoryOperationAccess";
import { protectInventoryCycleCountUpdate } from "./protectInventoryCycleCountUpdate";

const transitionFields = (
  transition: "submitted" | "applied" | "rejected" | "cancelled"
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

export const InventoryCycleCounts: CollectionConfig = {
  slug: "inventory-cycle-counts",
  labels: {
    singular: "Inventory Cycle Count",
    plural: "Inventory Cycle Counts"
  },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["location", "status", "submitted_at", "updatedAt"]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeOperation: [protectInventoryOperationWrite],
    beforeValidate: [protectInventoryCycleCountUpdate]
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
      options: ["draft", "submitted", "applied", "rejected", "cancelled"],
      index: true,
      admin: { readOnly: true }
    },
    ...transitionFields("submitted"),
    ...transitionFields("applied"),
    ...transitionFields("rejected"),
    ...transitionFields("cancelled")
  ]
};
