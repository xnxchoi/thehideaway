import { describe, expect, it } from "vitest";

import { cartLinesMatch, lostCartItemMatcher } from "./cart-item-matcher";

type CartLine = {
  product: string | { id: string };
  variant?: string | { id: string };
  quantity: number;
  mode?: string;
  campaign?: string | { id: string } | null;
};

function addItem(
  items: CartLine[],
  newItem: Omit<CartLine, "quantity">,
  quantity = 1
): CartLine[] {
  const index = items.findIndex((existingItem) =>
    cartLinesMatch(existingItem, newItem)
  );
  if (index === -1) {
    return [...items, { ...newItem, quantity }];
  }
  return items.map((item, itemIndex) =>
    itemIndex === index
      ? { ...item, quantity: item.quantity + quantity }
      : item
  );
}

describe("lostCartItemMatcher", () => {
  it("matches the same product, variant, mode, and campaign", () => {
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase",
          campaign: "camp-1"
        },
        newItem: {
          product: "prod-1",
          variant: "var-1",
          mode: "standard_purchase",
          campaign: "camp-1"
        }
      })
    ).toBe(true);
  });

  it("keeps the same SKU as two lines when the order mode differs", () => {
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase"
        },
        newItem: {
          product: "prod-1",
          variant: "var-1",
          mode: "request_to_order"
        }
      })
    ).toBe(false);
  });

  it("keeps the same SKU and mode as two lines when the campaign differs", () => {
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "request_to_order",
          campaign: "camp-1"
        },
        newItem: {
          product: "prod-1",
          variant: "var-1",
          mode: "request_to_order",
          campaign: "camp-2"
        }
      })
    ).toBe(false);
  });

  it("treats missing, null, empty, and whitespace campaigns as the same line", () => {
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase"
        },
        newItem: {
          product: "prod-1",
          variant: "var-1",
          mode: "standard_purchase",
          campaign: null
        }
      })
    ).toBe(true);
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase",
          campaign: ""
        },
        newItem: {
          product: "prod-1",
          variant: "var-1",
          mode: "standard_purchase"
        }
      })
    ).toBe(true);
    expect(
      cartLinesMatch(
        {
          product: "prod-1",
          variant: "var-1",
          mode: "standard_purchase",
          campaign: "   "
        },
        {
          product: "prod-1",
          variant: "var-1",
          mode: "standard_purchase"
        }
      )
    ).toBe(true);
  });

  it("trims product, variant, and campaign ids before matching", () => {
    expect(
      cartLinesMatch(
        {
          product: " prod-1 ",
          variant: "var-1",
          mode: "request_to_order",
          campaign: "camp-1 "
        },
        {
          product: "prod-1",
          variant: " var-1",
          mode: "request_to_order",
          campaign: "camp-1"
        }
      )
    ).toBe(true);
  });

  it("normalizes populated product, variant, and campaign objects", () => {
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: { id: "prod-1" },
          variant: { id: "var-1" },
          quantity: 2,
          mode: "request_to_order",
          campaign: { id: "camp-1" }
        },
        newItem: {
          product: "prod-1",
          variant: "var-1",
          mode: "request_to_order",
          campaign: "camp-1"
        }
      })
    ).toBe(true);
  });

  it("matches merge-shaped items when both sides are populated objects", () => {
    expect(
      cartLinesMatch(
        {
          product: { id: "prod-1" },
          variant: { id: "var-1" },
          quantity: 1,
          mode: "private_order"
        },
        {
          product: { id: "prod-1" },
          variant: { id: "var-1" },
          mode: "private_order"
        }
      )
    ).toBe(true);
  });

  it("defaults a missing mode to standard_purchase", () => {
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1
        },
        newItem: {
          product: "prod-1",
          variant: "var-1",
          mode: "standard_purchase"
        }
      })
    ).toBe(true);
  });

  it("does not match different products or variants", () => {
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase"
        },
        newItem: {
          product: "prod-2",
          variant: "var-1",
          mode: "standard_purchase"
        }
      })
    ).toBe(false);
    expect(
      lostCartItemMatcher({
        existingItem: {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase"
        },
        newItem: {
          product: "prod-1",
          variant: "var-2",
          mode: "standard_purchase"
        }
      })
    ).toBe(false);
  });
});

describe("lostCartItemMatcher used like addItem", () => {
  it("increments quantity for the same SKU and mode", () => {
    const items = addItem(
      [
        {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase"
        }
      ],
      {
        product: "prod-1",
        variant: "var-1",
        mode: "standard_purchase"
      },
      2
    );
    expect(items).toEqual([
      {
        product: "prod-1",
        variant: "var-1",
        quantity: 3,
        mode: "standard_purchase"
      }
    ]);
  });

  it("adds a second line when the same SKU is added in another mode", () => {
    const items = addItem(
      [
        {
          product: "prod-1",
          variant: "var-1",
          quantity: 1,
          mode: "standard_purchase"
        }
      ],
      {
        product: "prod-1",
        variant: "var-1",
        mode: "request_to_order"
      }
    );
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.mode)).toEqual([
      "standard_purchase",
      "request_to_order"
    ]);
  });
});
