import { describe, expect, it, vi } from "vitest";

import type { CommerceOrderRecord, CommerceRepository } from "./create-order";
import { getCommerceOrder } from "./get-order";

const order: CommerceOrderRecord = {
  id: "internal-order-id",
  ref: "ORD-12345678",
  userId: "owner-1",
  productId: "product-1",
  productName: "Product",
  productSlug: "product",
  quantity: 2,
  unitAmount: 10_000,
  totalAmount: 20_000,
  currency: "KRW",
  paymentMethod: "card",
  paymentStatus: "paid",
  status: "paid",
  idempotencyKey: "secret-idempotency-key",
  requestHash: "secret-request-hash",
  providerPaymentId: "provider-payment-id"
};

function repository(found: CommerceOrderRecord | null): CommerceRepository {
  return {
    findActiveProduct: vi.fn(),
    findOrderByIdempotencyKey: vi.fn(),
    findOrderByRef: vi.fn().mockResolvedValue(found),
    findOrderByProviderPaymentId: vi.fn(),
    createOrder: vi.fn(),
    updateOrderLifecycle: vi.fn()
  };
}

describe("getCommerceOrder", () => {
  it("returns the owner-safe projection", async () => {
    await expect(
      getCommerceOrder({
        repository: repository(order),
        ref: order.ref,
        userId: "owner-1"
      })
    ).resolves.toEqual({
      ref: order.ref,
      product: { id: "product-1", name: "Product", slug: "product" },
      quantity: 2,
      money: { currency: "KRW", unitAmount: 10_000, totalAmount: 20_000 },
      paymentMethod: "card",
      paymentStatus: "paid",
      status: "paid"
    });
  });

  it("returns not-found for another user", async () => {
    await expect(
      getCommerceOrder({
        repository: repository(order),
        ref: order.ref,
        userId: "other-1"
      })
    ).rejects.toThrow("order-not-found");
  });

  it("allows an admin to inspect the order", async () => {
    await expect(
      getCommerceOrder({
        repository: repository(order),
        ref: order.ref,
        userId: "admin-1",
        isAdmin: true
      })
    ).resolves.toMatchObject({ ref: order.ref, status: "paid" });
  });

  it("rejects malformed references before querying", async () => {
    const repo = repository(order);
    await expect(
      getCommerceOrder({ repository: repo, ref: "", userId: "owner-1" })
    ).rejects.toThrow("invalid-order-ref");
    expect(repo.findOrderByRef).not.toHaveBeenCalled();
  });
});
