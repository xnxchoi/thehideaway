import { describe, expect, it } from "vitest";

import {
  LOST_FRAGRANCE_SEED_PRODUCTS
} from "./seedLostProductCatalog";

describe("LOSTINSEOUL fragrance seed catalog", () => {
  it("defines three product drafts", () => {
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
        standard_enabled: false,
        request_to_order_enabled: false,
        private_order_enabled: false
      });
      expect(product).not.toHaveProperty("inventory");
      expect(product).not.toHaveProperty("stock_state");
      expect(product).not.toHaveProperty("variant_source");
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
