import type { CollectionConfig } from "payload";

export const Invoices: CollectionConfig = {
  slug: "invoices",
  admin: {
    useAsTitle: "invoice_number",
    defaultColumns: [
      "invoice_number",
      "client",
      "subscription",
      "amount",
      "currency",
      "status",
      "paid_at"
    ]
  },
  defaultPopulate: {
    client: true,
    subscription: true,
    plan: true,
    payment_method: true,
    paid_at: true,
    status: true,
    invoice_number: true,
    currency: true,
    cycle_start: true,
    cycle_end: true,
    amount: true,
    bank_reference: true,
    createdAt: true,
    updatedAt: true
  },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      return { client: { equals: req.user?.id } };
    },
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin"
  },
  fields: [
    {
      name: "invoice_number",
      type: "number",
      unique: true,
      index: true,
      required: true,
      admin: {
        readOnly: true,
        description: "Auto-incremented at issue time."
      }
    },
    {
      name: "client",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
      maxDepth: 0,
      index: true
    },
    {
      name: "subscription",
      type: "relationship",
      relationTo: "subscriptions",
      required: true,
      hasMany: false,
      maxDepth: 0,
      index: true,
      admin: {
        description: "The subscription this invoice receipts."
      }
    },
    {
      name: "plan",
      type: "relationship",
      relationTo: "plans",
      required: true,
      hasMany: false,
      maxDepth: 0
    },
    {
      name: "amount",
      type: "number",
      required: true,
      admin: {
        description:
          "Total invoice amount in the chosen currency's primary unit (won, dollars, euros)."
      }
    },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "krw",
      options: [
        { label: "KRW", value: "krw" },
        { label: "USD", value: "usd" },
        { label: "EUR", value: "eur" }
      ]
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "paid",
      options: [
        { label: "Paid", value: "paid" },
        { label: "Pending", value: "pending" },
        { label: "Void", value: "void" }
      ],
      index: true
    },
    {
      name: "paid_at",
      type: "date",
      admin: {
        description:
          "Set when admin marks the related Subscription as paid. Mirrors the bank-receipt date."
      }
    },
    {
      name: "cycle_start",
      type: "date",
      admin: {
        description: "Snapshot of subscription.start_date at issue time."
      }
    },
    {
      name: "cycle_end",
      type: "date",
      admin: {
        description:
          "Snapshot of subscription.expires_at at issue time (null = lifetime plan)."
      }
    },
    {
      name: "bank_reference",
      type: "text",
      admin: {
        description:
          "Admin's free-text note: bank transaction id, last-4 digits, or 'cash receipt' tag."
      }
    },
    {
      name: "payment_method",
      type: "array",
      admin: {
        description:
          "Single entry for cash-flow at launch; array shape preserved for future split-payment / multi-currency cases."
      },
      fields: [
        {
          name: "method",
          type: "select",
          required: true,
          options: [
            { label: "Bank transfer", value: "bank_transfer" },
            { label: "Cash", value: "cash" }
          ]
        },
        { name: "amount", type: "number", required: true },
        {
          name: "currency",
          type: "select",
          required: true,
          defaultValue: "krw",
          options: [
            { label: "KRW", value: "krw" },
            { label: "USD", value: "usd" },
            { label: "EUR", value: "eur" }
          ]
        },
        {
          name: "payment_date",
          type: "date",
          required: true
        },
        {
          name: "reference",
          type: "text"
        }
      ]
    }
  ]
};
