import type { PortOnePaymentRecord } from "@/lib/lost-commerce/verify-payment";
import { verifyPortOnePayment } from "@/lib/lost-commerce/verify-payment";

import {
  projectCommerceOrder,
  type CommerceOrderProjection,
  type CommerceRepository
} from "./create-order";

export interface CardPaymentGateway {
  getPayment(paymentId: string): Promise<PortOnePaymentRecord>;
  requireLiveChannel: boolean;
}

export async function settleCardPayment(input: {
  repository: CommerceRepository;
  gateway: CardPaymentGateway;
  paymentId: string;
  userId?: string;
  isAdmin?: boolean;
}): Promise<CommerceOrderProjection> {
  const paymentId = input.paymentId.trim();
  if (!paymentId) throw new Error("invalid-payment-id");
  const order = await input.repository.findOrderByProviderPaymentId(paymentId);
  if (!order || order.paymentMethod !== "card") {
    throw new Error("order-not-found");
  }
  if (input.userId && !input.isAdmin && order.userId !== input.userId) {
    throw new Error("order-not-found");
  }
  if (order.paymentStatus === "paid") return projectCommerceOrder(order);
  if (order.paymentStatus !== "pending") {
    throw new Error("payment-not-pending");
  }

  const payment = await input.gateway.getPayment(paymentId);
  const verified = verifyPortOnePayment(payment, {
    amount: order.totalAmount,
    currency: order.currency,
    requireLiveChannel: input.gateway.requireLiveChannel
  });
  if (!verified.ok) throw new Error(verified.reason);

  const updated = await input.repository.updateOrderLifecycle(order.id, {
    paymentStatus: "paid",
    status: "paid",
    providerTransactionId: verified.transactionRef ?? paymentId,
    paidAt: payment.paidAt ?? new Date().toISOString()
  });
  return projectCommerceOrder(updated);
}

export async function settleBankTransfer(input: {
  repository: CommerceRepository;
  orderRef: string;
  evidenceReference: string;
}): Promise<CommerceOrderProjection> {
  const evidenceReference = input.evidenceReference.trim();
  if (!evidenceReference || evidenceReference.length > 128) {
    throw new Error("bank-evidence-required");
  }
  const order = await input.repository.findOrderByRef(input.orderRef.trim());
  if (!order || order.paymentMethod !== "bank_transfer") {
    throw new Error("order-not-found");
  }
  if (order.paymentStatus === "paid") return projectCommerceOrder(order);
  if (order.paymentStatus !== "pending") {
    throw new Error("payment-not-pending");
  }
  const updated = await input.repository.updateOrderLifecycle(order.id, {
    paymentStatus: "paid",
    status: "paid",
    providerTransactionId: evidenceReference,
    paidAt: new Date().toISOString()
  });
  return projectCommerceOrder(updated);
}
