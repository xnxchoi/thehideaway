import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { COMMERCE_ORDER_STATUSES } from "@/lib/commerce/order-transitions";
import { COMMERCE_PAYMENT_METHODS } from "@/lib/commerce/contracts";
import { protectCommerceOrder } from "@/lib/commerce/order-protection";
import type { CollectionConfig } from "payload";

const ownsOrder: NonNullable<CollectionConfig["access"]>["read"] = ({
  req: { user }
}) => {
  if (user?.role === "admin") return true;
  return user?.id ? { user: { equals: user.id } } : false;
};

export const CommerceOrders: CollectionConfig = {
  slug: "commerce-orders",
  labels: {
    singular: "Commerce Order",
    plural: "Commerce Orders"
  },
  admin: {
    useAsTitle: "ref",
    defaultColumns: [
      "ref",
      "user",
      "payment_method",
      "payment_status",
      "status",
      "total_amount"
    ],
    description: "Minimal product orders and their current payment status."
  },
  access: {
    read: ownsOrder,
    create: () => false,
    update: isAdmin,
    delete: () => false
  },
  hooks: {
    beforeChange: [protectCommerceOrder]
  },
  fields: [
    {
      name: "ref",
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
      name: "product",
      type: "relationship",
      relationTo: "commerce-products",
      required: true,
      index: true
    },
    {
      name: "product_name_snapshot",
      type: "text",
      required: true
    },
    {
      name: "product_slug_snapshot",
      type: "text",
      required: true
    },
    {
      name: "quantity",
      type: "number",
      required: true,
      min: 1,
      max: 99
    },
    {
      name: "unit_amount_snapshot",
      type: "number",
      required: true,
      min: 1
    },
    {
      name: "total_amount",
      type: "number",
      required: true,
      min: 1
    },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW"]
    },
    {
      name: "payment_method",
      type: "select",
      required: true,
      options: [...COMMERCE_PAYMENT_METHODS]
    },
    {
      name: "payment_status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: ["pending", "paid", "failed", "canceled"],
      index: true
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "awaiting_payment",
      options: [...COMMERCE_ORDER_STATUSES],
      index: true
    },
    {
      name: "contact",
      type: "json",
      required: true
    },
    {
      name: "shipping",
      type: "json",
      required: true
    },
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
      name: "provider_payment_id",
      type: "text",
      unique: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "provider_transaction_id",
      type: "text",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "bank_transfer_reference",
      type: "text",
      unique: true,
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "tracking_number",
      type: "text"
    },
    {
      name: "paid_at",
      type: "date",
      index: true,
      admin: { readOnly: true }
    },
    {
      name: "shipped_at",
      type: "date",
      index: true
    },
    {
      name: "completed_at",
      type: "date",
      index: true
    }
  ]
};
