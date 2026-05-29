import { describe, expect, it } from "vitest";
import { serializeLostCartLines, type LostCartLineClient } from "./useLostCart";

describe("serializeLostCartLines", () => {
  it("keeps variant identity but strips client-only cart display fields", () => {
    const lines: LostCartLineClient[] = [
      {
        productId: "product_1",
        productName: "Parasol 0230",
        productSlug: "parasol-0230",
        mode: "standard_purchase",
        variantId: "black-milk",
        variantLabel: "Black / Milk",
        quantity: 2,
        price: "₩118,000",
        unitAmount: 118000,
        currency: "KRW",
        imageUrl: "/media/parasol.webp"
      }
    ];

    expect(serializeLostCartLines(lines)).toEqual([
      {
        productId: "product_1",
        mode: "standard_purchase",
        variantId: "black-milk",
        quantity: 2
      }
    ]);
  });
});
