import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { products } from "@/payload-generated-schema";
import { productsCollectionOverride } from "@/payload/plugins/ecommerce/products-collection";

function fieldNames(config: { fields: readonly unknown[] }): string[] {
  return config.fields.flatMap((field) => {
    if (!field || typeof field !== "object" || !("name" in field)) return [];
    return typeof field.name === "string" ? [field.name] : [];
  });
}

describe("plugin product catalog schema", () => {
  it("does not keep Stack A money or inventory fields on plugin products", async () => {
    const collection = await productsCollectionOverride({
      defaultCollection: {
        slug: "products",
        fields: [{ name: "priceInKRW", type: "number" }],
        access: {},
        hooks: {}
      } as never
    });
    expect(fieldNames(collection)).not.toEqual(
      expect.arrayContaining([
        "unit_amount",
        "inventory",
        "stock_state",
        "variant_source"
      ])
    );
  });

  it("stores plugin integer prices instead of unit_amount", () => {
    const columns = Object.keys(getTableColumns(products));
    expect(columns).toEqual(expect.arrayContaining(["priceInKRW"]));
    expect(columns).not.toEqual(expect.arrayContaining(["unit_amount"]));
    expect(columns).not.toEqual(
      expect.arrayContaining(["inventory", "stock_state", "variant_source"])
    );
  });
});

