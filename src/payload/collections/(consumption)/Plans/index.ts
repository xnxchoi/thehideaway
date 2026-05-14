import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";

const Plans: CollectionConfig = {
  slug: "plans",
  admin: {
    useAsTitle: "name",
    defaultColumns: [
      "name",
      "tier",
      "validity",
      "seat_limit",
      "state"
    ]
  },
  // Public catalog: anyone can read the pricing table. Writes are admin-only
  // — without these guards Payload's default ("logged-in user can mutate")
  // applied, and any member could rewrite tier/seat_limit/price.
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "Internal admin label (e.g. 'Member · Yearly · KRW'). Not shown to users."
      }
    },
    {
      name: "tier",
      type: "select",
      required: true,
      hasMany:false,
      defaultValue: "member",
      options: [{
        label: "Member",
        value: "member"
      }, {
        label: "Patron",
        value: "patron"
      }],
      admin: {
        description: "The subscriber role this plan grants while active."
      }
    },
    {
      name: "tier_label",
      type: "text",
      required: true,
      defaultValue: "",
      admin: {
        description: "User-facing display label (e.g. 'Member', 'Patron')."
      }
    },
    {
      name: "validity",
      type: "select",
      required: true,
      defaultValue: "yearly",
      options: ["yearly", "lifetime"],
      admin: {
        description:
          "Yearly: expires 1 year after start unless waiver criteria met. Lifetime: never expires."
      }
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "one_time",
      options: ["one_time"],
      admin: {
        description:
          "All Hideaway plans are one-time payments at launch (manual bank transfer)."
      }
    },
    {
      name: "payment_methods",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["bank_transfer"],
      options: ["bank_transfer", "cash"],
      admin: {
        description:
          "Online card / KakaoPay / Toss disabled at launch. Manual flow only."
      }
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Short marketing line under the price."
      }
    },
    {
      name: "features",
      type: "array",
      labels: { singular: "Feature", plural: "Features" },
      fields: [
        { name: "label", type: "text", required: true },
        {
          name: "included",
          type: "checkbox",
          defaultValue: true
        }
      ]
    },
    {
      name: "seat_limit",
      type: "number",
      min: 0,

      admin: {
        description:
          "Max active subscriptions for this plan (0 / blank = unlimited). When reached, the plan card shows 'Closed' and the CTA is disabled."
      }
    },
    {
      name: "discount_label",
      type: "text",
      admin: {
        description:
          "Pill text shown on the card when a deal applies (e.g. 'LIMITED 5')."
      }
    },
    {
      name: "sort",
      type: "number",
      defaultValue: 0,
      index: true,
      admin: { position: "sidebar" }
    },
    {
      name: "state",
      type: "select",
      required: true,
      defaultValue: "active",
      options: ["active", "ended"]
    }
  ]
};

export default Plans;
