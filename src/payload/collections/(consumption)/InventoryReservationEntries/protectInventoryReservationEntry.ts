import type { CollectionBeforeOperationHook } from "payload";

import { isInventoryReservationRequestAuthorized } from "../InventoryReservations/authorizeInventoryReservation";

export const protectInventoryReservationEntry: CollectionBeforeOperationHook =
  async ({ operation, req }) => {
    if (operation === "update" || operation === "updateByID") {
      throw new Error("inventory-reservation-entry-immutable");
    }
    if (operation === "delete" || operation === "deleteByID") {
      throw new Error("inventory-reservation-entry-immutable");
    }
    if (
      operation === "create" &&
      !isInventoryReservationRequestAuthorized(req)
    ) {
      throw new Error("inventory-reservation-entry-create-forbidden");
    }
  };
