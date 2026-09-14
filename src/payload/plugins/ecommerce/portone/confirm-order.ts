import type { PayloadRequest } from "payload";
import { relationID } from "../checkout-attempt";
import type { PortOneAdapterDeps } from "./deps";
import { createPortOneSettlement, findPaymentAttempt } from "./settle-payment";

const browserAuthorizations = new WeakMap<
  object,
  { transactionID: string; cartID: string }
>();

/** Only the validated HTTP handler grants this receipt, never a body/context field. */
export function markAuthorizedBrowserPayment(
  req: PayloadRequest,
  proof: { transactionID: string; cartID: string }
): void {
  browserAuthorizations.set(req, { ...proof });
}

export function createPortOneConfirmOrder(deps: PortOneAdapterDeps = {}) {
  const settle = createPortOneSettlement(deps);
  return async ({
    data,
    req
  }: {
    cartsSlug?: string;
    ordersSlug?: string;
    transactionsSlug?: string;
    data: {
      [key: string]: unknown;
      customerEmail?: string;
      paymentId?: unknown;
    };
    req: PayloadRequest;
  }) => {
    const paymentId =
      typeof data.paymentId === "string" ? data.paymentId.trim() : "";
    if (!paymentId) throw new Error("payment-id-required");
    const proof = browserAuthorizations.get(req);
    if (!proof) throw new Error("payment-authorization-required");
    const attempt = await findPaymentAttempt(req, paymentId);
    const snapshot = attempt.checkout_snapshot as
      Record<string, unknown> | undefined;
    if (
      String(attempt.id) !== proof.transactionID ||
      (relationID(attempt.cart) ?? snapshot?.cartID) !== proof.cartID
    )
      throw new Error("payment-authorization-required");
    return settle({ req, paymentId });
  };
}
