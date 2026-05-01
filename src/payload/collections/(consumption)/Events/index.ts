import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";

export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "date", "state", "capacity", "ticket_price"]
  },
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
        description: "Event name (e.g. 'Hideaway Spring Salon · 2026')."
      }
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          "URL-safe identifier used in /tickets/{slug}. Lowercase, hyphens only."
      }
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Short marketing line shown on the event page."
      }
    },
    {
      name: "date",
      type: "date",
      required: true,
      admin: {
        description: "Event start date and time."
      }
    },
    {
      name: "end_date",
      type: "date",
      admin: {
        description: "Optional event end date/time."
      }
    },
    {
      name: "location",
      type: "text",
      admin: {
        description: "Venue name and/or address."
      }
    },
    {
      name: "gate_password",
      type: "text",
      required: true,
      access: {
        read: ({ req }) => {
          const role = req.user?.role;
          return role === "admin" || role === "editor";
        }
      },
      admin: {
        description:
          "Password required to access the purchase page. Share privately with the intended audience."
      }
    },
    {
      name: "capacity",
      type: "number",
      min: 0,
      defaultValue: 0,
      admin: {
        description:
          "Total tickets available across all users (0 = unlimited). When reached, the page shows 'Sold out'."
      }
    },
    {
      name: "max_per_user",
      type: "number",
      min: 1,
      max: 10,
      defaultValue: 3,
      required: true,
      admin: {
        description:
          "Maximum tickets a single user can purchase for this event."
      }
    },
    {
      name: "ticket_price",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Price per ticket in KRW (whole numbers only)."
      }
    },
    {
      name: "toss_payment_id",
      type: "text",
      admin: {
        description:
          "Toss ID for the payment link (overrides NEXT_PUBLIC_TOSS_ID). Format: 'hideawayseoul' for toss.me/hideawayseoul/{amount}."
      }
    },
    {
      name: "state",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: ["draft", "open", "closed", "ended"],
      admin: {
        description:
          "draft = hidden; open = accepting purchases; closed = no new purchases; ended = past, exclusive content live."
      }
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Event cover image."
      }
    },
    {
      name: "exclusive_content",
      type: "richText",
      admin: {
        description:
          "Post-event content shown only to checked-in attendees on /tickets/{slug}/exclusive."
      }
    },
    {
      name: "exclusive_links",
      type: "array",
      admin: {
        description: "Links shown on the exclusive content page."
      },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
        {
          name: "type",
          type: "select",
          required: true,
          defaultValue: "link",
          options: ["link", "form"]
        }
      ]
    },
    {
      name: "goods_drop_enabled",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Show a delivery address form on the exclusive content page (for free-goods drops)."
      }
    }
  ]
};

export default Events;
