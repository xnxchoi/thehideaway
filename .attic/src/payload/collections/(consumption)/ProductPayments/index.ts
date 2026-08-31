import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectPaymentLifecycle } from "@/lib/lost-commerce/lifecycle-authorization";
import type { CollectionConfig } from "payload";

const ownsPayment = ({ req }: { req: { user?: { id?: string } | null } }) => {
  if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
  const userId = req.user?.id;
  return userId ? { user: { equals: userId } } : false;
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
    create: () => false,
    update: isAdmin,
    delete: () => false
  },
  hooks: {
    beforeChange: [protectPaymentLifecycle]
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
      defaultValue: [],
      access: {
        create: () => false,
        update: () => false
      },
      admin: {
        readOnly: true
      }
    },
    {
      name: "paid_at",
      type: "date",
      index: true
    }
  ]
};
