import type { Payload } from "payload";

import { markRequestOrderPaid } from "./campaigns";
import type { InventoryReservationOperatorOrderState } from "./inventory-reservation-operator-queries";
import { recoverPaidInventoryReservationsInTransaction } from "./inventory-reservation-recovery";
import type { ReservationTransactionRequest } from "./inventory-reservation-store";
import { authorizeCommerceLifecycleRequest } from "./lifecycle-authorization";
import { assertOrderTransition } from "./transitions";

function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value) {
    const nested = (value as { id?: unknown }).id;
    if (typeof nested === "string" && nested.length > 0) return nested;
  }
  return undefined;
}

function providerReference(doc: Record<string, unknown>): string | undefined {
  const value = doc.portone_transaction_ref;
  if (typeof value === "string" && /^[A-Za-z0-9_.:~/-]{1,200}$/.test(value)) {
    return value;
  }
  return undefined;
}

function reviewRemaining(paymentId?: string) {
  return Object.freeze({
    status: "review_remaining" as const,
    affectedCount: 0,
    paymentId
  });
}

export async function reconcilePaidInventoryReviewInTransaction(input: {
  payload: Payload;
  req: ReservationTransactionRequest;
  orderId: string;
  idempotencyKey: string;
  effectiveAt: string;
  locksHeld?: boolean;
  state: InventoryReservationOperatorOrderState;
}): Promise<
  Readonly<{
    status: "confirmed" | "review_remaining";
    affectedCount: number;
    paymentId?: string;
  }>
> {
  const { state } = input;
  const payment = state.payment;
  if (
    state.order.id !== input.orderId ||
    state.order.status !== "paid_inventory_review" ||
    state.order.paymentStatus !== "paid" ||
    !payment ||
    payment.status !== "paid" ||
    !payment.paidAt ||
    payment.doc.provider !== "portone" ||
    relationshipId(payment.doc.order) !== input.orderId
  ) {
    return reviewRemaining(payment?.id);
  }
  const eventReference = providerReference(payment.doc);
  if (!eventReference) return reviewRemaining(payment.id);
  const paidAt = Date.parse(payment.paidAt);
  const evidenceInvalid = state.reservations.some(({ doc }) => {
    if (relationshipId(doc.recovery_of)) return false;
    const reservedAt =
      typeof doc.reserved_at === "string" ? Date.parse(doc.reserved_at) : NaN;
    return !Number.isFinite(reservedAt) || paidAt < reservedAt;
  });
  if (!Number.isFinite(paidAt) || evidenceInvalid) {
    return reviewRemaining(payment.id);
  }

  const recovered = await recoverPaidInventoryReservationsInTransaction({
    payload: input.payload,
    req: input.req,
    orderId: input.orderId,
    paymentId: payment.id,
    idempotencyKey: input.idempotencyKey,
    providerEventRef: eventReference,
    effectiveAt: input.effectiveAt,
    locksHeld: input.locksHeld
  });
  if (recovered.kind === "review_remaining") {
    return reviewRemaining(payment.id);
  }

  const user = input.req.user as
    { id?: unknown; role?: unknown } | null | undefined;
  if (typeof user?.id !== "string" || user.role !== "admin") {
    throw new Error("inventory-reservation-operator-admin-required");
  }
  assertOrderTransition({
    from: "paid_inventory_review",
    to: "confirmed",
    actor: { kind: "staff", id: user.id, role: "admin" }
  });
  authorizeCommerceLifecycleRequest(input.req);
  const updated = await input.payload.update({
    collection: "product-orders" as never,
    id: input.orderId,
    depth: 0,
    overrideAccess: true,
    req: input.req,
    data: { status: "confirmed" } as never
  });
  await markRequestOrderPaid({
    payload: input.payload as never,
    order: updated as never,
    req: input.req as never
  });
  return Object.freeze({
    status: "confirmed",
    affectedCount: recovered.affectedCount,
    paymentId: payment.id
  });
}
