import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import type { CollectionConfig } from "payload";

const ownsCart = ({ req }: { req: { user?: { id?: string } | null } }) => {
  if (isAdmin({ req } as Parameters<typeof isAdmin>[0])) return true;
  return { user: { equals: req.user?.id } };
};

export const ProductCarts: CollectionConfig = {
  slug: "product-carts",
  labels: {
    singular: "Product Cart",
    plural: "Product Carts"
  },
  admin: {
    useAsTitle: "id",
    defaultColumns: ["user", "storefront", "status", "updatedAt"],
    description: "Synced authenticated carts for LOSTINSEOUL."
  },
  access: {
    read: ownsCart,
    create: ({ req }) => Boolean(req.user),
    update: ownsCart,
    delete: isAdmin
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true
    },
    {
      name: "storefront",
      type: "text",
      required: true,
      defaultValue: "lostinseoul",
      index: true
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: ["active", "converted", "abandoned"],
      index: true
    },
    {
      name: "currency",
      type: "select",
      required: true,
      defaultValue: "KRW",
      options: ["KRW", "USD", "JPY", "EUR"]
    },
    {
      name: "lines",
      type: "json",
      required: true,
      defaultValue: []
    }
  ]
};
