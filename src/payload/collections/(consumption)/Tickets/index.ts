import type { CollectionConfig, FieldAccess, Where } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { enforceTicketCap } from "./hooks/enforceTicketCap";
import { onTicketPaid } from "./hooks/onTicketPaid";

// Field-level admin lock. The collection-level `update` rule permits a user to
// PATCH their own ticket; `onTicketPaid` then runs with `overrideAccess: true`
// once `paid` flips. Without this guard, a user can self-activate a pending
// ticket and trigger the activation email + QR code without paying.
const adminOnlyField: FieldAccess = ({ req }) =>
  isAdmin({ req } as Parameters<typeof isAdmin>[0]);

const ticketAccess = {
  create: ({ req }: { req: { user?: { id?: string } | null } }) => {
    return Boolean(req.user);
  },
  read: ({ req }: { req: { user?: { id?: string } | null } }) => {
    if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
    if (!req.user?.id) return false;
    return {
      or: [
        { user: { equals: req.user.id } },
        { purchaser: { equals: req.user.id } }
      ]
    } as Where;
  },
  update: ({ req }: { req: { user?: { id?: string } | null } }) => {
    if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
    if (!req.user?.id) return false;
    return {
      user: { equals: req.user.id }
    } as Where;
  },
  delete: isAdmin
};

export const Tickets: CollectionConfig = {
  slug: "tickets",
  access: ticketAccess,
  admin: {
    useAsTitle: "ticket_number",
    defaultColumns: [
      "ticket_number",
      "event",
      "user",
      "status",
      "paid",
      "checked_in"
    ]
  },
  fields: [
    {
      name: "ticket_number",
      type: "number",
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description:
          "System: auto-incremented ticket number. Set on creation by the purchase API."
      }
    },
    {
      name: "event",
      type: "relationship",
      relationTo: "events",
      required: true,
      index: true,
      hasMany: false,
      maxDepth: 1
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      index: true,
      hasMany: false,
      maxDepth: 0,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Account this ticket is bound to. Null for unclaimed gift tickets."
      }
    },
    {
      name: "purchaser",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      hasMany: false,
      maxDepth: 0,
      access: { update: adminOnlyField },
      admin: {
        description: "User who paid for this ticket."
      }
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: ["pending", "active", "used", "canceled"],
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
          "Set true once admin confirms Toss receipt. Activating the ticket runs onTicketPaid hook."
      }
    },
    {
      name: "paid_at",
      type: "date",
      admin: {
        readOnly: true
      }
    },
    {
      name: "claim_token",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description:
          "Single-use nanoid for gift ticket claim URLs. Null after claim or for the purchaser's own ticket."
      }
    },
    {
      name: "claim_email",
      type: "text",
      admin: {
        description:
          "Optional: restrict claim to this email. If set, only the matching account can claim the ticket."
      }
    },
    {
      name: "claimed_at",
      type: "date",
      admin: {
        readOnly: true
      }
    },
    {
      name: "check_in_code",
      type: "text",
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "System: nanoid encoded into the QR code for check-in."
      }
    },
    {
      name: "checked_in",
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: {
        readOnly: true
      }
    },
    {
      name: "checked_in_at",
      type: "date",
      admin: {
        readOnly: true
      }
    },
    {
      name: "checked_in_by",
      type: "relationship",
      relationTo: "users",
      hasMany: false,
      maxDepth: 0,
      admin: {
        readOnly: true,
        description: "Admin/editor who performed the check-in."
      }
    },
    {
      name: "passkey_credential_id",
      type: "text",
      admin: {
        description:
          "Optional: passkey credential ID bound to this ticket for device verification."
      }
    },
    {
      name: "reminder_sent_at",
      type: "date",
      index: true,
      admin: {
        readOnly: true,
        description:
          "System: timestamp the pre-event reminder cron last sent for this ticket. Guards against double-sends when the cron is re-run inside the 23–25h window."
      }
    },
    {
      name: "delivery_address",
      type: "group",
      admin: {
        description: "Submitted by attendee on the exclusive content page."
      },
      fields: [
        { name: "recipient_name", type: "text" },
        { name: "address", type: "textarea" },
        { name: "phone", type: "text" },
        {
          name: "submitted_at",
          type: "date",
          admin: { readOnly: true }
        }
      ]
    },
    {
      name: "refundAction",
      type: "ui",
      admin: {
        components: {
          Field:
            "@/payload/collections/(consumption)/Tickets/components/RefundAction"
        }
      }
    }
  ],
  hooks: {
    beforeValidate: [enforceTicketCap],
    afterChange: [onTicketPaid]
  }
};

export default Tickets;
