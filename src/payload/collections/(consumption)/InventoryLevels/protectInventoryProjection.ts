import type {
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook
} from "payload";

const authorizedInventoryLedgerRequests = new WeakSet<object>();

export function authorizeInventoryLedgerRequest(req: object): void {
  if (typeof req !== "object" || req === null) {
    throw new Error("inventory-ledger-request-required");
  }
  authorizedInventoryLedgerRequests.add(req);
}

export function isInventoryLedgerRequestAuthorized(req: unknown): boolean {
  return (
    typeof req === "object" &&
    req !== null &&
    authorizedInventoryLedgerRequests.has(req)
  );
}

export const protectInventoryProjection: CollectionBeforeOperationHook =
  async ({ operation, req }) => {
    if (operation === "delete" || operation === "deleteByID") {
      throw new Error("inventory-projection-delete-forbidden");
    }
    if (
      (operation === "create" ||
        operation === "update" ||
        operation === "updateByID") &&
      !isInventoryLedgerRequestAuthorized(req)
    ) {
      throw new Error("inventory-projection-write-forbidden");
    }
  };

function relationshipId(value: unknown): unknown {
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id?: unknown }).id;
  }
  return value;
}

export const protectInventoryProjectionIdentity: CollectionBeforeValidateHook =
  async ({ data, operation, originalDoc }) => {
    if (operation !== "update" || !data || !originalDoc) return data;

    for (const field of ["aggregate_key", "sku", "location", "disposition"]) {
      if (
        data[field] !== undefined &&
        relationshipId(data[field]) !== relationshipId(originalDoc[field])
      ) {
        throw new Error(`inventory-projection-${field}-immutable`);
      }
    }

    return data;
  };
