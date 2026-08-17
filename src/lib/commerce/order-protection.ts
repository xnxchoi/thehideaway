import { isDeepStrictEqual } from "node:util";
import type { CollectionBeforeChangeHook } from "payload";

import {
  assertOrderTransition,
  type CommerceOrderStatus
} from "./order-transitions";

const authorizedRequests = new WeakSet<object>();

const IMMUTABLE_FIELDS = [
  "ref",
  "user",
  "product",
  "product_name_snapshot",
  "product_slug_snapshot",
  "quantity",
  "unit_amount_snapshot",
  "total_amount",
  "currency",
  "payment_method",
  "contact",
  "shipping",
  "idempotency_key",
  "request_hash",
  "bank_transfer_reference"
] as const;

const LIFECYCLE_FIELDS = [
  "payment_status",
  "status",
  "provider_payment_id",
  "provider_transaction_id",
  "tracking_number",
  "paid_at",
  "shipped_at",
  "completed_at"
] as const;

type PaymentStatus = "pending" | "paid" | "failed" | "canceled";

const PAYMENT_TRANSITIONS: Readonly<
  Record<PaymentStatus, readonly PaymentStatus[]>
> = Object.freeze<Record<PaymentStatus, readonly PaymentStatus[]>>({
  pending: Object.freeze(["paid", "failed", "canceled"]),
  paid: Object.freeze([]),
  failed: Object.freeze([]),
  canceled: Object.freeze([])
});

function relationshipId(value: unknown): unknown {
  return value && typeof value === "object" && "id" in value
    ? (value as { id?: unknown }).id
    : value;
}

function changesAny(
  fields: readonly string[],
  data: Record<string, unknown>,
  original: Record<string, unknown>
): boolean {
  return fields.some(
    (field) =>
      Object.hasOwn(data, field) &&
      !isDeepStrictEqual(
        relationshipId(data[field]),
        relationshipId(original[field])
      )
  );
}

function assertPaymentTransition(
  current: PaymentStatus,
  next: PaymentStatus
): void {
  if (current === next || PAYMENT_TRANSITIONS[current].includes(next)) return;
  throw new Error("invalid-payment-transition");
}

export function authorizeCommerceOrderMutation(req: object): void {
  authorizedRequests.add(req);
}

export const protectCommerceOrder: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req
}) => {
  const next = data as Record<string, unknown>;
  if (operation === "create") {
    if (
      (next.status !== undefined && next.status !== "awaiting_payment") ||
      (next.payment_status !== undefined && next.payment_status !== "pending")
    ) {
      throw new Error("commerce-order-initial-state-forbidden");
    }
    return data;
  }
  if (operation !== "update") return data;

  const original = (originalDoc ?? {}) as Record<string, unknown>;
  if (changesAny(IMMUTABLE_FIELDS, next, original)) {
    throw new Error("commerce-order-facts-immutable");
  }
  if (changesAny(LIFECYCLE_FIELDS, next, original)) {
    if (!authorizedRequests.has(req)) {
      throw new Error("commerce-order-mutation-forbidden");
    }
    if (typeof next.status === "string") {
      assertOrderTransition(
        original.status as CommerceOrderStatus,
        next.status as CommerceOrderStatus
      );
    }
    if (typeof next.payment_status === "string") {
      assertPaymentTransition(
        original.payment_status as PaymentStatus,
        next.payment_status as PaymentStatus
      );
    }
    const effectiveStatus = (next.status ??
      original.status) as CommerceOrderStatus;
    const effectivePaymentStatus = (next.payment_status ??
      original.payment_status) as PaymentStatus;
    const requiresPaidPayment = [
      "paid",
      "preparing",
      "shipped",
      "completed"
    ].includes(effectiveStatus);
    if (
      (requiresPaidPayment && effectivePaymentStatus !== "paid") ||
      (effectivePaymentStatus === "paid" &&
        effectiveStatus === "awaiting_payment")
    ) {
      throw new Error("commerce-order-state-inconsistent");
    }
  }
  return data;
};
