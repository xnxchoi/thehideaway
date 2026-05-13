import { slugField } from "@/payload/fields";
import { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";

// Public catalog taxonomy: reads are open so the storefront can render
// category lists; writes are admin-only. Without these guards Payload's
// default lets any authenticated user mutate the taxonomy table.
const taxonomyAccess = {
  read: () => true,
  create: isAdmin,
  update: isAdmin,
  delete: isAdmin
};

export const ProductCategory: CollectionConfig = {
  slug: "product-category",
  labels: {
    singular: "Product Category",
    plural: "Product Categories"
  },
  access: taxonomyAccess,
  defaultPopulate: {
    id: true,
    name: true,
    slug: true
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true
    },
    ...slugField("name")
  ]
};
export const ProductSubCategory: CollectionConfig = {
  slug: "product-sub",
  labels: {
    singular: "Product Sub Category",
    plural: "Product Sub Categories"
  },
  access: taxonomyAccess,
  defaultPopulate: {
    id: true,
    name: true,
    slug: true
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true
    },
    ...slugField("name")
  ]
};
