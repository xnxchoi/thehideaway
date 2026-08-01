import { describe, expect, it } from "vitest";

import { normalizeProductVariantData } from "./normalizeProductVariant";

describe("normalizeProductVariantData", () => {
  it("keeps an inactive SKU draft honest when every optional fact is unknown", () => {
    expect(
      normalizeProductVariantData({
        operation: "create",
        data: { product: "product-1", active: false }
      })
    ).toMatchObject({
      product: "product-1",
      active: false,
      identity_locked: false,
      sku: null,
      options: [],
      option_key: "product-1:[]"
    });
  });

  it("requires a confirmed SKU before activation", () => {
    expect(() =>
      normalizeProductVariantData({
        operation: "create",
        data: { product: "product-1", active: true, sku: "  " }
      })
    ).toThrow("active-sku-required");
  });

  it("normalizes SKU identity and canonicalizes option order", () => {
    expect(
      normalizeProductVariantData({
        operation: "create",
        data: {
          product: "product-1",
          active: true,
          sku: " lis-50 ",
          options: [
            { key: "Size", value: "50 ml" },
            { key: "finish", value: "Clear" }
          ]
        }
      })
    ).toMatchObject({
      identity_locked: true,
      sku: "LIS-50",
      options: [
        { key: "finish", value: "Clear" },
        { key: "Size", value: "50 ml" }
      ],
      option_key:
        'product-1:[["finish","Clear"],["size","50 ml"]]'
    });
  });

  it("rejects blank and duplicate option names", () => {
    expect(() =>
      normalizeProductVariantData({
        operation: "create",
        data: {
          product: "product-1",
          options: [{ key: "", value: "50 ml" }]
        }
      })
    ).toThrow("invalid-sku-option");

    expect(() =>
      normalizeProductVariantData({
        operation: "create",
        data: {
          product: "product-1",
          options: [
            { key: "Size", value: "50 ml" },
            { key: " size ", value: "100 ml" }
          ]
        }
      })
    ).toThrow("duplicate-sku-option");
  });

  it("rejects unsafe money and physical values", () => {
    for (const [field, value] of [
      ["price_override_amount", 1.5],
      ["weight_grams", Number.MAX_SAFE_INTEGER + 1],
      ["length_mm", Number.NaN]
    ] as const) {
      expect(() =>
        normalizeProductVariantData({
          operation: "create",
          data: { product: "product-1", [field]: value }
        })
      ).toThrow("invalid-sku-number");
    }
  });

  it("rejects zero physical values", () => {
    for (const field of [
      "weight_grams",
      "length_mm",
      "width_mm",
      "height_mm"
    ] as const) {
      expect(() =>
        normalizeProductVariantData({
          operation: "create",
          data: { product: "product-1", [field]: 0 }
        })
      ).toThrow("invalid-sku-number");
    }

  });

  it("requires a positive price override while preserving an unknown price", () => {
    expect(() =>
      normalizeProductVariantData({
        operation: "create",
        data: { product: "product-1", price_override_amount: 0 }
      })
    ).toThrow("invalid-sku-number");

    expect(
      normalizeProductVariantData({
        operation: "create",
        data: { product: "product-1", price_override_amount: null }
      })
    ).toMatchObject({ price_override_amount: null });
  });

  it("allows identity corrections while an SKU draft has never been active", () => {
    expect(
      normalizeProductVariantData({
        operation: "update",
        originalDoc: {
          product: "product-1",
          active: false,
          identity_locked: false,
          sku: "DRAFT-1",
          options: [{ key: "size", value: "50 ml" }]
        },
        data: {
          product: "product-2",
          sku: "DRAFT-2",
          options: [{ key: "size", value: "100 ml" }]
        }
      })
    ).toMatchObject({
      product: "product-2",
      sku: "DRAFT-2",
      identity_locked: false
    });
  });

  it("keeps product and SKU code immutable after activation", () => {
    const originalDoc = {
      product: "product-1",
      active: false,
      identity_locked: true,
      sku: "LIS-50",
      options: [{ key: "size", value: "50 ml" }]
    };

    expect(() =>
      normalizeProductVariantData({
        operation: "update",
        originalDoc,
        data: { product: "product-2" }
      })
    ).toThrow("sku-product-immutable");

    expect(() =>
      normalizeProductVariantData({
        operation: "update",
        originalDoc,
        data: { sku: "LIS-100" }
      })
    ).toThrow("sku-identity-immutable");
  });

  it("keeps options immutable after activation", () => {
    expect(() =>
      normalizeProductVariantData({
        operation: "update",
        originalDoc: {
          product: "product-1",
          active: false,
          identity_locked: true,
          sku: "LIS-50",
          options: [{ key: "size", value: "50 ml" }]
        },
        data: { options: [{ key: "size", value: "100 ml" }] }
      })
    ).toThrow("sku-identity-immutable");
  });

  it("keeps identity locked through deactivation and reactivation", () => {
    const deactivated = normalizeProductVariantData({
      operation: "update",
      originalDoc: {
        product: "product-1",
        active: true,
        identity_locked: true,
        sku: "LIS-50",
        options: [{ key: "size", value: "50 ml" }]
      },
      data: { active: false, label: "50 ml" }
    });

    expect(deactivated).toMatchObject({
      active: false,
      identity_locked: true,
      label: "50 ml"
    });
    expect(() =>
      normalizeProductVariantData({
        operation: "update",
        originalDoc: deactivated,
        data: { options: [{ key: "size", value: "100 ml" }] }
      })
    ).toThrow("sku-identity-immutable");

    expect(
      normalizeProductVariantData({
        operation: "update",
        originalDoc: deactivated,
        data: { active: true, price_override_amount: 72000 }
      })
    ).toMatchObject({
      active: true,
      identity_locked: true,
      price_override_amount: 72000
    });
  });

  it("allows non-identity catalog facts to change after activation", () => {
    expect(
      normalizeProductVariantData({
        operation: "update",
        originalDoc: {
          product: "product-1",
          active: false,
          identity_locked: true,
          sku: "LIS-50"
        },
        data: {
          label: "50 ml",
          price_override_amount: 72000,
          weight_grams: 250,
          length_mm: 40,
          width_mm: 40,
          height_mm: 120
        }
      })
    ).toMatchObject({
      label: "50 ml",
      price_override_amount: 72000,
      weight_grams: 250,
      length_mm: 40,
      width_mm: 40,
      height_mm: 120,
      identity_locked: true
    });
  });
});
