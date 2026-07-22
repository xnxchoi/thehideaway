import type { Payload } from "payload";

import {
  inventoryAggregateLock,
  inventoryLocationLock,
  inventoryMovementIdempotencyLock,
  inventoryReservationAggregateLock,
  inventoryReservationIdempotencyLock,
  inventoryReservationLock,
  productInventoryLock,
  productSkuMutationLock
} from "@/lib/db/sequences";
import {
  inventoryReservationMovementKey,
  inventoryReservationTerminalCommandKey,
  type InventoryReservationTerminalOperation
} from "./inventory-reservation-idempotency";
import {
  findReservationDocById,
  findReservationDocs,
  immutableReservationCopy,
  reservationReference,
  reservationRelationshipId,
  requireReservationTransaction,
  type ReservationRequest,
  type ReservationStored,
  type ReservationTransactionRequest
} from "./inventory-reservation-store";

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

export async function lockOrderInventoryReservationsInTransaction(input: {
  payload: Payload;
  req: ReservationRequest;
  orderId: unknown;
  terminal?: Readonly<{
    operation: InventoryReservationTerminalOperation;
    baseKey: string;
  }>;
}): Promise<readonly Readonly<ReservationStored>[]> {
  const transactionID = requireReservationTransaction(input.req);
  const req = input.req as ReservationTransactionRequest;
  const orderId = reservationReference(
    input.orderId,
    "invalid-inventory-order"
  );
  const reservations = await findReservationDocs(
    input.payload,
    req,
    "inventory-reservations",
    { order: { equals: orderId } },
    "id"
  );
  const productIds: string[] = [];
  const skuIds: string[] = [];
  const locationIds: string[] = [];
  const reservationIds: string[] = [];
  for (const reservation of reservations) {
    const reservationId = reservationRelationshipId(reservation.id);
    const skuId = reservationRelationshipId(reservation.sku);
    const locationId = reservationRelationshipId(reservation.location);
    if (!reservationId || !skuId || !locationId) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    const sku = await findReservationDocById(
      input.payload,
      req,
      "product-variants",
      skuId
    );
    const productId = reservationRelationshipId(sku.product);
    if (!productId) throw new Error("inventory-reservation-sku-unavailable");
    productIds.push(productId);
    skuIds.push(skuId);
    locationIds.push(locationId);
    reservationIds.push(reservationId);
  }
  if (input.terminal) {
    for (const reservationId of sortedUnique(reservationIds)) {
      const commandKey = inventoryReservationTerminalCommandKey({
        baseKey: input.terminal.baseKey,
        reservationId,
        operation: input.terminal.operation
      });
      await inventoryReservationIdempotencyLock(
        input.payload,
        transactionID,
        commandKey
      );
      if (input.terminal.operation === "consume") {
        await inventoryMovementIdempotencyLock(
          input.payload,
          transactionID,
          inventoryReservationMovementKey(commandKey)
        );
      }
    }
  }
  for (const productId of sortedUnique(productIds)) {
    await productInventoryLock(input.payload, transactionID, productId);
  }
  for (const skuId of sortedUnique(skuIds)) {
    await productSkuMutationLock(input.payload, transactionID, skuId);
  }
  for (const locationId of sortedUnique(locationIds)) {
    await inventoryLocationLock(input.payload, transactionID, locationId);
  }
  for (const key of sortedUnique(
    skuIds.map((skuId, index) => `${skuId}:${locationIds[index]}:available`)
  )) {
    await inventoryAggregateLock(input.payload, transactionID, key);
  }
  for (const key of sortedUnique(
    skuIds.map((skuId, index) => `${skuId}:${locationIds[index]}`)
  )) {
    await inventoryReservationAggregateLock(input.payload, transactionID, key);
  }
  for (const reservationId of sortedUnique(reservationIds)) {
    await inventoryReservationLock(input.payload, transactionID, reservationId);
  }
  return immutableReservationCopy(reservations);
}
