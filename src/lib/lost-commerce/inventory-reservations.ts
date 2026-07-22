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
import { authorizeInventoryReservationRequest } from "@/payload/collections/(consumption)/InventoryReservations/authorizeInventoryReservation";
import { validateCommerceCommandKey } from "./commerce-commands";
import {
  calculateAvailableToPromise,
  hashInventoryReservationRequest,
  type InventoryReservationPolicy,
  type InventoryReservationRequest,
  validateInventoryReservationRequest
} from "./inventory-reservation-contracts";
import {
  grantInventoryReservationLedgerAuthorization,
  revokeInventoryReservationLedgerAuthorization
} from "./inventory-reservation-ledger-authorization";
import { lockOrderInventoryReservationsInTransaction } from "./inventory-reservation-locks";
import {
  inventoryReservationMovementKey,
  inventoryReservationTerminalCommandKey
} from "./inventory-reservation-idempotency";
import { recordInventoryReservationReviewEvidence } from "./inventory-reservation-review-evidence";
import {
  activeReservedForAggregate,
  reconstructInventoryReservations,
  reservationHistory
} from "./inventory-reservation-reconstruction";
import {
  compareReservationText as compareText,
  findReservationDocById as findById,
  findReservationDocs as findDocs,
  findReservationEntry as findEntry,
  immutableReservationCopy as immutableCopy,
  reservationPositiveQuantity as positiveQuantity,
  reservationReference as reference,
  reservationRelationshipId as relationshipId,
  reservationTimestamp as timestamp,
  reservationTransactionTimestamp as transactionTimestamp,
  requireReservationTransaction as transactionID,
  type ReservationStored as Stored,
  type ReservationTransactionRequest as TransactionRequest
} from "./inventory-reservation-store";
import {
  recordInventoryMovementsInTransaction,
  type InventoryTransactionRequest
} from "./inventory-ledger";

export { reconstructInventoryReservations };
export { lockOrderInventoryReservationsInTransaction };
export { requireInventoryReservationPolicyForCheckout } from "./inventory-reservation-policy";

type PreparedRequest = {
  index: number;
  request: InventoryReservationRequest;
  requestHash: string;
};

export type InventoryReservationResult =
  | { kind: "created"; reservation: Readonly<Stored>; entry: Readonly<Stored> }
  | { kind: "replay"; reservation: Readonly<Stored>; entry: Readonly<Stored> }
  | {
      kind: "paid_inventory_review";
      reason: "physical_inventory_unavailable" | "late_payment";
      reservation: Readonly<Stored>;
    };

export type InventoryReservationBatchResult = {
  kind: "created" | "replay";
  results: readonly InventoryReservationResult[];
};

const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;

function requirePolicy(policy: InventoryReservationPolicy): void {
  if (
    policy.enabled !== true ||
    !Number.isSafeInteger(policy.ttlMinutes) ||
    policy.ttlMinutes <= 0 ||
    !REFERENCE_PATTERN.test(policy.locationCode) ||
    !Number.isSafeInteger(policy.safetyStock) ||
    policy.safetyStock < 0 ||
    policy.consumePoint !== "payment_confirmed" ||
    policy.expiryBoundary !== "at_or_after" ||
    policy.paymentTimeSource !== "provider_paid_at" ||
    policy.latePaymentPolicy !== "manual_review" ||
    policy.backorderMode !== "disabled"
  ) {
    throw new Error("inventory-reservations-unavailable");
  }
}

async function replayFor(
  payload: Payload,
  req: TransactionRequest,
  prepared: PreparedRequest
): Promise<InventoryReservationResult | undefined> {
  const entry = await findEntry(payload, req, prepared.request.idempotencyKey);
  if (!entry) return undefined;
  if (entry.request_hash !== prepared.requestHash) {
    throw new Error("inventory-reservation-idempotency-conflict");
  }
  const reservationId = relationshipId(entry.reservation);
  if (!reservationId) throw new Error("inventory-reservation-history-corrupt");
  const reservation = await findById(
    payload,
    req,
    "inventory-reservations",
    reservationId
  );
  return immutableCopy({ kind: "replay", reservation, entry });
}

