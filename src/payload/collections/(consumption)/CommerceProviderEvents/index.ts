import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { replayProviderEventHandler } from "./replay";

export const CommerceProviderEvents: CollectionConfig = {
  slug: "commerce-provider-events",
  labels: {
    singular: "Commerce Provider Event",
    plural: "Commerce Provider Events"
  },
  admin: {
    useAsTitle: "dedupe_key",
    defaultColumns: ["provider", "event_type", "payment_ref", "received_at"]
  },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false
  },
  endpoints: [
    {
      path: "/:id/replay",
      method: "post",
      handler: replayProviderEventHandler
    }
  ],
  fields: [
    {
      name: "dedupe_key",
      type: "text",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "provider",
      type: "select",
      required: true,
      options: ["portone"],
      index: true
    },
    { name: "event_key", type: "text", required: true, index: true },
    { name: "event_type", type: "text", index: true },
    { name: "payment_ref", type: "text", index: true },
    { name: "payload_hash", type: "text", index: true },
    { name: "provider_status", type: "text", index: true },
    { name: "transaction_ref", type: "text", index: true },
    {
      name: "product_payment",
      type: "relationship",
      relationTo: "product-payments",
      index: true
    },
    {
      name: "occurred_at",
      type: "date",
      index: true
    },
    {
      name: "received_at",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true
    },
    {
      name: "processing_status",
      type: "select",
      required: true,
      defaultValue: "received",
      options: ["received", "processing", "retryable", "processed", "rejected"],
      index: true
    },
    { name: "attempt_count", type: "number", required: true, defaultValue: 0 },
    { name: "lease_token_hash", type: "text" },
    { name: "lease_expires_at", type: "date", index: true },
    { name: "last_attempt_at", type: "date", index: true },
    { name: "processed_at", type: "date", index: true },
    { name: "outcome_code", type: "text", index: true },
    { name: "last_error_code", type: "text", index: true }
  ]
};
