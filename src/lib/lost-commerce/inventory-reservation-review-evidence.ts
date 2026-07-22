import type { Payload } from "payload";

import { authorizeInventoryReservationRequest } from "@/payload/collections/(consumption)/InventoryReservations/authorizeInventoryReservation";
import { hashCommerceCommandInput } from "./commerce-commands";
import {
  findReservationEntry,
  reservationTransactionTimestamp,
  type ReservationStored,
  type ReservationTransactionRequest
} from "./inventory-reservation-store";

export type InventoryReservationReviewEvidenceCode =
  | "provider_timestamp_missing"
  | "provider_timestamp_before_reservation"
  | "provider_payment_late"
  | "physical_inventory_unavailable";

export async function recordInventoryReservationReviewEvidence(input: {
  payload: Payload;
  req: ReservationTransactionRequest;
  reservation: ReservationStored;
  reservationId: string;
  paymentId: string;
  providerEventRef?: string;
  quantity: number;
  baseKey: string;
  providerPaidAt?: string;
  evidenceCode: InventoryReservationReviewEvidenceCode;
}) {
  const idempotencyKey = hashCommerceCommandInput({
    baseKey: input.baseKey,
    operation: "late_payment_detected",
    reservationId: input.reservationId,
    evidenceCode: input.evidenceCode
  });
  const requestHash = hashCommerceCommandInput({
    idempotencyKey,
    reservationId: input.reservationId,
    paymentId: input.paymentId,
    quantity: input.quantity,
    providerEventRef: input.providerEventRef ?? null,
    providerPaidAt: input.providerPaidAt ?? null,
    evidenceCode: input.evidenceCode
  });
  const existing = await findReservationEntry(
    input.payload,
    input.req,
    idempotencyKey
  );
  if (existing) {
    if (existing.request_hash !== requestHash) {
      throw new Error("inventory-reservation-idempotency-conflict");
    }
    return existing;
  }
  const effectiveAt = await reservationTransactionTimestamp(
    input.payload,
    input.req
  );
  authorizeInventoryReservationRequest(input.req);
  return input.payload.create({
    collection: "inventory-reservation-entries" as never,
    depth: 0,
    overrideAccess: true,
    req: input.req,
    data: {
      idempotency_key: idempotencyKey,
      request_hash: requestHash,
      reservation: input.reservationId,
      operation: "late_payment_detected",
      quantity: input.quantity,
      payment: input.paymentId,
      provider_event_ref: input.providerEventRef,
      provider_paid_at: input.providerPaidAt,
      evidence_code: input.evidenceCode,
      effective_at: effectiveAt
    } as never
  });
}
