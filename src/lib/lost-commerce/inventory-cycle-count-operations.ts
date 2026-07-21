import type { Payload, PayloadRequest } from "payload";

import {
  commerceCommandLock,
  inventoryAggregateLock
} from "@/lib/db/sequences";
import {
  executeClaimedInventoryOperation,
  findInventoryOperationDoc,
  nonnegativeOperationQuantity,
  operationDisposition,
  operationReference,
  operationRelationshipId,
  requireInventoryAdmin,
  requireInventoryOperationStatus,
  updateInventoryOperationTransition,
  inventoryMovementKey,
  MAX_INVENTORY_OPERATION_LINES,
  type InventoryOperationContext,
  type InventoryOperationResult
} from "./inventory-operation-runtime";
import {
  inventoryAggregateKey,
  type InventoryDisposition,
  type InventoryMovementRequest
} from "./inventory-ledger-contracts";
import { recordInventoryMovementsInTransaction } from "./inventory-ledger";

type CycleInputLine = {
  skuId: string;
  disposition: InventoryDisposition;
  countedQuantity: number;
  aggregateKey: string;
};

function compareAggregateKeys(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

async function findProjection(
  payload: Payload,
  req: PayloadRequest,
  aggregateKey: string
): Promise<{ quantity: number; movementCount: number }> {
  const result = await payload.find({
    collection: "inventory-levels",
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req,
    where: { aggregate_key: { equals: aggregateKey } }
  });
  const projection = result.docs.find(
    (candidate) => candidate.aggregate_key === aggregateKey
  );
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

function validateCycleLines(
  locationId: string,
  input: readonly {
    skuId: unknown;
    disposition: unknown;
    countedQuantity: unknown;
  }[]
): CycleInputLine[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("inventory-cycle-count-lines-required");
  }
  if (input.length > MAX_INVENTORY_OPERATION_LINES) {
    throw new Error("inventory-cycle-count-lines-limit-exceeded");
  }
  const lines = input.map((line) => {
    const skuId = operationReference(line.skuId, "invalid-inventory-sku");
    const lineDisposition = operationDisposition(line.disposition);
    return {
      skuId,
      disposition: lineDisposition,
      countedQuantity: nonnegativeOperationQuantity(line.countedQuantity),
      aggregateKey: inventoryAggregateKey({
        skuId,
        locationId,
        disposition: lineDisposition
      })
    };
  });
  if (new Set(lines.map((line) => line.aggregateKey)).size !== lines.length) {
    throw new Error("inventory-cycle-count-duplicate-aggregate");
  }
  return lines.sort((left, right) =>
    compareAggregateKeys(left.aggregateKey, right.aggregateKey)
  );
}

export async function createInventoryCycleCount(
  context: InventoryOperationContext & {
    input: {
      locationId: unknown;
      lines: readonly {
        skuId: unknown;
        disposition: unknown;
        countedQuantity: unknown;
      }[];
    };
  }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  const locationId = operationReference(
    context.input.locationId,
    "invalid-inventory-location"
  );
  const lines = validateCycleLines(locationId, context.input.lines);
  return executeClaimedInventoryOperation(
    context,
    "cycle-create",
    { locationId, lines },
    async ({ req }) => {
      for (const line of lines) {
        await inventoryAggregateLock(
          context.payload,
          req.transactionID,
          line.aggregateKey
        );
      }
      const snapshots = await lines.reduce(
        async (snapshotsPromise, line) => [
          ...(await snapshotsPromise),
          {
            line,
            projection: await findProjection(
              context.payload,
              req,
              line.aggregateKey
            )
          }
        ],
        Promise.resolve<
          {
            line: (typeof lines)[number];
            projection: Awaited<ReturnType<typeof findProjection>>;
          }[]
        >([])
      );
      const count = await context.payload.create({
        collection: "inventory-cycle-counts",
        overrideAccess: true,
        req,
        data: { location: locationId, status: "draft" }
      });
      const countId = operationRelationshipId(
        count.id,
        "inventory-cycle-count-create-failed"
      );
      for (const snapshot of snapshots) {
        await context.payload.create({
          collection: "inventory-cycle-count-lines",
          overrideAccess: true,
          req,
          data: {
            count: countId,
            sku: snapshot.line.skuId,
            disposition: snapshot.line.disposition,
            counted_quantity: snapshot.line.countedQuantity,
            system_quantity: snapshot.projection.quantity,
            movement_count_snapshot: snapshot.projection.movementCount,
            variance:
              snapshot.line.countedQuantity - snapshot.projection.quantity,
            count_aggregate_key: `${countId}:${snapshot.line.skuId}:${snapshot.line.disposition}`
          }
        });
      }
      return {
        resourceId: countId,
        resourceType: "inventory-cycle-count",
        status: "draft"
      };
    }
  );
}

async function transitionCycleCount(
  context: InventoryOperationContext & { input: { countId: unknown } },
  transition:
    | { operation: "submit"; from: "draft"; to: "submitted" }
    | { operation: "reject"; from: "submitted"; to: "rejected" }
    | { operation: "cancel"; from: "draft"; to: "cancelled" }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  const countId = operationReference(
    context.input.countId,
    "invalid-inventory-cycle-count"
  );
  return executeClaimedInventoryOperation(
    context,
    transition.operation,
    { countId },
    async ({ req, actorId, effectiveAt }) => {
      await commerceCommandLock(
        context.payload,
        req.transactionID,
        `inventory-cycle-count:${countId}`
      );
      const count = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-cycle-counts",
        countId
      );
      requireInventoryOperationStatus(
        count,
        transition.from,
        `inventory-cycle-count-${transition.operation}-invalid-status`
      );
      const transitionInput =
        transition.operation === "submit"
          ? {
              collection: "inventory-cycle-counts" as const,
              id: countId,
              status: "submitted" as const,
              transition: "submitted" as const,
              actorId,
              effectiveAt
            }
          : transition.operation === "reject"
            ? {
                collection: "inventory-cycle-counts" as const,
                id: countId,
                status: "rejected" as const,
                transition: "rejected" as const,
                actorId,
                effectiveAt
              }
            : {
                collection: "inventory-cycle-counts" as const,
                id: countId,
                status: "cancelled" as const,
                transition: "cancelled" as const,
                actorId,
                effectiveAt
              };
      await updateInventoryOperationTransition(
        context.payload,
        req,
        transitionInput
      );
      return {
        resourceId: countId,
        resourceType: "inventory-cycle-count",
        status: transition.to
      };
    }
  );
}

