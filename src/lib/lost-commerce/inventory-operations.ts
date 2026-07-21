import { commerceCommandLock } from "@/lib/db/sequences";
import {
  executeClaimedInventoryOperation,
  findInventoryOperationDoc,
  inventoryMovementKey,
  nullableOperationText,
  operationEndpoint,
  operationReference,
  operationRelationshipId,
  positiveOperationQuantity,
  requireInventoryAdmin,
  requireInventoryOperationStatus,
  updateInventoryOperationTransition,
  MAX_INVENTORY_OPERATION_LINES,
  type InventoryOperationContext,
  type InventoryOperationResult
} from "./inventory-operation-runtime";
import { validateInventoryAdjustmentTransition } from "./inventory-ledger-contracts";
import { recordInventoryMovementsInTransaction } from "./inventory-ledger";

export type { InventoryOperationResult } from "./inventory-operation-runtime";
export {
  applyInventoryCycleCount,
  cancelInventoryCycleCount,
  createInventoryCycleCount,
  rejectInventoryCycleCount,
  submitInventoryCycleCount
} from "./inventory-cycle-count-operations";

export async function createInventoryReceipt(
  context: InventoryOperationContext & {
    input: {
      locationId: unknown;
      supplierName?: unknown;
      externalReference?: unknown;
      lines: readonly { skuId: unknown; expectedQuantity?: unknown }[];
    };
  }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  const locationId = operationReference(
    context.input.locationId,
    "invalid-inventory-location"
  );
  if (!Array.isArray(context.input.lines) || context.input.lines.length === 0) {
    throw new Error("inventory-receipt-lines-required");
  }
  if (context.input.lines.length > MAX_INVENTORY_OPERATION_LINES) {
    throw new Error("inventory-receipt-lines-limit-exceeded");
  }
  const lines = context.input.lines.map((line) => ({
    skuId: operationReference(line.skuId, "invalid-inventory-sku"),
    expectedQuantity:
      line.expectedQuantity === undefined || line.expectedQuantity === null
        ? null
        : positiveOperationQuantity(line.expectedQuantity)
  }));
  if (new Set(lines.map((line) => line.skuId)).size !== lines.length) {
    throw new Error("inventory-receipt-duplicate-sku");
  }
  const supplierName = nullableOperationText(
    context.input.supplierName,
    "invalid-inventory-receipt-supplier"
  );
  const externalReference = nullableOperationText(
    context.input.externalReference,
    "invalid-inventory-receipt-reference"
  );
  return executeClaimedInventoryOperation(
    context,
    "receipt-create",
    { locationId, supplierName, externalReference, lines },
    async ({ req }) => {
      const receipt = await context.payload.create({
        collection: "inventory-receipts",
        overrideAccess: true,
        req,
        data: {
          location: locationId,
          status: "draft",
          supplier_name: supplierName,
          external_reference: externalReference
        }
      });
      const receiptId = operationRelationshipId(
        receipt.id,
        "inventory-receipt-create-failed"
      );
      for (const line of lines) {
        await context.payload.create({
          collection: "inventory-receipt-lines",
          overrideAccess: true,
          req,
          data: {
            receipt: receiptId,
            sku: line.skuId,
            expected_quantity: line.expectedQuantity,
            receipt_sku_key: `${receiptId}:${line.skuId}`
          }
        });
      }
      return {
        resourceId: receiptId,
        resourceType: "inventory-receipt",
        status: "draft"
      };
    }
  );
}

async function transitionReceipt(
  context: InventoryOperationContext & { input: { receiptId: unknown } },
  transition:
    | {
        operation: "open";
        from: readonly ["draft"];
        to: "open";
        evidence: "opened";
      }
    | {
        operation: "close";
        from: readonly ["open"];
        to: "closed";
        evidence: "closed";
      }
    | {
        operation: "cancel";
        from: readonly ["draft", "open"];
        to: "cancelled";
        evidence: "cancelled";
      }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  const receiptId = operationReference(
    context.input.receiptId,
    "invalid-inventory-receipt"
  );
  return executeClaimedInventoryOperation(
    context,
    transition.operation,
    { receiptId },
    async ({ req, actorId, effectiveAt }) => {
      await commerceCommandLock(
        context.payload,
        req.transactionID,
        `inventory-receipt:${receiptId}`
      );
      const receipt = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-receipts",
        receiptId
      );
      if (!transition.from.some((status) => status === receipt.status)) {
        throw new Error(
          `inventory-receipt-${transition.operation}-invalid-status`
        );
      }
      if (transition.operation === "cancel" && receipt.status === "open") {
        const received = await context.payload.find({
          collection: "inventory-movements",
          depth: 0,
          limit: 1,
          pagination: false,
          overrideAccess: true,
          req,
          where: {
            and: [
              { receipt: { equals: receiptId } },
              { source_type: { equals: "inventory_receipt" } }
            ]
          }
        });
        if (received.docs.length > 0) {
          throw new Error("inventory-receipt-cancel-has-receipts");
        }
      }
      const transitionInput =
        transition.operation === "open"
          ? {
              collection: "inventory-receipts" as const,
              id: receiptId,
              status: "open" as const,
              transition: "opened" as const,
              actorId,
              effectiveAt
            }
          : transition.operation === "close"
            ? {
                collection: "inventory-receipts" as const,
                id: receiptId,
                status: "closed" as const,
                transition: "closed" as const,
                actorId,
                effectiveAt
              }
            : {
                collection: "inventory-receipts" as const,
                id: receiptId,
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
        resourceId: receiptId,
        resourceType: "inventory-receipt",
        status: transition.to
      };
    }
  );
}

