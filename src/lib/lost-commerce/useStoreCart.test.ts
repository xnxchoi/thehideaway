import { describe, expect, it } from "vitest";
import { serializeStoreCartLines, type StoreCartLine } from "./useStoreCart";

describe("serializeStoreCartLines", () => {
  it("emits the relational SKU identity in the cart request payload", () => {
    const lines: StoreCartLine[] = [
      {
        productId: "product_1",
        skuId: "sku_1",
        productName: "Product 1",
        productSlug: "product-1",
        mode: "standard_purchase",
        quantity: 2,
        price: "KRW 1000",
        unitAmount: 1000,
        currency: "KRW"
      }
    ];

    const requestBody = JSON.parse(
      JSON.stringify({ lines: serializeStoreCartLines(lines) })
    );

    expect(requestBody).toStrictEqual({
      lines: [
        {
          productId: "product_1",
          skuId: "sku_1",
          mode: "standard_purchase",
          quantity: 2
        }
      ]
    });
    expect(requestBody.lines[0]).not.toHaveProperty("variantId");
  });
});
