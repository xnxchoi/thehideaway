import type { Payload, PayloadRequest } from "payload";

import { authorizeInventoryReservationOperatorEventRequest } from "@/payload/collections/(consumption)/InventoryReservationOperatorEvents/authorizeInventoryReservationOperatorEvent";
import {
  hashCommerceCommandInput,
  type CommerceCommandClaim
} from "./commerce-commands";
import type { InventoryReservationOperatorCommand } from "./inventory-reservation-operator-policy";
import { reservationTransactionTimestamp } from "./inventory-reservation-store";

type Claimed = Extract<CommerceCommandClaim, { kind: "claimed" }>;

const FAILURE_OUTCOME_CODES = new Set([
  "invalid-inventory-reservation-operator-action",
  "inventory-reservation-expiry-discovery-failed",
  "inventory-reservation-expiry-order-too-large",
  "inventory-reservation-history-corrupt",
  "inventory-reservation-operator-admin-required",
  "inventory-reservation-operator-not-expired",
  "inventory-reservation-operator-order-empty",
  "inventory-reservation-operator-order-not-found",
  "inventory-reservation-operator-release-forbidden",
  "inventory-reservation-operator-state-conflict",
  "inventory-reservation-operator-transaction-failed",
  "inventory-reservation-pagination-corrupt",
  "inventory-reservation-release-no-effect",
  "inventory-reservation-sku-unavailable",
  "inventory-reservation-transaction-time-missing"
]);

function failureOutcomeCode(error: unknown): string {
  if (error instanceof Error && FAILURE_OUTCOME_CODES.has(error.message)) {
    return error.message;
  }
  return "inventory-reservation-operator-failed";
}

function transactionRequest(input: {
  payload: Payload;
  req: PayloadRequest;
  transactionID: string | number;
}): PayloadRequest {
  return {
    ...input.req,
    payload: input.payload,
    transactionID: input.transactionID,
    context: { ...(input.req.context ?? {}) }
  } as PayloadRequest;
}

export async function recordInventoryReservationOperatorEvent(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand;
  commandKey: string;
  leaseToken: string;
  actorId: string;
  outcomeCode: string;
  affectedCount: number;
  observedStateHash: string;
  effectiveAt: string;
  orderId?: string;
  paymentId?: string;
}): Promise<void> {
  authorizeInventoryReservationOperatorEventRequest(input.req);
  await input.payload.create({
    collection: "inventory-reservation-operator-events" as never,
    depth: 0,
    overrideAccess: true,
    req: input.req,
    data: {
      event_key: hashCommerceCommandInput({
        commandKey: input.commandKey,
        action: input.command.action,
        leaseToken: input.leaseToken
      }),
      command_key: input.commandKey,
      source: "manual_operator",
      correlation_key: input.commandKey,
      causation_key: input.commandKey,
      action: input.command.action,
      outcome_code: input.outcomeCode,
      actor: input.actorId,
      order: input.orderId,
      payment: input.paymentId,
      reason_code: input.command.reasonCode,
      evidence_reference: input.command.evidenceReference,
      expected_state_hash: input.command.expectedStateHash,
      observed_state_hash: input.observedStateHash,
      affected_count: input.affectedCount,
      effective_at: input.effectiveAt
    } as never
  });
}

async function recordFailureEvent(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand;
  commandKey: string;
  actorId: string;
  claim: Claimed;
  error: unknown;
  observedStateHash: string;
  orderId?: string;
  paymentId?: string;
}): Promise<void> {
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) {
    throw new Error(
      "inventory-reservation-operator-evidence-transaction-failed"
    );
  }
  const req = transactionRequest({ ...input, transactionID });
  try {
    await recordInventoryReservationOperatorEvent({
      ...input,
      req,
      leaseToken: input.claim.leaseToken,
      outcomeCode: failureOutcomeCode(input.error),
      affectedCount: 0,
      effectiveAt: await reservationTransactionTimestamp(
        input.payload,
        req as never
      )
    });
    await input.payload.db.commitTransaction(transactionID);
  } catch (error) {
    try {
      await input.payload.db.rollbackTransaction(transactionID);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "inventory-reservation-operator-evidence-rollback-failed"
      );
    }
    throw error;
  }
}

export async function throwWithInventoryReservationOperatorFailureEvidence(
  input: Parameters<typeof recordFailureEvent>[0]
): Promise<never> {
  try {
    await recordFailureEvent(input);
  } catch (evidenceError) {
    throw new AggregateError(
      [input.error, evidenceError],
      "inventory-reservation-operator-failure-evidence-failed"
    );
  }
  throw input.error;
}
