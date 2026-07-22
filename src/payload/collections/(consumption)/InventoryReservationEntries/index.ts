import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectInventoryReservationEntry } from "./protectInventoryReservationEntry";

export const InventoryReservationEntries: CollectionConfig = {
  slug: "inventory-reservation-entries",
  labels: {
    singular: "Inventory Reservation Entry",
    plural: "Inventory Reservation Entries"
  },
  lockDocuments: false,
  admin: {
    useAsTitle: "idempotency_key",
    defaultColumns: ["reservation", "operation", "quantity", "effective_at"]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: { beforeOperation: [protectInventoryReservationEntry] },
  indexes: [{ fields: ["reservation", "operation"] }],
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
      name: "reservation",
      type: "relationship",
      relationTo: "inventory-reservations",
      required: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "operation",
      type: "select",
      required: true,
      options: [
        "reserve",
        "consume",
        "release",
        "expire",
        "late_payment_detected"
      ],
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
      name: "payment",
      type: "relationship",
      relationTo: "product-payments",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "provider_event_ref",
      type: "text",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "provider_paid_at",
      type: "date",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "evidence_code",
      type: "select",
      options: [
        "provider_timestamp_missing",
        "provider_timestamp_before_reservation",
        "provider_payment_late",
        "physical_inventory_unavailable"
      ],
      index: true,
      admin: { readOnly: true }
    },
    { name: "actor", type: "text", admin: { readOnly: true } },
    {
      name: "effective_at",
      type: "date",
      required: true,
      index: true,
      admin: { readOnly: true }
    }
  ]
};
