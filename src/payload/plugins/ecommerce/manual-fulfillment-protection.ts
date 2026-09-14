import { isDeepStrictEqual } from "node:util";
import type { CollectionBeforeChangeHook, PayloadRequest } from "payload";
import { planManualFulfillment, type ManualFulfillmentPatch } from "./manual-fulfillment-contract";

const receipts = new WeakMap<object, {
  transactionID: unknown; actorId: string; orderId: string;
  before: Record<string, unknown>; patch: ManualFulfillmentPatch;
}>();
const fields = ["fulfillment_status", "manual_shipment", "fulfillment_history"] as const;

/** Server-only one-use proof for the exact validated transition and caller transaction. */
export function authorizeManualFulfillmentWrite(req: PayloadRequest, input: Omit<Parameters<typeof planManualFulfillment>[0], "actorId">): ManualFulfillmentPatch {
  if (!req.transactionID || req.user?.collection !== "users" || req.user.role !== "admin" || typeof req.user.id !== "string")
    throw new Error("fulfillment-write-forbidden");
  const patch = planManualFulfillment({ ...input, actorId: req.user.id });
  receipts.set(req, { transactionID: req.transactionID, actorId: req.user.id, orderId: input.command.orderId, before: structuredClone(input.order), patch: structuredClone(patch) });
  return patch;
}

/** Returns authority for only fulfillment_status; the financial lifecycle stays guarded. */
export function consumeManualFulfillmentWrite(args: Parameters<CollectionBeforeChangeHook>[0]): boolean {
  const { data, originalDoc: original, req, operation } = args;
  const receipt = receipts.get(req);
  receipts.delete(req);
  if (operation === "create") {
    if (data.manual_shipment != null || data.fulfillment_history != null || ["preparing", "shipped", "delivered"].includes(data.fulfillment_status))
      throw new Error("fulfillment-write-forbidden");
    return false;
  }
  const changed = fields.some((field) => Object.hasOwn(data, field) && !isDeepStrictEqual(data[field], original?.[field]));
  if (!changed) return false;
  if (!receipt || receipt.transactionID !== req.transactionID || receipt.orderId !== String(original?.id) ||
    req.user?.id !== receipt.actorId || req.user.collection !== "users" || req.user.role !== "admin" ||
    fields.some((field) => !isDeepStrictEqual(data[field], receipt.patch[field])) ||
    Object.keys(data).some((field) => !fields.includes(field as typeof fields[number]) && field !== "updatedAt" && !isDeepStrictEqual(data[field], original?.[field])) ||
    fields.some((field) => !isDeepStrictEqual(original?.[field], receipt.before[field])))
    throw new Error("fulfillment-write-forbidden");
  return true;
}
