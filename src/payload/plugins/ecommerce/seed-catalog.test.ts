import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { LOST_LAUNCH_PRODUCTS } from "@/scripts/lostLaunchCatalog";
import { LOST_FRAGRANCE_SEED_PRODUCTS } from "@/scripts/seedLostProductCatalog";

import {
  DEFAULT_VARIANT_OPTION,
  DEFAULT_VARIANT_TYPE,
  inventoryCollectionsReady,
  pluginDraftProductData,
  pluginLaunchProductData,
  pluginLaunchVariantData
} from "./seed-catalog";

describe("plugin catalog seed payloads", () => {
  it("writes fragrance drafts as unpublished plugin products without SKUs or unit_amount", () => {
    const [draft] = LOST_FRAGRANCE_SEED_PRODUCTS;
    expect(pluginDraftProductData(draft, "cat-fragrance")).toEqual(
      expect.objectContaining({
        name: draft.name,
        slug: draft.slug,
        category: "cat-fragrance",
        storefront: "lostinseoul",
        active: false,
        _status: "draft",
        enableVariants: false,
        priceInKRWEnabled: false,
        standard_enabled: false,
        request_to_order_enabled: false,
        private_order_enabled: false,
        min_order_quantity: 1,
        max_order_quantity: 1
      })
    );
    expect(pluginDraftProductData(draft, "cat-fragrance")).not.toHaveProperty(
      "unit_amount"
    );
    expect(pluginDraftProductData(draft, "cat-fragrance")).not.toHaveProperty(
      "currency"
    );
    expect(pluginDraftProductData(draft, "cat-fragrance")).not.toHaveProperty(
      "sku"
    );
  });

  it("writes launch products onto plugin money, variants, and published status", () => {
    const [hoodie] = LOST_LAUNCH_PRODUCTS;
    const product = pluginLaunchProductData(hoodie, "cat-apparel", {
      heroMedia: "media-hero",
      gallery: ["media-1", "media-2"]
    });
    expect(product).toEqual(
      expect.objectContaining({
        name: hoodie.name,
        slug: hoodie.slug,
        active: true,
        _status: "published",
        enableVariants: true,
        priceInKRWEnabled: true,
        priceInKRW: 249000,
        max_order_quantity: 5,
        standard_enabled: true,
        request_to_order_enabled: false,
        storefront: "lostinseoul"
      })
    );
    expect(product).not.toHaveProperty("unit_amount");
    expect(product).not.toHaveProperty("currency");

    expect(
      pluginLaunchVariantData(hoodie, "product-1", ["option-standard"])
    ).toEqual(
      expect.objectContaining({
        product: "product-1",
        active: true,
        sku: hoodie.sku,
        label: hoodie.name,
        options: ["option-standard"],
        priceInKRWEnabled: true,
        priceInKRW: 249000,
        _status: "published"
      })
    );
  });

  it("defines a default variant type so SKUs can exist without product-specific options", () => {
    expect(DEFAULT_VARIANT_TYPE).toEqual({
      name: "default",
      label: "Default"
    });
    expect(DEFAULT_VARIANT_OPTION).toEqual({
      label: "Standard",
      value: "standard"
    });
  });

  it("skips warehouse receipt work when inventory collections are unregistered", () => {
    expect(
      inventoryCollectionsReady({
        collections: { products: {}, variants: {} }
      } as never)
    ).toBe(false);
    expect(
      inventoryCollectionsReady({
        collections: {
          "stock-locations": {},
          "inventory-receipts": {},
          "inventory-levels": {}
        }
      } as never)
    ).toBe(true);
  });
});

describe("plugin catalog seed wiring", () => {
  it("points lost-product seeds and launch bootstrap at plugin collections", () => {
    const seed = readFileSync(
      new URL("../../../scripts/seedLostProducts.ts", import.meta.url),
      "utf8"
    );
    const bootstrap = readFileSync(
      new URL("../../../scripts/bootstrapLostLaunch.ts", import.meta.url),
      "utf8"
    );
    expect(seed).toContain("pluginDraftProductData");
    expect(seed).not.toContain("unit_amount:");
    expect(bootstrap).toContain('collection: "variants"');
    expect(bootstrap).not.toContain('collection: "product-variants"');
    expect(bootstrap).toContain("inventoryCollectionsReady");
    expect(bootstrap).toContain("pluginLaunchProductData");
    expect(bootstrap).toContain("pluginLaunchVariantData");
  });
});
