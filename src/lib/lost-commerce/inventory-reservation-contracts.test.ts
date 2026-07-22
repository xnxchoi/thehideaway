import { describe, expect, it } from "vitest";

import {
  calculateAvailableToPromise,
  hashInventoryReservationRequest,
  parseInventoryReservationPolicy,
  transitionInventoryReservationStatus,
  validateInventoryReservationRequest
} from "./inventory-reservation-contracts";

const policySource = {
  enabled: "true",
  ttlMinutes: "15",
  locationCode: "SEOUL-01",
  safetyStock: "2",
  consumePoint: "payment_confirmed",
  expiryBoundary: "at_or_after",
  paymentTimeSource: "provider_paid_at",
  latePaymentPolicy: "manual_review",
  backorderMode: "disabled"
};

const reserveRequest = {
  idempotencyKey: "reservation-command-0001",
  operation: "reserve" as const,
  orderId: "order-1",
  skuId: "sku-1",
  locationId: "location-1",
  quantity: 2,
  expiresAt: "2026-07-22T03:15:00.000Z",
  effectiveAt: "2026-07-22T03:00:00.000Z"
};

describe("inventory reservation policy", () => {
  it("parses a complete explicit PortOne policy without adding defaults", () => {
    expect(
      parseInventoryReservationPolicy(policySource, {
        paymentProvider: "portone"
      })
    ).toEqual({
      enabled: true,
      ttlMinutes: 15,
      locationCode: "SEOUL-01",
      safetyStock: 2,
      consumePoint: "payment_confirmed",
      expiryBoundary: "at_or_after",
      paymentTimeSource: "provider_paid_at",
      latePaymentPolicy: "manual_review",
      backorderMode: "disabled"
    });
  });

  it.each(Object.keys(policySource))(
    "fails closed when %s is absent",
    (field) => {
      const incomplete = { ...policySource } as Record<string, string>;
      delete incomplete[field];

      expect(() =>
        parseInventoryReservationPolicy(incomplete, {
          paymentProvider: "portone"
        })
      ).toThrow("inventory-reservations-unavailable");
    }
  );

  it.each([
    ["enabled", "false"],
    ["enabled", "TRUE"],
    ["ttlMinutes", "0"],
    ["ttlMinutes", "1.5"],
    ["ttlMinutes", String(Number.MAX_SAFE_INTEGER + 1)],
    ["locationCode", ""],
    ["locationCode", "Seoul location"],
    ["safetyStock", "-1"],
    ["safetyStock", "1.5"],
    ["consumePoint", "checkout"],
    ["expiryBoundary", "after"],
    ["paymentTimeSource", "server_now"],
    ["latePaymentPolicy", "accept"],
    ["backorderMode", "enabled"]
  ])("fails closed for invalid explicit %s", (field, value) => {
    expect(() =>
      parseInventoryReservationPolicy(
        { ...policySource, [field]: value },
        { paymentProvider: "portone" }
      )
    ).toThrow("inventory-reservations-unavailable");
  });

  it("rejects automatic stock reacquisition for late payment", () => {
    expect(() =>
      parseInventoryReservationPolicy(
        { ...policySource, latePaymentPolicy: "reacquire_then_review" },
        { paymentProvider: "portone" }
      )
    ).toThrow("inventory-reservations-unavailable");
  });

  it.each([undefined, "manual", "unknown"])(
    "fails closed for payment provider %s",
    (paymentProvider) => {
      expect(() =>
        parseInventoryReservationPolicy(policySource, { paymentProvider })
      ).toThrow("inventory-reservations-unavailable");
    }
  );
});

describe("available to promise", () => {
  it("subtracts active reservations and explicit safety stock from available stock", () => {
    expect(
      calculateAvailableToPromise({
        available: 12,
        activeReserved: 3,
        safetyStock: 2
      })
    ).toBe(7);
  });

  it("does not count non-available physical dispositions", () => {
    const physicalState = {
      available: 5,
      activeReserved: 2,
      safetyStock: 1,
      quarantine: 100,
      damaged: 100,
      inspectionPending: 100,
      returnedPendingRelease: 100
    };

    expect(calculateAvailableToPromise(physicalState)).toBe(2);
  });

  it("clamps exhausted availability to zero", () => {
    expect(
      calculateAvailableToPromise({
        available: 2,
        activeReserved: 3,
        safetyStock: 1
      })
    ).toBe(0);
  });

  it.each([
    { available: -1, activeReserved: 0, safetyStock: 0 },
    { available: 1.5, activeReserved: 0, safetyStock: 0 },
    { available: 1, activeReserved: -1, safetyStock: 0 },
    { available: 1, activeReserved: 0, safetyStock: -1 },
    {
      available: Number.MAX_SAFE_INTEGER + 1,
      activeReserved: 0,
      safetyStock: 0
    }
  ])("rejects corrupt ATP inputs", (input) => {
    expect(() => calculateAvailableToPromise(input)).toThrow(
      "invalid-inventory-availability"
    );
  });
});

