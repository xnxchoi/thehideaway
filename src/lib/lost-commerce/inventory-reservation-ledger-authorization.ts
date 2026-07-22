type ReservationMovementScope = {
  idempotencyKey: string;
  reservationId: string;
  skuId: string;
  locationId: string;
  quantity: number;
};

type ReservationMovementRequest = {
  idempotencyKey: string;
  skuId: string;
  kind: string;
  quantity: number;
  from?: { locationId: string; disposition: string };
  to?: unknown;
  sourceType: string;
  sourceRef?: string;
};

declare const inventoryReservationLedgerAuthorizationBrand: unique symbol;

export type InventoryReservationLedgerAuthorization = {
  readonly [inventoryReservationLedgerAuthorizationBrand]: true;
};

const grants = new WeakMap<object, ReservationMovementScope>();

export function grantInventoryReservationLedgerAuthorization(
  scope: ReservationMovementScope
): InventoryReservationLedgerAuthorization {
  const authorization = Object.freeze(
    {}
  ) as InventoryReservationLedgerAuthorization;
  grants.set(authorization, { ...scope });
  return authorization;
}

export function assertInventoryReservationLedgerAuthorization(
  authorization: unknown,
  request: ReservationMovementRequest
): asserts authorization is InventoryReservationLedgerAuthorization {
  if (!authorization || typeof authorization !== "object") {
    throw new Error("inventory-reservation-ledger-authorization-required");
  }
  const scope = grants.get(authorization);
  if (
    !scope ||
    request.idempotencyKey !== scope.idempotencyKey ||
    request.skuId !== scope.skuId ||
    request.kind !== "outbound" ||
    request.quantity !== scope.quantity ||
    request.from?.locationId !== scope.locationId ||
    request.from.disposition !== "available" ||
    request.to !== undefined ||
    request.sourceType !== "inventory_reservation" ||
    request.sourceRef !== scope.reservationId
  ) {
    throw new Error("inventory-reservation-ledger-authorization-required");
  }
}

export function revokeInventoryReservationLedgerAuthorization(
  authorization: InventoryReservationLedgerAuthorization
): void {
  grants.delete(authorization);
}
