import { describe, expect, it } from "vitest";

import { createMoneySnapshot, parseCreateOrderCommand } from "./contracts";

describe("minimal commerce contracts", () => {
  it.each(["card", "bank_transfer"] as const)(
    "accepts the %s payment method",
    (paymentMethod) => {
      expect(
        parseCreateOrderCommand({
          productId: "product-1",
          quantity: 2,
          paymentMethod
        })
      ).toEqual({ productId: "product-1", quantity: 2, paymentMethod });
    }
  );

  it.each([1, 99])("accepts the quantity boundary %s", (quantity) => {
    expect(
      parseCreateOrderCommand({
        productId: "product-1",
        quantity,
        paymentMethod: "card"
      }).quantity
    ).toBe(quantity);
  });

  it.each([0, -1, 1.5, 100, "2", Number.NaN])(
    "rejects the invalid quantity %s",
    (quantity) => {
      expect(() =>
        parseCreateOrderCommand({
          productId: "product-1",
          quantity,
          paymentMethod: "card"
        })
      ).toThrow();
    }
  );

  it.each(["manual", "portone", "cash", ""])(
    "rejects the legacy or unsupported payment method %s",
    (paymentMethod) => {
      expect(() =>
        parseCreateOrderCommand({
          productId: "product-1",
          quantity: 1,
          paymentMethod
        })
      ).toThrow();
    }
  );

  it("rejects client-owned commerce facts", () => {
    expect(() =>
      parseCreateOrderCommand({
        productId: "product-1",
        quantity: 1,
        paymentMethod: "card",
        totalAmount: 1
      })
    ).toThrow();
  });

  it("calculates integer KRW totals without mutating input", () => {
    const input = Object.freeze({ unitAmount: 33_000, quantity: 3 });

    const money = createMoneySnapshot(input);

    expect(money).toEqual({
      currency: "KRW",
      unitAmount: 33_000,
      totalAmount: 99_000
    });
    expect(input).toEqual({ unitAmount: 33_000, quantity: 3 });
    expect(Object.isFrozen(money)).toBe(true);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER])(
    "rejects invalid or overflowing money %s",
    (unitAmount) => {
      expect(() => createMoneySnapshot({ unitAmount, quantity: 99 })).toThrow();
    }
  );
});
