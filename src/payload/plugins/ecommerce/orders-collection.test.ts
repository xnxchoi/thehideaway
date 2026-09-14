import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";

import { ordersCollectionOverride } from "./orders-collection";

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
    if ("tabs" in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if (tab && typeof tab === "object" && "fields" in tab) {
          const nested = namedField(tab.fields as Field[], name);
          if (nested) return nested;
        }
      }
    }
  }
  return undefined;
}

const defaultCollection = {
  slug: "orders",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Details",
          fields: [
            {
              name: "items",
              type: "array",
              fields: [
                {
                  name: "product",
                  type: "relationship",
                  relationTo: "products"
                },
                {
                  name: "variant",
                  type: "relationship",
                  relationTo: "variants"
                },
                { name: "quantity", type: "number" }
              ]
            }
          ]
        }
      ]
    },
    { name: "status", type: "select", options: ["processing"] },
    { name: "customer", type: "relationship", relationTo: "users" }
  ],
  hooks: {}
} as unknown as CollectionConfig;

describe("ordersCollectionOverride", () => {
  it("adds LOSTINSEOUL order fields without replacing plugin status", async () => {
    const collection = await ordersCollectionOverride({ defaultCollection });
    const names = fieldNames(collection.fields);
    expect(names).toEqual(
      expect.arrayContaining([
        "items",
        "product",
        "variant",
        "quantity",
        "mode",
        "campaign",
        "order_ref",
        "order_mode",
        "lifecycle_status",
        "payment_status",
        "fulfillment_status",
        "quote",
        "contact",
        "line_snapshot_version",
        "paid_at",
        "status"
      ])
    );
    expect(namedField(collection.fields, "status")).toMatchObject({
      type: "select",
      options: ["processing", "pending"]
    });
    expect(namedField(collection.fields, "lifecycle_status")).toMatchObject({
      type: "select",
      defaultValue: "pending_payment"
    });
    expect(namedField(collection.fields, "campaign")).toMatchObject({
      type: "text"
    });
  });

  it("owns one pending purchase per cart and denies public capability reads", async () => {
    const collection = await ordersCollectionOverride({ defaultCollection });
    expect(namedField(collection.fields, "checkout_cart")).toMatchObject({
      type: "relationship",
      relationTo: "carts",
      unique: true,
      index: true
    });
    const digest = namedField(collection.fields, "guest_access_digest");
    expect(digest).toMatchObject({ type: "text", hidden: true });
    if (!digest || !("access" in digest))
      throw new Error("missing digest access");
    expect(await digest.access?.read?.({} as never)).toBe(false);
    expect(await digest.access?.create?.({} as never)).toBe(false);
    expect(await digest.access?.update?.({} as never)).toBe(false);
  });

  it("guards lifecycle updates with the PortOne-authorized hook", async () => {
    const collection = await ordersCollectionOverride({ defaultCollection });
    expect(collection.hooks?.beforeChange?.length).toBeGreaterThan(0);
  });
});
