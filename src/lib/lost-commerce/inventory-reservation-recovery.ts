import type { Payload } from "payload";

import {
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "./commerce-commands";
import type {
  InventoryReservationPolicy,
  InventoryReservationRequest
} from "./inventory-reservation-contracts";
import { lockOrderInventoryReservationsInTransaction } from "./inventory-reservation-locks";
import { reservationHistory } from "./inventory-reservation-reconstruction";
import {
  consumeInventoryReservationInTransaction,
  reserveOrderInventoryInTransaction
} from "./inventory-reservations";
import {
  findReservationDocById as findById,
  findReservationDocs as findDocs,
  immutableReservationCopy as immutableCopy,
  reservationPositiveQuantity as positiveQuantity,
  reservationReference as reference,
  reservationRelationshipId as relationshipId,
  reservationTimestamp as timestamp,
  requireReservationTransaction as transactionID,
  type ReservationStored as Stored,
  type ReservationTransactionRequest as TransactionRequest
} from "./inventory-reservation-store";

type RecoveryInput = Readonly<{
  payload: Payload;
  req: TransactionRequest;
  orderId: unknown;
  paymentId: unknown;
  idempotencyKey: unknown;
  providerEventRef?: unknown;
  effectiveAt: unknown;
  locksHeld?: boolean;
}>;

type OriginalState = Readonly<{
  reservation: Stored;
  history: Awaited<ReturnType<typeof reservationHistory>>;
}>;

function policyFromReservation(
  reservation: Stored,
  locationCode: string
): InventoryReservationPolicy {
  const ttlMinutes = reservation.ttl_minutes;
  const safetyStock = reservation.safety_stock;
  if (
    reservation.policy_version !== 1 ||
    typeof ttlMinutes !== "number" ||
    !Number.isSafeInteger(ttlMinutes) ||
    ttlMinutes < 1 ||
    typeof safetyStock !== "number" ||
    !Number.isSafeInteger(safetyStock) ||
    safetyStock < 0 ||
    reservation.consume_point !== "payment_confirmed" ||
    reservation.expiry_boundary !== "at_or_after" ||
    reservation.payment_time_source !== "provider_paid_at" ||
    reservation.late_payment_policy !== "manual_review" ||
    reservation.backorder_mode !== "disabled"
  ) {
    throw new Error("inventory-reservation-history-corrupt");
  }
  return {
    enabled: true,
    ttlMinutes,
    locationCode,
    safetyStock,
    consumePoint: "payment_confirmed",
    expiryBoundary: "at_or_after",
    paymentTimeSource: "provider_paid_at",
    latePaymentPolicy: "manual_review",
    backorderMode: "disabled"
  };
}

function sameRecoveryPolicy(
  left: InventoryReservationPolicy,
  right: InventoryReservationPolicy
): boolean {
  return (
    left.ttlMinutes === right.ttlMinutes &&
    left.locationCode === right.locationCode &&
    left.safetyStock === right.safetyStock &&
    left.consumePoint === right.consumePoint &&
    left.expiryBoundary === right.expiryBoundary &&
    left.paymentTimeSource === right.paymentTimeSource &&
    left.latePaymentPolicy === right.latePaymentPolicy &&
    left.backorderMode === right.backorderMode
  );
}

async function loadRecoveryState(input: {
  payload: Payload;
  req: TransactionRequest;
  orderId: string;
  locksHeld?: boolean;
}) {
  const reservations = input.locksHeld
    ? await findDocs(
        input.payload,
        input.req,
        "inventory-reservations",
        { order: { equals: input.orderId } },
        "id"
      )
    : await lockOrderInventoryReservationsInTransaction({
        payload: input.payload,
        req: input.req,
        orderId: input.orderId
      });
  const originals = reservations.filter(
    (reservation) => !relationshipId(reservation.recovery_of)
  );
  if (originals.length === 0) {
    throw new Error("inventory-reservation-order-missing");
  }
  const recoveryByOriginal = new Map<string, Stored>();
  for (const reservation of reservations) {
    const originalId = relationshipId(reservation.recovery_of);
    if (!originalId) continue;
    if (recoveryByOriginal.has(originalId)) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    recoveryByOriginal.set(originalId, reservation);
  }
  const originalStates = await Promise.all(
    originals.map(async (reservation) => ({
      reservation,
      history: await reservationHistory(input.payload, input.req, reservation)
    }))
  );
  return { originalStates, recoveryByOriginal };
}

async function buildRecoveryRequests(input: {
  payload: Payload;
  req: TransactionRequest;
  orderId: string;
  effectiveAt: string;
  originalStates: readonly OriginalState[];
  recoveryByOriginal: ReadonlyMap<string, Stored>;
}) {
  let recoveryPolicy: InventoryReservationPolicy | undefined;
  const requests: InventoryReservationRequest[] = [];
  for (const { reservation, history } of input.originalStates) {
    const originalId = relationshipId(reservation.id);
    if (
      !originalId ||
      !["released", "expired"].includes(history.status) ||
      input.recoveryByOriginal.has(originalId)
    ) {
      continue;
    }
    const skuId = reference(
      relationshipId(reservation.sku),
      "inventory-reservation-history-corrupt"
    );
    const locationId = reference(
      relationshipId(reservation.location),
      "inventory-reservation-history-corrupt"
    );
    const location = await findById(
      input.payload,
      input.req,
      "stock-locations",
      locationId
    );
    const policy = policyFromReservation(
      reservation,
      reference(location.code, "inventory-reservation-history-corrupt")
    );
    if (recoveryPolicy && !sameRecoveryPolicy(recoveryPolicy, policy)) {
      throw new Error("inventory-reservation-recovery-policy-mismatch");
    }
    recoveryPolicy = policy;
    requests.push({
      idempotencyKey: hashCommerceCommandInput({
        source: "paid-inventory-review-recovery",
        version: 1,
        originalId
      }),
      operation: "reserve",
      orderId: input.orderId,
      skuId,
      locationId,
      quantity: positiveQuantity(reservation.quantity),
      recoveryOf: originalId,
      effectiveAt: input.effectiveAt,
      expiresAt: new Date(
        Date.parse(input.effectiveAt) + policy.ttlMinutes * 60_000
      ).toISOString()
    });
  }
  return { policy: recoveryPolicy, requests };
}

async function reserveRecoveries(input: {
  payload: Payload;
  req: TransactionRequest;
  plan: Awaited<ReturnType<typeof buildRecoveryRequests>>;
  recoveryByOriginal: Map<string, Stored>;
}): Promise<"ready" | "review_remaining"> {
  if (input.plan.requests.length === 0) return "ready";
  if (!input.plan.policy)
    throw new Error("inventory-reservation-history-corrupt");
  try {
    const recovered = await reserveOrderInventoryInTransaction({
      payload: input.payload,
      req: input.req,
      requests: input.plan.requests,
      policy: input.plan.policy
    });
    for (const result of recovered.results) {
      if (result.kind === "paid_inventory_review") {
        throw new Error("inventory-reservation-recovery-invalid");
      }
      const recovery = result.reservation as Stored;
      const originalId = relationshipId(recovery.recovery_of);
      if (!originalId)
        throw new Error("inventory-reservation-recovery-invalid");
      input.recoveryByOriginal.set(originalId, recovery);
    }
    return "ready";
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "insufficient-available-to-promise"
    ) {
      return "review_remaining";
    }
    throw error;
  }
}

