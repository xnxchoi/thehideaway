import type { CollectionBeforeOperationHook } from "payload";

import { isInventoryLedgerRequestAuthorized } from "./InventoryLevels/protectInventoryProjection";

const isWriteOperation = (operation: string): boolean =>
  operation === "create" ||
  operation === "update" ||
  operation === "updateByID";

const isDeleteOperation = (operation: string): boolean =>
  operation === "delete" || operation === "deleteByID";

export const protectInventoryOperationWrite: CollectionBeforeOperationHook =
  async ({ operation, req }) => {
    if (isDeleteOperation(operation)) {
      throw new Error("inventory-operation-delete-forbidden");
    }
    if (
      isWriteOperation(operation) &&
      !isInventoryLedgerRequestAuthorized(req)
    ) {
      throw new Error("inventory-operation-write-forbidden");
    }
  };

export const protectInventoryOperationCreateOnly: CollectionBeforeOperationHook =
  async ({ operation, req }) => {
    if (
      operation === "update" ||
      operation === "updateByID" ||
      isDeleteOperation(operation)
    ) {
      throw new Error("inventory-operation-record-immutable");
    }
    if (operation === "create" && !isInventoryLedgerRequestAuthorized(req)) {
      throw new Error("inventory-operation-write-forbidden");
    }
  };

export const protectInventoryLotWrite: CollectionBeforeOperationHook = async ({
  operation,
  req
}) => {
  if (
    operation === "update" ||
    operation === "updateByID" ||
    isDeleteOperation(operation)
  ) {
    throw new Error("inventory-lot-immutable");
  }
  if (operation === "create" && !isInventoryLedgerRequestAuthorized(req)) {
    throw new Error("inventory-operation-write-forbidden");
  }
};
