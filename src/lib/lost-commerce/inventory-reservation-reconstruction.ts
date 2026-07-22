import type { Payload } from "payload";

import type { InventoryReservationStatus } from "./inventory-reservation-contracts";
import {
  compareReservationText,
  findReservationDocs,
  immutableReservationCopy,
  reservationPositiveQuantity,
  reservationRelationshipId,
  requireReservationTransaction,
  type ReservationStored,
  type ReservationTransactionRequest
} from "./inventory-reservation-store";

export type ReservationHistory = {
  status: InventoryReservationStatus;
  activeQuantity: number;
};

export function reconstructReservationHistory(
  reservation: ReservationStored,
  entries: readonly ReservationStored[]
): ReservationHistory {
  const reservedQuantity = reservationPositiveQuantity(reservation.quantity);
  let activeQuantity = 0;
  let status: InventoryReservationStatus | undefined;
  for (const entry of entries) {
    const quantity = reservationPositiveQuantity(entry.quantity);
    if (quantity !== reservedQuantity) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    if (entry.operation === "reserve") {
      if (status !== undefined) {
        throw new Error("inventory-reservation-history-corrupt");
      }
      activeQuantity = quantity;
      status = "active";
      continue;
    }
    if (entry.operation === "late_payment_detected") {
      if (status === undefined) {
        throw new Error("inventory-reservation-history-corrupt");
      }
      continue;
    }
    if (status !== "active" || activeQuantity !== quantity) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    if (entry.operation === "release") status = "released";
    else if (entry.operation === "expire") status = "expired";
    else if (entry.operation === "consume") status = "consumed";
    else throw new Error("inventory-reservation-history-corrupt");
    activeQuantity = 0;
  }
  if (!status || reservation.status !== status) {
    throw new Error("inventory-reservation-history-corrupt");
  }
  return { status, activeQuantity };
}

export async function reservationHistory(
  payload: Payload,
  req: ReservationTransactionRequest,
  reservation: ReservationStored
): Promise<ReservationHistory> {
  const id = reservationRelationshipId(reservation.id);
  if (!id) throw new Error("inventory-reservation-history-corrupt");
  const entries = await findReservationDocs(
    payload,
    req,
    "inventory-reservation-entries",
    { reservation: { equals: id } },
    "createdAt"
  );
  return reconstructReservationHistory(reservation, entries);
}

export async function activeReservedForAggregate(
  payload: Payload,
  req: ReservationTransactionRequest,
  skuId: string,
  locationId: string
): Promise<number> {
  const reservations = await findReservationDocs(
    payload,
    req,
    "inventory-reservations",
    {
      and: [
        { sku: { equals: skuId } },
        { location: { equals: locationId } },
        { status: { equals: "active" } }
      ]
    }
  );
  let quantity = 0;
  for (const reservation of reservations) {
    quantity += reservationPositiveQuantity(reservation.quantity);
    if (!Number.isSafeInteger(quantity)) {
      throw new Error("inventory-reservation-history-corrupt");
    }
  }
  return quantity;
}

export async function reconstructInventoryReservations(input: {
  payload: Payload;
  req: ReservationTransactionRequest;
}): Promise<
  readonly Readonly<{
    aggregateKey: string;
    skuId: string;
    locationId: string;
    activeReserved: number;
    reservationCount: number;
  }>[]
> {
  requireReservationTransaction(input.req);
  const req = input.req as ReservationTransactionRequest;
  const reservations = await findReservationDocs(
    input.payload,
    req,
    "inventory-reservations",
    {}
  );
  const aggregates = new Map<
    string,
    {
      aggregateKey: string;
      skuId: string;
      locationId: string;
      activeReserved: number;
      reservationCount: number;
    }
  >();
  for (const reservation of reservations) {
    const skuId = reservationRelationshipId(reservation.sku);
    const locationId = reservationRelationshipId(reservation.location);
    if (!skuId || !locationId) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    const history = await reservationHistory(input.payload, req, reservation);
    const aggregateKey = `${skuId}:${locationId}`;
    const current = aggregates.get(aggregateKey) ?? {
      aggregateKey,
      skuId,
      locationId,
      activeReserved: 0,
      reservationCount: 0
    };
    const activeReserved = current.activeReserved + history.activeQuantity;
    if (!Number.isSafeInteger(activeReserved)) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    aggregates.set(aggregateKey, {
      ...current,
      activeReserved,
      reservationCount: current.reservationCount + 1
    });
  }
  return immutableReservationCopy(
    [...aggregates.values()].sort((left, right) =>
      compareReservationText(left.aggregateKey, right.aggregateKey)
    )
  );
}
