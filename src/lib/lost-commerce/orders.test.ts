import { describe, expect, it, vi } from "vitest";

import { cancelUnpaidProductOrder } from "./orders";

vi.mock("./inventory", () => ({
  releaseStandardInventory: vi.fn(async () => undefined)
}));

describe("cancelUnpaidProductOrder", () => {
  it("releases inventory and marks order/payment failed in one transaction", async () => {
    const { releaseStandardInventory } = await import("./inventory");
    const payload = {
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      find: vi.fn(async () => ({ docs: [{ id: "payment-1" }] })),
      update: vi.fn(async () => ({ id: "updated" }))
    } as any;

    const result = await cancelUnpaidProductOrder({
      payload,
      order: {
        id: "order-1",
        order_mode: "standard_purchase",
        payment_status: "pending",
        status: "pending_payment",
        lines: []
      }
    });

    expect(result).toEqual({ ok: true, canceled: true });
    expect(releaseStandardInventory).toHaveBeenCalledWith(
      expect.objectContaining({
        req: expect.objectContaining({ transactionID: "tx-1" })
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-orders",
        id: "order-1",
        req: expect.objectContaining({ transactionID: "tx-1" }),
        data: expect.objectContaining({
          status: "failed",
          payment_status: "failed",
          fulfillment_status: "canceled"
        })
      })
    );
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-payments",
        id: "payment-1",
        data: { status: "failed" }
      })
    );
    expect(payload.db.commitTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("does not release inventory for already-final orders", async () => {
    const { releaseStandardInventory } = await import("./inventory");
    vi.mocked(releaseStandardInventory).mockClear();
    const payload = {
      db: {
        beginTransaction: vi.fn()
      }
    } as any;

    const result = await cancelUnpaidProductOrder({
      payload,
      order: {
        id: "order-1",
        order_mode: "standard_purchase",
        payment_status: "failed",
        status: "failed",
        lines: []
      }
    });

    expect(result).toEqual({
      ok: true,
      canceled: false,
      reason: "already-final"
    });
    expect(payload.db.beginTransaction).not.toHaveBeenCalled();
    expect(releaseStandardInventory).not.toHaveBeenCalled();
  });
});
