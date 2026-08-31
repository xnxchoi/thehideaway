import { describe, expect, it } from "vitest";

import {
  mapPluginCartLines,
  pluginCartAddItem
} from "./map-cart-lines";

describe("pluginCartAddItem", () => {
  it("sends product, variant, mode, and campaign so matcher lines stay distinct", () => {
    expect(
      pluginCartAddItem({
        productId: "prod-1",
        skuId: "var-1",
        mode: "request_to_order",
        campaignId: "camp-1",
        quantity: 2,
        productName: "Catalyst",
        productSlug: "catalyst",
        variantLabel: "50 ml",
        price: "₩48,000",
        unitAmount: 48000,
        currency: "KRW"
      })
    ).toEqual({
      product: "prod-1",
      variant: "var-1",
      mode: "request_to_order",
      campaign: "camp-1",
      product_name: "Catalyst",
      product_slug: "catalyst",
      sku_label: "50 ml",
      unit_amount: 48000,
      currency: "KRW",
      schema_version: 3
    });
  });

  it("omits variant when skuId is empty so Postgres never sees '' as a uuid", () => {
    expect(
      pluginCartAddItem({
        productId: "prod-1",
        skuId: "",
        mode: "standard_purchase",
        quantity: 1,
        productName: "Catalyst",
        productSlug: "catalyst",
        price: "₩48,000",
        unitAmount: 48000,
        currency: "KRW"
      })
    ).toEqual({
      product: "prod-1",
      mode: "standard_purchase",
      campaign: undefined,
      product_name: "Catalyst",
      product_slug: "catalyst",
      sku_label: undefined,
      unit_amount: 48000,
      currency: "KRW",
      schema_version: 3
    });
  });
});

describe("mapPluginCartLines", () => {
  it("maps populated plugin items onto the storefront cart line shape", () => {
    expect(
      mapPluginCartLines(
        {
          items: [
            {
              id: "item-1",
              quantity: 2,
              mode: "standard_purchase",
              campaign: "camp-1",
              product_name: "Catalyst",
              product_slug: "catalyst",
              sku_label: "50 ml",
              unit_amount: 48000,
              currency: "KRW",
              product: {
                id: "prod-1",
                name: "Catalyst",
                slug: "catalyst",
                hero_media: { url: "/media/catalyst.webp", filename: "catalyst.webp" }
              },
              variant: { id: "var-1", sku: "LIS-FRAGRANCE-CATALYST", label: "50 ml" }
            }
          ]
        },
        "KRW"
      )
    ).toEqual([
      {
        itemId: "item-1",
        productId: "prod-1",
        skuId: "var-1",
        productName: "Catalyst",
        productSlug: "catalyst",
        variantLabel: "50 ml",
        mode: "standard_purchase",
        campaignId: "camp-1",
        quantity: 2,
        price: "₩48,000",
        unitAmount: 48000,
        currency: "KRW",
        imageUrl: "/media/catalyst.webp"
      }
    ]);
  });

  it("falls back to variant or product plugin prices when snapshots are missing", () => {
    const [line] = mapPluginCartLines(
      {
        items: [
          {
            id: "item-2",
            quantity: 1,
            product: { id: "prod-1", name: "Hoodie", slug: "hoodie", priceInKRW: 249000 },
            variant: { id: "var-2", priceInKRW: 249000 }
          }
        ]
      },
      "KRW"
    );
    expect(line).toMatchObject({
      productId: "prod-1",
      skuId: "var-2",
      unitAmount: 249000,
      mode: "standard_purchase",
      campaignId: undefined
    });
  });

  it("returns an empty list when the cart has no items", () => {
    expect(mapPluginCartLines(undefined, "KRW")).toEqual([]);
    expect(mapPluginCartLines({ items: [] }, "KRW")).toEqual([]);
  });
});
