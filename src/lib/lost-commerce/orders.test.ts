import { describe, expect, it, vi } from "vitest";

import { cancelUnpaidProductOrder } from "./orders";

const releaseOrderInventoryReservationsInTransaction = vi.hoisted(() =>
  vi.fn(async () => undefined)
);
const lockEvents = vi.hoisted(() => [] as string[]);
const lockOrderInventoryReservationsInTransaction = vi.hoisted(() =>
  vi.fn(async () => lockEvents.push("reservation"))
);
const paymentWebhookLock = vi.hoisted(() =>
  vi.fn(async () => lockEvents.push("payment"))
);

vi.mock("./inventory-reservations", () => ({
  lockOrderInventoryReservationsInTransaction
}));

vi.mock("./order-inventory-reservations", () => ({
  releaseOrderInventoryReservationsInTransaction
}));

vi.mock("@/lib/db/sequences", () => ({
  paymentWebhookLock
}));

describe("cancelUnpaidProductOrder", () => {
  it("releases the order reservation and marks order/payment failed in one transaction", async () => {
    lockEvents.length = 0;
    releaseOrderInventoryReservationsInTransaction.mockClear();
    const payload = {
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  order_mode: "standard_purchase",
                  payment_status: "pending",
                  status: "pending_payment",
                  lines: []
                }
              ]
            : [{ id: "payment-1", status: "pending" }]
      })),
      update: vi.fn(async () => ({ id: "updated" }))
    } as any;

    const result = await cancelUnpaidProductOrder({
      payload,
      order: {
        id: "order-1",
        order_ref: "lis_1",
        order_mode: "standard_purchase",
        payment_status: "pending",
        status: "pending_payment",
        lines: []
      }
    });

    expect(result).toEqual({ ok: true, canceled: true });
    expect(paymentWebhookLock).toHaveBeenCalledWith(payload, "tx-1", "lis_1");
    expect(lockEvents).toEqual(["reservation", "payment"]);
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "product-payments",
        pagination: false
      })
    );
    expect(releaseOrderInventoryReservationsInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        payload,
        req: expect.objectContaining({ transactionID: "tx-1" }),
        orderId: "order-1"
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
    releaseOrderInventoryReservationsInTransaction.mockClear();
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
    expect(releaseOrderInventoryReservationsInTransaction).not.toHaveBeenCalled();
  });

  it("rejects an inconsistent paid payment before releasing inventory", async () => {
    releaseOrderInventoryReservationsInTransaction.mockClear();
    const payload = {
      db: {
        beginTransaction: vi.fn(async () => "tx-1"),
        commitTransaction: vi.fn(async () => undefined),
        rollbackTransaction: vi.fn(async () => undefined)
      },
      find: vi.fn(async ({ collection }) => ({
        docs:
          collection === "product-orders"
            ? [
                {
                  id: "order-1",
                  order_ref: "lis_1",
                  order_mode: "standard_purchase",
                  payment_status: "pending",
                  status: "pending_payment",
                  lines: []
                }
              ]
            : [{ id: "payment-1", status: "paid" }]
      })),
      update: vi.fn()
    } as any;

    await expect(
      cancelUnpaidProductOrder({
        payload,
        order: {
          id: "order-1",
          order_ref: "lis_1",
          payment_status: "pending",
          status: "pending_payment"
        }
      })
    ).rejects.toThrow("invalid-commerce-transition");

    expect(releaseOrderInventoryReservationsInTransaction).not.toHaveBeenCalled();
    expect(payload.update).not.toHaveBeenCalled();
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith("tx-1");
  });
});
