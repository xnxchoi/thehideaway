import { describe, expect, it } from "vitest";

import {
  inventoryReservationOperatorMutationsEnabled,
  requireInventoryReservationOperator,
  validateInventoryReservationOperatorCommand
} from "./inventory-reservation-operator-policy";

const validCommand = {
  action: "release",
  orderId: "order-123",
  expectedStateHash: "a".repeat(64),
  reasonCode: "order-canceled",
  evidenceReference: "support:case-123"
} as const;

describe("inventory reservation operator policy", () => {
  it("allows only a persisted admin identity", () => {
    expect(
      requireInventoryReservationOperator({
        user: { id: "user-1", role: "admin" }
      } as never)
    ).toBe("user-1");
    expect(() =>
      requireInventoryReservationOperator({
        user: { id: "user-2", role: "cofounder" }
      } as never)
    ).toThrow("inventory-reservation-operator-admin-required");
  });

  it("requires structured reason, evidence, and an expected state hash", () => {
    for (const field of [
      "reasonCode",
      "evidenceReference",
      "expectedStateHash"
    ] as const) {
      const command = { ...validCommand } as Record<string, unknown>;
      delete command[field];
      expect(() =>
        validateInventoryReservationOperatorCommand(command)
      ).toThrow();
    }
  });

  it.each(["release", "expire", "reconcile", "run_expiry"] as const)(
    "accepts the focused %s action",
    (action) => {
      expect(
        validateInventoryReservationOperatorCommand({
          ...validCommand,
          action,
          ...(action === "run_expiry" ? { batchSize: 25 } : {})
        })
      ).toMatchObject({ action, reasonCode: "order-canceled" });
    }
  );

  it.each(["consume", "force-status", "refund", "cancel"])(
    "rejects the unsafe %s action",
    (action) => {
      expect(() =>
        validateInventoryReservationOperatorCommand({ ...validCommand, action })
      ).toThrow("invalid-inventory-reservation-operator-action");
    }
  );

  it("enables mutations only for an exact true flag", () => {
    expect(
      inventoryReservationOperatorMutationsEnabled({
        LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE: "true"
      })
    ).toBe(true);
    expect(
      inventoryReservationOperatorMutationsEnabled({
        LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE: "TRUE"
      })
    ).toBe(false);
    expect(inventoryReservationOperatorMutationsEnabled({})).toBe(false);
  });
});
