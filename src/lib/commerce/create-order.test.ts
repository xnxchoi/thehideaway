import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCommerceOrder,
  hashCreateOrderRequest,
  type CommerceOrderRecord,
  type CommerceRepository
} from "./create-order";

const product = Object.freeze({
  id: "product-1",
  name: "향수 🧪",
  slug: "fragrance",
  active: true,
  currency: "KRW" as const,
  unitAmount: 45_000,
  maxQuantity: 3
});

function orderRecord(
  overrides: Partial<CommerceOrderRecord> = {}
): CommerceOrderRecord {
  return {
    id: "order-id",
    ref: "ORD-TEST",
    userId: "user-1",
    productId: product.id,
    productName: product.name,
    productSlug: product.slug,
    quantity: 2,
    unitAmount: product.unitAmount,
    totalAmount: 90_000,
    currency: "KRW",
    paymentMethod: "bank_transfer",
    paymentStatus: "pending",
    status: "awaiting_payment",
    idempotencyKey: "idem-123456789012",
    requestHash: "hash",
    bankTransferReference: "ORD-TEST",
    ...overrides
  };
}

describe("createCommerceOrder", () => {
  let repository: CommerceRepository;

  beforeEach(() => {
    repository = {
      findActiveProduct: vi.fn().mockResolvedValue(product),
      findOrderByIdempotencyKey: vi.fn().mockResolvedValue(null),
      findOrderByRef: vi.fn().mockResolvedValue(null),
      findOrderByProviderPaymentId: vi.fn().mockResolvedValue(null),
      createOrder: vi.fn().mockImplementation(async (input) => ({
        ...orderRecord(),
        ...input,
        id: "order-id"
      })),
      updateOrderLifecycle: vi.fn()
    };
  });

  it("uses the current server product price and snapshots the product", async () => {
    const result = await createCommerceOrder({
      repository,
      userId: "user-1",
      idempotencyKey: "idem-123456789012",
      command: {
        productId: product.id,
        quantity: 2,
        paymentMethod: "bank_transfer"
      },
      contact: { name: "Buyer", email: "buyer@example.com" },
      shipping: { address: "Seoul" }
    });

    expect(repository.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        productName: "향수 🧪",
        quantity: 2,
        unitAmount: 45_000,
        totalAmount: 90_000,
        currency: "KRW",
        paymentMethod: "bank_transfer",
        paymentStatus: "pending",
        status: "awaiting_payment"
      })
    );
    expect(result.nextAction).toEqual({
      type: "bank_transfer",
      reference: expect.any(String)
    });
  });

  it("creates a stable card payment identifier", async () => {
    const result = await createCommerceOrder({
      repository,
      userId: "user-1",
      idempotencyKey: "idem-123456789012",
      command: {
        productId: product.id,
        quantity: 1,
        paymentMethod: "card"
      },
      contact: { name: "Buyer", email: "buyer@example.com" },
      shipping: { address: "Seoul" }
    });

    expect(result.nextAction).toEqual({
      type: "card",
      paymentId: result.order.ref
    });
  });

  it("rejects missing, inactive, and over-limit products before writing", async () => {
    vi.mocked(repository.findActiveProduct).mockResolvedValueOnce(null);
    await expect(
      createCommerceOrder({
        repository,
        userId: "user-1",
        idempotencyKey: "idem-123456789012",
        command: {
          productId: "missing",
          quantity: 1,
          paymentMethod: "card"
        },
        contact: { name: "Buyer", email: "buyer@example.com" },
        shipping: { address: "Seoul" }
      })
    ).rejects.toThrow("product-unavailable");

    await expect(
      createCommerceOrder({
        repository,
        userId: "user-1",
        idempotencyKey: "idem-123456789012",
        command: {
          productId: product.id,
          quantity: 4,
          paymentMethod: "card"
        },
        contact: { name: "Buyer", email: "buyer@example.com" },
        shipping: { address: "Seoul" }
      })
    ).rejects.toThrow("quantity-unavailable");
    expect(repository.createOrder).not.toHaveBeenCalled();
  });

  it("replays the same idempotent request", async () => {
    const request = {
      userId: "user-1",
      command: {
        productId: product.id,
        quantity: 2,
        paymentMethod: "bank_transfer" as const
      },
      contact: { name: "Buyer", email: "buyer@example.com" },
      shipping: { address: "Seoul" }
    };
    const existing = orderRecord({
      requestHash: hashCreateOrderRequest(request)
    });
    vi.mocked(repository.findOrderByIdempotencyKey).mockResolvedValue(existing);

    const result = await createCommerceOrder({
      repository,
      ...request,
      idempotencyKey: existing.idempotencyKey
    });

    expect(result.order.ref).toBe(existing.ref);
    expect(repository.createOrder).not.toHaveBeenCalled();
  });

  it("rejects reuse of an idempotency key for different input", async () => {
    vi.mocked(repository.findOrderByIdempotencyKey).mockResolvedValue(
      orderRecord({ requestHash: "different" })
    );

    await expect(
      createCommerceOrder({
        repository,
        userId: "user-1",
        idempotencyKey: "idem-123456789012",
        command: {
          productId: product.id,
          quantity: 1,
          paymentMethod: "card"
        },
        contact: { name: "Buyer", email: "buyer@example.com" },
        shipping: { address: "Seoul" }
      })
    ).rejects.toThrow("idempotency-conflict");
  });
});
