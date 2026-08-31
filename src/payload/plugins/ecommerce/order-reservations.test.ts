import { beforeEach, describe, expect, it, vi } from "vitest";

const tracked = vi.hoisted(() => ({
  consume: vi.fn(),
  release: vi.fn()
}));

vi.mock("@/lib/lost-commerce/inventory-reservations", () => ({
  consumeInventoryReservationInTransaction: tracked.consume
}));
vi.mock("@/lib/lost-commerce/order-inventory-reservations", () => ({
  releaseOrderInventoryReservationsInTransaction: tracked.release
}));

describe("plugin order reservations", () => {
  beforeEach(() => {
    tracked.consume.mockReset().mockResolvedValue({ kind: "created" });
    tracked.release.mockReset().mockResolvedValue([]);
  });

  it("skips commit when inventory-reservations is not registered", async () => {
    const { commitPluginOrderReservations } = await import(
      "./order-reservations"
    );
    const payload = {
      collections: { orders: {} },
      find: vi.fn()
    };
    await expect(
      commitPluginOrderReservations({
        payload: payload as never,
        req: { transactionID: "tx-1" } as never,
        orderId: "order-1",
        idempotencyKey: "pay1commitxxxxxxxx",
        effectiveAt: "2026-08-31T00:00:00.000Z"
      })
    ).resolves.toEqual({ kind: "skipped" });
    expect(payload.find).not.toHaveBeenCalled();
  });

  it("consumes active reservations for a plugin order", async () => {
    const { commitPluginOrderReservations } = await import(
      "./order-reservations"
    );
    const payload = {
      collections: { "inventory-reservations": {}, orders: {} },
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: "res-1",
            sku: "var-1",
            location: "loc-1",
            quantity: 2
          }
        ]
      })
    };
    await expect(
      commitPluginOrderReservations({
        payload: payload as never,
        req: { transactionID: "tx-1" } as never,
        orderId: "order-1",
        idempotencyKey: "pay1commitxxxxxxxx",
        effectiveAt: "2026-08-31T00:00:00.000Z"
      })
    ).resolves.toEqual({ kind: "committed" });
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "inventory-reservations",
        where: { order: { equals: "order-1" } }
      })
    );
    expect(tracked.consume).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          operation: "consume",
          orderId: "order-1",
          reservationId: "res-1",
          skuId: "var-1",
          locationId: "loc-1",
          quantity: 2
        })
      })
    );
  });

  it("releases reservations when an unpaid plugin order is canceled", async () => {
    const { releasePluginOrderReservations } = await import(
      "./order-reservations"
    );
    const payload = {
      collections: { "inventory-reservations": {} }
    };
    await releasePluginOrderReservations({
      payload: payload as never,
      req: { transactionID: "tx-1" } as never,
      orderId: "order-1",
      idempotencyKey: "pay1cancelxxxxxxxx",
      effectiveAt: "2026-08-31T00:00:00.000Z"
    });
    expect(tracked.release).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        idempotencyKey: "pay1cancelxxxxxxxx"
      })
    );
  });
});
