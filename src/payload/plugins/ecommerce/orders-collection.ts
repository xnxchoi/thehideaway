import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

import {
  CART_LINE_SCHEMA_VERSION,
  appendLostLineFields
} from "./lost-line-fields";
import { checkoutOrderFields } from "./checkout-fields";
import {
  pluginOrderLifecycleOptions,
  protectPluginOrderLifecycle,
  recordPluginOrderCreated
} from "./order-lifecycle";
import { releasePluginOrderReservations } from "./order-reservations";

export const ordersCollectionOverride: CollectionOverride = ({
  defaultCollection
}) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    useAsTitle: "order_ref",
    defaultColumns: [
      "order_ref",
      "order_mode",
      "lifecycle_status",
      "payment_status",
      "status"
    ]
  },
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [
      protectPluginOrderLifecycle,
      ...(defaultCollection.hooks?.beforeChange ?? [])
    ],
    afterChange: [
      recordPluginOrderCreated,
      ...(defaultCollection.hooks?.afterChange ?? []),
      async ({ doc, operation, previousDoc, req }) => {
        if (operation !== "update") return doc;
        const next = doc as { id?: string; lifecycle_status?: string };
        const previous = previousDoc as
          { lifecycle_status?: string } | undefined;
        if (
          next.lifecycle_status !== "canceled" ||
          previous?.lifecycle_status === "canceled" ||
          !next.id
        ) {
          return doc;
        }
        const release = async (lockedReq: typeof req) => {
          await releasePluginOrderReservations({
            payload: lockedReq.payload,
            req: lockedReq,
            orderId: next.id as string,
            idempotencyKey: `${next.id}-cancel`.padEnd(16, "x"),
            effectiveAt: new Date().toISOString()
          });
        };
        if (req.transactionID) {
          await release(req);
          return doc;
        }
        const begin = req.payload.db?.beginTransaction?.bind(req.payload.db);
        if (!begin) return doc;
        const transactionID = await begin();
        if (!transactionID) return doc;
        try {
          await release({ ...req, transactionID });
          await req.payload.db.commitTransaction(transactionID);
        } catch (error) {
          await req.payload.db
            .rollbackTransaction(transactionID)
            .catch(() => undefined);
          throw error;
        }
        return doc;
      }
    ]
  },
  fields: [
    ...appendLostLineFields(defaultCollection.fields).map((field) =>
      "name" in field && field.name === "status" && field.type === "select"
        ? { ...field, options: [...field.options, "pending"] }
        : field
    ),
    ...checkoutOrderFields,
    {
      name: "order_ref",
      type: "text",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "order_mode",
      type: "select",
      required: true,
      defaultValue: "standard_purchase",
      options: ["standard_purchase", "request_to_order", "private_order"],
      index: true
    },
    {
      name: "lifecycle_status",
      type: "select",
      required: true,
      defaultValue: "pending_payment",
      options: pluginOrderLifecycleOptions,
      index: true
    },
    {
      name: "payment_status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        "unpaid",
        "pending",
        "paid",
        "pending_manual",
        "failed",
        "refunded",
        "partially_refunded"
      ],
      index: true
    },
    {
      name: "fulfillment_status",
      type: "select",
      required: true,
      defaultValue: "unfulfilled",
      options: [
        "unfulfilled",
        "reserved",
        "in_production",
        "fulfilled",
        "canceled"
      ],
      index: true
    },
    { name: "campaign", type: "text", index: true },
    { name: "quote", type: "json" },
    { name: "contact", type: "json" },
    {
      name: "line_snapshot_version",
      type: "number",
      required: true,
      defaultValue: CART_LINE_SCHEMA_VERSION,
      min: 1,
      admin: { readOnly: true }
    },
    { name: "paid_at", type: "date", index: true }
  ]
});
