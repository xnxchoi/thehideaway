import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectOrderLifecycle } from "@/lib/lost-commerce/lifecycle-authorization";
import type { CollectionConfig } from "payload";

const ownsOrder = ({ req }: { req: { user?: { id?: string } | null } }) => {
  if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
  return { user: { equals: req.user?.id } };
};

export const ProductOrders: CollectionConfig = {
  slug: "product-orders",
  labels: {
    singular: "Product Order",
    plural: "Product Orders"
  },
  admin: {
    useAsTitle: "order_ref",
    defaultColumns: [
      "order_ref",
      "user",
      "order_mode",
      "status",
      "payment_status",
      "total_amount"
    ],
    description: "LOSTINSEOUL orders, commitments, and private quotes."
  },
  access: {
    read: ownsOrder,
    create: () => false,
    update: isAdmin,
    delete: isAdmin
  },
  hooks: {
    beforeChange: [protectOrderLifecycle]
  },
  fields: [
    {
      name: "order_ref",
      type: "text",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true
    },
    {
      name: "storefront",
      type: "text",
      required: true,
      defaultValue: "lostinseoul",
      index: true
    },
    {
      name: "order_mode",
      type: "select",
      required: true,
      options: ["standard_purchase", "request_to_order", "private_order"],
      index: true
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        "draft",
        "quote_requested",
        "quote_ready",
        "pending_payment",
        "paid",
        "committed",
        "confirmed",
        "converted",
        "failed",
        "canceled",
        "refunded"
      ],
      index: true
    },
    {
      name: "payment_status",
      type: "select",
      required: true,
      defaultValue: "unpaid",
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
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW", "USD", "JPY", "EUR"]
    },
    {
      name: "subtotal_amount",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0
    },
    {
      name: "total_amount",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
      index: true
    },
    {
      name: "campaign",
      type: "relationship",
      relationTo: "product-order-campaigns",
      index: true
    },
    {
      name: "line_snapshot_version",
      type: "number",
      required: true,
      defaultValue: 1,
      min: 1,
      admin: { readOnly: true }
    },
    {
      name: "lines",
      type: "json",
      required: true,
      defaultValue: []
    },
    {
      name: "shipping",
      type: "json"
    },
    {
      name: "contact",
      type: "json"
    },
    {
      name: "quote",
      type: "json",
      admin: {
        description:
          "Private-order quote state: amount, currency, expires_at, notes."
      }
    },
    {
      name: "paid_at",
      type: "date",
      index: true
    },
    {
      name: "expires_at",
      type: "date",
      index: true
    }
  ]
};
