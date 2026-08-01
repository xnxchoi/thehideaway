import type { Payload } from "payload";

import { validateCommerceCommandKey } from "./commerce-commands";
import { inventoryReservationTerminalCommandKey } from "./inventory-reservation-idempotency";
import { reservationHistory } from "./inventory-reservation-reconstruction";
import { recordInventoryReservationReviewEvidence } from "./inventory-reservation-review-evidence";
import {
  findReservationDocById as findById,
  findReservationDocs as findDocs,
  immutableReservationCopy as immutableCopy,
  reservationPositiveQuantity as positiveQuantity,
  reservationReference as reference,
  reservationRelationshipId as relationshipId,
  reservationTimestamp as timestamp,
  requireReservationTransaction as transactionID,
  type ReservationTransactionRequest as TransactionRequest
} from "./inventory-reservation-store";
import {
  consumeInventoryReservationInTransaction,
  type InventoryReservationResult
} from "./inventory-reservations";

export async function finalizePaidOrderInventoryInTransaction(input: {
  payload: Payload;
  req: TransactionRequest;
  orderId: unknown;
  paymentId: unknown;
  idempotencyKey: unknown;
  providerEventRef?: unknown;
  providerPaidAt: unknown;
  locksHeld?: boolean;
}): Promise<
  Readonly<{
    kind: "created" | "replay" | "paid_inventory_review";
    results: readonly InventoryReservationResult[];
  }>
> {
  transactionID(input.req);
  const orderId = reference(input.orderId, "invalid-inventory-order");
  const paymentId = reference(input.paymentId, "invalid-inventory-payment");
  const providerEventRef =
    input.providerEventRef === undefined || input.providerEventRef === null
      ? undefined
      : reference(
          input.providerEventRef,
          "invalid-inventory-provider-event-ref"
        );
  const providerPaidAt =
    input.providerPaidAt === undefined || input.providerPaidAt === null
      ? undefined
      : timestamp(input.providerPaidAt, "invalid-inventory-provider-paid-at");
  const baseKey = validateCommerceCommandKey(input.idempotencyKey);
  const payment = await findById(
    input.payload,
    input.req,
    "product-payments",
    paymentId
  );
  if (
    relationshipId(payment.order) !== orderId ||
    payment.status !== "paid" ||
    payment.provider !== "portone"
  ) {
    throw new Error("inventory-reservation-payment-not-confirmed");
  }
  await findById(input.payload, input.req, "product-orders", orderId);
  const reservations = await findDocs(
    input.payload,
    input.req,
    "inventory-reservations",
    { order: { equals: orderId } },
    "id"
  );
  if (reservations.length === 0) {
    throw new Error("inventory-reservation-order-missing");
  }

  const results: InventoryReservationResult[] = [];
  for (const reservation of reservations) {
    const reservationId = relationshipId(reservation.id);
    const skuId = relationshipId(reservation.sku);
    const locationId = relationshipId(reservation.location);
    if (!reservationId || !skuId || !locationId) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    const history = await reservationHistory(
      input.payload,
      input.req,
      reservation
    );
    const reservedAt = timestamp(
      reservation.reserved_at,
      "inventory-reservation-history-corrupt"
    );
    const evidenceCode = !providerPaidAt
      ? "provider_timestamp_missing"
      : Date.parse(providerPaidAt) < Date.parse(reservedAt)
        ? "provider_timestamp_before_reservation"
        : history.status !== "consumed" &&
            (history.status !== "active" ||
              Date.parse(providerPaidAt) >=
                Date.parse(String(reservation.expires_at)))
          ? "provider_payment_late"
          : undefined;
    if (evidenceCode) {
      await recordInventoryReservationReviewEvidence({
        payload: input.payload,
        req: input.req,
        reservation,
        reservationId,
        paymentId,
        providerEventRef,
        quantity: positiveQuantity(reservation.quantity),
        baseKey,
        providerPaidAt,
        evidenceCode
      });
      results.push(
        immutableCopy({
          kind: "paid_inventory_review",
          reason: "late_payment",
          reservation
        })
      );
      continue;
    }
    const result = await consumeInventoryReservationInTransaction({
      payload: input.payload,
      req: input.req,
      paymentId,
      providerEventRef,
      locksHeld: input.locksHeld,
      request: {
        idempotencyKey: inventoryReservationTerminalCommandKey({
          baseKey,
          reservationId,
          operation: "consume"
        }),
        operation: "consume",
        orderId,
        reservationId,
        skuId,
        locationId,
        quantity: positiveQuantity(reservation.quantity),
        effectiveAt: providerPaidAt
      }
    });
    results.push(result);
    if (result.kind === "paid_inventory_review") {
      await recordInventoryReservationReviewEvidence({
        payload: input.payload,
        req: input.req,
        reservation,
        reservationId,
        paymentId,
        providerEventRef,
        quantity: positiveQuantity(reservation.quantity),
        baseKey,
        providerPaidAt,
        evidenceCode: "physical_inventory_unavailable"
      });
    }
  }
  const kind = results.some((result) => result.kind === "paid_inventory_review")
    ? "paid_inventory_review"
    : results.some((result) => result.kind === "created")
      ? "created"
      : "replay";
  return immutableCopy({ kind, results });
}
