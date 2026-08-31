import { describe, expect, it } from "vitest";

import { serverCartAmount } from "./amount";

describe("serverCartAmount", () => {
  it("uses the server cart subtotal and ignores a client amount", () => {
    expect(
      serverCartAmount({
        subtotal: 120000,
        items: [{ quantity: 1, line_amount: 120000 }]
      })
    ).toBe(120000);
    expect(
      serverCartAmount({
        subtotal: 120000,
        items: [{ quantity: 1, line_amount: 120000 }],
        amount: 1
      } as never)
    ).toBe(120000);
  });

  it("rejects missing, zero, or non-integer totals", () => {
    expect(() => serverCartAmount({ items: [] })).toThrow("invalid-cart-amount");
    expect(() => serverCartAmount({ subtotal: 0, items: [] })).toThrow(
      "invalid-cart-amount"
    );
    expect(() => serverCartAmount({ subtotal: 12.5, items: [] })).toThrow(
      "invalid-cart-amount"
    );
  });

  it("rejects a snapshot total that does not match the cart subtotal", () => {
    expect(() =>
      serverCartAmount({
        subtotal: 120000,
        items: [
          { quantity: 1, line_amount: 1000 },
          { quantity: 1, line_amount: 1000 }
        ]
      })
    ).toThrow("cart-amount-mismatch");
  });
});