export function openInventoryReceipt(
  context: InventoryOperationContext & { input: { receiptId: unknown } }
): Promise<InventoryOperationResult> {
  return transitionReceipt(context, {
    operation: "open",
    from: ["draft"],
    to: "open",
    evidence: "opened"
  });
}

export function closeInventoryReceipt(
  context: InventoryOperationContext & { input: { receiptId: unknown } }
): Promise<InventoryOperationResult> {
  return transitionReceipt(context, {
    operation: "close",
    from: ["open"],
    to: "closed",
    evidence: "closed"
  });
}

export function cancelInventoryReceipt(
  context: InventoryOperationContext & { input: { receiptId: unknown } }
): Promise<InventoryOperationResult> {
  return transitionReceipt(context, {
    operation: "cancel",
    from: ["draft", "open"],
    to: "cancelled",
    evidence: "cancelled"
  });
}

export async function receiveInventoryReceipt(
  context: InventoryOperationContext & {
    input: {
      receiptId: unknown;
      receiptLineId: unknown;
      quantity: unknown;
      externalLotCode?: unknown;
    };
  }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  const receiptId = operationReference(
    context.input.receiptId,
    "invalid-inventory-receipt"
  );
  const receiptLineId = operationReference(
    context.input.receiptLineId,
    "invalid-inventory-receipt-line"
  );
  const quantity = positiveOperationQuantity(context.input.quantity);
  const externalLotCode = nullableOperationText(
    context.input.externalLotCode,
    "invalid-inventory-lot-code"
  );
  return executeClaimedInventoryOperation(
    context,
    "receipt-receive",
    { receiptId, receiptLineId, quantity, externalLotCode },
    async ({ req, actorId, authorization, effectiveAt, commandKey }) => {
      await commerceCommandLock(
        context.payload,
        req.transactionID,
        `inventory-receipt:${receiptId}`
      );
      const receipt = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-receipts",
        receiptId
      );
      requireInventoryOperationStatus(
        receipt,
        "open",
        "inventory-receipt-receive-invalid-status"
      );
      const line = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-receipt-lines",
        receiptLineId
      );
      if (
        operationRelationshipId(
          line.receipt,
          "inventory-receipt-line-corrupt"
        ) !== receiptId
      ) {
        throw new Error("inventory-receipt-line-mismatch");
      }
      const skuId = operationRelationshipId(
        line.sku,
        "inventory-receipt-line-corrupt"
      );
      const locationId = operationRelationshipId(
        receipt.location,
        "inventory-receipt-location-corrupt"
      );
      const lot = await context.payload.create({
        collection: "inventory-lots",
        overrideAccess: true,
        req,
        data: {
          receipt_line: receiptLineId,
          operation_key: commandKey,
          external_lot_code: externalLotCode,
          received_quantity: quantity,
          received_at: effectiveAt,
          actor: actorId
        }
      });
      const lotId = operationRelationshipId(
        lot.id,
        "inventory-lot-create-failed"
      );
      await recordInventoryMovementsInTransaction({
        payload: context.payload,
        req,
        authorization,
        requests: [
          {
            idempotencyKey: inventoryMovementKey(commandKey, "receipt-inbound"),
            skuId,
            kind: "inbound",
            quantity,
            to: { locationId, disposition: "quarantine" },
            reasonCode: "receipt-received",
            sourceType: "inventory_receipt",
            sourceRef: lotId,
            receiptId,
            receiptLineId,
            lotId,
            actorId,
            effectiveAt
          }
        ]
      });
      return {
        resourceId: lotId,
        resourceType: "inventory-lot",
        status: "quarantine"
      };
    }
  );
}

