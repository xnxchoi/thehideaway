export type ProductPaymentRecoveryResult = {
  ok?: boolean;
  status?: string;
  reason?: string;
} | null;

export const LOST_PENDING_PAYMENT_STORAGE_KEY =
  "lostinseoul.pending-product-payment.v1";

export type PendingProductPayment = {
  orderRef: string;
  paymentId: string;
  customerEmail: string;
};

export function canViewPaidLostOrder(input: {
  customer?: string | null;
  paymentStatus?: string | null;
  viewerId?: string | null;
}): boolean {
  if (input.paymentStatus !== "paid") return false;
  if (input.viewerId) return input.customer === input.viewerId;
  return !input.customer;
}

export function productPaymentSubmitAction(
  pending: PendingProductPayment | null
): "create" | "reconcile" {
  return pending ? "reconcile" : "create";
}

export function productPaymentRecoveryAction(
  result: ProductPaymentRecoveryResult
): "success" | "failure" | "retry" {
  if (result?.ok && result.status === "paid") return "success";
  if (result?.reason === "payment-failed") return "failure";
  return "retry";
}
