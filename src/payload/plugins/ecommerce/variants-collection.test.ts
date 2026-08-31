import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";

import { lockProductVariantUpdate } from "@/payload/collections/(consumption)/ProductVariants/hooks/lockProductVariantUpdate";

import { variantsCollectionOverride } from "./variants-collection";

function namedField(
  fields: Field[] | undefined,
  name: string
): Field | undefined {
  if (!fields) return undefined;
  for (const field of fields) {
    if ("name" in field && field.name === name) return field;
    if ("fields" in field && Array.isArray(field.fields)) {
      const nested = namedField(field.fields as Field[], name);
      if (nested) return nested;
    }
  }
  return undefined;
}

const defaultCollection = {
  slug: "variants",
  fields: [
    { name: "title", type: "text" },
    { name: "product", type: "relationship", relationTo: "products" },
    {
      name: "options",
      type: "relationship",
      relationTo: "variantOptions",
      hasMany: true
    },
    { name: "priceInKRW", type: "number" }
  ],
  access: {
    create: () => true,
    update: () => true,
    read: () => true,
    delete: () => true
  },
  hooks: {
    beforeChange: [() => undefined]
  }
} as CollectionConfig;

describe("variantsCollectionOverride", () => {
  it("adds locked SKU identity fields and keeps plugin option relationships", async () => {
    const collection = await variantsCollectionOverride({ defaultCollection });
    const names = (collection.fields ?? []).flatMap((field) =>
      "name" in field && typeof field.name === "string" ? [field.name] : []
    );
    expect(names).toEqual(
      expect.arrayContaining([
        "sku",
        "identity_locked",
        "barcode",
        "weight_grams",
        "length_mm",
        "width_mm",
        "height_mm",
        "tax_category",
        "sort",
        "active",
        "label",
        "option_key",
        "options",
        "product"
      ])
    );
    expect(namedField(collection.fields, "options")).toMatchObject({
      type: "relationship",
      relationTo: "variantOptions"
    });
  });

  it("serializes SKU updates and forbids deletes", async () => {
    const collection = await variantsCollectionOverride({ defaultCollection });
    expect(collection.hooks?.beforeOperation).toContain(
      lockProductVariantUpdate
    );
    expect(collection.admin?.useAsTitle).toBe("sku");
    expect(await collection.access?.delete?.({} as never)).toBe(false);
  });
});
