import { describe, expect, it } from "vitest";
import type { CollectionConfig, Field } from "payload";

import { transactionsCollectionOverride } from "./transactions-collection";

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
  slug: "transactions",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          fields: [
            {
              name: "items",
              type: "array",
              fields: [
                { name: "product", type: "relationship", relationTo: "products" },
                { name: "quantity", type: "number" }
              ]
            }
          ]
        }
      ]
    }
  ]
} as unknown as CollectionConfig;

describe("transactionsCollectionOverride", () => {
  it("keeps mode and campaign on transaction lines", async () => {
    const collection = await transactionsCollectionOverride({
      defaultCollection
    });
    expect(namedField(collection.fields, "mode")).toMatchObject({
      type: "select"
    });
    expect(namedField(collection.fields, "campaign")).toMatchObject({
      type: "text"
    });
  });
});
