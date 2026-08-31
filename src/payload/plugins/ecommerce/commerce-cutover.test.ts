import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  commerceOrderToPlugin,
  commerceProductToPlugin
} from "./commerce-cutover";

describe("commerce collection cutover mapping", () => {
  it("copies a commerce product onto plugin product fields and keeps the id", () => {
    expect(
      commerceProductToPlugin({
        id: "prod-1",
        name: "Fragrance Object",
        slug: "fragrance-object",
        active: true,
        unit_amount: 55_000,
        max_quantity: 2,
        summary: "Object",
        description: { root: { type: "root", children: [] } },
        details: "Details",
        care: "Care",
        shipping_returns: "Returns",
        hero_media: "media-1",
        sort: 10
      })
    ).toEqual({
      id: "prod-1",
      name: "Fragrance Object",
      slug: "fragrance-object",
      active: true,
      storefront: "lostinseoul",
      summary: "Object",
      description: { root: { type: "root", children: [] } },
      details: "Details",
      care: "Care",
      shipping_returns: "Returns",
      hero_media: "media-1",
      sort: 10,
      priceInKRWEnabled: true,
      priceInKRW: 55_000,
      max_order_quantity: 2,
      min_order_quantity: 1,
      standard_enabled: true,
      request_to_order_enabled: false,
      private_order_enabled: false,
      private_preset_price_enabled: false,
      private_tier_gate: "anyone",
      enableVariants: false,
      _status: "published"
    });
  });

  it("keeps inactive commerce products as unpublished drafts without a price", () => {
    expect(
      commerceProductToPlugin({
        id: "prod-2",
        name: "Draft",
        slug: "draft",
        active: false,
        unit_amount: 0,
        max_quantity: 1
      })
    ).toMatchObject({
      active: false,
      _status: "draft",
      priceInKRWEnabled: false,
      priceInKRW: null
    });
  });

  it("maps a commerce order onto plugin order extras and a single item line", () => {
    const mapped = commerceOrderToPlugin({
      id: "order-1",
      ref: "LIS-1001",
      user: "user-1",
      product: "prod-1",
      product_name_snapshot: "Fragrance Object",
      product_slug_snapshot: "fragrance-object",
      quantity: 2,
      unit_amount_snapshot: 55_000,
      total_amount: 110_000,
      currency: "KRW",
      payment_method: "card",
      payment_status: "paid",
      status: "completed",
      contact: { email: "a@b.c" },
      shipping: { city: "Seoul" },
      paid_at: "2026-08-01T00:00:00.000Z"
    });
    expect(mapped).toEqual(
      expect.objectContaining({
        id: "order-1",
        customer: "user-1",
        customerEmail: "a@b.c",
        amount: 110_000,
        currency: "KRW",
        status: "completed",
        order_ref: "LIS-1001",
        order_mode: "standard_purchase",
        lifecycle_status: "converted",
        payment_status: "paid",
        fulfillment_status: "fulfilled",
        contact: { email: "a@b.c", shipping: { city: "Seoul" } },
        shippingAddress: expect.objectContaining({
          city: "Seoul"
        }),
        paid_at: "2026-08-01T00:00:00.000Z",
        line_snapshot_version: 3
      })
    );
    expect(mapped.items).toEqual([
      {
        product: "prod-1",
        quantity: 2,
        mode: "standard_purchase",
        product_name: "Fragrance Object",
        product_slug: "fragrance-object",
        currency: "KRW",
        unit_amount: 55_000,
        line_amount: 110_000
      }
    ]);
  });
});

describe("commerce collection retirement wiring", () => {
  it("stops registering the Stack A commerce collections", () => {
    const collectionsIndex = readFileSync(
      new URL("../../collections/index.ts", import.meta.url),
      "utf8"
    );
    expect(collectionsIndex).not.toContain("CommerceProducts");
    expect(collectionsIndex).not.toContain("CommerceOrders");
    expect(collectionsIndex).not.toContain("commerce/Products");
    expect(collectionsIndex).not.toContain("commerce/Orders");
  });

  it("copies commerce rows into plugin tables before dropping them", () => {
    const migration = readFileSync(
      new URL(
        "../../../lib/migrations-baseline/20260831_011714_commerce_cutover.ts",
        import.meta.url
      ),
      "utf8"
    );
    expect(migration).toContain("WHY-OVERRIDE-PAYLOAD");
    expect(migration).toContain('INSERT INTO "products"');
    expect(migration).toContain('INSERT INTO "orders"');
    expect(migration).toContain("shipping_address_city");
    expect(migration).toContain('DROP TABLE IF EXISTS "commerce_products"');
    expect(migration).toContain('DROP TABLE IF EXISTS "commerce_orders"');
  });
});
