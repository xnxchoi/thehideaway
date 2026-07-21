import type { Payload, PayloadRequest } from "payload";

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

type AnyDoc = Record<string, any>;

type AggregateChange = {
  aggregateKey: string;
  skuId: string;
  locationId: string;
  disposition: InventoryDisposition;
  delta: number;
};

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export type InventoryMovementResult =
  | { kind: "created"; movement: AnyDoc; projections: AnyDoc[] }
  | { kind: "replay"; movement: AnyDoc };

function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id.length > 0 ? id : undefined;
  }
  return undefined;
}

function makeTransactionRequest(
  payload: Payload,
  transactionID: string | number
): PayloadRequest {
  return { payload, transactionID, context: {} } as PayloadRequest;
}

async function readSku(
  payload: Payload,
  req: PayloadRequest,
  skuId: string
): Promise<AnyDoc> {
  const sku = (await payload.findByID({
    collection: "product-variants",
    id: skuId,
    depth: 0,
    overrideAccess: true,
    req
  })) as AnyDoc;
  if (!sku) throw new Error("inventory-sku-not-found");
  return sku;
}

function requireProductId(sku: AnyDoc): string {
  const productId = relationshipId(sku.product);
  if (!productId) throw new Error("inventory-sku-identity-invalid");
  return productId;
}

function requireUsableIdentity(
  sku: AnyDoc,
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

async function requireUsableLocations(
  payload: Payload,
  req: PayloadRequest,
  locationIds: string[],
  request: InventoryMovementRequest
): Promise<void> {
  for (const locationId of locationIds) {
    const location = (await payload.findByID({
      collection: "stock-locations" as never,
      id: locationId,
      depth: 0,
      overrideAccess: true,
      req
    } as never)) as AnyDoc;
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
): Promise<AnyDoc | undefined> {
  const result = (await payload.find({
    collection: "inventory-movements" as never,
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req,
    where: { idempotency_key: { equals: idempotencyKey } }
  } as never)) as unknown as { docs: AnyDoc[] };
  return result.docs[0];
}

async function findProjection(
  payload: Payload,
  req: PayloadRequest,
  aggregateKey: string
): Promise<AnyDoc | undefined> {
  const result = (await payload.find({
    collection: "inventory-levels" as never,
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req,
    where: { aggregate_key: { equals: aggregateKey } }
  } as never)) as unknown as { docs: AnyDoc[] };
  return result.docs[0];
}

function projectionNumbers(projection: AnyDoc | undefined): {
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
): Record<string, unknown> {
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
    actor: request.actorId ?? null,
    effective_at: request.effectiveAt ?? null
  };
}

export async function recordInventoryMovement(input: {
  payload: Payload;
  request: unknown;
}): Promise<InventoryMovementResult> {
  const request = validateInventoryMovementRequest(input.request);
  const requestHash = hashInventoryMovementRequest(request);
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) throw new Error("inventory-movement-transaction-failed");
  const req = makeTransactionRequest(input.payload, transactionID);

  try {
    await inventoryMovementIdempotencyLock(
      input.payload,
      transactionID,
      request.idempotencyKey
    );

    const existing = await findMovement(
      input.payload,
      req,
      request.idempotencyKey
    );
    if (existing) {
      if (existing.request_hash !== requestHash) {
        throw new Error("inventory-movement-idempotency-conflict");
      }
      await input.payload.db.commitTransaction(transactionID);
      return { kind: "replay", movement: existing };
    }

    const discoveredSku = await readSku(input.payload, req, request.skuId);
    const productId = requireProductId(discoveredSku);
    await productInventoryLock(input.payload, transactionID, productId);
    await productSkuMutationLock(input.payload, transactionID, request.skuId);

    const locationIds = [
      ...new Set(endpointsOf(request).map((endpoint) => endpoint.locationId))
    ].sort();
    for (const locationId of locationIds) {
      await inventoryLocationLock(input.payload, transactionID, locationId);
    }

    const changes = aggregateChanges(request);
    for (const change of changes) {
      await inventoryAggregateLock(
        input.payload,
        transactionID,
        change.aggregateKey
      );
    }

    const lockedSku = await readSku(input.payload, req, request.skuId);
    requireUsableIdentity(
      lockedSku,
      {
        productId,
        skuCode: discoveredSku.sku
      },
      request.kind
    );
    await requireUsableLocations(input.payload, req, locationIds, request);

    const pending = [] as Array<{
      change: AggregateChange;
      projection?: AnyDoc;
      quantity: number;
      movementCount: number;
    }>;
    for (const change of changes) {
      const projection = await findProjection(
        input.payload,
        req,
        change.aggregateKey
      );
      const current = projectionNumbers(projection);
      const quantity = current.quantity + change.delta;
      const movementCount = current.movementCount + 1;
      if (!Number.isSafeInteger(movementCount)) {
        throw new Error("inventory-projection-count-overflow");
      }
      if (!Number.isSafeInteger(quantity) || quantity < 0) {
        throw new Error("insufficient-inventory-balance");
      }
      pending.push({
        change,
        projection,
        quantity,
        movementCount
      });
    }

    authorizeInventoryLedgerRequest(req);
    const movement = (await input.payload.create({
      collection: "inventory-movements" as never,
      overrideAccess: true,
      req,
      data: movementData(request, requestHash) as never
    })) as AnyDoc;

    const projections: AnyDoc[] = [];
    for (const next of pending) {
      authorizeInventoryLedgerRequest(req);
      if (next.projection) {
        projections.push(
          (await input.payload.update({
            collection: "inventory-levels" as never,
            id: next.projection.id,
            overrideAccess: true,
            req,
            data: {
              quantity: next.quantity,
              movement_count: next.movementCount
            } as never
          })) as AnyDoc
        );
      } else {
        projections.push(
          (await input.payload.create({
            collection: "inventory-levels" as never,
            overrideAccess: true,
            req,
            data: {
              aggregate_key: next.change.aggregateKey,
              sku: next.change.skuId,
              location: next.change.locationId,
              disposition: next.change.disposition,
              quantity: next.quantity,
              movement_count: next.movementCount
            } as never
          })) as AnyDoc
        );
      }
    }

    await input.payload.db.commitTransaction(transactionID);
    return { kind: "created", movement, projections };
  } catch (error) {
    await input.payload.db
      .rollbackTransaction(transactionID)
      .catch(() => undefined);
    throw error;
  }
}