function reservationKey(request: InventoryReservationRequest): string {
  return `${request.orderId}:${request.skuId}:${request.locationId}`;
}

function physicalAggregateKey(request: InventoryReservationRequest): string {
  return `${request.skuId}:${request.locationId}:available`;
}

function reservationAggregateKey(request: InventoryReservationRequest): string {
  return `${request.skuId}:${request.locationId}`;
}

function preparedRequests(values: readonly unknown[]): PreparedRequest[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("invalid-inventory-reservation-batch");
  }
  const prepared = values.map((value, index) => {
    const request = validateInventoryReservationRequest(value);
    if (request.operation !== "reserve") {
      throw new Error("invalid-inventory-reservation-batch");
    }
    return {
      index,
      request,
      requestHash: hashInventoryReservationRequest(request)
    };
  });
  const commandKeys = new Set<string>();
  const reservationKeys = new Set<string>();
  for (const item of prepared) {
    const key = reservationKey(item.request);
    if (
      commandKeys.has(item.request.idempotencyKey) ||
      reservationKeys.has(key)
    ) {
      throw new Error("inventory-reservation-batch-duplicate");
    }
    commandKeys.add(item.request.idempotencyKey);
    reservationKeys.add(key);
  }
  return prepared;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(compareText);
}

async function validateSkuAndLocation(input: {
  payload: Payload;
  req: TransactionRequest;
  skuId: string;
  locationId: string;
  locationCode?: string;
}): Promise<{ productId: string }> {
  const sku = await findById(
    input.payload,
    input.req,
    "product-variants",
    input.skuId
  );
  const productId = relationshipId(sku.product);
  if (!productId || sku.active !== true || sku.identity_locked !== true) {
    throw new Error("inventory-reservation-sku-unavailable");
  }
  const location = await findById(
    input.payload,
    input.req,
    "stock-locations",
    input.locationId
  );
  if (
    location.active !== true ||
    (input.locationCode !== undefined && location.code !== input.locationCode)
  ) {
    throw new Error("inventory-reservation-location-unavailable");
  }
  return { productId };
}

async function readAvailable(
  payload: Payload,
  req: TransactionRequest,
  aggregateKey: string
): Promise<number> {
  const levels = await findDocs(payload, req, "inventory-levels", {
    aggregate_key: { equals: aggregateKey }
  });
  const quantity = levels[0]?.quantity ?? 0;
  if (
    typeof quantity !== "number" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0
  ) {
    throw new Error("inventory-reservation-physical-balance-corrupt");
  }
  return quantity;
}

async function createReservation(
  payload: Payload,
  req: TransactionRequest,
  prepared: PreparedRequest,
  policy: InventoryReservationPolicy
): Promise<InventoryReservationResult> {
  const request = prepared.request;
  authorizeInventoryReservationRequest(req);
  const reservation = (await payload.create({
    collection: "inventory-reservations" as never,
    depth: 0,
    overrideAccess: true,
    req,
    data: {
      reservation_key: reservationKey(request),
      request_hash: prepared.requestHash,
      order: request.orderId,
      sku: request.skuId,
      location: request.locationId,
      quantity: request.quantity,
      status: "active",
      expires_at: request.expiresAt,
      reserved_at: request.effectiveAt,
      policy_version: 1,
      ttl_minutes: policy.ttlMinutes,
      safety_stock: policy.safetyStock,
      consume_point: policy.consumePoint,
      expiry_boundary: policy.expiryBoundary,
      payment_time_source: policy.paymentTimeSource,
      late_payment_policy: policy.latePaymentPolicy,
      backorder_mode: policy.backorderMode
    } as never
  })) as unknown as Stored;
  const id = relationshipId(reservation.id);
  if (!id) throw new Error("inventory-reservation-write-missing");
  authorizeInventoryReservationRequest(req);
  const entry = (await payload.create({
    collection: "inventory-reservation-entries" as never,
    depth: 0,
    overrideAccess: true,
    req,
    data: {
      idempotency_key: request.idempotencyKey,
      request_hash: prepared.requestHash,
      reservation: id,
      operation: "reserve",
      quantity: request.quantity,
      actor: relationshipId(req.user?.id),
      effective_at: request.effectiveAt
    } as never
  })) as unknown as Stored;
  return immutableCopy({ kind: "created", reservation, entry });
}

