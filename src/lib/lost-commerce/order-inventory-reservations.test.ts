import { beforeEach, describe, expect, it, vi } from "vitest";

const tracked = vi.hoisted(() => ({
  find: vi.fn(),
  history: vi.fn(),
  lock: vi.fn(),
  release: vi.fn()
}));

vi.mock("./inventory-reservation-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./inventory-reservation-store")>()),
  findReservationDocs: tracked.find
}));
vi.mock("./inventory-reservation-reconstruction", () => ({
  reservationHistory: tracked.history
}));
vi.mock("./inventory-reservation-locks", () => ({
  lockOrderInventoryReservationsInTransaction: tracked.lock
}));
vi.mock("./inventory-reservations", () => ({
  releaseOrderInventoryInTransaction: tracked.release
}));

describe("release order inventory reservations", () => {
  beforeEach(() => {
    tracked.find.mockReset();
    tracked.history.mockReset();
    tracked.lock.mockReset();
    tracked.release.mockReset().mockResolvedValue({ kind: "created" });
  });

  it("releases each active reservation and skips terminal history when locks are held", async () => {
    const reservations = [
      {
        id: "reservation-active",
        sku: "sku-1",
        location: "location-1",
        quantity: 2
      },
      {
        id: "reservation-released",
        sku: "sku-2",
        location: "location-1",
        quantity: 1
      }
    ];
    tracked.find.mockResolvedValue(reservations);
    tracked.history
      .mockResolvedValueOnce({ status: "active" })
      .mockResolvedValueOnce({ status: "released" });

    const { releaseOrderInventoryReservationsInTransaction } =
      await import("./order-inventory-reservations");
    const result = await releaseOrderInventoryReservationsInTransaction({
      payload: {} as any,
      req: {
        payload: {} as any,
        context: { user: { role: "admin" } },
        transactionID: "tx-1"
      },
      orderId: "order-1",
      idempotencyKey: "cancel-command-1",
      effectiveAt: "2026-07-22T03:00:00.000Z",
      locksHeld: true
    });

    expect(tracked.lock).not.toHaveBeenCalled();
    expect(tracked.release).toHaveBeenCalledTimes(1);
    expect(tracked.release).toHaveBeenCalledWith(
      expect.objectContaining({
        locksHeld: true,
        request: expect.objectContaining({
          operation: "release",
          orderId: "order-1",
          reservationId: "reservation-active",
          skuId: "sku-1",
          locationId: "location-1",
          quantity: 2
        })
      })
    );
    expect(result).toEqual([{ kind: "created" }]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("acquires order locks and rejects corrupt active relationships", async () => {
    tracked.lock.mockResolvedValue([
      {
        id: "reservation-active",
        sku: null,
        location: "location-1",
        quantity: 1
      }
    ]);
    tracked.history.mockResolvedValue({ status: "active" });

    const { releaseOrderInventoryReservationsInTransaction } =
      await import("./order-inventory-reservations");
    await expect(
      releaseOrderInventoryReservationsInTransaction({
        payload: {} as any,
        req: {
          payload: {} as any,
          context: { user: { role: "admin" } },
          transactionID: "tx-1"
        },
        orderId: "order-1",
        idempotencyKey: "cancel-command-1",
        effectiveAt: "2026-07-22T03:00:00.000Z"
      })
    ).rejects.toThrow("inventory-reservation-history-corrupt");

    expect(tracked.lock).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1" })
    );
  });
});
