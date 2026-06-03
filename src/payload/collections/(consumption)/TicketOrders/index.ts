import type { CollectionConfig, FieldAccess, Where } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { issueOrderPaidPassword } from "./hooks/issueOrderPaidPassword";
import { onOrderPaid } from "./hooks/onOrderPaid";

/**
 * TicketOrders
 *
 * Parent grouping for one or more Tickets purchased together. Mirrors
 * Payload's "parent owns N children" idiom — Tickets.order is the FK.
 *
 * Lifecycle:
 *   1. Purchaser fills out the 4-step flow; we create a TicketOrders row
 *      with their user id and a `paid: false` state.
 *   2. Sibling Tickets rows are created with `Tickets.order = this.id`.
 *   3. Admin marks the order `paid = true` (manual confirmation against
 *      Toss). The `issueOrderPaidPassword` afterChange hook then:
 *        - generates a random 8-char password
 *        - stamps `password_issued_at = now`, `password_expires_at = +48h`
 *        - fires a Brevo email to the purchaser with that password
 *      All sibling Tickets stay valid past the 48h window — the password
 *      only gates the `/day-n-night/claim/[token]` URL for unredeemed
 *      gift tickets.
 *   4. Purchaser can mark the transfer as sent from the success screen.
 *      That stamps `payment_submitted_at` only; hosts still manually verify
 *      Toss and flip `paid`.
 */

// Field-level admin guard for the lifecycle fields. The collection-level
// `update` rule allows the purchaser to update their own row (e.g. to
// edit recipient names on sibling tickets), but only admins can flip
// `paid` or rewrite password timestamps.
const adminOnlyField: FieldAccess = ({ req }) =>
  isAdmin({ req } as Parameters<typeof isAdmin>[0]);

const orderAccess = {
  create: isAdmin,
  read: ({ req }: { req: { user?: { id?: string } | null } }) => {
    if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
    if (!req.user?.id) return false;
    return {
      purchaser: { equals: req.user.id }
    } as Where;
  },
  update: isAdmin,
  delete: isAdmin
};

export const TicketOrders: CollectionConfig = {
  slug: "ticket-orders",
  access: orderAccess,
  admin: {
    useAsTitle: "id",
    defaultColumns: [
      "purchaser",
      "event",
      "payment_submitted_at",
      "paid",
      "paid_at",
      "createdAt"
    ]
  },
  fields: [
    {
      type: "relationship",
      name: "purchaser",
      label: "Purchaser",
      relationTo: "users",
      required: true,
      maxDepth: 1,
      admin: {
        description:
          "Account that initiated the order (and to which the password mail is sent)."
      }
    },
    {
      type: "relationship",
      name: "event",
      label: "Event",
      relationTo: "events",
      required: true,
      maxDepth: 0,
      admin: {
        description:
          "Event this order is for. Denormalized from the sibling tickets for admin filtering."
      }
    },
    {
      type: "text",
      name: "purchaser_name",
      label: "Purchaser display name",
      admin: {
        description:
          "Name supplied during the 4-step flow. Surfaced on /day-n-night/my."
      }
    },
    {
      type: "text",
      name: "sender_name",
      label: "Bank sender name",
      admin: {
        description:
          "Name the purchaser says will appear on the bank transfer. Used by hosts to match pending Toss transfers."
      }
    },
    {
      type: "number",
      name: "quantity",
      label: "Ticket quantity",
      required: true,
      defaultValue: 1,
      min: 1,
      admin: {
        readOnly: true,
        description:
          "Number of sibling Tickets created for this order. Snapshotted at purchase."
      }
    },
    {
      type: "number",
      name: "unit_amount",
      label: "Unit amount",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description:
          "Per-ticket amount in the order currency. Snapshotted at purchase."
      }
    },
    {
      type: "number",
      name: "total_amount",
      label: "Total amount",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description:
          "Total order amount in the order currency. Snapshotted at purchase."
      }
    },
    {
      type: "select",
      name: "currency",
      label: "Currency",
      required: true,
      defaultValue: "KRW",
      options: ["KRW"],
      admin: {
        readOnly: true,
        description: "Currency used for this ticket order."
      }
    },
    {
      type: "checkbox",
      name: "paid",
      label: "Paid",
      defaultValue: false,
      access: {
        update: adminOnlyField
      },
      admin: {
        description:
          "Admin-only. Flip this after confirming the bank transfer. Triggers password issuance + email."
      }
    },
    {
      type: "date",
      name: "payment_submitted_at",
      label: "Payment submitted at",
      access: {
        update: adminOnlyField
      },
      admin: {
        description:
          "Stamped when the purchaser says the bank transfer has been sent. This is not payment confirmation; admins still verify Toss and flip Paid."
      }
    },
    {
      type: "date",
      name: "paid_at",
      label: "Paid at",
      access: {
        update: adminOnlyField
      },
      admin: {
        description: "Set automatically when `paid` is flipped to true."
      }
    },
    {
      type: "text",
      name: "password",
      label: "Order password",
      access: {
        read: adminOnlyField,
        update: adminOnlyField
      },
      admin: {
        description:
          "Generated by the paid hook. Stored in plaintext because it's a short-lived (48h) shared secret that the purchaser needs to read; treat like a coupon code, not an auth credential. Never echo to the purchaser through the admin UI."
      }
    },
    {
      type: "date",
      name: "password_issued_at",
      label: "Password issued at",
      access: { update: adminOnlyField }
    },
    {
      type: "date",
      name: "password_expires_at",
      label: "Password expires at",
      access: { update: adminOnlyField },
      admin: {
        description:
          "48 hours after `paid_at`. The /day-n-night/claim/[token] route refuses to validate after this timestamp."
      }
    },
    {
      type: "date",
      name: "mailed_at",
      label: "Password mail delivered at",
      access: { update: adminOnlyField },
      admin: {
        description:
          "Set automatically when the password mail has been delivered to the purchaser. Null means the mailer will (re)try on the next save. Cleared whenever `password` is regenerated so admin re-issue triggers a fresh mail."
      }
    },
    {
      type: "select",
      name: "locale",
      label: "Mail locale",
      defaultValue: "ko",
      options: [
        { label: "한국어 (Korean)", value: "ko" },
        { label: "English", value: "en" }
      ],
      admin: {
        description:
          "Locale used to render the password mail. Snapshotted from the purchaser's session locale at order creation. Admin-editable as fallback when the snapshot is wrong."
      }
    }
  ],
  hooks: {
    // Order matters: `onOrderPaid` fires the in-app notification first
    // (cheap, single insert on `notifications`), then
    // `issueOrderPaidPassword` does the password issuance + Brevo mail
    // (network round-trip, slower). The two are independent — neither
    // depends on the other's success — but firing the notification
    // first means the user's `/notifications` view updates with minimal
    // delay even on a slow SMTP path.
    afterChange: [onOrderPaid, issueOrderPaidPassword]
  }
};
