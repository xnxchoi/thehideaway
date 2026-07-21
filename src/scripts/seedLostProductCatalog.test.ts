import { describe, expect, it } from "vitest";

import {
  LEGACY_SEED_PRODUCT_SLUGS,
  LOST_FRAGRANCE_SEED_PRODUCTS
} from "./seedLostProductCatalog";

describe("LOSTINSEOUL fragrance seed catalog", () => {
  it("replaces the four fictional fixtures with three product drafts", () => {
    expect(LEGACY_SEED_PRODUCT_SLUGS).toEqual([
      "parasol-0230",
      "memory-tee",
      "window-study-01",
      "private-room-bench"
    ]);
    expect(LOST_FRAGRANCE_SEED_PRODUCTS.map(({ slug }) => slug)).toEqual([
      "catalyst-50ml",
      "catalyst-100ml-limited",
      "catalyst-travel-kit"
    ]);
  });

  it("keeps every unpriced product inactive and unavailable", () => {
    for (const product of LOST_FRAGRANCE_SEED_PRODUCTS) {
      expect(product).toMatchObject({
        active: false,
        currency: "KRW",
        unit_amount: 0,
        inventory: 0,
        stock_state: "on_request",
        standard_enabled: false,
        request_to_order_enabled: false,
        private_order_enabled: false,
        variant_source: "relational"
      });
      expect(product).not.toHaveProperty("variants");
      expect(product).not.toHaveProperty("sku");
    }
  });

  it("records only confirmed size facts", () => {
    const [fifty, hundred, travel] = LOST_FRAGRANCE_SEED_PRODUCTS;
    expect(fifty.confirmedSize).toBe("50 ml");
    expect(hundred.confirmedSize).toBe("100 ml");
    expect(hundred.limited).toBe(true);
    expect(travel.confirmedSize).toBeNull();
  });
});
