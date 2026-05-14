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
  update: ({ req }: { req: { user?: { id?: string } | null } }) => {
    if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
    return {
      user: { equals: req.user?.id }
    };
  },
  delete: isAdmin
};

// Field-level admin lock. Required because the collection-level `update` rule
// permits a user to PATCH their own row, and the role-sync + invoice-issuance
// hooks act on `overrideAccess: true` once the field flips — without this
// guard, a member can self-promote and self-issue an invoice.
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
      maxDepth: 0
    },
    {
      name: "plan",
      type: "relationship",
      relationTo: "plans",
      required: true,
      index: true,
      hasMany: false
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
      access: {
        update: ({ req }) => {
          const role = req.user?.role;
          return role === "admin" || role === "editor";
        }
      },
      admin: {
        description:
          "Editor flag — at the next quarterly check, extend the subscription 90 days for free (Member tier merit waiver)."
      }
    },
    {
      name: "last_waiver_check",
      type: "date",
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
      admin: {
        description:
          "Method the user requested at checkout. Admin uses this to confirm the matching receipt."
      }
    },
    {
      name: "request_note",
      type: "textarea",
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
