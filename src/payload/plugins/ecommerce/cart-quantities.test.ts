import { describe, expect, it } from "vitest";
import {
  protectCartQuantities,
  validCartQuantityInput
} from "./cart-quantities";

describe("cart numeric integrity", () => {
  it.each([NaN, Infinity, -1, 0, 1.5, Number.MAX_SAFE_INTEGER + 1, "2"])(
    "rejects invalid stored quantity %s",
    (quantity) => {
      expect(() =>
        protectCartQuantities({ data: { items: [{ quantity }] } } as never)
      ).toThrow("cart-quantity-invalid");
    }
  );
  it("rejects overflowed aggregate quantities and computed subtotal", () => {
    expect(() =>
      protectCartQuantities({
        data: {
          items: [{ quantity: Number.MAX_SAFE_INTEGER }, { quantity: 1 }]
        }
      } as never)
    ).toThrow();
    expect(() =>
      protectCartQuantities({ data: { subtotal: Infinity } } as never)
    ).toThrow("cart-subtotal-invalid");
  });
  it("allows safe lines, empty carts and exact official deltas", () => {
    const data = { items: [{ quantity: 2 }], subtotal: 24000 };
    expect(protectCartQuantities({ data } as never)).toBe(data);
    expect(
      protectCartQuantities({ data: { items: [], subtotal: 0 } } as never)
    ).toEqual({ items: [], subtotal: 0 });
    expect(validCartQuantityInput("/:id/update-item", { $inc: -1 })).toBe(true);
    expect(validCartQuantityInput("/:id/update-item", 0)).toBe(true);
    expect(validCartQuantityInput("/:id/add-item", undefined)).toBe(true);
  });
  it.each([
    null,
    {},
    { $inc: "1" },
    { $inc: 1.2 },
    { $inc: 1, extra: true },
    [1],
    -1
  ])("rejects malformed update operator %s", (quantity) => {
    expect(validCartQuantityInput("/:id/update-item", quantity)).toBe(false);
  });
  it.each([null, 0, -1, 1.2, "1", { $inc: 1 }])(
    "rejects malformed add quantity %s",
    (quantity) => {
      expect(validCartQuantityInput("/:id/add-item", quantity)).toBe(false);
    }
  );
});
