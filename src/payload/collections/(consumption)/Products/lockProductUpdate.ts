import type { CollectionBeforeOperationHook } from "payload";

import { productInventoryLock } from "@/lib/db/sequences";

export const lockProductUpdate: CollectionBeforeOperationHook = async ({
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
    throw new Error("product-bulk-update-disabled");
  }

  const role = (req.user as { role?: unknown } | null | undefined)?.role;
  if (overrideAccess !== true && role !== "admin" && role !== "editor") {
    throw new Error("product-update-forbidden");
  }

  const transactionID = req.transactionID;
  if (transactionID == null) {
    throw new Error("product-update-transaction-required");
  }
  await productInventoryLock(req.payload, transactionID, String(args.id));
};
