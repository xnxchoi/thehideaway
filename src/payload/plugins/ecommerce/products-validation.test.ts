import { describe, expect, it } from "vitest";

import { hideawayProductsValidation } from "./products-validation";

const currenciesConfig = {
  defaultCurrency: "KRW",
  supportedCurrencies: [{ code: "KRW", decimals: 0, label: "Won", symbol: "₩" }]
};

describe("hideawayProductsValidation", () => {
  it("requires a currency and a price in that currency", async () => {
    await expect(
      hideawayProductsValidation({
        currenciesConfig,
        product: { id: "p1", active: true, _status: "published" } as never,
        quantity: 1
      })
    ).rejects.toThrow("Currency must be provided");

    await expect(
      hideawayProductsValidation({
        currenciesConfig,
        currency: "KRW",
        product: { id: "p1", active: true, _status: "published" } as never,
        quantity: 1
      })
    ).rejects.toThrow("does not have a price");
  });

  it("rejects inactive products and quantities outside the product bounds", async () => {
    await expect(
      hideawayProductsValidation({
        currenciesConfig,
        currency: "KRW",
        product: {
          id: "p1",
          active: false,
          _status: "published",
          priceInKRW: 12000,
          priceInKRWEnabled: true,
          min_order_quantity: 1,
          max_order_quantity: 2
        } as never,
        quantity: 1
      })
    ).rejects.toThrow("product-inactive");

    await expect(
      hideawayProductsValidation({
        currenciesConfig,
        currency: "KRW",
        product: {
          id: "p1",
          active: true,
          _status: "published",
          priceInKRW: 12000,
          priceInKRWEnabled: true,
          min_order_quantity: 1,
          max_order_quantity: 2
        } as never,
        quantity: 3
      })
    ).rejects.toThrow("quantity-above-max");
  });

  it("accepts a published active product with a KRW price", async () => {
    await expect(
      hideawayProductsValidation({
        currenciesConfig,
        currency: "KRW",
        product: {
          id: "p1",
          active: true,
          _status: "published",
          priceInKRW: 12000,
          priceInKRWEnabled: true,
          min_order_quantity: 1,
          max_order_quantity: 2
        } as never,
        quantity: 1
      })
    ).resolves.toBeUndefined();
  });
});
