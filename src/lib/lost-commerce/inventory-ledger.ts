import type {
  Payload,
  PayloadRequest,
  RequiredDataFromCollectionSlug
} from "payload";

import type {
  InventoryLevel,
  InventoryMovement,
  ProductVariant,
  StockLocation
} from "@/payload-types";

import {
  inventoryAggregateLock,
  inventoryLocationLock,
  inventoryMovementIdempotencyLock,
  productInventoryLock,
  productSkuMutationLock
} from "@/lib/db/sequences";
import { authorizeInventoryLedgerRequest } from "@/payload/collections/(consumption)/InventoryLevels/protectInventoryProjection";
import {
  hashInventoryMovementRequest,
  inventoryAggregateKey,
  type InventoryDisposition,
  type InventoryMovementEndpoint,
  type InventoryMovementRequest,
  validateInventoryMovementRequest
} from "./inventory-ledger-contracts";
import {
  assertInventoryWorkflowAuthorization,
  requireInventoryAdmin,
  type InventoryWorkflowAuthorization
} from "./inventory-operation-runtime";
import {
  assertInventoryReservationLedgerAuthorization,
  type InventoryReservationLedgerAuthorization
} from "./inventory-reservation-ledger-authorization";

type AggregateChange = {
  aggregateKey: string;
  skuId: string;
  locationId: string;
  disposition: InventoryDisposition;
  delta: number;
};

type PreparedMovement = {
  index: number;
  request: InventoryMovementRequest;
  requestHash: string;
};

type ProjectionState = {
  projection?: InventoryLevel;
  quantity: number;
  movementCount: number;
};

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function requireMapValue<K, V>(
  values: ReadonlyMap<K, V>,
  key: K,
  errorCode: string
): V {
  const value = values.get(key);
  if (value === undefined) throw new Error(errorCode);
  return value;
}

export type InventoryMovementResult =
  | {
      kind: "created";
      movement: InventoryMovement;
      projections: InventoryLevel[];
    }
  | { kind: "replay"; movement: InventoryMovement };

export type InventoryMovementBatchResult = {
  results: InventoryMovementResult[];
  projections: InventoryLevel[];
};

export type InventoryTransactionRequest = PayloadRequest & {
  transactionID: string | number;
};

export type InventoryProjectionExpectation = {
  aggregateKey: string;
  quantity: number;
  movementCount: number;
};

function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (isRecord(value)) {
    const id = value.id;
    return typeof id === "string" && id.length > 0 ? id : undefined;
  }
  return undefined;
}

function makeTransactionRequest(
  payload: Payload,
  baseReq: PayloadRequest,
  transactionID: string | number
): InventoryTransactionRequest {
  return {
    ...baseReq,
    payload,
    transactionID,
    context: { ...(baseReq.context ?? {}) }
  };
}

async function readSku(
  payload: Payload,
  req: PayloadRequest,
  skuId: string
): Promise<ProductVariant> {
  const sku = await payload.findByID({
    collection: "product-variants",
    id: skuId,
    depth: 0,
    overrideAccess: true,
    req
  });
  if (!sku) throw new Error("inventory-sku-not-found");
  return sku;
}

function requireProductId(sku: ProductVariant): string {
  const productId = relationshipId(sku.product);
  if (!productId) throw new Error("inventory-sku-identity-invalid");
  return productId;
}

function requireUsableIdentity(
  sku: ProductVariant,
  expected: { productId: string; skuCode: unknown },
  movementKind: InventoryMovementRequest["kind"]
): void {
  if (sku.identity_locked !== true) {
    throw new Error("inventory-sku-identity-unlocked");
  }
  if (movementKind === "inbound" && sku.active !== true) {
    throw new Error("inventory-sku-inactive");
  }
  if (
    requireProductId(sku) !== expected.productId ||
    typeof sku.sku !== "string" ||
    sku.sku.length === 0 ||
    sku.sku !== expected.skuCode
  ) {
    throw new Error("inventory-sku-identity-changed");
  }
}

function endpointsOf(
  request: InventoryMovementRequest
): InventoryMovementEndpoint[] {
  return [request.from, request.to].filter(
    (endpoint): endpoint is InventoryMovementEndpoint => endpoint !== undefined
  );
}

