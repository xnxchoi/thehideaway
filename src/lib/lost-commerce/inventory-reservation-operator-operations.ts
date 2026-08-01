import type { Payload, PayloadRequest } from "payload";

import { paymentWebhookLock } from "@/lib/db/sequences";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  hashCommerceCommandInput,
  type CommerceCommandClaim,
  type CommerceCommandSafeResponse
} from "./commerce-commands";
import { expireInventoryReservationOrder } from "./inventory-reservation-expiry";
import { lockOrderInventoryReservationsInTransaction } from "./inventory-reservation-locks";
import {
  recordInventoryReservationOperatorEvent,
  throwWithInventoryReservationOperatorFailureEvidence
} from "./inventory-reservation-operator-evidence";
import {
  inventoryReservationOperatorMutationsEnabled,
  requireInventoryReservationOperator,
  validateInventoryReservationOperatorCommand,
  type InventoryReservationOperatorCommand
} from "./inventory-reservation-operator-policy";
import {
  listInventoryReservationOperatorQueue,
  loadInventoryReservationOperatorOrderState,
  type InventoryReservationOperatorOrderState
} from "./inventory-reservation-operator-queries";
import { reservationTransactionTimestamp } from "./inventory-reservation-store";
import { reconcilePaidInventoryReviewInTransaction } from "./inventory-reservation-paid-review";
import { releaseOrderInventoryReservationsInTransaction } from "./order-inventory-reservations";

type OperatorResult =
  | Readonly<{
      kind: "succeeded" | "replay";
      resourceId: string;
      status: string;
      affectedCount: number;
      stateHash?: string;
    }>
  | Extract<CommerceCommandClaim, { kind: "conflict" | "in_progress" }>;

type Claimed = Extract<CommerceCommandClaim, { kind: "claimed" }>;

function safeReplay(response: CommerceCommandSafeResponse): OperatorResult {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error("inventory-reservation-operator-replay-invalid");
  }
  const record = response as Record<string, CommerceCommandSafeResponse>;
  if (
    typeof record.resourceId !== "string" ||
    typeof record.status !== "string" ||
    typeof record.affectedCount !== "number"
  ) {
    throw new Error("inventory-reservation-operator-replay-invalid");
  }
  return Object.freeze({
    kind: "replay",
    resourceId: record.resourceId,
    status: record.status,
    affectedCount: record.affectedCount,
    ...(typeof record.stateHash === "string"
      ? { stateHash: record.stateHash }
      : {})
  });
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

function unobservedStateHash(
  command: InventoryReservationOperatorCommand
): string {
  return hashCommerceCommandInput({
    source: "inventory-reservation-operator",
    observation: "not-loaded",
    action: command.action,
    orderId: command.orderId ?? null
  });
}

async function complete(input: {
  payload: Payload;
  req: PayloadRequest;
  commandKey: string;
  claim: Claimed;
  response: Readonly<{
    resourceId: string;
    status: string;
    affectedCount: number;
    stateHash: string;
  }>;
  now: string;
}): Promise<void> {
  await completeCommerceCommand({
    payload: input.payload,
    req: input.req,
    commandKey: input.commandKey,
    requestHash: input.claim.requestHash,
    leaseToken: input.claim.leaseToken,
    response: input.response,
    resource: {
      type: "inventory-reservation-operation",
      id: input.response.resourceId
    },
    now: new Date(input.now)
  });
}

async function loadLockedOrderState(input: {
  payload: Payload;
  req: PayloadRequest;
  orderId: string;
  transactionID: string | number;
}): Promise<InventoryReservationOperatorOrderState> {
  await lockOrderInventoryReservationsInTransaction({
    payload: input.payload,
    req: input.req,
    orderId: input.orderId
  });
  const beforePaymentLock = await loadInventoryReservationOperatorOrderState({
    payload: input.payload,
    req: input.req,
    orderId: input.orderId
  });
  await paymentWebhookLock(
    input.payload,
    input.transactionID,
    beforePaymentLock.order.orderRef
  );
  const state = await loadInventoryReservationOperatorOrderState({
    payload: input.payload,
    req: input.req,
    orderId: input.orderId
  });
  return state;
}

