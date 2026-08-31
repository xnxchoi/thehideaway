import { describe, expect, it, vi } from "vitest";

import type { CommerceOrderRecord, CommerceRepository } from "./create-order";
import { transitionOrderStatus } from "./transition-order-status";

const order: CommerceOrderRecord = {
  id: "order-1",
  ref: "ORD-1",
  userId: "user-1",
  productId: "product-1",
  productName: "Object",
  productSlug: "object",
  quantity: 1,
  unitAmount: 10_000,
  totalAmount: 10_000,
  currency: "KRW",
  paymentMethod: "card",
  paymentStatus: "paid",
  status: "paid",
  idempotencyKey: "idem-123456789012",
  requestHash: "hash"
};

function repository(current = order): CommerceRepository {
  return {
    findActiveProduct: vi.fn(),
    findOrderByIdempotencyKey: vi.fn(),
    findOrderByProviderPaymentId: vi.fn(),
    findOrderByRef: vi.fn(async () => current),
    createOrder: vi.fn(),
    updateOrderLifecycle: vi.fn(async (_id, change) => ({
      ...current,
      status: change.status ?? current.status
    }))
  };
}

describe("fulfillment status transitions", () => {
  it("advances a paid order and records shipping metadata", async () => {
    const repo = repository({ ...order, status: "preparing" });

    await transitionOrderStatus({
      repository: repo,
      orderRef: "ORD-1",
      status: "shipped",
      trackingNumber: "TRACK-1",
      now: "2026-08-15T00:00:00.000Z"
    });

    expect(repo.updateOrderLifecycle).toHaveBeenCalledWith("order-1", {
      status: "shipped",
      trackingNumber: "TRACK-1",
      shippedAt: "2026-08-15T00:00:00.000Z"
    });
  });

  it("rejects unpaid and invalid transitions", async () => {
    await expect(
      transitionOrderStatus({
        repository: repository({ ...order, paymentStatus: "pending" }),
        orderRef: "ORD-1",
        status: "preparing"
      })
    ).rejects.toThrow("order-not-paid");
    await expect(
      transitionOrderStatus({
        repository: repository({ ...order, status: "paid" }),
        orderRef: "ORD-1",
        status: "completed"
      })
    ).rejects.toThrow("invalid-order-transition");
  });
});
