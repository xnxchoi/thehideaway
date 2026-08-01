import { describe, expect, expectTypeOf, it } from "vitest";

import {
  createCommerceMoney,
  createCommerceTotalsSnapshot,
  createPrivateQuoteLineSnapshot
} from "./contracts";
import type {
  LostCartLineSnapshot,
  LostPrivateQuoteLineSnapshot
} from "./types";

describe("commerce money contracts", () => {
  it("creates an immutable integer-money value", () => {
    const money = createCommerceMoney(3500, "KRW");

    expect(money).toEqual({ amount: 3500, currency: "KRW" });
    expect(Object.isFrozen(money)).toBe(true);
  });

  it.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1
  ])("rejects invalid amount %s", (amount) => {
    expect(() => createCommerceMoney(amount, "KRW")).toThrow(
      "invalid-commerce-amount"
    );
  });

  it("rejects unsupported currencies at runtime", () => {
    expect(() => createCommerceMoney(1000, "GBP" as never)).toThrow(
      "invalid-commerce-currency"
    );
  });
});

describe("commerce totals snapshots", () => {
  it("copies and freezes a balanced totals snapshot", () => {
    const input = {
      currency: "KRW" as const,
      subtotalAmount: 20_000,
      discountAmount: 2_000,
      shippingAmount: 3_500,
      taxAmount: 0,
      totalAmount: 21_500
    };

    const snapshot = createCommerceTotalsSnapshot(input);
    input.shippingAmount = 5_000;

    expect(snapshot.shippingAmount).toBe(3_500);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("rejects totals that do not balance", () => {
    expect(() =>
      createCommerceTotalsSnapshot({
        currency: "KRW",
        subtotalAmount: 20_000,
        discountAmount: 2_000,
        shippingAmount: 3_500,
        taxAmount: 0,
        totalAmount: 20_000
      })
    ).toThrow("commerce-totals-mismatch");
  });
});

describe("private quote line snapshots", () => {
  const privateCheckoutLine = {
    schemaVersion: 3 as const,
    productId: "product-1",
    productName: "CATALYST 01",
    productSlug: "catalyst-01",
    skuId: "sku-1",
    sku: "LIS-CATALYST-01",
    skuLabel: null,
    options: Object.freeze([{ key: "Size", value: "50 ml" }]),
    currency: "KRW" as const,
    unitAmount: 180000,
    quantity: 2,
    lineAmount: 360000,
    weightGrams: null,
    dimensions: null,
    taxCategory: null,
    mode: "private_order" as const
  } satisfies LostCartLineSnapshot;

  it("keeps priced private quote amounts numeric", () => {
    const snapshot = createPrivateQuoteLineSnapshot(privateCheckoutLine);

    expect(snapshot.unitAmount).toBe(180000);
    expect(snapshot.lineAmount).toBe(360000);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("stores an unpriced private quote as a paired null amount snapshot", () => {
    const snapshot = createPrivateQuoteLineSnapshot({
      ...privateCheckoutLine,
      unitAmount: 0,
      lineAmount: 0
    });

    expect(snapshot.unitAmount).toBeNull();
    expect(snapshot.lineAmount).toBeNull();
  });

  it("does not permit quote-only nullability for payment checkout modes", () => {
    expect(() =>
      createPrivateQuoteLineSnapshot({
        ...privateCheckoutLine,
        mode: "standard_purchase"
      })
    ).toThrow("private-quote-line-required");
  });

  it("rejects a partially priced private quote snapshot", () => {
    expect(() =>
      createPrivateQuoteLineSnapshot({
        ...privateCheckoutLine,
        unitAmount: 0,
        lineAmount: 1
      })
    ).toThrow("invalid-private-quote-amount");
  });

  it("keeps payment checkout amount types numeric", () => {
    type PendingPrivateQuoteLine = Extract<
      LostPrivateQuoteLineSnapshot,
      { unitAmount: null }
    >;

    expectTypeOf<LostCartLineSnapshot["unitAmount"]>().toEqualTypeOf<number>();
    expectTypeOf<LostCartLineSnapshot["lineAmount"]>().toEqualTypeOf<number>();
    expectTypeOf<LostPrivateQuoteLineSnapshot["unitAmount"]>().toEqualTypeOf<
      number | null
    >();
    expectTypeOf<LostPrivateQuoteLineSnapshot["lineAmount"]>().toEqualTypeOf<
      number | null
    >();
    expectTypeOf<
      PendingPrivateQuoteLine["mode"]
    >().toEqualTypeOf<"private_order">();
    expectTypeOf<PendingPrivateQuoteLine["lineAmount"]>().toEqualTypeOf<null>();
  });
});
