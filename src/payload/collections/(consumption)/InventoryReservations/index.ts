import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import {
  protectInventoryReservation,
  protectInventoryReservationIdentity
} from "./protectInventoryReservation";

const immutableFieldAccess = { update: () => false };

export const InventoryReservations: CollectionConfig = {
  slug: "inventory-reservations",
  labels: {
    singular: "Inventory Reservation",
    plural: "Inventory Reservations"
  },
  lockDocuments: false,
  admin: {
    useAsTitle: "reservation_key",
    defaultColumns: [
      "order",
      "sku",
      "location",
      "quantity",
      "status",
      "expires_at"
    ]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeOperation: [protectInventoryReservation],
    beforeValidate: [protectInventoryReservationIdentity]
  },
  indexes: [
    { fields: ["sku", "location", "status"] },
    { fields: ["status", "expires_at"] }
  ],
  fields: [
    {
      name: "reservation_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "request_hash",
      type: "text",
      required: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "product-orders",
      required: true,
      index: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
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
      name: "quantity",
      type: "number",
      required: true,
      min: 1,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: ["active", "consumed", "released", "expired"],
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "expires_at",
      type: "date",
      required: true,
      index: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "reserved_at",
      type: "date",
      required: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "terminal_at",
      type: "date",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "policy_version",
      type: "number",
      required: true,
      min: 1,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "ttl_minutes",
      type: "number",
      required: true,
      min: 1,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "safety_stock",
      type: "number",
      required: true,
      min: 0,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "consume_point",
      type: "select",
      required: true,
      options: ["payment_confirmed"],
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "expiry_boundary",
      type: "select",
      required: true,
      options: ["at_or_after"],
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "payment_time_source",
      type: "select",
      required: true,
      options: ["provider_paid_at"],
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "late_payment_policy",
      type: "select",
      required: true,
      options: ["manual_review"],
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    {
      name: "backorder_mode",
      type: "select",
      required: true,
      options: ["disabled"],
      access: immutableFieldAccess,
      admin: { readOnly: true }
    },
    // WHY-OVERRIDE-PAYLOAD: the generated migration adds the recovery-key
    // check Payload cannot express. The relationship remains schema-owned here.
    {
      name: "recovery_of",
      type: "relationship",
      relationTo: "inventory-reservations",
      index: true,
      unique: true,
      access: immutableFieldAccess,
      admin: { readOnly: true }
    }
  ]
};
