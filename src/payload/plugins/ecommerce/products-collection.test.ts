import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";

import { lockProductUpdate } from "@/payload/collections/(consumption)/Products/lockProductUpdate";

import { productsCollectionOverride } from "./products-collection";

function fieldNames(fields: Field[] | undefined): string[] {
  if (!fields) return [];
  return fields.flatMap((field) => {
    const names =
      "name" in field && typeof field.name === "string" ? [field.name] : [];
    if ("fields" in field && Array.isArray(field.fields)) {
      return [...names, ...fieldNames(field.fields as Field[])];
    }
    if ("tabs" in field && Array.isArray(field.tabs)) {
      return [
        ...names,
        ...field.tabs.flatMap((tab) =>
          tab && typeof tab === "object" && "fields" in tab
            ? fieldNames(tab.fields as Field[])
            : []
        )
      ];
    }
    return names;
  });
}

const defaultCollection = {
  slug: "products",
  fields: [
    { name: "enableVariants", type: "checkbox" },
    { name: "priceInKRW", type: "number" }
  ],
  access: {
    create: () => false,
    update: () => false,
    read: () => false,
    delete: () => false
  },
  hooks: {}
} as CollectionConfig;

describe("productsCollectionOverride", () => {
  it("adds LOSTINSEOUL catalog fields without a second money or inventory field", async () => {
    const collection = await productsCollectionOverride({ defaultCollection });
    const names = fieldNames(collection.fields);
    expect(names).toEqual(
      expect.arrayContaining([
        "name",
        "slug",
        "active",
        "storefront",
        "drop",
        "category",
        "summary",
        "description",
        "details",
        "care",
        "shipping_returns",
        "hero_media",
        "gallery",
        "compare_at_amount",
        "max_order_quantity",
        "min_order_quantity",
        "standard_enabled",
        "request_to_order_enabled",
        "private_order_enabled",
        "private_preset_price_enabled",
        "private_unit_amount",
        "private_tier_gate",
        "sort",
        "enableVariants",
        "priceInKRW"
      ])
    );
    expect(names).not.toContain("unit_amount");
    expect(names).not.toContain("inventory");
    expect(names).not.toContain("skus");
  });

  it("locks single-document updates and lets editors mutate the catalog", async () => {
    const collection = await productsCollectionOverride({ defaultCollection });
    expect(collection.hooks?.beforeOperation).toContain(lockProductUpdate);
    expect(collection.admin?.useAsTitle).toBe("name");

    const update = collection.access?.update;
    expect(await update?.({ req: { user: { role: "editor" } } } as never)).toBe(
      true
    );
    expect(await update?.({ req: { user: { role: "user" } } } as never)).toBe(
      false
    );

    const read = collection.access?.read;
    expect(await read?.({ req: { user: null } } as never)).toEqual({
      and: [
        { _status: { equals: "published" } },
        { active: { equals: true } }
      ]
    });
  });
});
