import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import type { CollectionConfig } from "payload";

const ownsPayment = ({ req }: { req: { user?: { id?: string } | null } }) => {
  if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
  return { user: { equals: req.user?.id } };
};

export const ProductPayments: CollectionConfig = {
  slug: "product-payments",
  labels: {
    singular: "Product Payment",
    plural: "Product Payments"
  },
  admin: {
    useAsTitle: "payment_ref",
    defaultColumns: ["payment_ref", "order", "provider", "status", "amount"],
    description: "PortOne and manual payment records for LOSTINSEOUL."
  },
  access: {
    read: ownsPayment,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  fields: [
    {
      name: "payment_ref",
      type: "text",
      required: true,
      unique: true,
      index: true
    },
    {
      name: "order",
      type: "relationship",
      relationTo: "product-orders",
      required: true,
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
      name: "provider",
      type: "select",
      required: true,
      defaultValue: "portone",
      options: ["portone", "manual"],
      index: true
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "initiated",
      options: [
        "initiated",
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
        "manual_pending"
      ],
      index: true
    },
    {
      name: "amount",
      type: "number",
      required: true,
      min: 0
    },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW", "USD", "JPY", "EUR"]
    },
    {
      name: "portone_order_ref",
      type: "text",
      index: true
    },
    {
      name: "portone_transaction_ref",
      type: "text",
      index: true
    },
    {
      name: "payment_channel",
      type: "text"
    },
    {
      name: "payment_method",
      type: "text"
    },
    {
      name: "request_payload",
      type: "json"
    },
    {
      name: "events",
      type: "json",
      defaultValue: []
    },
    {
      name: "paid_at",
      type: "date",
      index: true
    }
  ]
};
