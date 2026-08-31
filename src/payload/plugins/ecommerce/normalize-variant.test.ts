import { describe, expect, it } from "vitest";

import { normalizePluginVariantData } from "./normalize-variant";

describe("normalizePluginVariantData", () => {
  it("builds a stable option key from product and option IDs", () => {
    expect(
      normalizePluginVariantData({
        operation: "create",
        data: {
          product: "product-1",
          active: true,
          sku: " lis-50 ",
          options: ["opt-b", "opt-a"]
        }
      })
    ).toMatchObject({
      sku: "LIS-50",
      identity_locked: true,
      option_key: "product-1:[opt-a,opt-b]"
    });
  });

  it("requires a SKU before activation", () => {
    expect(() =>
      normalizePluginVariantData({
        operation: "create",
        data: { product: "product-1", active: true, options: ["opt-a"] }
      })
    ).toThrow("active-sku-required");
  });

  it("freezes product, sku, and options after identity lock", () => {
    expect(() =>
      normalizePluginVariantData({
        operation: "update",
        originalDoc: {
          product: "product-1",
          sku: "LIS-50",
          options: ["opt-a"],
          identity_locked: true,
          active: true
        },
        data: { sku: "LIS-100" }
      })
    ).toThrow("sku-identity-immutable");
  });
});
