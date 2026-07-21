import type { CollectionConfig } from "payload";

import { INVENTORY_MOVEMENT_SOURCE_TYPES } from "@/lib/lost-commerce/inventory-ledger-contracts";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { INVENTORY_DISPOSITIONS } from "../InventoryLevels/dispositions";
import { protectInventoryMovement } from "./protectInventoryMovement";

const dispositionField = (name: "from_disposition" | "to_disposition") => ({
  name,
  type: "select" as const,
  options: [...INVENTORY_DISPOSITIONS],
  index: true,
  admin: { readOnly: true }
});

const provenanceField = (
  name: "receipt" | "receipt_line" | "lot" | "cycle_count" | "cycle_count_line",
  relationTo:
    | "inventory-receipts"
    | "inventory-receipt-lines"
    | "inventory-lots"
    | "inventory-cycle-counts"
    | "inventory-cycle-count-lines"
) => ({
  name,
  type: "relationship" as const,
  relationTo,
  index: true,
  admin: { readOnly: true }
});

export const InventoryMovements: CollectionConfig = {
  slug: "inventory-movements",
  labels: {
    singular: "Inventory Movement",
    plural: "Inventory Movements"
  },
  lockDocuments: false,
  admin: {
    useAsTitle: "idempotency_key",
    defaultColumns: ["sku", "kind", "quantity", "reason_code", "effective_at"]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeOperation: [protectInventoryMovement]
  },
  fields: [
    {
      name: "idempotency_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "request_hash",
      type: "text",
      required: true,
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
      name: "kind",
      type: "select",
      required: true,
      options: ["inbound", "outbound", "transfer"],
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "quantity",
      type: "number",
      required: true,
      min: 1,
      admin: { readOnly: true }
    },
    {
      name: "from_location",
      type: "relationship",
      relationTo: "stock-locations",
      index: true,
      admin: { readOnly: true }
    },
    dispositionField("from_disposition"),
    {
      name: "to_location",
      type: "relationship",
      relationTo: "stock-locations",
      index: true,
      admin: { readOnly: true }
    },
    dispositionField("to_disposition"),
    {
      name: "reason_code",
      type: "text",
      required: true,
      admin: { readOnly: true }
    },
    {
      name: "source_type",
      type: "select",
      required: true,
      options: [...INVENTORY_MOVEMENT_SOURCE_TYPES],
      admin: { readOnly: true }
    },
    {
      name: "source_ref",
      type: "text",
      admin: { readOnly: true }
    },
    provenanceField("receipt", "inventory-receipts"),
    provenanceField("receipt_line", "inventory-receipt-lines"),
    provenanceField("lot", "inventory-lots"),
    provenanceField("cycle_count", "inventory-cycle-counts"),
    provenanceField("cycle_count_line", "inventory-cycle-count-lines"),
    {
      name: "actor",
      type: "text",
      admin: { readOnly: true }
    },
    {
      name: "effective_at",
      type: "date",
      admin: { readOnly: true }
    }
  ]
};