async function collectConsumeTargets(input: {
  payload: Payload;
  req: TransactionRequest;
  originalStates: readonly OriginalState[];
  recoveryByOriginal: ReadonlyMap<string, Stored>;
}): Promise<Stored[] | null> {
  const targets: Stored[] = [];
  for (const { reservation, history } of input.originalStates) {
    const originalId = reference(
      relationshipId(reservation.id),
      "inventory-reservation-history-corrupt"
    );
    if (history.status === "active") {
      targets.push(reservation);
      continue;
    }
    if (history.status === "consumed") continue;
    const recovery = input.recoveryByOriginal.get(originalId);
    if (!recovery) return null;
    const recoveryHistory = await reservationHistory(
      input.payload,
      input.req,
      recovery
    );
    if (recoveryHistory.status === "active") targets.push(recovery);
    else if (recoveryHistory.status !== "consumed") {
      throw new Error("inventory-reservation-recovery-invalid");
    }
  }
  return targets;
}

async function consumeTargets(input: {
  payload: Payload;
  req: TransactionRequest;
  orderId: string;
  paymentId: string;
  providerEventRef?: string;
  baseKey: string;
  effectiveAt: string;
  targets: readonly Stored[];
}): Promise<void> {
  for (const reservation of input.targets) {
    const reservationId = reference(
      relationshipId(reservation.id),
      "inventory-reservation-history-corrupt"
    );
    const result = await consumeInventoryReservationInTransaction({
      payload: input.payload,
      req: input.req,
      paymentId: input.paymentId,
      providerEventRef: input.providerEventRef,
      locksHeld: true,
      request: {
        idempotencyKey: hashCommerceCommandInput({
          source: "paid-inventory-review-consume",
          version: 1,
          reservationId,
          paymentId: input.paymentId,
          baseKey: input.baseKey
        }),
        operation: "consume",
        orderId: input.orderId,
        reservationId,
        skuId: reference(
          relationshipId(reservation.sku),
          "inventory-reservation-history-corrupt"
        ),
        locationId: reference(
          relationshipId(reservation.location),
          "inventory-reservation-history-corrupt"
        ),
        quantity: positiveQuantity(reservation.quantity),
        effectiveAt: input.effectiveAt
      }
    });
    if (result.kind === "paid_inventory_review") {
      throw new Error("inventory-reservation-recovery-balance-changed");
    }
  }
}

export async function recoverPaidInventoryReservationsInTransaction(
  input: RecoveryInput
): Promise<
  Readonly<{ kind: "confirmed" | "review_remaining"; affectedCount: number }>
> {
  transactionID(input.req);
  const orderId = reference(input.orderId, "invalid-inventory-order");
  const paymentId = reference(input.paymentId, "invalid-inventory-payment");
  const baseKey = validateCommerceCommandKey(input.idempotencyKey);
  const effectiveAt = timestamp(
    input.effectiveAt,
    "invalid-inventory-reservation-effective-at"
  );
  const providerEventRef =
    input.providerEventRef === undefined || input.providerEventRef === null
      ? undefined
      : reference(
          input.providerEventRef,
          "invalid-inventory-provider-event-ref"
        );
  const state = await loadRecoveryState({ ...input, orderId });
  const plan = await buildRecoveryRequests({
    ...input,
    orderId,
    effectiveAt,
    ...state
  });
  const recoveryStatus = await reserveRecoveries({
    ...input,
    plan,
    recoveryByOriginal: state.recoveryByOriginal
  });
  if (recoveryStatus === "review_remaining") {
    return immutableCopy({ kind: "review_remaining", affectedCount: 0 });
  }
  const targets = await collectConsumeTargets({ ...input, ...state });
  if (!targets) {
    return immutableCopy({ kind: "review_remaining", affectedCount: 0 });
  }
  await consumeTargets({
    ...input,
    orderId,
    paymentId,
    providerEventRef,
    baseKey,
    effectiveAt,
    targets
  });
  return immutableCopy({ kind: "confirmed", affectedCount: targets.length });
}
