import { sql } from "@payloadcms/db-postgres";
import type { Payload, PayloadRequest } from "payload";

import {
  INVENTORY_DISPOSITIONS,
  inventoryAggregateKey,
  type InventoryDisposition,
  type InventoryMovementKind
} from "./inventory-ledger-contracts";

type AnyDoc = Record<string, any>;
type TransactionSession = {
  db: { execute: (query: unknown) => Promise<unknown> };
};

export type ReconstructedInventoryBalance = {
  aggregateKey: string;
  skuId: string;
  locationId: string;
  disposition: InventoryDisposition;
  quantity: number;
  movementCount: number;
};

export type InventoryReconciliationMismatch = {
  kind:
    | "missing_projection"
    | "unexpected_projection"
    | "quantity_mismatch"
    | "movement_count_mismatch";
  aggregateKey: string;
  expected: number | null;
  actual: number | null;
};

const DISPOSITIONS = new Set<string>(INVENTORY_DISPOSITIONS);

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id.length > 0 ? id : undefined;
  }
  return undefined;
}

async function readAll(
  payload: Payload,
  collection: string,
  req?: PayloadRequest
): Promise<AnyDoc[]> {
  const result = (await payload.find({
    collection: collection as never,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    ...(req ? { req } : {}),
    sort: "id"
  } as never)) as unknown as { docs: AnyDoc[] };
  return result.docs;
}

function movementEndpoint(
  movement: AnyDoc,
  side: "from" | "to"
): { locationId: string; disposition: InventoryDisposition } | undefined {
  const locationValue = movement[`${side}_location`];
  const dispositionValue = movement[`${side}_disposition`];
  const absent = locationValue == null && dispositionValue == null;
  if (absent) return undefined;

  const locationId = relationshipId(locationValue);
  if (!locationId || !DISPOSITIONS.has(String(dispositionValue))) {
    throw new Error("inventory-movement-record-corrupt");
  }
  return {
    locationId,
    disposition: dispositionValue as InventoryDisposition
  };
}

function foldMovement(
  balances: Map<string, ReconstructedInventoryBalance>,
  movement: AnyDoc
): void {
  const skuId = relationshipId(movement.sku);
  const kind = movement.kind as InventoryMovementKind;
  const quantity = movement.quantity;
  const from = movementEndpoint(movement, "from");
  const to = movementEndpoint(movement, "to");
  if (
    !skuId ||
    !["inbound", "outbound", "transfer"].includes(kind) ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    (kind === "inbound" && (from !== undefined || to === undefined)) ||
    (kind === "outbound" && (from === undefined || to !== undefined)) ||
    (kind === "transfer" && (from === undefined || to === undefined)) ||
    (kind === "transfer" &&
      from?.locationId === to?.locationId &&
      from?.disposition === to?.disposition)
  ) {
    throw new Error("inventory-movement-record-corrupt");
  }

  const apply = (
    endpoint: { locationId: string; disposition: InventoryDisposition },
    delta: number
  ) => {
    const aggregateKey = inventoryAggregateKey({
      skuId,
      locationId: endpoint.locationId,
      disposition: endpoint.disposition
    });
    const current = balances.get(aggregateKey) ?? {
      aggregateKey,
      skuId,
      locationId: endpoint.locationId,
      disposition: endpoint.disposition,
      quantity: 0,
      movementCount: 0
    };
    balances.set(aggregateKey, {
      ...current,
      quantity: current.quantity + delta,
      movementCount: current.movementCount + 1
    });
  };

  if (from) apply(from, -quantity);
  if (to) apply(to, quantity);
}

export async function reconstructInventoryLedger(
  payload: Payload,
  req?: PayloadRequest
): Promise<ReconstructedInventoryBalance[]> {
  const movements = await readAll(payload, "inventory-movements", req);
  const balances = new Map<string, ReconstructedInventoryBalance>();
  for (const movement of movements) foldMovement(balances, movement);
  return [...balances.values()].sort((left, right) =>
    compareText(left.aggregateKey, right.aggregateKey)
  );
}

function projectionValue(projection: AnyDoc): {
  quantity: number;
  movementCount: number;
} {
  if (
    !Number.isSafeInteger(projection.quantity) ||
    projection.quantity < 0 ||
    !Number.isSafeInteger(projection.movement_count) ||
    projection.movement_count < 0
  ) {
    throw new Error("inventory-projection-record-corrupt");
  }
  return {
    quantity: projection.quantity,
    movementCount: projection.movement_count
  };
}

export async function reconcileInventoryLedger(
  payload: Payload
): Promise<InventoryReconciliationMismatch[]> {
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    throw new Error("inventory-reconciliation-transaction-failed");
  }
  const req = { payload, transactionID, context: {} } as PayloadRequest;
  const session = (
    payload.db as unknown as { sessions: Record<string, TransactionSession> }
  ).sessions[String(transactionID)];

  try {
    if (!session) throw new Error("inventory-reconciliation-session-missing");
    await session.db.execute(
      sql`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY`
    );
    const reconstructed = await reconstructInventoryLedger(payload, req);
    const stored = await readAll(payload, "inventory-levels", req);
    const expected = new Map(
      reconstructed.map((balance) => [balance.aggregateKey, balance])
    );
    const actual = new Map<string, ReturnType<typeof projectionValue>>();
    for (const projection of stored) {
      if (
        typeof projection.aggregate_key !== "string" ||
        projection.aggregate_key.length === 0 ||
        actual.has(projection.aggregate_key)
      ) {
        throw new Error("inventory-projection-record-corrupt");
      }
      actual.set(projection.aggregate_key, projectionValue(projection));
    }

    const aggregateKeys = [
      ...new Set([...expected.keys(), ...actual.keys()])
    ].sort(compareText);
    const mismatches: InventoryReconciliationMismatch[] = [];
    for (const aggregateKey of aggregateKeys) {
      const expectedBalance = expected.get(aggregateKey);
      const actualBalance = actual.get(aggregateKey);
      if (!actualBalance && expectedBalance) {
        mismatches.push({
          kind: "missing_projection",
          aggregateKey,
          expected: expectedBalance.quantity,
          actual: null
        });
        continue;
      }
      if (!expectedBalance && actualBalance) {
        mismatches.push({
          kind: "unexpected_projection",
          aggregateKey,
          expected: null,
          actual: actualBalance.quantity
        });
        continue;
      }
      if (!expectedBalance || !actualBalance) continue;
      if (expectedBalance.quantity !== actualBalance.quantity) {
        mismatches.push({
          kind: "quantity_mismatch",
          aggregateKey,
          expected: expectedBalance.quantity,
          actual: actualBalance.quantity
        });
      }
      if (expectedBalance.movementCount !== actualBalance.movementCount) {
        mismatches.push({
          kind: "movement_count_mismatch",
          aggregateKey,
          expected: expectedBalance.movementCount,
          actual: actualBalance.movementCount
        });
      }
    }
    await payload.db.commitTransaction(transactionID);
    return mismatches;
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID).catch(() => undefined);
    throw error;
  }
}