function aggregateChanges(
  request: InventoryMovementRequest
): AggregateChange[] {
  const changes: AggregateChange[] = [];
  if (request.from) {
    changes.push({
      aggregateKey: inventoryAggregateKey({
        skuId: request.skuId,
        locationId: request.from.locationId,
        disposition: request.from.disposition
      }),
      skuId: request.skuId,
      locationId: request.from.locationId,
      disposition: request.from.disposition,
      delta: -request.quantity
    });
  }
  if (request.to) {
    changes.push({
      aggregateKey: inventoryAggregateKey({
        skuId: request.skuId,
        locationId: request.to.locationId,
        disposition: request.to.disposition
      }),
      skuId: request.skuId,
      locationId: request.to.locationId,
      disposition: request.to.disposition,
      delta: request.quantity
    });
  }
  return changes.sort((left, right) =>
    compareText(left.aggregateKey, right.aggregateKey)
  );
}

async function readLocations(
  payload: Payload,
  req: PayloadRequest,
  locationIds: string[]
): Promise<Map<string, StockLocation>> {
  const locations = new Map<string, StockLocation>();
  for (const locationId of locationIds) {
    const location = await payload.findByID({
      collection: "stock-locations",
      id: locationId,
      depth: 0,
      overrideAccess: true,
      req
    });
    if (!location) throw new Error("inventory-location-not-found");
    locations.set(locationId, location);
  }
  return locations;
}

function requireUsableLocations(
  locations: ReadonlyMap<string, StockLocation>,
  request: InventoryMovementRequest
): void {
  for (const locationId of new Set(
    endpointsOf(request).map((endpoint) => endpoint.locationId)
  )) {
    const location = locations.get(locationId);
    if (!location) throw new Error("inventory-location-not-found");
    const isInboundDestination =
      request.to?.locationId === locationId &&
      (request.kind === "inbound" ||
        (request.kind === "transfer" &&
          request.from?.locationId !== request.to.locationId));
    if (isInboundDestination && location.active !== true) {
      throw new Error("inventory-location-inactive");
    }
  }
}

async function findMovement(
  payload: Payload,
  req: PayloadRequest,
  idempotencyKey: string
): Promise<InventoryMovement | undefined> {
  const result = await payload.find({
    collection: "inventory-movements",
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req,
    where: { idempotency_key: { equals: idempotencyKey } }
  });
  return result.docs[0];
}

async function findProjection(
  payload: Payload,
  req: PayloadRequest,
  aggregateKey: string
): Promise<InventoryLevel | undefined> {
  const result = await payload.find({
    collection: "inventory-levels",
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req,
    where: { aggregate_key: { equals: aggregateKey } }
  });
  return result.docs[0];
}

function projectionNumbers(projection: InventoryLevel | undefined): {
  quantity: number;
  movementCount: number;
} {
  if (!projection) return { quantity: 0, movementCount: 0 };
  if (
    !Number.isSafeInteger(projection.quantity) ||
    projection.quantity < 0 ||
    !Number.isSafeInteger(projection.movement_count) ||
    projection.movement_count < 0
  ) {
    throw new Error("inventory-projection-corrupt");
  }
  return {
    quantity: projection.quantity,
    movementCount: projection.movement_count
  };
}

function movementData(
  request: InventoryMovementRequest,
  requestHash: string
): RequiredDataFromCollectionSlug<"inventory-movements"> {
  return {
    idempotency_key: request.idempotencyKey,
    request_hash: requestHash,
    sku: request.skuId,
    kind: request.kind,
    quantity: request.quantity,
    from_location: request.from?.locationId ?? null,
    from_disposition: request.from?.disposition ?? null,
    to_location: request.to?.locationId ?? null,
    to_disposition: request.to?.disposition ?? null,
    reason_code: request.reasonCode,
    source_type: request.sourceType,
    source_ref: request.sourceRef ?? null,
    receipt: request.receiptId ?? null,
    receipt_line: request.receiptLineId ?? null,
    lot: request.lotId ?? null,
    cycle_count: request.cycleCountId ?? null,
    cycle_count_line: request.cycleCountLineId ?? null,
    actor: request.actorId ?? null,
    effective_at: request.effectiveAt ?? null
  };
}

