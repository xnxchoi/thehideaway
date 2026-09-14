"use client";

import { useEffect, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import {
  confirmPurchase,
  readPurchasePayment,
  rememberPurchaseReceipt,
  markPurchaseRetryable,
  canRecoverPurchase
} from "@/payload/plugins/ecommerce/client/purchase-confirmation";

export function PurchaseStatusClient({
  orderRef,
  paymentId,
  paid,
  pending,
  unavailable,
  failed,
  refunded,
  partiallyRefunded
}: {
  orderRef?: string;
  paymentId?: string;
  paid: ReactNode;
  pending: ReactNode;
  unavailable: ReactNode;
  failed: ReactNode;
  refunded: ReactNode;
  partiallyRefunded: ReactNode;
}) {
  const viewerId = useRPSession((session) => session.id);
  const { mutate, data, isError } = useMutation({
    mutationFn: async ({
      viewer,
      requestedOrder,
      requestedPayment
    }: {
      viewer: typeof viewerId;
      requestedOrder?: string;
      requestedPayment?: string;
    }) => {
      const payment = readPurchasePayment(requestedOrder ?? requestedPayment);
      if (
        !canRecoverPurchase(payment, viewer) ||
        (requestedPayment && payment.paymentId !== requestedPayment)
      )
        throw new Error("purchase-access-unavailable");
      const result = await confirmPurchase(payment);
      if (result.paymentStatus === "paid" && !result.reconciliationRequired)
        rememberPurchaseReceipt(payment);
      if (["failed", "cancelled"].includes(result.attemptStatus ?? ""))
        markPurchaseRetryable(payment);
      return { viewer, result, requestedOrder, requestedPayment };
    },
    retry: false
  });

  useEffect(() => {
    mutate({
      viewer: viewerId,
      requestedOrder: orderRef,
      requestedPayment: paymentId
    });
  }, [mutate, orderRef, paymentId, viewerId]);

  // Never reuse a previous account's successful response after login/logout or switching accounts.
  if (
    data &&
    data.viewer === viewerId &&
    data.requestedOrder === orderRef &&
    data.requestedPayment === paymentId
  ) {
    if (data.result.paymentStatus === "refunded") return refunded;
    if (data.result.paymentStatus === "partially_refunded")
      return partiallyRefunded;
    if (
      data.result.paymentStatus === "paid" &&
      !data.result.reconciliationRequired
    )
      return paid;
    if (["failed", "cancelled"].includes(data.result.attemptStatus ?? ""))
      return failed;
    return pending;
  }
  return isError ? unavailable : pending;
}
