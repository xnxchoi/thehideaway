import { describe, expect, it } from "vitest";
import {
  buildCommerceSkuSnapshot,
  buildSkuOptionKey,
  canonicalizeSkuOptions,
  resolveSkuUnitAmount
} from "./product-skus";

describe("canonicalizeSkuOptions", () => {
  it("sorts options by key without mutating the source", () => {
    const source = [
      { key: "size", value: "02" },
      { key: "color", value: "black" }
    ];

    const result = canonicalizeSkuOptions(source);

    expect(result).toEqual([
      { key: "color", value: "black" },
      { key: "size", value: "02" }
    ]);
    expect(source).toEqual([
      { key: "size", value: "02" },
      { key: "color", value: "black" }
    ]);
  });

  it.each([
    {
      name: "duplicate keys",
      error: "duplicate-sku-option",
      options: [
        { key: "size", value: "01" },
        { key: "size", value: "02" }
      ]
    },
    {
      name: "blank keys",
      error: "invalid-sku-option",
      options: [{ key: " ", value: "black" }]
    },
    {
      name: "blank values",
      error: "invalid-sku-option",
      options: [{ key: "color", value: " " }]
    }
  ])("rejects $name", ({ error, options }) => {
    expect(() => canonicalizeSkuOptions(options)).toThrow(error);
  });

  it("builds the same product option key for equivalent option orderings", () => {
    const first = buildSkuOptionKey("product_1", [
      { key: "size", value: "02" },
      { key: "color", value: "black" }
    ]);
    const second = buildSkuOptionKey("product_1", [
      { key: "color", value: "black" },
      { key: "size", value: "02" }
    ]);

    expect(first).toBe(second);
    expect(first).not.toBe(
      buildSkuOptionKey("product_2", [
        { key: "color", value: "black" },
        { key: "size", value: "02" }
      ])
    );
  });
});

