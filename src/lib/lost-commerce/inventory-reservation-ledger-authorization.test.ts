import { describe, expect, it } from "vitest";

import {
  assertInventoryReservationLedgerAuthorization,
  grantInventoryReservationLedgerAuthorization,
  revokeInventoryReservationLedgerAuthorization
} from "./inventory-reservation-ledger-authorization";

const scope = {
  idempotencyKey: "movement-command-1",
  reservationId: "reservation-1",
  skuId: "sku-1",
  locationId: "location-1",
  quantity: 2
};

const request = {
  idempotencyKey: scope.idempotencyKey,
  skuId: scope.skuId,
  kind: "outbound",
  quantity: scope.quantity,
  from: { locationId: scope.locationId, disposition: "available" },
  sourceType: "inventory_reservation",
  sourceRef: scope.reservationId
};

describe("inventory reservation ledger authorization", () => {
  it("accepts only the movement covered by the grant and rejects it after revocation", () => {
    const authorization = grantInventoryReservationLedgerAuthorization(scope);

    expect(() =>
      assertInventoryReservationLedgerAuthorization(authorization, request)
    ).not.toThrow();

    revokeInventoryReservationLedgerAuthorization(authorization);
    expect(() =>
      assertInventoryReservationLedgerAuthorization(authorization, request)
    ).toThrow("inventory-reservation-ledger-authorization-required");
  });

  it("rejects missing grants and every movement outside the granted scope", () => {
    expect(() =>
      assertInventoryReservationLedgerAuthorization(undefined, request)
    ).toThrow("inventory-reservation-ledger-authorization-required");

    const mutations = [
      { idempotencyKey: "different" },
      { skuId: "different" },
      { kind: "inbound" },
      { quantity: 3 },
      { from: { locationId: "different", disposition: "available" } },
      { from: { locationId: scope.locationId, disposition: "damaged" } },
      { to: { locationId: "location-2", disposition: "available" } },
      { sourceType: "manual_adjustment" },
      { sourceRef: "different" }
    ];

    for (const mutation of mutations) {
      const authorization = grantInventoryReservationLedgerAuthorization(scope);
      expect(() =>
        assertInventoryReservationLedgerAuthorization(authorization, {
          ...request,
          ...mutation
        })
      ).toThrow("inventory-reservation-ledger-authorization-required");
    }
  });
});
