import { describe, expect, it } from "vitest";
import {
  normalizeLostDropCard,
  normalizeLostProductVariants
} from "./query-normalizers";

describe("lost commerce query normalization", () => {
  it("normalizes product variants from Payload json fields", () => {
    expect(
      normalizeLostProductVariants({
        variants: [
          {
            id: "black-milk",
            sku: "LIS-PSL-0230-BM",
            label: "Black / Milk",
            color: "Black / Milk",
            amount: 118000,
            inventory: 5,
            stock_state: "in_stock"
          },
          {
            id: "size-2",
            size: "2",
            stock_state: "pre_order"
          },
          {
            id: "",
            label: "Broken"
          },
          null
        ]
      })
    ).toEqual([
      {
        id: "black-milk",
        sku: "LIS-PSL-0230-BM",
        label: "Black / Milk",
        size: null,
        color: "Black / Milk",
        amount: 118000,
        inventory: 5,
        stockState: "in_stock"
      },
      {
        id: "size-2",
        sku: null,
        label: "2",
        size: "2",
        color: null,
        amount: null,
        inventory: null,
        stockState: "pre_order"
      }
    ]);
  });

  it("normalizes active drop cards without leaking Payload fields", () => {
    expect(
      normalizeLostDropCard({
        id: "drop_1",
        title: "Available Now",
        slug: "available-now",
        kicker: "Dispatch 01",
        lede: "Objects and editions ready for immediate checkout."
      })
    ).toEqual({
      title: "Available Now",
      slug: "available-now",
      kicker: "Dispatch 01",
      lede: "Objects and editions ready for immediate checkout."
    });
  });
});
