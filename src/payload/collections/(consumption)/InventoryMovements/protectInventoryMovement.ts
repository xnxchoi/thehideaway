import type { CollectionBeforeOperationHook } from "payload";

import { isInventoryLedgerRequestAuthorized } from "../InventoryLevels/protectInventoryProjection";

export const protectInventoryMovement: CollectionBeforeOperationHook = async ({
  operation,
  req
}) => {
  if (
    operation === "update" ||
    operation === "updateByID" ||
    operation === "delete" ||
    operation === "deleteByID"
  ) {
    throw new Error("inventory-movement-immutable");
  }
  if (operation === "create" && !isInventoryLedgerRequestAuthorized(req)) {
    throw new Error("inventory-movement-create-forbidden");
  }
};