async function executeOrderAction(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand & { orderId: string };
  commandKey: string;
  state: InventoryReservationOperatorOrderState;
  effectiveAt: string;
}): Promise<{ status: string; affectedCount: number; paymentId?: string }> {
  if (input.command.action === "release") {
    if (
      !["failed", "canceled"].includes(input.state.order.status) ||
      !["unpaid", "failed"].includes(input.state.order.paymentStatus) ||
      input.state.payment?.status === "paid"
    ) {
      throw new Error("inventory-reservation-operator-release-forbidden");
    }
    const results = await releaseOrderInventoryReservationsInTransaction({
      payload: input.payload,
      req: input.req as never,
      orderId: input.command.orderId,
      idempotencyKey: input.commandKey,
      effectiveAt: input.effectiveAt,
      locksHeld: true
    });
    if (results.length === 0) {
      throw new Error("inventory-reservation-release-no-effect");
    }
    return { status: "released", affectedCount: results.length };
  }
  if (input.command.action === "expire") {
    const affectedCount = await expireInventoryReservationOrder({
      payload: input.payload,
      req: input.req,
      orderId: input.command.orderId,
      locksHeld: true
    });
    if (affectedCount === 0) {
      throw new Error("inventory-reservation-operator-not-expired");
    }
    return { status: "expired", affectedCount };
  }
  if (input.command.action === "reconcile") {
    const reconciled = await reconcilePaidInventoryReviewInTransaction({
      payload: input.payload,
      req: input.req as never,
      orderId: input.command.orderId,
      idempotencyKey: input.commandKey,
      effectiveAt: input.effectiveAt,
      locksHeld: true,
      state: input.state
    });
    return {
      status: reconciled.status,
      affectedCount: reconciled.affectedCount,
      ...(reconciled.paymentId ? { paymentId: reconciled.paymentId } : {})
    };
  }
  throw new Error("invalid-inventory-reservation-operator-action");
}

async function rollbackOrderFailure(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand & { orderId: string };
  commandKey: string;
  actorId: string;
  claim: Claimed;
  transactionID: string | number;
  error: unknown;
  observedStateHash: string;
  orderId?: string;
  paymentId?: string;
}): Promise<never> {
  try {
    await input.payload.db.rollbackTransaction(input.transactionID);
  } catch (rollbackError) {
    throw new AggregateError(
      [input.error, rollbackError],
      "inventory-reservation-operator-rollback-failed"
    );
  }
  return throwWithInventoryReservationOperatorFailureEvidence(input);
}

async function commitOrderSuccess(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand & { orderId: string };
  commandKey: string;
  actorId: string;
  claim: Claimed;
  transactionID: string | number;
  effectiveAt: string;
  action: { status: string; affectedCount: number; paymentId?: string };
}): Promise<OperatorResult> {
  const observed = await loadInventoryReservationOperatorOrderState({
    payload: input.payload,
    req: input.req,
    orderId: input.command.orderId
  });
  const response = Object.freeze({
    resourceId: input.command.orderId,
    status: input.action.status,
    affectedCount: input.action.affectedCount,
    stateHash: observed.stateHash
  });
  await recordInventoryReservationOperatorEvent({
    ...input,
    leaseToken: input.claim.leaseToken,
    outcomeCode: input.action.status,
    affectedCount: input.action.affectedCount,
    observedStateHash: observed.stateHash,
    orderId: input.command.orderId,
    ...(input.action.paymentId ? { paymentId: input.action.paymentId } : {})
  });
  await complete({
    ...input,
    response,
    now: input.effectiveAt
  });
  await input.payload.db.commitTransaction(input.transactionID);
  return Object.freeze({ kind: "succeeded", ...response });
}

async function runOrderCommand(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand & { orderId: string };
  commandKey: string;
  actorId: string;
  claim: Claimed;
}): Promise<OperatorResult> {
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) {
    const error = new Error(
      "inventory-reservation-operator-transaction-failed"
    );
    return throwWithInventoryReservationOperatorFailureEvidence({
      ...input,
      error,
      observedStateHash: unobservedStateHash(input.command)
    });
  }
  const req = transactionRequest({
    payload: input.payload,
    req: input.req,
    transactionID
  });
  let observedStateHash = unobservedStateHash(input.command);
  let failureOrderId: string | undefined;
  let failurePaymentId: string | undefined;
  try {
    const state = await loadLockedOrderState({
      payload: input.payload,
      req,
      orderId: input.command.orderId,
      transactionID
    });
    failureOrderId = state.order.id;
    observedStateHash = state.stateHash;
    failurePaymentId = state.payment?.id;
    if (state.stateHash !== input.command.expectedStateHash) {
      throw new Error("inventory-reservation-operator-state-conflict");
    }
    const effectiveAt = await reservationTransactionTimestamp(
      input.payload,
      req as never
    );
    const action = await executeOrderAction({
      ...input,
      req,
      state,
      effectiveAt
    });
    return commitOrderSuccess({
      ...input,
      req,
      transactionID,
      effectiveAt,
      action
    });
  } catch (error) {
    return rollbackOrderFailure({
      ...input,
      transactionID,
      error,
      observedStateHash,
      ...(failureOrderId ? { orderId: failureOrderId } : {}),
      ...(failurePaymentId ? { paymentId: failurePaymentId } : {})
    });
  }
}

