import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectInventoryReservationOperatorEvent } from "./protectInventoryReservationOperatorEvent";

const readOnly = { readOnly: true } as const;

export const InventoryReservationOperatorEvents: CollectionConfig = {
  slug: "inventory-reservation-operator-events",
  labels: {
    singular: "Inventory Reservation Operator Event",
    plural: "Inventory Reservation Operator Events"
  },
  lockDocuments: false,
  admin: {
    useAsTitle: "event_key",
    defaultColumns: [
      "action",
      "outcome_code",
      "actor",
      "affected_count",
      "effective_at"
    ]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    // WHY-OVERRIDE-PAYLOAD: hooks protect Local API operations; the generated
    // migration adds SQL triggers because direct SQL bypasses collection hooks.
    beforeOperation: [protectInventoryReservationOperatorEvent]
  },
  // WHY-OVERRIDE-PAYLOAD: field validators cannot enforce the audit shapes or
  // safe-integer bounds for direct SQL writes, so the migration adds a check.
  fields: [
    {
      name: "event_key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: readOnly
    },
    {
      name: "command_key",
      type: "text",
      required: true,
      index: true,
      admin: readOnly
    },
    {
      name: "source",
      type: "select",
      required: true,
      options: ["manual_operator"],
      admin: readOnly
    },
    {
      name: "correlation_key",
      type: "text",
      required: true,
      index: true,
      admin: readOnly
    },
    {
      name: "causation_key",
      type: "text",
      required: true,
      index: true,
      admin: readOnly
    },
    {
      name: "action",
      type: "select",
      required: true,
      options: ["release", "expire", "reconcile", "run_expiry"],
      admin: readOnly
    },
    {
      name: "outcome_code",
      type: "text",
      required: true,
      index: true,
      admin: readOnly
    },
    {
      name: "actor",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      admin: readOnly
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "product-orders",
      index: true,
      admin: readOnly
    },
    {
      name: "payment",
      type: "relationship",
      relationTo: "product-payments",
      index: true,
      admin: readOnly
    },
    {
      name: "reservation",
      type: "relationship",
      relationTo: "inventory-reservations",
      index: true,
      admin: readOnly
    },
    {
      name: "reason_code",
      type: "text",
      required: true,
      index: true,
      maxLength: 100,
      admin: readOnly
    },
    {
      name: "evidence_reference",
      type: "text",
      required: true,
      maxLength: 200,
      admin: readOnly
    },
    {
      name: "expected_state_hash",
      type: "text",
      required: true,
      admin: readOnly
    },
    {
      name: "observed_state_hash",
      type: "text",
      required: true,
      admin: readOnly
    },
    {
      name: "affected_count",
      type: "number",
      required: true,
      min: 0,
      admin: readOnly
    },
    {
      name: "effective_at",
      type: "date",
      required: true,
      index: true,
      admin: readOnly
    }
  ]
};
