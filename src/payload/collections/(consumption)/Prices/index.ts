import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";

/**
 * Prices — money side of the Product/Price split.
 *
 * Each Price hangs off a Plan and captures a single (currency, amount, cadence)
 * triple. One Plan can have N Prices — e.g. KRW one-time today, USD one-time
 * tomorrow, KRW recurring later — without cloning the Plan row.
 *
 * Sprint 2 rebuild: the prior shape was a single Price doc holding a
 * `currencies[]` array with no anchor currency and no cadence. That made the
 * "what does this plan cost?" question unanswerable and re-paid invoices
 * retroactively whenever an admin edited the array. The new shape mirrors
 * Stripe / Polar: the Plan is the offer, the Price is the money.
 */
export const Prices: CollectionConfig = {
  slug: "prices",
  admin: {
    useAsTitle: "nickname",
    defaultColumns: [
      "nickname",
      "plan",
      "currency",
      "unit_amount",
      "type",
      "active"
    ]
  }, // Public catalog reads stay open — the pricing page reads Prices through
  // Plans without a session. Writes are admin-only; without this guard
  // Payload's default lets any authenticated user mutate the price table,
  // which is catalog tampering as a money-flow attack.
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  fields: [
    {
      name: "nickname",
      type: "text",
      required: true,
      admin: {
        description: "Admin label for this price row."
      }
    },
    {
      name: "plan",
      type: "relationship",
      relationTo: "plans",
      hasMany: false,
      required: true,
      index: true,
      maxDepth: 0,
      admin: {
        description: "The Plan this Price is attached to."
      }
    },
    {
      name: "currency",
      type: "relationship",
      relationTo: "currency",
      hasMany: false,

      required: true,
      index: true
    },
    {
      name: "unit_amount",
      type: "number",
      required: true,
      min: 0
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "one_time",
      options: ["one_time", "recurring"]
    },
    {
      name: "recurring",
      type: "group",
      admin: {
        description:
          "Populated only when type='recurring'. Leave blank for one-time prices.",
        condition: (_, siblingData) => siblingData?.type === "recurring"
      },
      fields: [
        {
          name: "interval",
          type: "select",
          options: ["day", "week", "month", "year"],
          defaultValue: "month"
        },
        {
          name: "interval_count",
          type: "number",
          min: 1,
          defaultValue: 1
        },
        {
          name: "trial_period_days",
          type: "number",
          min: 0,
          defaultValue: 0
        }
      ]
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      required: true,
      index: true
    }
  ]
};
