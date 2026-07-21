import type { CollectionConfig } from "payload";

import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";
import { lockStockLocationUpdate } from "./lockStockLocationUpdate";
import { normalizeStockLocation } from "./normalizeStockLocation";

export const StockLocations: CollectionConfig = {
  slug: "stock-locations",
  labels: {
    singular: "Stock Location",
    plural: "Stock Locations"
  },
  admin: {
    useAsTitle: "code",
    defaultColumns: ["code", "name", "active"]
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: () => false
  },
  hooks: {
    beforeOperation: [lockStockLocationUpdate],
    beforeValidate: [normalizeStockLocation]
  },
  fields: [
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      index: true,
      access: { update: () => false }
    },
    {
      name: "name",
      type: "text",
      required: true
    },
    {
      name: "active",
      type: "checkbox",
      required: true,
      defaultValue: false,
      index: true
    }
  ]
};
