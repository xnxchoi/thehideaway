import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";

export const CommerceCommands: CollectionConfig = {
  slug: "commerce-commands",
  labels: {
    singular: "Commerce Command",
    plural: "Commerce Commands"
  },
  admin: {
    useAsTitle: "business_key",
    defaultColumns: [
      "business_key",
      "status",
      "resource_type",
      "resource_id",
      "completed_at"
    ],
    description: "Durable idempotency records for LOSTINSEOUL commerce."
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  fields: [
    {
      name: "command_key",
      type: "text",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "business_key",
      type: "text",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "request_hash",
      type: "text",
      required: true,
      admin: { readOnly: true }
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "in_progress",
      options: ["in_progress", "succeeded"],
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "attempt_count",
      type: "number",
      required: true,
      min: 1,
      defaultValue: 1,
      admin: { readOnly: true }
    },
    {
      name: "lease_token_hash",
      type: "text",
      required: false,
      admin: { readOnly: true }
    },
    {
      name: "lease_expires_at",
      type: "date",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "safe_response",
      type: "json",
      admin: { readOnly: true }
    },
    {
      name: "resource_type",
      type: "text",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "resource_id",
      type: "text",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "completed_at",
      type: "date",
      index: true,
      admin: { readOnly: true }
    }
  ]
};
