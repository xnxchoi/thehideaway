import type { CollectionBeforeChangeHook } from "payload";
import { isDeepStrictEqual } from "node:util";

const authorizedLifecycleRequests = new WeakSet<object>();

const orderLifecycleFields = [
  "status",
  "payment_status",
  "fulfillment_status",
  "paid_at"
] as const;
const paymentLifecycleFields = [
  "status",
  "portone_transaction_ref",
  "paid_at"
] as const;
const campaignLifecycleFields = ["state", "paid_commitments"] as const;
const orderSnapshotFields = [
  "order_ref",
  "user",
  "storefront",
  "order_mode",
  "currency",
  "subtotal_amount",
  "total_amount",
  "campaign",
  "line_snapshot_version",
  "lines",
  "shipping",
  "contact",
  "quote",
  "expires_at"
] as const;
const paymentSnapshotFields = [
  "payment_ref",
  "order",
  "user",
  "provider",
  "amount",
  "currency",
  "portone_order_ref",
  "payment_channel",
  "payment_method",
  "request_payload",
  "events"
] as const;

type InitialLifecycleValues = Readonly<
  Record<string, ReadonlySet<string | number>>
>;

export function authorizeCommerceLifecycleRequest(req: object): void {
  authorizedLifecycleRequests.add(req);
}

function changesLifecycleField(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  fields: readonly string[]
): boolean {
  return fields.some(
    (field) =>
      Object.hasOwn(data, field) && data[field] !== originalDoc?.[field]
  );
}

function comparableValue(value: unknown): unknown {
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id?: unknown }).id;
  }
  return value;
}

function changesSnapshotField(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  fields: readonly string[]
): boolean {
  return fields.some(
    (field) =>
      Object.hasOwn(data, field) &&
      !isDeepStrictEqual(
        comparableValue(data[field]),
        comparableValue(originalDoc?.[field])
      )
  );
}

function lifecycleHook(
  fields: readonly string[],
  initialValues: InitialLifecycleValues,
  immutableFields: readonly string[] = []
): CollectionBeforeChangeHook {
  return async ({ data, operation, originalDoc, req }) => {
    const lifecycleData = data as Record<string, unknown>;
    if (operation === "create") {
      const hasForbiddenInitialValue = Object.entries(initialValues).some(
        ([field, allowed]) =>
          Object.hasOwn(lifecycleData, field) &&
          lifecycleData[field] !== undefined &&
          !allowed.has(lifecycleData[field] as string | number)
      );
      if (hasForbiddenInitialValue && !authorizedLifecycleRequests.has(req)) {
        throw new Error("commerce-lifecycle-create-forbidden");
      }
      return data;
    }
    if (operation !== "update") return data;
    if (
      changesSnapshotField(
        lifecycleData,
        originalDoc as Record<string, unknown> | undefined,
        immutableFields
      )
    ) {
      throw new Error("commerce-snapshot-update-forbidden");
    }
    if (
      changesLifecycleField(
        lifecycleData,
        originalDoc as Record<string, unknown> | undefined,
        fields
      ) &&
      !authorizedLifecycleRequests.has(req)
    ) {
      throw new Error("commerce-lifecycle-update-forbidden");
    }
    return data;
  };
}

export const protectOrderLifecycle = lifecycleHook(orderLifecycleFields, {
  status: new Set(["draft", "quote_requested", "pending_payment"]),
  payment_status: new Set(["unpaid", "pending", "pending_manual"]),
  fulfillment_status: new Set(["unfulfilled", "reserved"])
}, orderSnapshotFields);
export const protectPaymentLifecycle = lifecycleHook(paymentLifecycleFields, {
  status: new Set(["initiated", "manual_pending"])
}, paymentSnapshotFields);
export const protectCampaignLifecycle = lifecycleHook(campaignLifecycleFields, {
  state: new Set(["draft", "open"]),
  paid_commitments: new Set([0])
});
