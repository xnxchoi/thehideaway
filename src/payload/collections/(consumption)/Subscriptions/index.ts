import type { CollectionConfig, FieldAccess } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { syncRoleAfterSubscriptionChange } from "./hooks/syncRole";
import { issueInvoiceOnPaid } from "./hooks/issueInvoiceOnPaid";
import { autoActivateOnPaid } from "./hooks/autoActivateOnPaid";

const subscriptionAccess = {
  create: isAdmin,
  read: ({ req }: { req: { user?: { id?: string } | null } }) => {
    if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
    return {
      user: { equals: req.user?.id }
    };
  },
  update: ({ req }: { req: { user?: { role?: string } | null } }) => {
    const role = req.user?.role;
    return role === "admin" || role === "editor";
  },
  delete: isAdmin
};

// Field-level admin lock. Required because editors may update operational
// subscription metadata, while payment/lifecycle fields must remain admin-only.
const adminOnlyField: FieldAccess = ({ req }) =>
  isAdmin({ req } as Parameters<typeof isAdmin>[0]);

export const Subscriptions: CollectionConfig = {
  slug: "subscriptions",
  access: subscriptionAccess,
  admin: {
    useAsTitle: "id",
    defaultColumns: [
      "user",
      "plan",
      "subscription_status",
      "paid",
      "start_date",
      "expires_at"
    ]
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      maxDepth: 0,
      access: { update: adminOnlyField }
    },
    {
      name: "plan",
      type: "relationship",
      relationTo: "plans",
      required: true,
      index: true,
      hasMany: false,
      access: { update: adminOnlyField }
    },
    {
      name: "price",
      type: "relationship",
      relationTo: "prices",
      required: true,
      index: true,
      hasMany: false,
      access: { update: adminOnlyField },
      admin: {
        description:
          "The specific Price (currency × amount × cadence) the subscriber transacted. Captured at checkout; never rewritten."
      }
    },
    {
      name: "amount",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Snapshot of the selected Price amount at checkout. Invoice issuance must use this, not mutable catalog prices."
      }
    },
    {
      name: "currency",
      type: "relationship",
      relationTo: "currency",
      required: true,
      index: true,
      maxDepth: 0,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Snapshot of the selected Price currency at checkout. Invoice issuance must use this, not mutable catalog prices."
      }
    },
    {
      name: "start_date",
      type: "date",
      required: true,
      access: { update: adminOnlyField }
    },
    {
      name: "expires_at",
      type: "date",
      index: true,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Date the subscription expires (null = lifetime). Set on activation; extended quarterly when waiver criteria are met."
      }
    },
    {
      name: "subscription_status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: ["pending", "active", "expired", "canceled"],
      index: true,
      access: { update: adminOnlyField }
    },
    {
      name: "paid",
      type: "checkbox",
      defaultValue: false,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Set true once admin confirms bank-transfer / cash receipt. Activating triggers role sync."
      }
    },
    {
      name: "validity_waived",
      type: "checkbox",
      defaultValue: false,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Admin flag — at the next quarterly check, extend the subscription 90 days for free (Member tier merit waiver)."
      }
    },
    {
      name: "last_waiver_check",
      type: "date",
      access: { update: adminOnlyField },
      admin: {
        readOnly: true,
        description:
          "System: most recent quarterly waiver evaluation timestamp."
      }
    },
    {
      name: "request_method",
      type: "select",
      required: true,
      defaultValue: "bank_transfer",
      options: ["bank_transfer", "cash"],
      access: { update: adminOnlyField },
      admin: {
        description:
          "Method the user requested at checkout. Admin uses this to confirm the matching receipt."
      }
    },
    {
      name: "request_note",
      type: "textarea",
      access: { update: adminOnlyField },
      admin: {
        description: "Free-text note attached at checkout."
      }
    }
  ],
  hooks: {
    // beforeChange must run first: it promotes status pending→active on
    // the paid edge so the afterChange hooks see a clean transition and
    // fire their main paths (role sync + invoice issuance) in a single
    // admin click.
    beforeChange: [autoActivateOnPaid],
    afterChange: [syncRoleAfterSubscriptionChange, issueInvoiceOnPaid]
  }
};
