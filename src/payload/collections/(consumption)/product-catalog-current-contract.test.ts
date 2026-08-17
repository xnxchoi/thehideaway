import { describe, expect, it } from "vitest";
import { getTableColumns } from "drizzle-orm";

import { commerce_products } from "@/payload-generated-schema";
import { CommerceProducts } from "../commerce/Products";

function fieldNames(config: { fields: readonly unknown[] }): string[] {
  return config.fields.flatMap((field) => {
    if (!field || typeof field !== "object" || !("name" in field)) return [];
    return typeof field.name === "string" ? [field.name] : [];
  });
}

describe("current minimal commerce product catalog schema", () => {
  it("contains no compatibility fields on products", () => {
    expect(fieldNames(CommerceProducts)).not.toEqual(
      expect.arrayContaining([
        "inventory",
        "stock_state",
        "variant_source",
        "variants"
      ])
    );
  });

  it("does not expose compatibility fields in admin listings", () => {
    expect(CommerceProducts.admin?.defaultColumns).not.toEqual(
      expect.arrayContaining(["inventory", "stock_state"])
    );
  });

  it("contains no compatibility columns in the generated PostgreSQL schema", () => {
    expect(Object.keys(getTableColumns(commerce_products))).not.toEqual(
      expect.arrayContaining([
        "inventory",
        "stock_state",
        "variant_source",
        "variants"
      ])
    );
  });
});
