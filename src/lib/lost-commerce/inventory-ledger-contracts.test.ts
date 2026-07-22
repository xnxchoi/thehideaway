import { describe, expect, it } from "vitest";

import {
  INVENTORY_DISPOSITIONS,
  INVENTORY_MOVEMENT_SOURCE_TYPES,
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

const receiptInbound = {
  ...inbound,
  to: { locationId: "location-1", disposition: "quarantine" as const },
  sourceType: "inventory_receipt" as const,
  receiptId: "receipt-1",
  receiptLineId: "receipt-line-1",
  lotId: "lot-1",
  sourceRef: "lot-1"
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

  it("defines explicit inventory provenance sources", () => {
    expect(INVENTORY_MOVEMENT_SOURCE_TYPES).toEqual([
      "inventory_command",
      "inventory_receipt",
      "inventory_lot_release",
      "inventory_adjustment",
      "inventory_cycle_count",
      "inventory_reservation"
    ]);
  });

  it.each([
    receiptInbound,
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
      to: { locationId: "location-2", disposition: "damaged" as const }
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

  it.each([
    ["kind", new String("outbound")],
    ["sourceType", new String("inventory_command")],
    ["kind", { toString: () => "outbound" }],
    ["sourceType", { toString: () => "inventory_command" }]
  ])("rejects coercible non-string %s values", (field, value) => {
    expect(() =>
      validateInventoryMovementRequest({ ...inbound, [field]: value })
    ).toThrow();
  });

  it("rejects coercible non-string endpoint dispositions", () => {
    expect(() =>
      validateInventoryMovementRequest({
        ...inbound,
        kind: "outbound",
        to: undefined,
        from: {
          locationId: "location-1",
          disposition: new String("available")
        }
      })
    ).toThrow("invalid-inventory-disposition");
  });

  it.each([
    {
      sourceType: "inventory_receipt",
      receiptId: "receipt-1",
      receiptLineId: "receipt-line-1",
      lotId: "lot-1",
      sourceRef: "lot-1",
      to: { locationId: "location-1", disposition: "quarantine" }
    },
    {
      sourceType: "inventory_lot_release",
      receiptId: "receipt-1",
      receiptLineId: "receipt-line-1",
      lotId: "lot-1",
      sourceRef: "lot-1",
      kind: "transfer",
      from: { locationId: "location-1", disposition: "quarantine" },
      to: { locationId: "location-1", disposition: "available" }
    },
    {
      sourceType: "inventory_cycle_count",
      sourceRef: "count-line-1",
      cycleCountId: "count-1",
      cycleCountLineId: "count-line-1"
    }
  ] as const)("accepts complete $sourceType provenance", (provenance) => {
    expect(
      validateInventoryMovementRequest({ ...inbound, ...provenance })
    ).toMatchObject(provenance);
  });

  it.each([
    { sourceType: "inventory_receipt" },
    { sourceType: "inventory_lot_release", lotId: "lot-1" },
    { sourceType: "inventory_cycle_count", cycleCountId: "count-1" },
    { sourceType: "inventory_adjustment", lotId: "lot-1" },
    { sourceType: "inventory_command", receiptId: "receipt-1" }
  ])("rejects incomplete or mismatched typed provenance", (provenance) => {
    expect(() =>
      validateInventoryMovementRequest({ ...inbound, ...provenance })
    ).toThrow("invalid-inventory-provenance");
  });

  it.each([
    ["inventory_receipt", "lot-1"],
    ["inventory_lot_release", "lot-1"],
    ["inventory_cycle_count", "count-line-1"]
  ] as const)(
    "derives the canonical source reference for %s before hashing",
    (sourceType, expectedSourceRef) => {
      const provenance =
        sourceType === "inventory_cycle_count"
          ? { cycleCountId: "count-1", cycleCountLineId: "count-line-1" }
          : {
              receiptId: "receipt-1",
              receiptLineId: "receipt-line-1",
              lotId: "lot-1"
            };
      const movement = {
        ...receiptInbound,
        sourceRef: undefined,
        receiptId: undefined,
        receiptLineId: undefined,
        lotId: undefined,
        sourceType,
        ...provenance,
        ...(sourceType === "inventory_lot_release"
          ? {
              kind: "transfer" as const,
              from: {
                locationId: "location-1",
                disposition: "quarantine" as const
              },
              to: {
                locationId: "location-1",
                disposition: "available" as const
              }
            }
          : {})
      };

      expect(validateInventoryMovementRequest(movement).sourceRef).toBe(
        expectedSourceRef
      );
      expect(hashInventoryMovementRequest(movement)).toBe(
        hashInventoryMovementRequest({
          ...movement,
          sourceRef: expectedSourceRef
        })
      );
    }
  );

  it("rejects a typed source reference that disagrees with its evidence", () => {
    expect(() =>
      validateInventoryMovementRequest({
        ...receiptInbound,
        sourceRef: "different-lot"
      })
    ).toThrow("invalid-inventory-source-ref");
    expect(() =>
      validateInventoryMovementRequest({
        ...inbound,
        sourceType: "inventory_cycle_count",
        sourceRef: "different-line",
        cycleCountId: "count-1",
        cycleCountLineId: "count-line-1"
      })
    ).toThrow("invalid-inventory-source-ref");
  });

  it.each([
    { sourceType: "inventory_adjustment", kind: "inbound" },
    {
      sourceType: "inventory_receipt",
      receiptId: "receipt-1",
      receiptLineId: "receipt-line-1",
      lotId: "lot-1",
      to: { locationId: "location-1", disposition: "available" }
    },
    {
      sourceType: "inventory_lot_release",
      receiptId: "receipt-1",
      receiptLineId: "receipt-line-1",
      lotId: "lot-1",
      kind: "transfer",
      from: { locationId: "location-1", disposition: "damaged" },
      to: { locationId: "location-1", disposition: "available" }
    },
    {
      sourceType: "inventory_cycle_count",
      cycleCountId: "count-1",
      cycleCountLineId: "count-line-1",
      kind: "transfer",
      from: { locationId: "location-1", disposition: "quarantine" },
      to: { locationId: "location-1", disposition: "damaged" }
    }
  ])("rejects invalid $sourceType movement semantics", (overrides) => {
    expect(() =>
      validateInventoryMovementRequest({ ...inbound, ...overrides })
    ).toThrow("invalid-inventory-source-semantics");
  });

  it("accepts only an available outbound movement for reservation consumption", () => {
    expect(
      validateInventoryMovementRequest({
        ...inbound,
        sourceType: "inventory_reservation",
        sourceRef: "reservation-1",
        kind: "outbound",
        to: undefined,
        from: { locationId: "location-1", disposition: "available" }
      })
    ).toMatchObject({
      sourceType: "inventory_reservation",
      sourceRef: "reservation-1",
      kind: "outbound"
    });

    expect(() =>
      validateInventoryMovementRequest({
        ...inbound,
        sourceType: "inventory_reservation",
        sourceRef: "reservation-1"
      })
    ).toThrow("invalid-inventory-source-semantics");
  });

  it("rejects naked command inbound stock outside a receipt or count workflow", () => {
    expect(() => validateInventoryMovementRequest(inbound)).toThrow(
      "inventory-inbound-requires-workflow"
    );
  });

  it.each(["inventory_adjustment", "inventory_command"] as const)(
    "prevents %s from bypassing the lot-release workflow",
    (sourceType) => {
      expect(() =>
        validateInventoryMovementRequest({
          ...inbound,
          sourceType,
          kind: "transfer",
          from: { locationId: "location-1", disposition: "quarantine" },
          to: { locationId: "location-1", disposition: "available" }
        })
      ).toThrow("inventory-lot-release-workflow-required");
    }
  );

  it.each([
    {
      kind: "transfer",
      from: { locationId: "location-1", disposition: "available" },
      to: { locationId: "location-1", disposition: "damaged" }
    },
    {
      kind: "outbound",
      from: {
        locationId: "location-1",
        disposition: "returned_pending_release"
      },
      to: undefined
    }
  ])("accepts a legitimate adjustment transition", (transition) => {
    expect(() =>
      validateInventoryMovementRequest({
        ...inbound,
        sourceType: "inventory_adjustment",
        ...transition
      })
    ).not.toThrow();
  });

  it("hashes the canonical validated request independent of object key order", () => {
    const reordered = {
      lotId: receiptInbound.lotId,
      receiptLineId: receiptInbound.receiptLineId,
      receiptId: receiptInbound.receiptId,
      effectiveAt: receiptInbound.effectiveAt,
      actorId: receiptInbound.actorId,
      sourceRef: receiptInbound.sourceRef,
      sourceType: receiptInbound.sourceType,
      reasonCode: receiptInbound.reasonCode,
      to: { disposition: "quarantine" as const, locationId: "location-1" },
      quantity: 4,
      kind: "inbound" as const,
      skuId: "sku-1",
      idempotencyKey: "inventory-event-0001"
    };
    expect(hashInventoryMovementRequest(receiptInbound)).toBe(
      hashInventoryMovementRequest(reordered)
    );
    expect(
      hashInventoryMovementRequest({ ...receiptInbound, quantity: 5 })
    ).not.toBe(hashInventoryMovementRequest(receiptInbound));
  });
});
