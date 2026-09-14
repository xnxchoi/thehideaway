import { isDeepStrictEqual } from "node:util";
import type { CollectionBeforeChangeHook } from "payload";

const authorizedRequests = new WeakSet<object>();
const immutableFields = [
  "order",
  "cart",
  "customer",
  "customerEmail",
  "amount",
  "currency",
  "items",
  "billingAddress",
  "paymentMethod",
  "checkout_attempt_key",
  "checkout_fingerprint",
  "checkout_snapshot",
  "guest_access_digest",
  "provider_expectation"
] as const;

function comparable(value: unknown): unknown {
  return value && typeof value === "object" && "id" in value ? value.id : value;
}

export function authorizePluginTransactionWrite(req: object): void {
  authorizedRequests.add(req);
}

export const protectPluginTransaction: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req
}) => {
  if (
    operation === "create" &&
    !authorizedRequests.has(req) &&
    ((data.status !== undefined && data.status !== "pending") ||
      [
        "checkout_snapshot",
        "checkout_attempt_key",
        "guest_access_digest",
        "provider_expectation",
        "provider_outcome",
        "provider_verified_at"
      ].some((name) => data[name] != null) ||
      data.reconciliation_required === true)
  )
    throw new Error("commerce-transaction-write-forbidden");
  if (operation !== "update") return data;
  const previous = originalDoc as Record<string, unknown>;
  const next = data as Record<string, unknown>;
  const portone = next.portone as { paymentId?: unknown } | undefined;
  const previousPortone = previous?.portone as
    { paymentId?: unknown } | undefined;
  if (
    immutableFields.some(
      (name) =>
        Object.hasOwn(next, name) &&
        !isDeepStrictEqual(comparable(next[name]), comparable(previous?.[name]))
    ) ||
    (portone &&
      Object.hasOwn(portone, "paymentId") &&
      portone.paymentId !== previousPortone?.paymentId)
  ) {
    throw new Error("commerce-snapshot-update-forbidden");
  }
  if (
    !authorizedRequests.has(req) &&
    [
      "status",
      "portone",
      "provider_outcome",
      "provider_verified_at",
      "reconciliation_required"
    ].some(
      (name) =>
        Object.hasOwn(next, name) &&
        !isDeepStrictEqual(next[name], previous?.[name])
    )
  ) {
    throw new Error("commerce-transaction-write-forbidden");
  }
  return data;
};
