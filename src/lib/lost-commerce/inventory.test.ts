import { describe, expect, it, vi } from "vitest";

import { releaseStandardInventory } from "./inventory";

const locks = vi.hoisted(() => ({
  events: [] as string[],
  product: vi.fn(),
  sku: vi.fn()
}));

vi.mock("@/lib/db/sequences", () => ({
  productInventoryLock: locks.product,
  productSkuMutationLock: locks.sku
}));

describe("releaseStandardInventory", () => {
  it("locks sorted products and SKUs before reading relational SKU inventory", async () => {
    locks.events.length = 0;
    locks.product.mockReset().mockImplementation(async (_payload, _tx, id) => {
      locks.events.push(`product:${id}`);
    });
    locks.sku.mockReset().mockImplementation(async (_payload, _tx, id) => {
      locks.events.push(`sku:${id}`);
    });
    const payload = {
      findByID: vi.fn(async ({ id }) => {
        locks.events.push(`read:${id}`);
        return {
          id,
          inventory: 0,
          stock_state: "out_of_stock"
        };
      }),
      update: vi.fn(async ({ id }) => ({ id }))
    } as any;

    await releaseStandardInventory({
      payload,
      req: { transactionID: "tx-1" },
      order: {
        order_mode: "standard_purchase",
        payment_status: "failed",
        lines: [
          {
            schemaVersion: 2,
            mode: "standard_purchase",
            productId: "product-b",
            skuId: "sku-b",
            quantity: 1
          },
          {
            schemaVersion: 2,
            mode: "standard_purchase",
            productId: "product-a",
            skuId: "sku-a",
            quantity: 1
          }
        ]
      }
    });

    expect(locks.events.slice(0, 4)).toEqual([
      "product:product-a",
      "product:product-b",
      "sku:sku-a",
      "sku:sku-b"
    ]);
    expect(locks.events.indexOf("read:sku-b")).toBeGreaterThan(
      locks.events.indexOf("sku:sku-b")
    );
    expect(locks.events.indexOf("read:sku-a")).toBeGreaterThan(
      locks.events.indexOf("sku:sku-b")
    );
  });

  it("restores relational SKU inventory for a version 2 order snapshot", async () => {
    const payload = {
      findByID: vi.fn(async () => ({
        id: "sku-1",
        inventory: 0,
        stock_state: "out_of_stock"
      })),
      update: vi.fn(async () => ({ id: "sku-1" }))
    } as any;

    await releaseStandardInventory({
      payload,
      order: {
        order_mode: "standard_purchase",
        payment_status: "failed",
        lines: [
          {
            schemaVersion: 2,
            mode: "standard_purchase",
            productId: "product-1",
            skuId: "sku-1",
            quantity: 2
          }
        ]
      }
    });

    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-variants",
        id: "sku-1",
        data: { inventory: 2, stock_state: "in_stock" }
      })
    );
  });

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
