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
    price: true,
    payment_method: true,
    paid_at: true,
    status: true,
    invoice_number: true,
    currency: true,
    cycle_start: true,
    cycle_end: true,
    amount: true,
    fx_rate_used: true,
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
      name: "price",
      type: "relationship",
      relationTo: "prices",
      hasMany: false,
      maxDepth: 0,
      admin: {
        description:
          "The Price doc the customer transacted. Nullable for legacy / hand-issued invoices that predate the Product/Price split."
      }
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
      type: "relationship",
      relationTo: "currency",
      hasMany: false,
      required: true,
      index: true,
      admin: {
        description:
          "The currency this invoice is denominated in. Points at the canonical `currency` collection (was an enum pre-Sprint 2)."
      }
    },
    {
      name: "fx_rate_used",
      type: "number",
      min: 0,
      admin: {
        description:
          "Forward-looking: rate applied when the invoice currency differs from the Plan's base currency. Null at launch (KRW-only)."
      }
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Open", value: "open" },
        { label: "Paid", value: "paid" },
        { label: "Void", value: "void" },
        // 'pending' is a legacy value from the pre-Sprint-2 3-state FSM.
        // Kept here to mirror the DB enum (which still carries the value
        // because Postgres won't let us DROP a single enum value without
        // a full type-recreate). No new code path writes 'pending';
        // semantically equivalent to 'open' going forward.
        { label: "Pending (legacy)", value: "pending" }
      ],
      index: true,
      admin: {
        description:
          "Stripe-style FSM: draft → open → paid | void. The issuance hook writes 'paid' directly on bank-confirmed flow; hand-authored invoices may start as 'draft'."
      }
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
          type: "relationship",
          relationTo: "currency",
          hasMany: false,
          required: true
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
