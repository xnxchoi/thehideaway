import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { syncRoleAfterSubscriptionChange } from "./hooks/syncRole";
import { issueInvoiceOnPaid } from "./hooks/issueInvoiceOnPaid";

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
      name: "start_date",
      type: "date",
      required: true
    },
    {
      name: "expires_at",
      type: "date",
      index: true,
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
      index: true
    },
    {
      name: "paid",
      type: "checkbox",
      defaultValue: false,
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
    afterChange: [syncRoleAfterSubscriptionChange, issueInvoiceOnPaid]
  }
};
