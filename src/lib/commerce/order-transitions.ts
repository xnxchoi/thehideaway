export const COMMERCE_ORDER_STATUSES = [
  "awaiting_payment",
  "paid",
  "preparing",
  "shipped",
  "completed",
  "canceled"
] as const;

export type CommerceOrderStatus = (typeof COMMERCE_ORDER_STATUSES)[number];

const ALLOWED_TRANSITIONS: Readonly<
  Record<CommerceOrderStatus, readonly CommerceOrderStatus[]>
> = Object.freeze<Record<CommerceOrderStatus, readonly CommerceOrderStatus[]>>({
  awaiting_payment: Object.freeze(["paid", "canceled"]),
  paid: Object.freeze(["preparing", "canceled"]),
  preparing: Object.freeze(["shipped", "canceled"]),
  shipped: Object.freeze(["completed"]),
  completed: Object.freeze([]),
  canceled: Object.freeze([])
});

export function assertOrderTransition(
  current: CommerceOrderStatus,
  next: CommerceOrderStatus
): CommerceOrderStatus {
  if (current === next) return next;
  if (ALLOWED_TRANSITIONS[current].includes(next)) return next;
  throw new Error("invalid-order-transition");
}
