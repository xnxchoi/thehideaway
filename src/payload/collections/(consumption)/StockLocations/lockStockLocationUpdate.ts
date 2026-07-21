import type { CollectionBeforeOperationHook } from "payload";

import { inventoryLocationLock } from "@/lib/db/sequences";

export const lockStockLocationUpdate: CollectionBeforeOperationHook = async ({
  args,
  operation,
  overrideAccess,
  req
}) => {
  if (operation !== "update" && operation !== "updateByID") return;

  if (
    !("id" in args) ||
    (typeof args.id !== "string" && typeof args.id !== "number")
  ) {
    throw new Error("stock-location-bulk-update-disabled");
  }

  const role = (req.user as { role?: unknown } | null | undefined)?.role;
  if (overrideAccess !== true && role !== "admin") {
    throw new Error("stock-location-update-forbidden");
  }

  if (req.transactionID == null) {
    throw new Error("stock-location-update-transaction-required");
  }

  await inventoryLocationLock(req.payload, req.transactionID, String(args.id));
};
