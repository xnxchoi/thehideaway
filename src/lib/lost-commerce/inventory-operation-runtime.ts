import { createHash } from "node:crypto";
import type { Payload, PayloadRequest } from "payload";

import type {
  InventoryCycleCount,
  InventoryCycleCountLine,
  InventoryLot,
  InventoryReceipt,
  InventoryReceiptLine
} from "@/payload-types";
import { authorizeInventoryLedgerRequest } from "@/payload/collections/(consumption)/InventoryLevels/protectInventoryProjection";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  validateCommerceCommandKey,
  type CommerceCommandClaim,
  type CommerceCommandSafeResponse
} from "./commerce-commands";
import {
  INVENTORY_DISPOSITIONS,
  type InventoryDisposition,
  type InventoryMovementEndpoint
} from "./inventory-ledger-contracts";
import type { InventoryTransactionRequest } from "./inventory-ledger";

type InventoryOperationDocMap = {
  "inventory-receipts": InventoryReceipt;
  "inventory-receipt-lines": InventoryReceiptLine;
  "inventory-lots": InventoryLot;
  "inventory-cycle-counts": InventoryCycleCount;
  "inventory-cycle-count-lines": InventoryCycleCountLine;
};

export type InventoryOperationCollection = keyof InventoryOperationDocMap;
export type InventoryOperationDoc =
  InventoryOperationDocMap[InventoryOperationCollection];
type Clock = () => Date;

// Bound work per command and allow headroom for sequential queries on one transaction client.
export const MAX_INVENTORY_OPERATION_LINES = 50;
export const INVENTORY_OPERATION_LEASE_MS = 5 * 60_000;

export type InventoryOperationContext = {
  payload: Payload;
  req: PayloadRequest;
  commandKey: unknown;
  clock?: Clock;
};

export type InventoryOperationResult =
  | { kind: "succeeded"; resourceId: string; status: string }
  | Extract<CommerceCommandClaim, { kind: "in_progress" | "conflict" }>
  | {
      kind: "replay";
      businessKey: string;
      response: CommerceCommandSafeResponse;
    };

type ClaimedExecution = {
  req: InventoryTransactionRequest;
  actorId: string;
  authorization: InventoryWorkflowAuthorization;
  effectiveAt: string;
  commandKey: string;
  claim: Extract<CommerceCommandClaim, { kind: "claimed" }>;
};

declare const inventoryWorkflowAuthorizationBrand: unique symbol;

export type InventoryWorkflowAuthorization = {
  readonly [inventoryWorkflowAuthorizationBrand]: true;
};

const workflowAuthorizationActors = new WeakMap<object, string>();

function grantInventoryWorkflowAuthorization(
  actorId: string
): InventoryWorkflowAuthorization {
  const authorization = Object.freeze({}) as InventoryWorkflowAuthorization;
  workflowAuthorizationActors.set(authorization, actorId);
  return authorization;
}

function revokeInventoryWorkflowAuthorization(
  authorization: InventoryWorkflowAuthorization
): void {
  workflowAuthorizationActors.delete(authorization);
}

export function assertInventoryWorkflowAuthorization(
  authorization: unknown,
  actorId: string
): asserts authorization is InventoryWorkflowAuthorization {
  if (
    !authorization ||
    typeof authorization !== "object" ||
    workflowAuthorizationActors.get(authorization) !== actorId
  ) {
    throw new Error("inventory-workflow-authorization-required");
  }
}

const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;
const DISPOSITIONS = new Set<string>(INVENTORY_DISPOSITIONS);

function isInventoryDisposition(value: unknown): value is InventoryDisposition {
  return typeof value === "string" && DISPOSITIONS.has(value);
}

export function operationReference(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || !REFERENCE_PATTERN.test(value)) {
    throw new Error(errorCode);
  }
  return value;
}

export function nullableOperationText(
  value: unknown,
  errorCode: string,
  maxLength = 200
): string | null {
  if (value === undefined || value === null) return null;
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    value.trim().length > maxLength
  ) {
    throw new Error(errorCode);
  }
  return value.trim();
}

export function positiveOperationQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("invalid-inventory-operation-quantity");
  }
  return value;
}

export function nonnegativeOperationQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("invalid-inventory-operation-quantity");
  }
  return value;
}

export function operationDisposition(value: unknown): InventoryDisposition {
  if (!isInventoryDisposition(value)) {
    throw new Error("invalid-inventory-disposition");
  }
  return value;
}

export function operationEndpoint(value: unknown): InventoryMovementEndpoint {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid-inventory-operation-endpoint");
  }
  const record = value as Record<string, unknown>;
  return {
    locationId: operationReference(
      record.locationId,
      "invalid-inventory-location"
    ),
    disposition: operationDisposition(record.disposition)
  };
}

export function operationRelationshipId(
  value: unknown,
  errorCode: string
): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object") {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  throw new Error(errorCode);
}

export function requireInventoryAdmin(req: PayloadRequest): string {
  const user = req.user as { id?: unknown; role?: unknown } | null | undefined;
  if (user?.role !== "admin" || typeof user.id !== "string" || !user.id) {
    throw new Error("inventory-operation-admin-required");
  }
  return operationReference(user.id, "inventory-operation-admin-required");
}

export function inventoryMovementKey(
  commandKey: string,
  suffix: string
): string {
  return `inv-${createHash("sha256")
    .update(`${commandKey}:${suffix}`, "utf8")
    .digest("hex")
    .slice(0, 40)}`;
}

