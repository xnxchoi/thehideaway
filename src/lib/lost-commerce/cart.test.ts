import { describe, expect, it } from "vitest";
import { resolveLostCheckout } from "./cart";

function payloadWith(docs: Record<string, any>) {
  return {
    async findByID({ id }: { id: string }) {
      const doc = docs[id];
      if (!doc) throw new Error("not-found");
      return doc;
    }
  } as any;
}

describe("resolveLostCheckout", () => {
  it("snapshots a conventional purchase", async () => {
    const result = await resolveLostCheckout({
      payload: payloadWith({
        product_1: {
          id: "product_1",
          active: true,
          name: "Jacket",
          slug: "jacket",
          currency: "KRW",
          unit_amount: 120000,
          min_order_quantity: 1,
          max_order_quantity: 2,
          standard_enabled: true
        }
      }),
      user: { role: "user" },
      lines: [
        { productId: "product_1", mode: "standard_purchase", quantity: 2 }
      ]
    });

    expect(result.totalAmount).toBe(240000);
    expect(result.lines[0]).toMatchObject({
      productName: "Jacket",
      lineAmount: 240000
    });
  });

  it("rejects standard purchases when product stock is unavailable", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Sold out jacket",
            slug: "sold-out-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true,
            stock_state: "out_of_stock",
            inventory: 8
          }
        }),
        user: { role: "user" },
        lines: [
          { productId: "product_1", mode: "standard_purchase", quantity: 1 }
        ]
      })
    ).rejects.toThrow("out-of-stock");
  });

  it("rejects standard purchases above product inventory", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Limited jacket",
            slug: "limited-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 5,
            standard_enabled: true,
            stock_state: "in_stock",
            inventory: 1
          }
        }),
        user: { role: "user" },
        lines: [
          { productId: "product_1", mode: "standard_purchase", quantity: 2 }
        ]
      })
    ).rejects.toThrow("insufficient-inventory");
  });

  it("aggregates duplicate raw lines before enforcing max order quantity", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Limited jacket",
            slug: "limited-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true,
            stock_state: "in_stock",
            inventory: 5
          }
        }),
        user: { role: "user" },
        lines: [
          { productId: "product_1", mode: "standard_purchase", quantity: 2 },
          { productId: "product_1", mode: "standard_purchase", quantity: 1 }
        ]
      })
    ).rejects.toThrow("quantity-out-of-range");
  });

  it("rejects on-request products in standard purchase mode", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Request jacket",
            slug: "request-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true,
            stock_state: "on_request",
            inventory: 2
          }
        }),
        user: { role: "user" },
        lines: [
          { productId: "product_1", mode: "standard_purchase", quantity: 1 }
        ]
      })
    ).rejects.toThrow("standard-unavailable");
  });

  it("rejects unknown variant ids instead of falling back to product pricing", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Variant jacket",
            slug: "variant-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 2,
            standard_enabled: true,
            stock_state: "in_stock",
            inventory: 2,
            variants: [{ id: "small", amount: 120000, inventory: 1 }]
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            variantId: "large",
            mode: "standard_purchase",
            quantity: 1
          }
        ]
      })
    ).rejects.toThrow("variant-not-found");
  });

  it("rejects standard purchases above variant inventory", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Variant jacket",
            slug: "variant-jacket",
            currency: "KRW",
            unit_amount: 120000,
            min_order_quantity: 1,
            max_order_quantity: 5,
            standard_enabled: true,
            stock_state: "in_stock",
            inventory: 5,
            variants: [
              {
                id: "small",
                label: "Small",
                amount: 120000,
                inventory: 1,
                stock_state: "in_stock"
              }
            ]
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            variantId: "small",
            mode: "standard_purchase",
            quantity: 2
          }
        ]
      })
    ).rejects.toThrow("insufficient-inventory");
  });

  it("treats variant inventory as the standard-purchase cap when present", async () => {
    const result = await resolveLostCheckout({
      payload: payloadWith({
        product_1: {
          id: "product_1",
          active: true,
          name: "Variant jacket",
          slug: "variant-jacket",
          currency: "KRW",
          unit_amount: 120000,
          min_order_quantity: 1,
          max_order_quantity: 5,
          standard_enabled: true,
          stock_state: "in_stock",
          inventory: 1,
          variants: [
            {
              id: "small",
              label: "Small",
              amount: 120000,
              inventory: 2,
              stock_state: "in_stock"
            }
          ]
        }
      }),
      user: { role: "user" },
      lines: [
        {
          productId: "product_1",
          variantId: "small",
          mode: "standard_purchase",
          quantity: 2
        }
      ]
    });

    expect(result.totalAmount).toBe(240000);
  });

  it("requires an open campaign for request-to-order lines", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Coat",
            slug: "coat",
            currency: "KRW",
            unit_amount: 220000,
            min_order_quantity: 1,
            max_order_quantity: 1,
            request_to_order_enabled: true
          },
          campaign_1: {
            id: "campaign_1",
            product: "product_1",
            state: "draft",
            deadline: new Date(Date.now() + 86_400_000).toISOString()
          }
        }),
        user: { role: "user" },
        lines: [
          {
            productId: "product_1",
            mode: "request_to_order",
            quantity: 1,
            campaignId: "campaign_1"
          }
        ]
      })
    ).rejects.toThrow("campaign-not-open");
  });

  it("enforces private-order tier gates", async () => {
    await expect(
      resolveLostCheckout({
        payload: payloadWith({
          product_1: {
            id: "product_1",
            active: true,
            name: "Archive",
            slug: "archive",
            currency: "KRW",
            unit_amount: 330000,
            min_order_quantity: 1,
            max_order_quantity: 1,
            private_order_enabled: true,
            private_tier_gate: "patron"
          }
        }),
        user: { role: "resident" },
        lines: [
          { productId: "product_1", mode: "private_order", quantity: 1 }
        ]
      })
    ).rejects.toThrow("private-order-forbidden");
  });
});