function prepareMovements(values: readonly unknown[]): PreparedMovement[] {
  if (!Array.isArray(values)) {
    throw new Error("invalid-inventory-movement-batch");
  }
  const prepared = values.map((value, index) => {
    const request = validateInventoryMovementRequest(value);
    return {
      index,
      request,
      requestHash: hashInventoryMovementRequest(request)
    };
  });
  const seen = new Set<string>();
  for (const item of prepared) {
    if (seen.has(item.request.idempotencyKey)) {
      throw new Error("inventory-movement-duplicate-idempotency-key");
    }
    seen.add(item.request.idempotencyKey);
  }
  return prepared;
}

function prepareProjectionExpectations(
  values: readonly unknown[] | undefined
): InventoryProjectionExpectation[] {
  if (values === undefined) return [];
  if (!Array.isArray(values)) {
    throw new Error("invalid-inventory-projection-expectation");
  }
  const prepared = values.map((value) => {
    if (!isRecord(value)) {
      throw new Error("invalid-inventory-projection-expectation");
    }
    const expectation = value;
    if (
      typeof expectation.aggregateKey !== "string" ||
      expectation.aggregateKey.length === 0 ||
      expectation.aggregateKey.length > 512 ||
      !/^[A-Za-z0-9_.:~/-]+$/.test(expectation.aggregateKey) ||
      !isNonNegativeSafeInteger(expectation.quantity) ||
      !isNonNegativeSafeInteger(expectation.movementCount)
    ) {
      throw new Error("invalid-inventory-projection-expectation");
    }
    return {
      aggregateKey: expectation.aggregateKey,
      quantity: expectation.quantity,
      movementCount: expectation.movementCount
    };
  });
  const seen = new Set<string>();
  for (const expectation of prepared) {
    if (seen.has(expectation.aggregateKey)) {
      throw new Error("inventory-projection-expectation-duplicate");
    }
    seen.add(expectation.aggregateKey);
  }
  return prepared.sort((left, right) =>
    compareText(left.aggregateKey, right.aggregateKey)
  );
}

function requireTransactionID(req: PayloadRequest): string | number {
  const transactionID = req.transactionID;
  if (
    (typeof transactionID !== "string" || transactionID.length === 0) &&
    (typeof transactionID !== "number" || !Number.isFinite(transactionID))
  ) {
    throw new Error("inventory-movement-transaction-required");
  }
  return transactionID;
}

function makeLedgerRequest(
  payload: Payload,
  req: InventoryTransactionRequest,
  transactionID: string | number
): InventoryTransactionRequest {
  if (req.payload !== payload) {
    throw new Error("inventory-movement-payload-mismatch");
  }
  return {
    ...req,
    payload,
    transactionID,
    context: { ...(req.context ?? {}) }
  };
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(compareText);
}