export async function executeClaimedInventoryOperation(
  context: InventoryOperationContext,
  operation: string,
  validatedInput: Record<string, unknown>,
  execute: (execution: ClaimedExecution) => Promise<{
    resourceId: string;
    resourceType: string;
    status: string;
  }>
): Promise<InventoryOperationResult> {
  const actorId = requireInventoryAdmin(context.req);
  const commandKey = validateCommerceCommandKey(context.commandKey);
  const clock = context.clock ?? (() => new Date());
  const claimTime = new Date(clock().getTime());
  if (Number.isNaN(claimTime.getTime())) {
    throw new Error("invalid-inventory-operation-time");
  }
  const claim = await claimCommerceCommand({
    payload: context.payload,
    commandKey,
    validatedInput: { operation, input: validatedInput },
    businessKey: `inventory:${operation}:${commandKey}`,
    now: claimTime,
    leaseMs: INVENTORY_OPERATION_LEASE_MS
  });
  if (claim.kind !== "claimed") return claim;

  const transactionID = await context.payload.db.beginTransaction();
  if (!transactionID) throw new Error("inventory-operation-transaction-failed");
  const req = {
    ...context.req,
    payload: context.payload,
    transactionID,
    context: { ...(context.req.context ?? {}) }
  } as InventoryTransactionRequest;
  try {
    authorizeInventoryLedgerRequest(req);
    const authorization = grantInventoryWorkflowAuthorization(actorId);
    let completed: Awaited<ReturnType<typeof execute>>;
    try {
      completed = await execute({
        req,
        actorId,
        authorization,
        effectiveAt: claimTime.toISOString(),
        commandKey,
        claim
      });
    } finally {
      revokeInventoryWorkflowAuthorization(authorization);
    }
    const response = {
      resourceId: completed.resourceId,
      status: completed.status
    } as const;
    const completionTime = new Date(clock().getTime());
    if (Number.isNaN(completionTime.getTime())) {
      throw new Error("invalid-inventory-operation-time");
    }
    await completeCommerceCommand({
      payload: context.payload,
      req,
      commandKey,
      requestHash: claim.requestHash,
      leaseToken: claim.leaseToken,
      response,
      resource: { type: completed.resourceType, id: completed.resourceId },
      now: completionTime
    });
    await context.payload.db.commitTransaction(transactionID);
    return { kind: "succeeded", ...response };
  } catch (error) {
    try {
      await context.payload.db.rollbackTransaction(transactionID);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "inventory-operation-rollback-failed"
      );
    }
    throw error;
  }
}

export async function findInventoryOperationDoc<
  Collection extends InventoryOperationCollection
>(
  payload: Payload,
  req: PayloadRequest,
  collection: Collection,
  id: string
): Promise<InventoryOperationDocMap[Collection]> {
  const doc = await payload.findByID({
    collection,
    id,
    depth: 0,
    overrideAccess: true,
    req
  });
  if (!doc) throw new Error("inventory-operation-record-not-found");
  return doc;
}

export function requireInventoryOperationStatus(
  doc: InventoryReceipt | InventoryCycleCount,
  status: string,
  errorCode: string
): void {
  if (doc.status !== status) throw new Error(errorCode);
}

export async function updateInventoryOperationTransition(
  payload: Payload,
  req: InventoryTransactionRequest,
  input:
    | {
        collection: "inventory-receipts";
        id: string;
        status: "open";
        transition: "opened";
        actorId: string;
        effectiveAt: string;
      }
    | {
        collection: "inventory-receipts";
        id: string;
        status: "closed";
        transition: "closed";
        actorId: string;
        effectiveAt: string;
      }
    | {
        collection: "inventory-receipts";
        id: string;
        status: "cancelled";
        transition: "cancelled";
        actorId: string;
        effectiveAt: string;
      }
    | {
        collection: "inventory-cycle-counts";
        id: string;
        status: "submitted";
        transition: "submitted";
        actorId: string;
        effectiveAt: string;
      }
    | {
        collection: "inventory-cycle-counts";
        id: string;
        status: "applied";
        transition: "applied";
        actorId: string;
        effectiveAt: string;
      }
    | {
        collection: "inventory-cycle-counts";
        id: string;
        status: "rejected";
        transition: "rejected";
        actorId: string;
        effectiveAt: string;
      }
    | {
        collection: "inventory-cycle-counts";
        id: string;
        status: "cancelled";
        transition: "cancelled";
        actorId: string;
        effectiveAt: string;
      }
): Promise<void> {
  if (input.collection === "inventory-receipts") {
    const data =
      input.transition === "opened"
        ? {
            status: input.status,
            opened_at: input.effectiveAt,
            opened_by: input.actorId
          }
        : input.transition === "closed"
          ? {
              status: input.status,
              closed_at: input.effectiveAt,
              closed_by: input.actorId
            }
          : {
              status: input.status,
              cancelled_at: input.effectiveAt,
              cancelled_by: input.actorId
            };
    await payload.update({
      collection: "inventory-receipts",
      id: input.id,
      overrideAccess: true,
      req,
      data
    });
    return;
  }
  const data =
    input.transition === "submitted"
      ? {
          status: input.status,
          submitted_at: input.effectiveAt,
          submitted_by: input.actorId
        }
      : input.transition === "applied"
        ? {
            status: input.status,
            applied_at: input.effectiveAt,
            applied_by: input.actorId
          }
        : input.transition === "rejected"
          ? {
              status: input.status,
              rejected_at: input.effectiveAt,
              rejected_by: input.actorId
            }
          : {
              status: input.status,
              cancelled_at: input.effectiveAt,
              cancelled_by: input.actorId
            };
  await payload.update({
    collection: "inventory-cycle-counts",
    id: input.id,
    overrideAccess: true,
    req,
    data
  });
}