export async function reserveOrderInventoryInTransaction(input: {
  payload: Payload;
  req: TransactionRequest;
  requests: readonly unknown[];
  policy: InventoryReservationPolicy;
}): Promise<Readonly<InventoryReservationBatchResult>> {
  requirePolicy(input.policy);
  const tx = transactionID(input.req);
  const req = input.req as TransactionRequest;
  const prepared = preparedRequests(input.requests);

  for (const key of uniqueSorted(
    prepared.map((item) => item.request.idempotencyKey)
  )) {
    await inventoryReservationIdempotencyLock(input.payload, tx, key);
  }

  const replays = new Map<number, InventoryReservationResult>();
  for (const item of prepared) {
    const replay = await replayFor(input.payload, req, item);
    if (replay) replays.set(item.index, replay);
  }
  const active = prepared.filter((item) => !replays.has(item.index));
  if (active.length === 0) {
    return immutableCopy({
      kind: "replay",
      results: prepared.map((item) => replays.get(item.index)!)
    });
  }

  const productBySku = new Map<string, string>();
  for (const skuId of uniqueSorted(active.map((item) => item.request.skuId))) {
    const matching = active.find((item) => item.request.skuId === skuId)!;
    const identity = await validateSkuAndLocation({
      payload: input.payload,
      req,
      skuId,
      locationId: matching.request.locationId,
      locationCode: input.policy.locationCode
    });
    productBySku.set(skuId, identity.productId);
  }

  for (const productId of uniqueSorted(productBySku.values())) {
    await productInventoryLock(input.payload, tx, productId);
  }
  for (const skuId of uniqueSorted(active.map((item) => item.request.skuId))) {
    await productSkuMutationLock(input.payload, tx, skuId);
  }
  for (const locationId of uniqueSorted(
    active.map((item) => item.request.locationId)
  )) {
    await inventoryLocationLock(input.payload, tx, locationId);
  }
  for (const key of uniqueSorted(
    active.map((item) => physicalAggregateKey(item.request))
  )) {
    await inventoryAggregateLock(input.payload, tx, key);
  }
  for (const key of uniqueSorted(
    active.map((item) => reservationAggregateKey(item.request))
  )) {
    await inventoryReservationAggregateLock(input.payload, tx, key);
  }
  for (const key of uniqueSorted(
    active.map((item) => reservationKey(item.request))
  )) {
    await inventoryReservationLock(input.payload, tx, key);
  }

  const requestedByAggregate = new Map<string, number>();
  for (const item of active) {
    await validateSkuAndLocation({
      payload: input.payload,
      req,
      skuId: item.request.skuId,
      locationId: item.request.locationId,
      locationCode: input.policy.locationCode
    });
    const existing = await findDocs(
      input.payload,
      req,
      "inventory-reservations",
      { reservation_key: { equals: reservationKey(item.request) } }
    );
    if (existing.length > 0) {
      throw new Error("inventory-reservation-already-exists");
    }
    const key = reservationAggregateKey(item.request);
    const next = (requestedByAggregate.get(key) ?? 0) + item.request.quantity;
    if (!Number.isSafeInteger(next)) {
      throw new Error("invalid-inventory-reservation-quantity");
    }
    requestedByAggregate.set(key, next);
  }

  for (const [key, requested] of requestedByAggregate) {
    const item = active.find(
      (candidate) => reservationAggregateKey(candidate.request) === key
    )!;
    const available = await readAvailable(
      input.payload,
      req,
      physicalAggregateKey(item.request)
    );
    const reserved = await activeReservedForAggregate(
      input.payload,
      req,
      item.request.skuId,
      item.request.locationId
    );
    if (
      requested >
      calculateAvailableToPromise({
        available,
        activeReserved: reserved,
        safetyStock: input.policy.safetyStock
      })
    ) {
      throw new Error("insufficient-available-to-promise");
    }
  }

  const created = new Map<number, InventoryReservationResult>();
  for (const item of active) {
    created.set(
      item.index,
      await createReservation(input.payload, req, item, input.policy)
    );
  }
  const results = prepared.map(
    (item) => replays.get(item.index) ?? created.get(item.index)!
  );
  return immutableCopy({ kind: "created", results });
}

