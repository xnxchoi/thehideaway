import type { CollectionBeforeOperationHook } from "payload";

import { productSkuMutationLock } from "@/lib/db/sequences";

export const lockProductVariantUpdate: CollectionBeforeOperationHook = async ({
  args,
  operation,
  overrideAccess,
  req
}) => {
  if (operation !== "update" && operation !== "updateByID") return;

  if (!("id" in args) || (typeof args.id !== "string" && typeof args.id !== "number")) {
    throw new Error("sku-bulk-update-disabled");
  }

  const role = (req.user as { role?: unknown } | null | undefined)?.role;
  if (overrideAccess !== true && role !== "admin" && role !== "editor") {
    throw new Error("sku-update-forbidden");
  }

  const transactionID = req.transactionID;
  if (transactionID == null) {
    throw new Error("sku-update-transaction-required");
  }

  await productSkuMutationLock(req.payload, transactionID, String(args.id));
};
