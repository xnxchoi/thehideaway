type StoredPayment = Record<string, unknown>;

function relationshipId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value) {
    const nested = (value as { id?: unknown }).id;
    if (typeof nested === "string" && nested.length > 0) return nested;
  }
  return undefined;
}

function sortableTimestamp(value: unknown): number {
  if (typeof value !== "string") return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function hasAuthoritativePaidEvidence(payment: StoredPayment): boolean {
  return (
    payment.provider === "portone" &&
    payment.status === "paid" &&
    sortableTimestamp(payment.paid_at) !== Number.NEGATIVE_INFINITY &&
    typeof payment.portone_transaction_ref === "string" &&
    /^[A-Za-z0-9_.:~/-]{1,200}$/.test(payment.portone_transaction_ref)
  );
}

export function selectAuthoritativeInventoryReservationPayment(
  payments: readonly StoredPayment[],
  orderRef?: string
): StoredPayment | undefined {
  const canonicalRef = orderRef ? `${orderRef}_portone` : undefined;
  return [...payments].sort((left, right) => {
    const authority =
      Number(hasAuthoritativePaidEvidence(right)) -
      Number(hasAuthoritativePaidEvidence(left));
    if (authority !== 0) return authority;
    const paid =
      Number(right.status === "paid") - Number(left.status === "paid");
    if (paid !== 0) return paid;
    const canonical =
      Number(right.payment_ref === canonicalRef) -
      Number(left.payment_ref === canonicalRef);
    if (canonical !== 0) return canonical;
    const leftPaidAt = sortableTimestamp(left.paid_at);
    const rightPaidAt = sortableTimestamp(right.paid_at);
    if (leftPaidAt !== rightPaidAt) return rightPaidAt - leftPaidAt;
    const leftUpdatedAt = sortableTimestamp(left.updatedAt);
    const rightUpdatedAt = sortableTimestamp(right.updatedAt);
    if (leftUpdatedAt !== rightUpdatedAt) return rightUpdatedAt - leftUpdatedAt;
    const paymentRef = String(left.payment_ref ?? "").localeCompare(
      String(right.payment_ref ?? "")
    );
    if (paymentRef !== 0) return paymentRef;
    return String(relationshipId(left.id) ?? "").localeCompare(
      String(relationshipId(right.id) ?? "")
    );
  })[0];
}
