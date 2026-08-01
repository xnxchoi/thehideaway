import type { Payload } from "payload";

import { inventoryReservationTerminalCommandKey } from "./inventory-reservation-idempotency";
import { lockOrderInventoryReservationsInTransaction } from "./inventory-reservation-locks";
import { reservationHistory } from "./inventory-reservation-reconstruction";
import {
  findReservationDocs,
  reservationPositiveQuantity,
  reservationReference,
  reservationRelationshipId,
  type ReservationRequest,
  type ReservationTransactionRequest
} from "./inventory-reservation-store";
import { releaseOrderInventoryInTransaction } from "./inventory-reservations";

export async function releaseOrderInventoryReservationsInTransaction(input: {
  payload: Payload;
  req: ReservationRequest;
  orderId: unknown;
  idempotencyKey: string;
  effectiveAt: string;
  locksHeld?: boolean;
}) {
  const orderId = reservationReference(
    input.orderId,
    "invalid-inventory-order"
  );
  const req = input.req as ReservationTransactionRequest;
  const reservations = input.locksHeld
    ? await findReservationDocs(
        input.payload,
        req,
        "inventory-reservations",
        { order: { equals: orderId } },
        "id"
      )
    : await lockOrderInventoryReservationsInTransaction({
        payload: input.payload,
        req: input.req,
        orderId
      });

  const results = [];
  for (const reservation of reservations) {
    const history = await reservationHistory(input.payload, req, reservation);
    if (history.status !== "active") continue;
    const reservationId = reservationReference(
      reservation.id,
      "inventory-reservation-history-corrupt"
    );
    const skuId = reservationRelationshipId(reservation.sku);
    const locationId = reservationRelationshipId(reservation.location);
    if (!skuId || !locationId) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    results.push(
      await releaseOrderInventoryInTransaction({
        payload: input.payload,
        req,
        locksHeld: true,
        request: {
          idempotencyKey: inventoryReservationTerminalCommandKey({
            baseKey: input.idempotencyKey,
            operation: "release",
            reservationId
          }),
          operation: "release",
          orderId,
          skuId,
          locationId,
          reservationId,
          quantity: reservationPositiveQuantity(reservation.quantity),
          effectiveAt: input.effectiveAt
        }
      })
    );
  }
  return Object.freeze(results);
}
