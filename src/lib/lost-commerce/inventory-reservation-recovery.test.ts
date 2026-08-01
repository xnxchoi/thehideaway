import { beforeEach, describe, expect, it, vi } from "vitest";

const tracked = vi.hoisted(() => ({
  findById: vi.fn(),
  findDocs: vi.fn(),
  history: vi.fn(),
  reserve: vi.fn(),
  consume: vi.fn()
}));

vi.mock("./inventory-reservation-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./inventory-reservation-store")>()),
  findReservationDocById: tracked.findById,
  findReservationDocs: tracked.findDocs,
  requireReservationTransaction: vi.fn(() => "tx-1")
}));
vi.mock("./inventory-reservation-reconstruction", () => ({
  reservationHistory: tracked.history
}));
vi.mock("./inventory-reservations", () => ({
  reserveOrderInventoryInTransaction: tracked.reserve,
  consumeInventoryReservationInTransaction: tracked.consume
}));

import { recoverPaidInventoryReservationsInTransaction } from "./inventory-reservation-recovery";

function reservation(id: string, safetyStock: number) {
  return {
    id,
    sku: `sku-${id}`,
    location: "location-1",
    quantity: 1,
    recovery_of: null,
    policy_version: 1,
    ttl_minutes: 15,
    safety_stock: safetyStock,
    consume_point: "payment_confirmed",
    expiry_boundary: "at_or_after",
    payment_time_source: "provider_paid_at",
    late_payment_policy: "manual_review",
    backorder_mode: "disabled"
  };
}

function recoveryInput(payload: unknown) {
  return {
    payload: payload as never,
    req: {
      payload,
      transactionID: "tx-1",
      context: { user: { role: "admin" } }
    } as never,
    orderId: "order-1",
    paymentId: "payment-1",
    idempotencyKey: "a".repeat(32),
    providerEventRef: "provider:event-1",
    effectiveAt: "2026-07-23T00:00:00.000Z",
    locksHeld: true
  } as const;
}

describe("paid inventory reservation recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tracked.findDocs.mockResolvedValue([
      reservation("reservation-1", 0),
      reservation("reservation-2", 1)
    ]);
    tracked.findById.mockResolvedValue({ code: "primary" });
    tracked.history.mockResolvedValue({ status: "released" });
  });

  it("fails closed when immutable roots carry different policies", async () => {
    const payload = {} as never;
    await expect(
      recoverPaidInventoryReservationsInTransaction(recoveryInput(payload))
    ).rejects.toThrow("inventory-reservation-recovery-policy-mismatch");
    expect(tracked.reserve).not.toHaveBeenCalled();
    expect(tracked.consume).not.toHaveBeenCalled();
  });

  it("consumes active originals without creating recovery reservations", async () => {
    tracked.findDocs.mockResolvedValue([reservation("reservation-1", 0)]);
    tracked.history.mockResolvedValue({ status: "active" });
    tracked.consume.mockResolvedValue({ kind: "consumed" });
    const payload = {};

    await expect(
      recoverPaidInventoryReservationsInTransaction(recoveryInput(payload))
    ).resolves.toEqual({ kind: "confirmed", affectedCount: 1 });
    expect(tracked.reserve).not.toHaveBeenCalled();
    expect(tracked.consume).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: "payment-1",
        providerEventRef: "provider:event-1",
        request: expect.objectContaining({
          orderId: "order-1",
          reservationId: "reservation-1"
        })
      })
    );
  });

  it("reserves and consumes replacement stock for a released original", async () => {
    const original = reservation("reservation-1", 0);
    const recovery = {
      ...reservation("recovery-1", 0),
      recovery_of: "reservation-1"
    };
    tracked.findDocs.mockResolvedValue([original]);
    tracked.history
      .mockResolvedValueOnce({ status: "released" })
      .mockResolvedValueOnce({ status: "active" });
    tracked.reserve.mockResolvedValue({
      results: [{ kind: "created", reservation: recovery }]
    });
    tracked.consume.mockResolvedValue({ kind: "consumed" });

    await expect(
      recoverPaidInventoryReservationsInTransaction(recoveryInput({}))
    ).resolves.toEqual({ kind: "confirmed", affectedCount: 1 });
    expect(tracked.reserve).toHaveBeenCalledWith(
      expect.objectContaining({
        requests: [
          expect.objectContaining({
            operation: "reserve",
            recoveryOf: "reservation-1"
          })
        ]
      })
    );
    expect(tracked.consume).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({ reservationId: "recovery-1" })
      })
    );
  });

  it("returns review_remaining when replacement stock is unavailable", async () => {
    tracked.findDocs.mockResolvedValue([reservation("reservation-1", 0)]);
    tracked.history.mockResolvedValue({ status: "expired" });
    tracked.reserve.mockRejectedValue(
      new Error("insufficient-available-to-promise")
    );

    await expect(
      recoverPaidInventoryReservationsInTransaction(recoveryInput({}))
    ).resolves.toEqual({ kind: "review_remaining", affectedCount: 0 });
    expect(tracked.consume).not.toHaveBeenCalled();
  });

  it("uses an existing active recovery without reserving twice", async () => {
    const original = reservation("reservation-1", 0);
    const recovery = {
      ...reservation("recovery-1", 0),
      recovery_of: "reservation-1"
    };
    tracked.findDocs.mockResolvedValue([original, recovery]);
    tracked.history
      .mockResolvedValueOnce({ status: "released" })
      .mockResolvedValueOnce({ status: "active" });
    tracked.consume.mockResolvedValue({ kind: "consumed" });

    await expect(
      recoverPaidInventoryReservationsInTransaction(recoveryInput({}))
    ).resolves.toEqual({ kind: "confirmed", affectedCount: 1 });
    expect(tracked.reserve).not.toHaveBeenCalled();
    expect(tracked.consume).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({ reservationId: "recovery-1" })
      })
    );
  });

  it("fails closed when more than one recovery references an original", async () => {
    tracked.findDocs.mockResolvedValue([
      reservation("reservation-1", 0),
      { ...reservation("recovery-1", 0), recovery_of: "reservation-1" },
      { ...reservation("recovery-2", 0), recovery_of: "reservation-1" }
    ]);

    await expect(
      recoverPaidInventoryReservationsInTransaction(recoveryInput({}))
    ).rejects.toThrow("inventory-reservation-history-corrupt");
    expect(tracked.reserve).not.toHaveBeenCalled();
    expect(tracked.consume).not.toHaveBeenCalled();
  });
});