export function submitInventoryCycleCount(
  context: InventoryOperationContext & { input: { countId: unknown } }
): Promise<InventoryOperationResult> {
  return transitionCycleCount(context, {
    operation: "submit",
    from: "draft",
    to: "submitted"
  });
}

export function rejectInventoryCycleCount(
  context: InventoryOperationContext & { input: { countId: unknown } }
): Promise<InventoryOperationResult> {
  return transitionCycleCount(context, {
    operation: "reject",
    from: "submitted",
    to: "rejected"
  });
}

export function cancelInventoryCycleCount(
  context: InventoryOperationContext & { input: { countId: unknown } }
): Promise<InventoryOperationResult> {
  return transitionCycleCount(context, {
    operation: "cancel",
    from: "draft",
    to: "cancelled"
  });
}

export async function applyInventoryCycleCount(
  context: InventoryOperationContext & { input: { countId: unknown } }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  const countId = operationReference(
    context.input.countId,
    "invalid-inventory-cycle-count"
  );
  return executeClaimedInventoryOperation(
    context,
    "cycle-apply",
    { countId },
    async ({ req, actorId, authorization, effectiveAt, commandKey }) => {
      await commerceCommandLock(
        context.payload,
        req.transactionID,
        `inventory-cycle-count:${countId}`
      );
      const count = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-cycle-counts",
        countId
      );
      requireInventoryOperationStatus(
        count,
        "submitted",
        "inventory-cycle-count-apply-invalid-status"
      );
      const locationId = operationRelationshipId(
        count.location,
        "inventory-cycle-count-location-corrupt"
      );
      const found = await context.payload.find({
        collection: "inventory-cycle-count-lines",
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        req,
        where: { count: { equals: countId } }
      });
      if (found.docs.length === 0) {
        throw new Error("inventory-cycle-count-lines-required");
      }
      const lines = found.docs
        .map((line) => {
          const skuId = operationRelationshipId(
            line.sku,
            "inventory-cycle-count-line-corrupt"
          );
          const lineDisposition = operationDisposition(line.disposition);
          return {
            id: operationReference(
              line.id,
              "inventory-cycle-count-line-corrupt"
            ),
            skuId,
            disposition: lineDisposition,
            systemQuantity: nonnegativeOperationQuantity(line.system_quantity),
            countedQuantity: nonnegativeOperationQuantity(
              line.counted_quantity
            ),
            movementCountSnapshot: nonnegativeOperationQuantity(
              line.movement_count_snapshot
            ),
            variance: line.variance,
            aggregateKey: inventoryAggregateKey({
              skuId,
              locationId,
              disposition: lineDisposition
            })
          };
        })
        .sort((left, right) =>
          compareAggregateKeys(left.aggregateKey, right.aggregateKey)
        );
      for (const line of lines) {
        if (
          !Number.isSafeInteger(line.variance) ||
          line.variance !== line.countedQuantity - line.systemQuantity
        ) {
          throw new Error("inventory-cycle-count-line-corrupt");
        }
      }
      if (lines.some((line) => line.variance > 0)) {
        const submittedBy = operationRelationshipId(
          count.submitted_by,
          "inventory-cycle-count-submitter-required"
        );
        if (submittedBy === actorId) {
          throw new Error("inventory-cycle-count-self-approval-forbidden");
        }
      }
      const requests: InventoryMovementRequest[] = [];
      for (const line of lines) {
        if (line.variance === 0) continue;
        const movementBase = {
          idempotencyKey: inventoryMovementKey(commandKey, `cycle:${line.id}`),
          skuId: line.skuId,
          quantity: Math.abs(line.variance),
          reasonCode: "cycle-count-variance",
          sourceType: "inventory_cycle_count" as const,
          sourceRef: line.id,
          cycleCountId: countId,
          cycleCountLineId: line.id,
          actorId,
          effectiveAt
        };
        requests.push(
          line.variance > 0
            ? {
                ...movementBase,
                kind: "inbound",
                to: { locationId, disposition: line.disposition }
              }
            : {
                ...movementBase,
                kind: "outbound",
                from: { locationId, disposition: line.disposition }
              }
        );
      }
      try {
        await recordInventoryMovementsInTransaction({
          payload: context.payload,
          req,
          authorization,
          requests,
          expectedProjections: lines.map((line) => ({
            aggregateKey: line.aggregateKey,
            quantity: line.systemQuantity,
            movementCount: line.movementCountSnapshot
          }))
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "inventory-projection-expectation-stale"
        ) {
          throw new Error("inventory-cycle-count-snapshot-stale");
        }
        throw error;
      }
      await updateInventoryOperationTransition(context.payload, req, {
        collection: "inventory-cycle-counts",
        id: countId,
        status: "applied",
        transition: "applied",
        actorId,
        effectiveAt
      });
      return {
        resourceId: countId,
        resourceType: "inventory-cycle-count",
        status: "applied"
      };
    }
  );
}
