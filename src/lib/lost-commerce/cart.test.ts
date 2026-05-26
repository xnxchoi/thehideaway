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
