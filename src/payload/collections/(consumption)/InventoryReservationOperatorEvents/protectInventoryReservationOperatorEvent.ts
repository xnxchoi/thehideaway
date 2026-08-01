import type { CollectionBeforeOperationHook } from "payload";

import { isInventoryReservationOperatorEventRequestAuthorized } from "./authorizeInventoryReservationOperatorEvent";

const isImmutableOperation = (operation: string): boolean =>
  operation === "update" ||
  operation === "updateByID" ||
  operation === "delete" ||
  operation === "deleteByID";

export const protectInventoryReservationOperatorEvent: CollectionBeforeOperationHook =
  async ({ operation, req }) => {
    if (isImmutableOperation(operation)) {
      throw new Error("inventory-reservation-operator-event-immutable");
    }
    if (
      operation === "create" &&
      !isInventoryReservationOperatorEventRequestAuthorized(req)
    ) {
      throw new Error("inventory-reservation-operator-event-create-forbidden");
    }
  };