export async function releaseInventoryLot(
  context: InventoryOperationContext & {
    input: { lotId: unknown; quantity: unknown };
  }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  const lotId = operationReference(
    context.input.lotId,
    "invalid-inventory-lot"
  );
  const quantity = positiveOperationQuantity(context.input.quantity);
  return executeClaimedInventoryOperation(
    context,
    "lot-release",
    { lotId, quantity },
    async ({ req, actorId, authorization, effectiveAt, commandKey }) => {
      await commerceCommandLock(
        context.payload,
        req.transactionID,
        `inventory-lot:${lotId}`
      );
      const lot = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-lots",
        lotId
      );
      const receiptLineId = operationRelationshipId(
        lot.receipt_line,
        "inventory-lot-receipt-line-corrupt"
      );
      const line = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-receipt-lines",
        receiptLineId
      );
      const receiptId = operationRelationshipId(
        line.receipt,
        "inventory-receipt-line-corrupt"
      );
      const receipt = await findInventoryOperationDoc(
        context.payload,
        req,
        "inventory-receipts",
        receiptId
      );
      const skuId = operationRelationshipId(
        line.sku,
        "inventory-receipt-line-corrupt"
      );
      const locationId = operationRelationshipId(
        receipt.location,
        "inventory-receipt-location-corrupt"
      );
      const releases = await context.payload.find({
        collection: "inventory-movements",
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        req,
        where: {
          and: [
            { lot: { equals: lotId } },
            { source_type: { equals: "inventory_lot_release" } },
            { kind: { equals: "transfer" } },
            { from_disposition: { equals: "quarantine" } }
          ]
        }
      });
      const released = releases.docs.reduce((total, movement) => {
        if (
          !Number.isSafeInteger(movement.quantity) ||
          movement.quantity <= 0
        ) {
          throw new Error("inventory-lot-release-evidence-corrupt");
        }
        return total + movement.quantity;
      }, 0);
      const received = positiveOperationQuantity(lot.received_quantity);
      if (!Number.isSafeInteger(released) || released > received) {
        throw new Error("inventory-lot-release-evidence-corrupt");
      }
      if (quantity > received - released) {
        throw new Error("inventory-lot-release-exceeds-remaining");
      }
      await recordInventoryMovementsInTransaction({
        payload: context.payload,
        req,
        authorization,
        requests: [
          {
            idempotencyKey: inventoryMovementKey(commandKey, "lot-release"),
            skuId,
            kind: "transfer",
            quantity,
            from: { locationId, disposition: "quarantine" },
            to: { locationId, disposition: "available" },
            reasonCode: "lot-released",
            sourceType: "inventory_lot_release",
            sourceRef: lotId,
            receiptId,
            receiptLineId,
            lotId,
            actorId,
            effectiveAt
          }
        ]
      });
      return {
        resourceId: lotId,
        resourceType: "inventory-lot",
        status:
          released + quantity === received ? "released" : "partially-released"
      };
    }
  );
}

export async function adjustInventory(
  context: InventoryOperationContext & {
    input: {
      skuId: unknown;
      kind: unknown;
      quantity: unknown;
      from?: unknown;
      to?: unknown;
      reasonCode: unknown;
      sourceRef?: unknown;
    };
  }
): Promise<InventoryOperationResult> {
  requireInventoryAdmin(context.req);
  if (context.input.kind === "inbound") {
    throw new Error("inventory-positive-adjustment-requires-provenance");
  }
  if (context.input.kind !== "outbound" && context.input.kind !== "transfer") {
    throw new Error("invalid-inventory-adjustment-kind");
  }
  const kind = context.input.kind;
  const skuId = operationReference(
    context.input.skuId,
    "invalid-inventory-sku"
  );
  const quantity = positiveOperationQuantity(context.input.quantity);
  const reasonCode = operationReference(
    context.input.reasonCode,
    "invalid-inventory-reason-code"
  );
  const sourceRef =
    context.input.sourceRef === undefined
      ? null
      : operationReference(
          context.input.sourceRef,
          "invalid-inventory-source-ref"
        );
  const from = operationEndpoint(context.input.from);
  const transition =
    kind === "outbound"
      ? ({ kind: "outbound", from } as const)
      : ({
          kind: "transfer",
          from,
          to: operationEndpoint(context.input.to)
        } as const);
  validateInventoryAdjustmentTransition(transition);
  const to = transition.kind === "transfer" ? transition.to : null;
  return executeClaimedInventoryOperation(
    context,
    "adjustment",
    {
      skuId,
      kind,
      quantity,
      from,
      to,
      reasonCode,
      sourceRef
    },
    async ({ req, actorId, authorization, effectiveAt, commandKey }) => {
      await recordInventoryMovementsInTransaction({
        payload: context.payload,
        req,
        authorization,
        requests: [
          {
            idempotencyKey: inventoryMovementKey(commandKey, "adjustment"),
            skuId,
            kind,
            quantity,
            from,
            ...(to ? { to } : {}),
            reasonCode,
            sourceType: "inventory_adjustment",
            ...(sourceRef ? { sourceRef } : {}),
            actorId,
            effectiveAt
          }
        ]
      });
      return {
        resourceId: commandKey,
        resourceType: "inventory-adjustment",
        status: "applied"
      };
    }
  );
}
