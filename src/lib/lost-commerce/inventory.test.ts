import { describe, expect, it, vi } from "vitest";

import { releaseStandardInventory } from "./inventory";

describe("releaseStandardInventory", () => {
  it("restores product-level standard inventory for unpaid orders", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "product-1",
        inventory: 0,
        stock_state: "out_of_stock"
      })),
      update: vi.fn(async () => ({ id: "product-1" }))
    } as any;

    await releaseStandardInventory({
      payload,
      order: {
        order_mode: "standard_purchase",
        payment_status: "failed",
        lines: [
          {
            mode: "standard_purchase",
            productId: "product-1",
            quantity: 2
          }
        ]
      }
    });

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        id: "product-1",
        data: {
          inventory: 2,
          stock_state: "in_stock"
        }
      })
    );
  });

  it("restores variant-level inventory when the original order used a variant", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "product-1",
        inventory: 10,
        variants: [
          {
            id: "small",
            label: "Small",
            inventory: 0,
            stock_state: "out_of_stock"
          }
        ]
      })),
      update: vi.fn(async () => ({ id: "product-1" }))
    } as any;

    await releaseStandardInventory({
      payload,
      order: {
        order_mode: "standard_purchase",
        payment_status: "failed",
        lines: [
          {
            mode: "standard_purchase",
            productId: "product-1",
            variantId: "small",
            quantity: 1
          }
        ]
      }
    });

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "products",
        id: "product-1",
        data: {
          variants: [
            {
              id: "small",
              label: "Small",
              inventory: 1,
              stock_state: "in_stock"
            }
          ]
        }
      })
    );
  });

  it("does not restore inventory for paid orders", async () => {
    const payload = {
      findByID: vi.fn(),
      update: vi.fn()
    } as any;

    await releaseStandardInventory({
      payload,
      order: {
        order_mode: "standard_purchase",
        payment_status: "paid",
        lines: [
          {
            mode: "standard_purchase",
            productId: "product-1",
            quantity: 1
          }
        ]
      }
    });

    expect(payload.findByID).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
  });
});
