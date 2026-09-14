import type { CollectionConfig } from "payload";

const IMMUTABLE_FIELDS = [
  "command_key",
  "business_key",
  "request_hash",
  "actor_id",
  "operation",
  "target_type",
  "target_id",
  "reason_code",
  "audit_source"
] as const;

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
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        if (operation === "update") {
          if (originalDoc.status === "succeeded")
            throw new Error("commerce-command-terminal-immutable");
          for (const field of IMMUTABLE_FIELDS) {
            if (
              Object.hasOwn(data, field) &&
              (data[field] ?? null) !== (originalDoc[field] ?? null)
            ) {
              throw new Error("commerce-command-binding-immutable");
            }
          }
        }
        return data;
      }
    ]
  },
  fields: [
    ...[
      "actor_id",
      "operation",
      "target_type",
      "target_id",
      "reason_code",
      "audit_source"
    ].map((name) => ({
      name,
      type: "text" as const,
      index: true,
      admin: { readOnly: true }
    })),
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
