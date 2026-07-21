import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { protectCampaignLifecycle } from "@/lib/lost-commerce/lifecycle-authorization";
import type { CollectionConfig } from "payload";
import { validateCampaignSkuOwnership } from "./validateSkuOwnership";

export const ProductOrderCampaigns: CollectionConfig = {
  slug: "product-order-campaigns",
  labels: {
    singular: "Product Order Campaign",
    plural: "Product Order Campaigns"
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "product",
      "state",
      "minimum_commitments",
      "paid_commitments",
      "deadline"
    ],
    description:
      "Request-to-order campaigns that convert paid commitments into orders."
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  hooks: {
    beforeChange: [protectCampaignLifecycle, validateCampaignSkuOwnership]
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
      index: true
    },
    {
      name: "state",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: ["draft", "open", "met", "failed", "converted", "canceled"],
      index: true
    },
    {
      name: "minimum_commitments",
      type: "number",
      required: true,
      min: 1,
      defaultValue: 1
    },
    {
      name: "maximum_commitments",
      type: "number",
      min: 1
    },
    {
      name: "paid_commitments",
      type: "number",
      min: 0,
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: "System-maintained count of paid commitments."
      }
    },
    {
      name: "deadline",
      type: "date",
      required: true,
      index: true
    },
    {
      name: "progress_visibility",
      type: "select",
      required: true,
      defaultValue: "hidden",
      options: ["hidden", "percentage", "count"],
      admin: {
        description: "Controls buyer-facing commitment progress display."
      }
    },
    {
      name: "eligible_skus",
      type: "relationship",
      relationTo: "product-variants",
      hasMany: true,
      admin: { description: "SKUs allowed for this campaign." }
    },
    {
      name: "eligible_variants",
      type: "json",
      admin: {
        readOnly: true,
        description: "Legacy campaign data retained during the SKU transition."
      }
    },
    {
      name: "refund_policy",
      type: "textarea",
      admin: {
        description:
          "Buyer-facing explanation for failed-campaign refunds or manual refunds."
      }
    }
  ]
};
