import { describe, expect, it, vi } from "vitest";

const { createLocalReq } = vi.hoisted(() => ({
  createLocalReq: vi.fn(async () => ({ context: {} }))
}));
vi.mock("payload", () => ({ createLocalReq }));

import { createPayloadCommerceRepository } from "./payload-repository";

const product = {
  id: "product-1",
  name: "Object",
  slug: "object",
  active: true,
  unit_amount: 12_000,
  max_quantity: 4
};

const order = {
  id: "order-1",
  ref: "ord_1",
  user: { id: "user-1" },
  product: "product-1",
  product_name_snapshot: "Object",
  product_slug_snapshot: "object",
  quantity: 2,
  unit_amount_snapshot: 12_000,
  total_amount: 24_000,
  payment_method: "card",
  payment_status: "pending",
  status: "awaiting_payment",
  idempotency_key: "idem-1",
  request_hash: "hash-1",
  provider_payment_id: "pay-1"
};

describe("Payload commerce repository", () => {
  it("maps an active product and hides an inactive one", async () => {
    const findByID = vi
      .fn()
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ ...product, active: false });
    const repository = createPayloadCommerceRepository({ findByID } as never);

    await expect(repository.findActiveProduct("product-1")).resolves.toEqual(
      expect.objectContaining({
        id: "product-1",
        currency: "KRW",
        unitAmount: 12_000
      })
    );
    await expect(repository.findActiveProduct("product-1")).resolves.toBeNull();
  });

  it.each([
    ["findOrderByIdempotencyKey", "idempotency_key", "idem-1"],
    ["findOrderByRef", "ref", "ord_1"],
    ["findOrderByProviderPaymentId", "provider_payment_id", "pay-1"]
  ] as const)("maps %s lookup results", async (method, field, value) => {
    const find = vi.fn(async () => ({ docs: [order] }));
    const repository = createPayloadCommerceRepository({ find } as never);

    await expect(repository[method](value)).resolves.toEqual(
      expect.objectContaining({ ref: "ord_1", userId: "user-1" })
    );
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { [field]: { equals: value } } })
    );
  });

  it("returns null when an order lookup is empty", async () => {
    const repository = createPayloadCommerceRepository({
      find: vi.fn(async () => ({ docs: [] }))
    } as never);

    await expect(repository.findOrderByRef("missing")).resolves.toBeNull();
  });

  it("creates a single order aggregate", async () => {
    const create = vi.fn(async () => order);
    const repository = createPayloadCommerceRepository({ create } as never);

    await repository.createOrder({
      ref: "ord_1",
      userId: "user-1",
      productId: "product-1",
      productName: "Object",
      productSlug: "object",
      quantity: 2,
      unitAmount: 12_000,
      totalAmount: 24_000,
      currency: "KRW",
      paymentMethod: "card",
      paymentStatus: "pending",
      status: "awaiting_payment",
      contact: {},
      shipping: {},
      idempotencyKey: "idem-1",
      requestHash: "hash-1",
      providerPaymentId: "pay-1"
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "commerce-orders",
        data: expect.objectContaining({ total_amount: 24_000 })
      })
    );
  });

  it("updates only explicitly supplied lifecycle fields", async () => {
    const update = vi.fn(async () => ({
      ...order,
      payment_status: "paid",
      status: "paid"
    }));
    const repository = createPayloadCommerceRepository({ update } as never);

    await repository.updateOrderLifecycle("order-1", {
      paymentStatus: "paid",
      status: "paid"
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { payment_status: "paid", status: "paid" }
      })
    );
    expect(createLocalReq).toHaveBeenCalled();
  });
});
