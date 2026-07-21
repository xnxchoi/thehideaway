import { describe, expect, it } from "vitest";

import {
  INVENTORY_DISPOSITIONS,
  hashInventoryMovementRequest,
  validateInventoryMovementRequest
} from "./inventory-ledger-contracts";

const inbound = {
  idempotencyKey: "inventory-event-0001",
  skuId: "sku-1",
  kind: "inbound" as const,
  quantity: 4,
  to: { locationId: "location-1", disposition: "available" as const },
  reasonCode: "verified-stock-in",
  sourceType: "inventory_command" as const,
  sourceRef: "source-1",
  actorId: "actor-1",
  effectiveAt: "2026-07-22T00:00:00.000Z"
};

describe("inventory ledger contracts", () => {
  it("defines only the PR4 physical disposition buckets", () => {
    expect(INVENTORY_DISPOSITIONS).toEqual([
      "available",
      "quarantine",
      "damaged",
      "inspection_pending",
      "returned_pending_release",
      "discarded"
    ]);
  });

  it.each([
    inbound,
    {
      ...inbound,
      kind: "outbound" as const,
      to: undefined,
      from: { locationId: "location-1", disposition: "damaged" as const }
    },
    {
      ...inbound,
      kind: "transfer" as const,
      from: { locationId: "location-1", disposition: "quarantine" as const },
      to: { locationId: "location-2", disposition: "available" as const }
    }
  ])("accepts a valid $kind physical event", (request) => {
    expect(validateInventoryMovementRequest(request)).toEqual(request);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity])(
    "rejects invalid quantity %s",
    (quantity) => {
      expect(() =>
        validateInventoryMovementRequest({ ...inbound, quantity })
      ).toThrow("invalid-inventory-movement-quantity");
    }
  );

  it("requires exactly the endpoints belonging to the movement kind", () => {
    expect(() =>
      validateInventoryMovementRequest({
        ...inbound,
        from: { locationId: "location-2", disposition: "available" }
      })
    ).toThrow("invalid-inventory-movement-endpoints");
    expect(() =>
      validateInventoryMovementRequest({ ...inbound, kind: "outbound" })
    ).toThrow("invalid-inventory-movement-endpoints");
    expect(() =>
      validateInventoryMovementRequest({ ...inbound, kind: "transfer" })
    ).toThrow("invalid-inventory-movement-endpoints");
  });

  it("requires transfer endpoints to differ by location or disposition", () => {
    expect(() =>
      validateInventoryMovementRequest({
        ...inbound,
        kind: "transfer",
        from: { locationId: "location-1", disposition: "available" }
      })
    ).toThrow("inventory-transfer-endpoints-match");
  });

  it.each([
    ["skuId", ""],
    ["idempotencyKey", "short"],
    ["reasonCode", ""],
    ["sourceType", "inventory-event"],
    ["sourceRef", ""],
    ["actorId", ""],
    ["effectiveAt", "not-a-time"]
  ])("rejects invalid explicit %s", (field, value) => {
    expect(() =>
      validateInventoryMovementRequest({ ...inbound, [field]: value })
    ).toThrow();
  });

  it("rejects unknown dispositions and non-physical command kinds", () => {
    expect(() =>
      validateInventoryMovementRequest({
        ...inbound,
        to: { locationId: "location-1", disposition: "reserved" }
      })
    ).toThrow("invalid-inventory-disposition");
    expect(() =>
      validateInventoryMovementRequest({ ...inbound, kind: "reservation" })
    ).toThrow("invalid-inventory-movement-kind");
  });

  it("hashes the canonical validated request independent of object key order", () => {
    const reordered = {
      effectiveAt: inbound.effectiveAt,
      actorId: inbound.actorId,
      sourceRef: inbound.sourceRef,
      sourceType: inbound.sourceType,
      reasonCode: inbound.reasonCode,
      to: { disposition: "available" as const, locationId: "location-1" },
      quantity: 4,
      kind: "inbound" as const,
      skuId: "sku-1",
      idempotencyKey: "inventory-event-0001"
    };
    expect(hashInventoryMovementRequest(inbound)).toBe(
      hashInventoryMovementRequest(reordered)
    );
    expect(hashInventoryMovementRequest({ ...inbound, quantity: 5 })).not.toBe(
      hashInventoryMovementRequest(inbound)
    );
  });
});