describe("inventory reservation request contracts", () => {
  it("validates and canonicalizes a reserve request", () => {
    expect(validateInventoryReservationRequest(reserveRequest)).toEqual(
      reserveRequest
    );
  });

  it.each(["release", "expire", "consume"] as const)(
    "validates a terminal %s request with an existing reservation",
    (operation) => {
      const request = {
        ...reserveRequest,
        operation,
        reservationId: "reservation-1",
        expiresAt: undefined
      };

      expect(validateInventoryReservationRequest(request)).toEqual({
        idempotencyKey: reserveRequest.idempotencyKey,
        operation,
        orderId: reserveRequest.orderId,
        skuId: reserveRequest.skuId,
        locationId: reserveRequest.locationId,
        quantity: reserveRequest.quantity,
        reservationId: "reservation-1",
        effectiveAt: reserveRequest.effectiveAt
      });
    }
  );

  it.each([
    ["idempotencyKey", "short"],
    ["operation", "cancel"],
    ["orderId", ""],
    ["skuId", ""],
    ["locationId", ""],
    ["quantity", 0],
    ["quantity", 1.5],
    ["effectiveAt", "not-a-time"]
  ])("rejects invalid %s", (field, value) => {
    expect(() =>
      validateInventoryReservationRequest({
        ...reserveRequest,
        [field]: value
      })
    ).toThrow();
  });

  it("requires an expiry only for reserve and a reservation ID only for terminal operations", () => {
    expect(() =>
      validateInventoryReservationRequest({
        ...reserveRequest,
        expiresAt: undefined
      })
    ).toThrow("invalid-inventory-reservation-expiry");
    expect(() =>
      validateInventoryReservationRequest({
        ...reserveRequest,
        operation: "release",
        expiresAt: undefined
      })
    ).toThrow("invalid-inventory-reservation-id");
    expect(() =>
      validateInventoryReservationRequest({
        ...reserveRequest,
        reservationId: "reservation-1"
      })
    ).toThrow("invalid-inventory-reservation-id");
  });

  it("requires reserve expiry to be after its effective time", () => {
    expect(() =>
      validateInventoryReservationRequest({
        ...reserveRequest,
        expiresAt: reserveRequest.effectiveAt
      })
    ).toThrow("invalid-inventory-reservation-expiry");
  });

  it("hashes canonical content independently of object key order", () => {
    const reordered = {
      effectiveAt: reserveRequest.effectiveAt,
      expiresAt: reserveRequest.expiresAt,
      quantity: reserveRequest.quantity,
      locationId: reserveRequest.locationId,
      skuId: reserveRequest.skuId,
      orderId: reserveRequest.orderId,
      operation: reserveRequest.operation,
      idempotencyKey: reserveRequest.idempotencyKey
    };

    expect(hashInventoryReservationRequest(reordered)).toBe(
      hashInventoryReservationRequest(reserveRequest)
    );
    expect(
      hashInventoryReservationRequest({ ...reserveRequest, quantity: 3 })
    ).not.toBe(hashInventoryReservationRequest(reserveRequest));
  });
});

describe("inventory reservation status", () => {
  it.each([
    ["release", "released"],
    ["expire", "expired"],
    ["consume", "consumed"]
  ] as const)("transitions active through %s to %s", (event, expected) => {
    expect(transitionInventoryReservationStatus("active", event)).toBe(
      expected
    );
  });

  it.each(["released", "expired", "consumed"] as const)(
    "rejects transitions out of terminal status %s",
    (status) => {
      expect(() =>
        transitionInventoryReservationStatus(status, "consume")
      ).toThrow("invalid-inventory-reservation-transition");
    }
  );
});
