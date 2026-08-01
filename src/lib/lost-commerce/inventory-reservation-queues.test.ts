import { describe, expect, it } from "vitest";

import {
  classifyInventoryReservationQueue,
  hashInventoryReservationQueueVersion
} from "./inventory-reservation-queues";

const now = "2026-07-23T00:00:00.000Z";
const expiringBefore = "2026-07-23T00:15:00.000Z";

function reservation(id: string, expiresAt: string, status = "active") {
  return {
    id,
    status,
    expiresAt,
    updatedAt: "2026-07-22T23:00:00.000Z",
    terminalAt: null
  };
}

describe("inventory reservation operator queues", () => {
  it("classifies whole-order active, expiring, and stuck states", () => {
    expect(
      classifyInventoryReservationQueue({
        orderStatus: "pending_payment",
        reservations: [reservation("r1", "2026-07-23T01:00:00.000Z")],
        now,
        expiringBefore
      })
    ).toBe("active");
    expect(
      classifyInventoryReservationQueue({
        orderStatus: "pending_payment",
        reservations: [reservation("r1", "2026-07-23T00:10:00.000Z")],
        now,
        expiringBefore
      })
    ).toBe("expiring");
    expect(
      classifyInventoryReservationQueue({
        orderStatus: "pending_payment",
        reservations: [reservation("r1", now)],
        now,
        expiringBefore
      })
    ).toBe("stuck");
  });

  it("does not call a partially due multi-line order stuck", () => {
    expect(
      classifyInventoryReservationQueue({
        orderStatus: "pending_payment",
        reservations: [
          reservation("r1", "2026-07-22T23:59:00.000Z"),
          reservation("r2", "2026-07-23T00:20:00.000Z")
        ],
        now,
        expiringBefore
      })
    ).toBe("active");
  });

  it("prioritizes payment review and excludes terminal-only orders", () => {
    expect(
      classifyInventoryReservationQueue({
        orderStatus: "paid_inventory_review",
        reservations: [reservation("r1", now, "expired")],
        now,
        expiringBefore
      })
    ).toBe("paid_inventory_review");
    expect(
      classifyInventoryReservationQueue({
        orderStatus: "confirmed",
        reservations: [reservation("r1", now, "consumed")],
        now,
        expiringBefore
      })
    ).toBeNull();
  });

  it("hashes only sorted operational state", () => {
    const state = {
      order: {
        id: "order-1",
        status: "pending_payment",
        paymentStatus: "pending",
        updatedAt: now,
        customerEmail: "first@example.com"
      },
      payment: {
        id: "payment-1",
        status: "pending",
        paidAt: null,
        updatedAt: now,
        requestPayload: { secret: "first" }
      },
      reservations: [
        reservation("r2", "2026-07-23T00:10:00.000Z"),
        reservation("r1", "2026-07-23T00:10:00.000Z")
      ]
    };
    const reordered = {
      ...state,
      order: { ...state.order, customerEmail: "second@example.com" },
      payment: {
        ...state.payment,
        requestPayload: { secret: "second" }
      },
      reservations: [...state.reservations].reverse()
    };

    expect(hashInventoryReservationQueueVersion(state)).toBe(
      hashInventoryReservationQueueVersion(reordered)
    );
    expect(hashInventoryReservationQueueVersion(state)).toMatch(
      /^[a-f0-9]{64}$/
    );
  });

  it("invalidates reconcile state when relevant inventory availability changes", () => {
    const state = {
      order: {
        id: "order-1",
        status: "paid_inventory_review",
        paymentStatus: "paid",
        updatedAt: now
      },
      payment: {
        id: "payment-1",
        status: "paid",
        paidAt: now,
        updatedAt: now
      },
      reservations: [reservation("r1", now, "expired")],
      inventoryLevels: [
        {
          aggregateKey: "sku-1:location-1:available",
          quantity: 0,
          movementCount: 1
        }
      ]
    };
    const replenished = {
      ...state,
      inventoryLevels: state.inventoryLevels.map((level) => ({
        ...level,
        quantity: 1,
        movementCount: 2
      }))
    };

    expect(hashInventoryReservationQueueVersion(replenished)).not.toBe(
      hashInventoryReservationQueueVersion(state)
    );
  });
});
