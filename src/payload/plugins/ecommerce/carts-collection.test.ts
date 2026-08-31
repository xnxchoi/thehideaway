import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";

import { cartsCollectionOverride } from "./carts-collection";

function fieldNames(fields: Field[] | undefined): string[] {
  if (!fields) return [];
  return fields.flatMap((field) => {
    const names =
      "name" in field && typeof field.name === "string" ? [field.name] : [];
    if ("fields" in field && Array.isArray(field.fields)) {
      return [...names, ...fieldNames(field.fields as Field[])];
    }
    return names;
  });
}

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
  slug: "carts",
  fields: [
    {
      name: "items",
      type: "array",
      fields: [
        { name: "product", type: "relationship", relationTo: "products" },
        { name: "variant", type: "relationship", relationTo: "variants" },
        { name: "quantity", type: "number", required: true, defaultValue: 1 }
      ]
    },
    { name: "customer", type: "relationship", relationTo: "users" },
    { name: "subtotal", type: "number" }
  ],
  endpoints: [
    { method: "post", path: "/:id/add-item", handler: async () => undefined },
    { method: "post", path: "/:id/merge", handler: async () => undefined }
  ]
} as unknown as CollectionConfig;

describe("cartsCollectionOverride", () => {
  it("adds mode, campaign, and snapshot columns onto cart items", async () => {
    const collection = await cartsCollectionOverride({ defaultCollection });
    const items = namedField(collection.fields, "items");
    expect(items).toMatchObject({ type: "array" });
    const names = fieldNames(
      items && "fields" in items ? (items.fields as Field[]) : []
    );
    expect(names).toEqual(
      expect.arrayContaining([
        "product",
        "variant",
        "quantity",
        "mode",
        "campaign",
        "schema_version",
        "product_name",
        "product_slug",
        "sku",
        "sku_label",
        "options",
        "currency",
        "unit_amount",
        "line_amount",
        "weight_grams",
        "length_mm",
        "width_mm",
        "height_mm",
        "tax_category"
      ])
    );
  });

  it("keeps order modes distinct and stores campaign as an id string", async () => {
    const collection = await cartsCollectionOverride({ defaultCollection });
    expect(namedField(collection.fields, "mode")).toMatchObject({
      type: "select",
      required: true,
      defaultValue: "standard_purchase",
      options: ["standard_purchase", "request_to_order", "private_order"]
    });
    expect(namedField(collection.fields, "campaign")).toMatchObject({
      type: "text"
    });
    expect(namedField(collection.fields, "schema_version")).toMatchObject({
      type: "number",
      defaultValue: 3
    });
  });

  it("keeps plugin cart item endpoints and rewires merge to the mode matcher", async () => {
    const originalMerge = Array.isArray(defaultCollection.endpoints)
      ? defaultCollection.endpoints.find(
          (endpoint) => "path" in endpoint && endpoint.path === "/:id/merge"
        )
      : undefined;
    const collection = await cartsCollectionOverride({ defaultCollection });
    const merge = Array.isArray(collection.endpoints)
      ? collection.endpoints.find(
          (endpoint) => "path" in endpoint && endpoint.path === "/:id/merge"
        )
      : undefined;
    expect(
      Array.isArray(collection.endpoints)
        ? collection.endpoints.map((endpoint) => endpoint.path)
        : []
    ).toEqual(expect.arrayContaining(["/:id/add-item", "/:id/merge"]));
    expect(merge).toBeDefined();
    expect(merge).not.toBe(originalMerge);
  });
});
