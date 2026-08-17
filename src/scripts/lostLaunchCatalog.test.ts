import { describe, expect, it } from "vitest";

import { LOST_LAUNCH_PRODUCTS } from "./lostLaunchCatalog";

describe("LOSTINSEOUL launch catalog", () => {
  it("defines the three confirmed launch products and prices", () => {
    expect(
      LOST_LAUNCH_PRODUCTS.map(({ name, slug, unitAmount }) => ({
        name,
        slug,
        unitAmount
      }))
    ).toEqual([
      {
        name: "Damaged Love the Damaged",
        slug: "damaged-love-the-damaged",
        unitAmount: 249000
      },
      { name: "De S\u00e9oul", slug: "de-seoul", unitAmount: 129000 },
      { name: "Catalyst", slug: "catalyst", unitAmount: 48000 }
    ]);
  });

  it("makes only the five confirmed hoodies standard stock", () => {
    const [hoodie, cap, catalyst] = LOST_LAUNCH_PRODUCTS;

    expect(hoodie).toMatchObject({
      fulfillment: "stock",
      availableQuantity: 5
    });
    expect(cap).toMatchObject({
      fulfillment: "preorder",
      availableQuantity: null
    });
    expect(catalyst).toMatchObject({
      fulfillment: "preorder",
      availableQuantity: null
    });
  });

  it("binds only supplied product photography and leaves Catalyst on placeholder", () => {
    const [hoodie, cap, catalyst] = LOST_LAUNCH_PRODUCTS;

    expect(hoodie.galleryAssets).toHaveLength(2);
    expect(cap.galleryAssets).toHaveLength(1);
    expect(catalyst.heroAsset).toBeNull();
    expect(catalyst.galleryAssets).toEqual([]);
  });

  it("keeps the custom-work cancellation boundary and seven-day fragrance return", () => {
    const [hoodie, cap, catalyst] = LOST_LAUNCH_PRODUCTS;

    expect(hoodie.shippingReturns).toContain(
      "Cancellation is accepted until production begins."
    );
    expect(cap.shippingReturns).toContain(
      "Cancellation is accepted until production begins."
    );
    expect(catalyst.shippingReturns).toContain("within seven days of receipt");
  });
});
