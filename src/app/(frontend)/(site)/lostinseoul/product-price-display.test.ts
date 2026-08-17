import { describe, expect, it } from "vitest";
import {
  canUseLostProductActions,
  didLostPrivateQuoteSucceed,
  getLostProductDetailPrice,
  getLostProductListingPrice,
  getLostProductVariantPrice,
  getLostProductVariantsForMode,
  hasLostPrivatePresetPrice
} from "./product-price-display";

const availableSku = {
  id: "sku-1",
  sku: "LIS-1",
  label: "One",
  amount: 150000,
  stockState: "in_stock",
  actionableModes: [
    "standard_purchase",
    "request_to_order",
    "private_order"
  ] as const
};

describe("LOSTINSEOUL product price display", () => {
  it("uses the localized request-quote label when listing price is null", () => {
    expect(
      getLostProductListingPrice(null, "Request quote", ["private_order"])
    ).toBe("Request quote");
    expect(
      getLostProductListingPrice(null, "견적 요청", ["private_order"])
    ).toBe("견적 요청");
  });

  it("keeps a numeric listing price when the query provides one", () => {
    expect(
      getLostProductListingPrice("₩150,000", "Request quote", [
        "standard_purchase"
      ])
    ).toBe("₩150,000");
  });

  it("does not label a product as quoteable when it has no actionable mode", () => {
    expect(getLostProductListingPrice(null, "Request quote", [])).toBe("");
  });

  it("uses the localized request-quote label for quote-only product detail", () => {
    expect(
      getLostProductDetailPrice({
        quoteOnly: true,
        requestQuoteLabel: "Request quote",
        selectedPrice: "₩120,000"
      })
    ).toBe("Request quote");
    expect(
      getLostProductDetailPrice({
        quoteOnly: true,
        requestQuoteLabel: "견적 요청",
        selectedPrice: "₩120,000"
      })
    ).toBe("견적 요청");
  });

  it("keeps the selected price for standard, request, and preset private modes", () => {
    expect(
      getLostProductDetailPrice({
        quoteOnly: false,
        requestQuoteLabel: "Request quote",
        selectedPrice: "₩125,000–₩150,000"
      })
    ).toBe("₩125,000–₩150,000");
  });

  it("accepts only enabled private presets with safe integer amounts of at least one", () => {
    expect(hasLostPrivatePresetPrice(true, 1)).toBe(true);
    expect(hasLostPrivatePresetPrice(true, 150000)).toBe(true);
    expect(hasLostPrivatePresetPrice(false, 150000)).toBe(false);
    expect(hasLostPrivatePresetPrice(true, null)).toBe(false);
    expect(hasLostPrivatePresetPrice(true, 0)).toBe(false);
    expect(hasLostPrivatePresetPrice(true, 1.5)).toBe(false);
    expect(hasLostPrivatePresetPrice(true, Number.MAX_SAFE_INTEGER + 1)).toBe(
      false
    );
  });

  it("allows standard actions only for a selected commercially actionable SKU", () => {
    expect(
      canUseLostProductActions({
        mode: "standard_purchase",
        modes: ["standard_purchase", "private_order"],
        selectedSku: availableSku
      })
    ).toBe(true);
  });

  it("rejects commerce actions when no active SKU is selected", () => {
    expect(
      canUseLostProductActions({
        mode: "standard_purchase",
        modes: ["standard_purchase"],
        selectedSku: null
      })
    ).toBe(false);
    expect(
      canUseLostProductActions({
        mode: "standard_purchase",
        modes: ["standard_purchase"],
        selectedSku: { ...availableSku, sku: null }
      })
    ).toBe(false);
  });

  it("rejects commerce actions when the current mode is missing or disabled", () => {
    expect(
      canUseLostProductActions({
        mode: null,
        modes: ["standard_purchase"],
        selectedSku: availableSku
      })
    ).toBe(false);
    expect(
      canUseLostProductActions({
        mode: "standard_purchase",
        modes: ["private_order"],
        selectedSku: availableSku
      })
    ).toBe(false);
    expect(
      canUseLostProductActions({
        mode: "standard_purchase",
        modes: [],
        selectedSku: availableSku
      })
    ).toBe(false);
  });

  it("uses server ATP actionability", () => {
    for (const selectedSku of [
      { ...availableSku, stockState: "on_request" },
      { ...availableSku, stockState: null }
    ]) {
      expect(
        canUseLostProductActions({
          mode: "standard_purchase",
          modes: ["standard_purchase"],
          selectedSku
        })
      ).toBe(true);
    }
    expect(
      canUseLostProductActions({
        mode: "standard_purchase",
        modes: ["standard_purchase"],
        selectedSku: { ...availableSku, amount: null }
      })
    ).toBe(false);
  });

  it("allows request actions only for SKUs marked actionable by the campaign", () => {
    expect(
      canUseLostProductActions({
        mode: "request_to_order",
        modes: ["request_to_order"],
        selectedSku: availableSku
      })
    ).toBe(true);
    expect(
      canUseLostProductActions({
        mode: "request_to_order",
        modes: ["request_to_order"],
        selectedSku: { ...availableSku, actionableModes: [] }
      })
    ).toBe(false);
  });

  it("keeps purchase actions dark until a payment method is live", () => {
    expect(
      canUseLostProductActions({
        checkoutEnabled: false,
        mode: "standard_purchase",
        modes: ["standard_purchase"],
        selectedSku: availableSku
      })
    ).toBe(false);
    expect(
      canUseLostProductActions({
        allowWithoutCheckout: true,
        checkoutEnabled: false,
        mode: "private_order",
        modes: ["private_order"],
        selectedSku: availableSku
      })
    ).toBe(true);
  });

  it("requires a complete preset for private checkout but keeps explicit quote-only available", () => {
    expect(
      canUseLostProductActions({
        mode: "private_order",
        modes: ["private_order"],
        privatePresetPriceEnabled: true,
        privateUnitAmount: 150000,
        selectedSku: { ...availableSku, amount: null }
      })
    ).toBe(true);
    expect(
      canUseLostProductActions({
        mode: "private_order",
        modes: ["private_order"],
        privatePresetPriceEnabled: true,
        privateUnitAmount: null,
        selectedSku: { ...availableSku, amount: null }
      })
    ).toBe(false);
    expect(
      canUseLostProductActions({
        mode: "private_order",
        modes: ["private_order"],
        privatePresetPriceEnabled: false,
        privateUnitAmount: null,
        selectedSku: {
          ...availableSku,
          amount: null,
          stockState: null
        }
      })
    ).toBe(true);
  });

  it("filters request-to-order variants to campaign-actionable SKUs", () => {
    expect(
      getLostProductVariantsForMode(
        [availableSku, { ...availableSku, id: "sku-2", actionableModes: [] }],
        "request_to_order"
      ).map((variant) => variant.id)
    ).toEqual(["sku-1"]);
  });

  it("shows the full actionable variant price range when selection is deferred", () => {
    expect(
      getLostProductVariantPrice(
        [
          availableSku,
          { ...availableSku, id: "sku-2", amount: 125000 },
          { ...availableSku, id: "sku-3", amount: 150000 }
        ],
        "KRW"
      )
    ).toBe("₩125,000–₩150,000");
    expect(getLostProductVariantPrice([], "KRW")).toBeNull();
  });

  it("treats only successful private-quote HTTP responses as success", () => {
    expect(didLostPrivateQuoteSucceed({ ok: true })).toBe(true);
    expect(didLostPrivateQuoteSucceed({ ok: false })).toBe(false);
  });
});