async function lockReservationIdentity(input: {
  payload: Payload;
  req: TransactionRequest;
  tx: string | number;
  request: InventoryReservationRequest;
  movementKey?: string;
}): Promise<{ reservation: Stored; productId: string }> {
  if (input.movementKey) {
    await inventoryMovementIdempotencyLock(
      input.payload,
      input.tx,
      input.movementKey
    );
  }
  const reservation = await findById(
    input.payload,
    input.req,
    "inventory-reservations",
    input.request.reservationId!
  );
  const identity = await validateSkuAndLocation({
    payload: input.payload,
    req: input.req,
    skuId: input.request.skuId,
    locationId: input.request.locationId
  });
  await productInventoryLock(input.payload, input.tx, identity.productId);
  await productSkuMutationLock(input.payload, input.tx, input.request.skuId);
  await inventoryLocationLock(
    input.payload,
    input.tx,
    input.request.locationId
  );
  await inventoryAggregateLock(
    input.payload,
    input.tx,
    physicalAggregateKey(input.request)
  );
  await inventoryReservationAggregateLock(
    input.payload,
    input.tx,
    reservationAggregateKey(input.request)
  );
  await inventoryReservationLock(
    input.payload,
    input.tx,
    input.request.reservationId!
  );
  return { reservation, productId: identity.productId };
}

function requireMatchingReservation(
  reservation: Stored,
  request: InventoryReservationRequest
): void {
  if (
    relationshipId(reservation.order) !== request.orderId ||
    relationshipId(reservation.sku) !== request.skuId ||
    relationshipId(reservation.location) !== request.locationId ||
    reservation.quantity !== request.quantity
  ) {
    throw new Error("inventory-reservation-identity-mismatch");
  }
}

async function recordPhysicalConsume(input: {
  payload: Payload;
  req: TransactionRequest;
  request: InventoryReservationRequest;
  movementKey: string;
}): Promise<"consumed" | "review"> {
  const reservationId = input.request.reservationId!;
  const authorization = grantInventoryReservationLedgerAuthorization({
    idempotencyKey: input.movementKey,
    reservationId,
    skuId: input.request.skuId,
    locationId: input.request.locationId,
    quantity: input.request.quantity
  });
  try {
    await recordInventoryMovementsInTransaction({
      payload: input.payload,
      req: input.req as InventoryTransactionRequest,
      authorization: authorization as never,
      requests: [
        {
          idempotencyKey: input.movementKey,
          skuId: input.request.skuId,
          kind: "outbound",
          quantity: input.request.quantity,
          from: {
            locationId: input.request.locationId,
            disposition: "available"
          },
          reasonCode: "reservation-consume",
          sourceType: "inventory_reservation",
          sourceRef: reservationId,
          actorId: "system:inventory-reservation",
          effectiveAt: input.request.effectiveAt
        }
      ]
    });
    return "consumed";
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "insufficient-inventory-balance"
    ) {
      return "review";
    }
    throw error;
  } finally {
    revokeInventoryReservationLedgerAuthorization(authorization);
  }
}