async function expireQueuedOrders(input: {
  payload: Payload;
  req: PayloadRequest;
  orderIds: readonly string[];
}): Promise<number> {
  let affectedCount = 0;
  for (const orderId of input.orderIds) {
    affectedCount += await expireInventoryReservationOrder({
      payload: input.payload,
      req: input.req,
      orderId,
      locksHeld: true
    });
  }
  return affectedCount;
}

async function commitExpirySuccess(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand & { action: "run_expiry" };
  commandKey: string;
  actorId: string;
  claim: Claimed;
  transactionID: string | number;
  affectedCount: number;
}): Promise<OperatorResult> {
  const after = await listInventoryReservationOperatorQueue({
    payload: input.payload,
    req: input.req,
    queue: "stuck",
    limit: input.command.batchSize
  });
  const effectiveAt = await reservationTransactionTimestamp(
    input.payload,
    input.req as never
  );
  const response = Object.freeze({
    resourceId: input.commandKey,
    status: "expiry-run-completed",
    affectedCount: input.affectedCount,
    stateHash: after.stateHash
  });
  await recordInventoryReservationOperatorEvent({
    ...input,
    leaseToken: input.claim.leaseToken,
    outcomeCode: response.status,
    affectedCount: response.affectedCount,
    observedStateHash: after.stateHash,
    effectiveAt
  });
  await complete({ ...input, response, now: effectiveAt });
  await input.payload.db.commitTransaction(input.transactionID);
  return Object.freeze({ kind: "succeeded", ...response });
}

async function rollbackExpiryFailure(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand & { action: "run_expiry" };
  commandKey: string;
  actorId: string;
  claim: Claimed;
  transactionID: string | number;
  error: unknown;
  observedStateHash: string;
}): Promise<never> {
  try {
    await input.payload.db.rollbackTransaction(input.transactionID);
  } catch (rollbackError) {
    throw new AggregateError(
      [input.error, rollbackError],
      "inventory-reservation-operator-rollback-failed"
    );
  }
  return throwWithInventoryReservationOperatorFailureEvidence(input);
}

async function runExpiryBatch(input: {
  payload: Payload;
  req: PayloadRequest;
  command: InventoryReservationOperatorCommand & { action: "run_expiry" };
  commandKey: string;
  actorId: string;
  claim: Claimed;
}): Promise<OperatorResult> {
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) {
    const error = new Error(
      "inventory-reservation-operator-transaction-failed"
    );
    return throwWithInventoryReservationOperatorFailureEvidence({
      ...input,
      error,
      observedStateHash: unobservedStateHash(input.command)
    });
  }
  const req = transactionRequest({
    payload: input.payload,
    req: input.req,
    transactionID
  });
  let observedStateHash = unobservedStateHash(input.command);
  try {
    const before = await listInventoryReservationOperatorQueue({
      payload: input.payload,
      req,
      queue: "stuck",
      limit: input.command.batchSize
    });
    if (before.stateHash !== input.command.expectedStateHash) {
      observedStateHash = before.stateHash;
      throw new Error("inventory-reservation-operator-state-conflict");
    }
    observedStateHash = before.stateHash;
    const affectedCount = await expireQueuedOrders({
      payload: input.payload,
      req,
      orderIds: before.items.map(({ orderId }) => orderId)
    });
    return commitExpirySuccess({
      ...input,
      req,
      transactionID,
      affectedCount
    });
  } catch (error) {
    return rollbackExpiryFailure({
      ...input,
      transactionID,
      error,
      observedStateHash
    });
  }
}

export async function runInventoryReservationOperatorCommand(
  value: unknown,
  context: {
    payload: Payload;
    req: PayloadRequest;
    commandKey: string;
  }
): Promise<OperatorResult> {
  const command = validateInventoryReservationOperatorCommand(value);
  const actorId = requireInventoryReservationOperator(context.req);
  if (!inventoryReservationOperatorMutationsEnabled()) {
    throw new Error("inventory-reservation-operator-mutations-disabled");
  }
  const claim = await claimCommerceCommand({
    payload: context.payload,
    commandKey: context.commandKey,
    validatedInput: { ...command, actorId },
    businessKey: `inventory-reservation-operator:${hashCommerceCommandInput({
      action: command.action,
      orderId: command.orderId ?? null,
      expectedStateHash: command.expectedStateHash
    })}`
  });
  if (claim.kind === "conflict" || claim.kind === "in_progress") return claim;
  if (claim.kind === "replay") return safeReplay(claim.response);
  if (command.action === "run_expiry") {
    return runExpiryBatch({
      payload: context.payload,
      req: context.req,
      command: command as InventoryReservationOperatorCommand & {
        action: "run_expiry";
      },
      commandKey: context.commandKey,
      actorId,
      claim
    });
  }
  return runOrderCommand({
    payload: context.payload,
    req: context.req,
    command: command as InventoryReservationOperatorCommand & {
      orderId: string;
    },
    commandKey: context.commandKey,
    actorId,
    claim
  });
}
