import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { product_variants, products } from "@/payload-generated-schema";
import { ProductVariants } from "./ProductVariants";
import { Products } from "./Products";

function fieldNames(config: { fields: readonly unknown[] }): string[] {
  return config.fields.flatMap((field) => {
    if (!field || typeof field !== "object" || !("name" in field)) return [];
    return typeof field.name === "string" ? [field.name] : [];
  });
}

describe("current LOSTINSEOUL product catalog schema", () => {
  it("contains no compatibility fields on products", () => {
    expect(fieldNames(Products)).not.toEqual(
      expect.arrayContaining([
        "inventory",
        "stock_state",
        "variant_source",
        "variants"
      ])
    );
  });

  it("contains no compatibility fields on SKUs", () => {
    expect(fieldNames(ProductVariants)).not.toEqual(
      expect.arrayContaining([
        "inventory",
        "legacy_key",
        "legacy_variant_ref",
        "stock_state"
      ])
    );
  });

  it("does not expose compatibility fields in admin listings or population", () => {
    expect(Products.defaultPopulate).not.toHaveProperty("stock_state");
    expect(Products.admin?.defaultColumns).not.toEqual(
      expect.arrayContaining(["inventory", "stock_state"])
    );
    expect(ProductVariants.defaultPopulate).not.toEqual(
      expect.objectContaining({ inventory: true, stock_state: true })
    );
    expect(ProductVariants.admin?.defaultColumns).not.toEqual(
      expect.arrayContaining(["inventory", "stock_state"])
    );
  });

  it("contains no compatibility columns in the generated PostgreSQL schema", () => {
    expect(Object.keys(getTableColumns(products))).not.toEqual(
      expect.arrayContaining([
        "inventory",
        "stock_state",
        "variant_source",
        "variants"
      ])
    );
    expect(Object.keys(getTableColumns(product_variants))).not.toEqual(
      expect.arrayContaining([
        "inventory",
        "legacy_key",
        "legacy_variant_ref",
        "stock_state"
      ])
    );
  });
});