describe("buildCommerceSkuSnapshot", () => {
  it("uses the SKU price override and creates a versioned line snapshot", () => {
    const snapshot = buildCommerceSkuSnapshot({
      product: {
        id: "product_1",
        name: "Jacket",
        slug: "jacket",
        currency: "KRW",
        unit_amount: 120000
      },
      sku: {
        id: "sku_1",
        product: "product_1",
        sku: "LIS-JACKET-BLACK-02",
        label: "Black / 02",
        options: [
          { key: "size", value: "02" },
          { key: "color", value: "black" }
        ],
        price_override_amount: 135000,
        weight_grams: null,
        dimensions: null,
        tax_category: null
      },
      quantity: 2,
      mode: "standard_purchase"
    });

    expect(snapshot).toEqual({
      schemaVersion: 2,
      productId: "product_1",
      productName: "Jacket",
      productSlug: "jacket",
      skuId: "sku_1",
      variantId: "sku_1",
      sku: "LIS-JACKET-BLACK-02",
      skuLabel: "Black / 02",
      options: [
        { key: "color", value: "black" },
        { key: "size", value: "02" }
      ],
      currency: "KRW",
      unitAmount: 135000,
      quantity: 2,
      lineAmount: 270000,
      weightGrams: null,
      dimensions: null,
      taxCategory: null,
      mode: "standard_purchase"
    });
  });

  it.each(["standard_purchase", "request_to_order"] as const)(
    "rejects an unpriced %s line",
    (mode) => {
      expect(() =>
        buildCommerceSkuSnapshot({
          product: {
            id: "product_1",
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 0
          },
          sku: {
            id: "sku_1",
            product: "product_1",
            sku: "LIS-JACKET-01",
            price_override_amount: null
          },
          quantity: 1,
          mode
        })
      ).toThrow("invalid-sku-price");
    }
  );

  it("rejects an unpriced private order instead of falling back to public pricing", () => {
    expect(() =>
      buildCommerceSkuSnapshot({
        product: {
          id: "product_1",
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 120000,
          private_preset_price_enabled: false
        },
        sku: {
          id: "sku_1",
          product: "product_1",
          sku: "LIS-JACKET-01",
          price_override_amount: 125000
        },
        quantity: 1,
        mode: "private_order"
      })
    ).toThrow("invalid-sku-price");
  });

  it("allows an unpriced private-order snapshot only for quote intake", () => {
    const snapshot = buildCommerceSkuSnapshot({
      product: {
        id: "product_1",
        name: "Jacket",
        slug: "jacket",
        currency: "KRW",
        unit_amount: 0,
        private_preset_price_enabled: false
      },
      sku: {
        id: "sku_1",
        product: "product_1",
        sku: "LIS-JACKET-01",
        price_override_amount: null
      },
      quantity: 1,
      mode: "private_order",
      allowUnpricedPrivateOrder: true
    });

    expect(snapshot.unitAmount).toBe(0);
    expect(snapshot.lineAmount).toBe(0);
  });

  it("rejects an invalid enabled private preset during quote intake", () => {
    expect(() =>
      resolveSkuUnitAmount({
        product: {
          unit_amount: 180_000,
          private_preset_price_enabled: true,
          private_unit_amount: null
        },
        sku: { price_override_amount: null },
        mode: "private_order",
        allowUnpricedPrivateOrder: true
      })
    ).toThrow("invalid-sku-price");
  });

  it.each(["weight_grams", "length_mm", "width_mm", "height_mm"] as const)(
    "rejects zero for confirmed physical field %s",
    (field) => {
      expect(() =>
        buildCommerceSkuSnapshot({
          product: {
            id: "product_1",
            name: "Jacket",
            slug: "jacket",
            currency: "KRW",
            unit_amount: 120000
          },
          sku: {
            id: "sku_1",
            product: "product_1",
            sku: "LIS-JACKET-01",
            [field]: 0
          },
          quantity: 1,
          mode: "standard_purchase"
        })
      ).toThrow("invalid-sku-number");
    }
  );

  it("uses a positive SKU override when the product base price is zero", () => {
    expect(
      resolveSkuUnitAmount({
        product: {
          id: "product_1",
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 0
        },
        sku: {
          id: "sku_1",
          product: "product_1",
          sku: "LIS-JACKET-01",
          price_override_amount: 125000
        },
        mode: "request_to_order"
      })
    ).toBe(125000);
  });

  it("falls back to the positive product price when the SKU override is zero", () => {
    expect(
      resolveSkuUnitAmount({
        product: {
          id: "product_1",
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 120000
        },
        sku: {
          id: "sku_1",
          product: "product_1",
          sku: "LIS-JACKET-01",
          price_override_amount: 0
        },
        mode: "standard_purchase"
      })
    ).toBe(120000);
  });

  it("rejects a zero private preset price", () => {
    expect(() =>
      resolveSkuUnitAmount({
        product: {
          id: "product_1",
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 0,
          private_preset_price_enabled: true,
          private_unit_amount: 0
        },
        sku: {
          id: "sku_1",
          product: "product_1",
          sku: "LIS-JACKET-01"
        },
        mode: "private_order"
      })
    ).toThrow("invalid-sku-price");
  });

  it("rejects a private preset with no configured amount", () => {
    expect(() =>
      resolveSkuUnitAmount({
        product: {
          id: "product_1",
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 120000,
          private_preset_price_enabled: true,
          private_unit_amount: null
        },
        sku: {
          id: "sku_1",
          product: "product_1",
          sku: "LIS-JACKET-01",
          price_override_amount: 125000
        },
        mode: "private_order"
      })
    ).toThrow("invalid-sku-price");
  });

  it("deep-copies nested options and keeps unknown catalog facts null", () => {
    const options = [{ key: "size", value: "02" }];
    const sku = {
      id: "sku_1",
      product: "product_1",
      sku: "LIS-JACKET-02",
      label: null,
      options,
      price_override_amount: null,
      weight_grams: null,
      dimensions: null,
      tax_category: null
    };
    const snapshot = buildCommerceSkuSnapshot({
      product: {
        id: "product_1",
        name: "Jacket",
        slug: "jacket",
        currency: "KRW",
        unit_amount: 120000
      },
      sku,
      quantity: 1,
      mode: "standard_purchase"
    });

    options[0]!.value = "changed";
    sku.label = "Changed";
    sku.weight_grams = 500;

    expect(snapshot.options).toEqual([{ key: "size", value: "02" }]);
    expect(snapshot.skuLabel).toBeNull();
    expect(snapshot.weightGrams).toBeNull();
    expect(snapshot.dimensions).toBeNull();
    expect(snapshot.taxCategory).toBeNull();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.options)).toBe(true);
    expect(Object.isFrozen(snapshot.options[0])).toBe(true);
    expect(() => {
      (snapshot.options[0] as { value: string }).value = "mutated";
    }).toThrow(TypeError);
  });
});