async function applyTerminal(input: {
  payload: Payload;
  req: TransactionRequest;
  request: unknown;
  expected: "release" | "expire" | "consume";
  paymentId?: string;
  providerEventRef?: string;
  locksHeld?: boolean;
}): Promise<InventoryReservationResult> {
  const request = validateInventoryReservationRequest(input.request);
  if (request.operation !== input.expected) {
    throw new Error("invalid-inventory-reservation-operation");
  }
  const requestHash = hashInventoryReservationRequest(request);
  const prepared = { index: 0, request, requestHash };
  const tx = transactionID(input.req);
  const req = input.req as TransactionRequest;
  await inventoryReservationIdempotencyLock(
    input.payload,
    tx,
    request.idempotencyKey
  );
  const movementKey =
    request.operation === "consume"
      ? inventoryReservationMovementKey(request.idempotencyKey)
      : undefined;
  if (movementKey) {
    await inventoryMovementIdempotencyLock(input.payload, tx, movementKey);
  }
  const replay = await replayFor(input.payload, req, prepared);
  if (replay) return replay;

  if (!input.locksHeld) {
    await lockReservationIdentity({
      payload: input.payload,
      req,
      tx,
      request
    });
  }
  const reservation = await findById(
    input.payload,
    req,
    "inventory-reservations",
    request.reservationId!
  );
  requireMatchingReservation(reservation, request);
  const history = await reservationHistory(input.payload, req, reservation);
  if (
    history.status !== "active" ||
    history.activeQuantity !== request.quantity
  ) {
    throw new Error("invalid-inventory-reservation-transition");
  }

  const effectiveAt =
    request.operation === "expire"
      ? await transactionTimestamp(input.payload, req)
      : request.effectiveAt;
  if (
    request.operation === "expire" &&
    Date.parse(effectiveAt) < Date.parse(String(reservation.expires_at))
  ) {
    throw new Error("inventory-reservation-not-expired");
  }

  if (request.operation === "consume") {
    const consume = await recordPhysicalConsume({
      payload: input.payload,
      req,
      request,
      movementKey: movementKey!
    });
    if (consume === "review") {
      return immutableCopy({
        kind: "paid_inventory_review",
        reason: "physical_inventory_unavailable",
        reservation
      });
    }
  }

  const status =
    request.operation === "release"
      ? "released"
      : request.operation === "expire"
        ? "expired"
        : "consumed";
  authorizeInventoryReservationRequest(req);
  const updated = (await input.payload.update({
    collection: "inventory-reservations" as never,
    id: request.reservationId!,
    depth: 0,
    overrideAccess: true,
    req,
    data: { status, terminal_at: effectiveAt } as never
  })) as unknown as Stored;
  authorizeInventoryReservationRequest(req);
  const entry = (await input.payload.create({
    collection: "inventory-reservation-entries" as never,
    depth: 0,
    overrideAccess: true,
    req,
    data: {
      idempotency_key: request.idempotencyKey,
      request_hash: requestHash,
      reservation: request.reservationId,
      operation: request.operation,
      quantity: request.quantity,
      payment: input.paymentId,
      provider_event_ref: input.providerEventRef,
      actor: relationshipId(req.user?.id) ?? "system:inventory-reservation",
      effective_at: effectiveAt
    } as never
  })) as unknown as Stored;
  return immutableCopy({ kind: "created", reservation: updated, entry });
}

export function releaseOrderInventoryInTransaction(input: {
  payload: Payload;
  req: TransactionRequest;
  request: unknown;
  locksHeld?: boolean;
}): Promise<InventoryReservationResult> {
  return applyTerminal({ ...input, expected: "release" });
}

export function expireInventoryReservationInTransaction(input: {
  payload: Payload;
  req: TransactionRequest;
  request: unknown;
  locksHeld?: boolean;
}): Promise<InventoryReservationResult> {
  return applyTerminal({ ...input, expected: "expire" });
}

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
  const tx = transactionID(input.req);
  void tx;
  const req = input.req as TransactionRequest;
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
    req,
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
  await findById(input.payload, req, "product-orders", orderId);
  const reservations = await findDocs(
    input.payload,
    req,
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
    const history = await reservationHistory(input.payload, req, reservation);
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
        req,
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
    const result = await applyTerminal({
      payload: input.payload,
      req,
      expected: "consume",
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
        req,
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