export async function recordInventoryMovementsInTransaction(input: {
  payload: Payload;
  req: InventoryTransactionRequest;
  requests: readonly unknown[];
  expectedProjections?: readonly InventoryProjectionExpectation[];
  authorization?:
    | InventoryWorkflowAuthorization
    | InventoryReservationLedgerAuthorization;
}): Promise<InventoryMovementBatchResult> {
  const prepared = prepareMovements(input.requests);
  const expectations = prepareProjectionExpectations(input.expectedProjections);
  if (prepared.length === 0 && expectations.length === 0) {
    throw new Error("invalid-inventory-movement-batch");
  }
  const workflowMovements = prepared.filter(
    (item) =>
      item.request.sourceType !== "inventory_command" &&
      item.request.sourceType !== "inventory_reservation"
  );
  const reservationMovements = prepared.filter(
    (item) => item.request.sourceType === "inventory_reservation"
  );
  if (reservationMovements.length > 0) {
    if (reservationMovements.length !== prepared.length) {
      throw new Error("inventory-reservation-mixed-batch-forbidden");
    }
    for (const item of reservationMovements) {
      if (item.request.actorId !== "system:inventory-reservation") {
        throw new Error("inventory-reservation-ledger-actor-required");
      }
      assertInventoryReservationLedgerAuthorization(
        input.authorization,
        item.request
      );
    }
  } else if (prepared.length > 0) {
    const actorId = requireInventoryAdmin(input.req);
    if (prepared.some((item) => item.request.actorId !== actorId)) {
      throw new Error("inventory-movement-actor-mismatch");
    }
    if (workflowMovements.length > 0) {
      assertInventoryWorkflowAuthorization(input.authorization, actorId);
    }
  }
  const transactionID = requireTransactionID(input.req);
  const ledgerReq = makeLedgerRequest(input.payload, input.req, transactionID);
  const byIdempotencyKey = [...prepared].sort((left, right) =>
    compareText(left.request.idempotencyKey, right.request.idempotencyKey)
  );

  for (const item of byIdempotencyKey) {
    await inventoryMovementIdempotencyLock(
      input.payload,
      transactionID,
      item.request.idempotencyKey
    );
  }

  const replayByIndex = new Map<number, InventoryMovement>();
  for (const item of byIdempotencyKey) {
    const existing = await findMovement(
      input.payload,
      ledgerReq,
      item.request.idempotencyKey
    );
    if (!existing) continue;
    if (existing.request_hash !== item.requestHash) {
      throw new Error("inventory-movement-idempotency-conflict");
    }
    replayByIndex.set(item.index, existing);
  }

  const active = prepared.filter((item) => !replayByIndex.has(item.index));
  if (active.length === 0 && expectations.length === 0) {
    return {
      results: prepared.map((item): InventoryMovementResult => ({
        kind: "replay",
        movement: requireMapValue(
          replayByIndex,
          item.index,
          "inventory-movement-replay-missing"
        )
      })),
      projections: []
    };
  }

  const skuIds = uniqueSorted(active.map((item) => item.request.skuId));
  const discoveredSkus = new Map<string, ProductVariant>();
  const productBySku = new Map<string, string>();
  for (const skuId of skuIds) {
    const sku = await readSku(input.payload, ledgerReq, skuId);
    discoveredSkus.set(skuId, sku);
    productBySku.set(skuId, requireProductId(sku));
  }

  for (const productId of uniqueSorted(productBySku.values())) {
    await productInventoryLock(input.payload, transactionID, productId);
  }
  for (const skuId of skuIds) {
    await productSkuMutationLock(input.payload, transactionID, skuId);
  }

  const locationIds = uniqueSorted(
    active.flatMap((item) =>
      endpointsOf(item.request).map((endpoint) => endpoint.locationId)
    )
  );
  for (const locationId of locationIds) {
    await inventoryLocationLock(input.payload, transactionID, locationId);
  }

  const changesByIndex = new Map<number, AggregateChange[]>();
  const changeByAggregateKey = new Map<string, AggregateChange>();
  for (const item of active) {
    const changes = aggregateChanges(item.request);
    changesByIndex.set(item.index, changes);
    for (const change of changes) {
      if (!changeByAggregateKey.has(change.aggregateKey)) {
        changeByAggregateKey.set(change.aggregateKey, change);
      }
    }
  }
  const changedAggregateKeys = uniqueSorted(changeByAggregateKey.keys());
  const aggregateKeys = uniqueSorted([
    ...changedAggregateKeys,
    ...expectations.map((expectation) => expectation.aggregateKey)
  ]);
  for (const aggregateKey of aggregateKeys) {
    await inventoryAggregateLock(input.payload, transactionID, aggregateKey);
  }

  const lockedSkus = new Map<string, ProductVariant>();
  for (const skuId of skuIds) {
    lockedSkus.set(skuId, await readSku(input.payload, ledgerReq, skuId));
  }
  for (const item of active) {
    const discoveredSku = requireMapValue(
      discoveredSkus,
      item.request.skuId,
      "inventory-sku-not-found"
    );
    requireUsableIdentity(
      requireMapValue(
        lockedSkus,
        item.request.skuId,
        "inventory-sku-not-found"
      ),
      {
        productId: requireMapValue(
          productBySku,
          item.request.skuId,
          "inventory-sku-identity-invalid"
        ),
        skuCode: discoveredSku.sku
      },
      item.request.kind
    );
  }

  const locations = await readLocations(input.payload, ledgerReq, locationIds);
  for (const item of active) {
    requireUsableLocations(locations, item.request);
  }

  const projectionStates = new Map<string, ProjectionState>();
  for (const aggregateKey of aggregateKeys) {
    const projection = await findProjection(
      input.payload,
      ledgerReq,
      aggregateKey
    );
    const current = projectionNumbers(projection);
    projectionStates.set(aggregateKey, {
      projection,
      quantity: current.quantity,
      movementCount: current.movementCount
    });
  }

  for (const expectation of expectations) {
    const state = requireMapValue(
      projectionStates,
      expectation.aggregateKey,
      "inventory-projection-state-missing"
    );
    if (
      state.quantity !== expectation.quantity ||
      state.movementCount !== expectation.movementCount
    ) {
      throw new Error("inventory-projection-expectation-stale");
    }
  }

  for (const item of active) {
    const changes = requireMapValue(
      changesByIndex,
      item.index,
      "inventory-movement-changes-missing"
    );
    for (const change of changes) {
      const state = requireMapValue(
        projectionStates,
        change.aggregateKey,
        "inventory-projection-state-missing"
      );
      const quantity = state.quantity + change.delta;
      const movementCount = state.movementCount + 1;
      if (!Number.isSafeInteger(movementCount)) {
        throw new Error("inventory-projection-count-overflow");
      }
      if (!Number.isSafeInteger(quantity) || quantity < 0) {
        throw new Error("insufficient-inventory-balance");
      }
      projectionStates.set(change.aggregateKey, {
        ...state,
        quantity,
        movementCount
      });
    }
  }

  const movementByIndex = new Map<number, InventoryMovement>();
  for (const item of active) {
    authorizeInventoryLedgerRequest(ledgerReq);
    movementByIndex.set(
      item.index,
      await input.payload.create({
        collection: "inventory-movements",
        overrideAccess: true,
        req: ledgerReq,
        data: movementData(item.request, item.requestHash)
      })
    );
  }

  const projectionByKey = new Map<string, InventoryLevel>();
  for (const aggregateKey of changedAggregateKeys) {
    const state = requireMapValue(
      projectionStates,
      aggregateKey,
      "inventory-projection-state-missing"
    );
    authorizeInventoryLedgerRequest(ledgerReq);
    const change = requireMapValue(
      changeByAggregateKey,
      aggregateKey,
      "inventory-projection-change-missing"
    );
    const projection = state.projection
      ? await input.payload.update({
          collection: "inventory-levels",
          id: state.projection.id,
          overrideAccess: true,
          req: ledgerReq,
          data: {
            quantity: state.quantity,
            movement_count: state.movementCount
          }
        })
      : await input.payload.create({
          collection: "inventory-levels",
          overrideAccess: true,
          req: ledgerReq,
          data: {
            aggregate_key: change.aggregateKey,
            sku: change.skuId,
            location: change.locationId,
            disposition: change.disposition,
            quantity: state.quantity,
            movement_count: state.movementCount
          }
        });
    projectionByKey.set(aggregateKey, projection);
  }

  const results = prepared.map((item): InventoryMovementResult => {
    const replay = replayByIndex.get(item.index);
    if (replay) return { kind: "replay", movement: replay };
    return {
      kind: "created",
      movement: requireMapValue(
        movementByIndex,
        item.index,
        "inventory-movement-write-missing"
      ),
      projections: uniqueSorted(
        requireMapValue(
          changesByIndex,
          item.index,
          "inventory-movement-changes-missing"
        ).map((change) => change.aggregateKey)
      ).map((aggregateKey) =>
        requireMapValue(
          projectionByKey,
          aggregateKey,
          "inventory-projection-write-missing"
        )
      )
    };
  });

  return {
    results,
    projections: changedAggregateKeys.map((aggregateKey) =>
      requireMapValue(
        projectionByKey,
        aggregateKey,
        "inventory-projection-write-missing"
      )
    )
  };
}

export async function recordInventoryMovement(input: {
  payload: Payload;
  req: PayloadRequest;
  request: unknown;
}): Promise<InventoryMovementResult> {
  const request = validateInventoryMovementRequest(input.request);
  if (request.sourceType !== "inventory_command") {
    throw new Error("inventory-workflow-operation-required");
  }
  const actorId = requireInventoryAdmin(input.req);
  if (request.actorId && request.actorId !== actorId) {
    throw new Error("inventory-movement-actor-mismatch");
  }
  const authorizedRequest = { ...request, actorId };
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) throw new Error("inventory-movement-transaction-failed");
  const req = makeTransactionRequest(input.payload, input.req, transactionID);

  try {
    const batch = await recordInventoryMovementsInTransaction({
      payload: input.payload,
      req,
      requests: [authorizedRequest]
    });
    const result = batch.results[0];
    if (!result) throw new Error("inventory-movement-write-missing");
    await input.payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    try {
      await input.payload.db.rollbackTransaction(transactionID);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "inventory-movement-rollback-failed"
      );
    }
    throw error;
  }
}
