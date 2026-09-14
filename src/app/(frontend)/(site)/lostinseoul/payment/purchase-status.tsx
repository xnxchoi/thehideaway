import { getTranslations } from "next-intl/server";
import { PurchaseStatusClient } from "./purchase-status.client";
import { LostPaymentStatusShell } from "./status-shell";

export async function PurchaseStatus({
  orderRef,
  paymentId,
  showOrderReference = true
}: {
  orderRef?: string;
  paymentId?: string;
  showOrderReference?: boolean;
}) {
  const t = await getTranslations("LOSTINSEOUL.payment");
  return (
    <PurchaseStatusClient
      orderRef={orderRef}
      paymentId={paymentId}
      paid={
        <LostPaymentStatusShell
          actionHref="/lostinseoul"
          actionLabel={t("continue")}
          eyebrow={t("successEyebrow")}
          title={t("successTitle")}
          order={showOrderReference ? orderRef : undefined}
        />
      }
      pending={
        <LostPaymentStatusShell
          actionHref="/lostinseoul/checkout"
          actionLabel={t("verify")}
          eyebrow={t("pendingLabel")}
          title={t("pendingTitle")}
        />
      }
      refunded={
        <LostPaymentStatusShell
          actionHref="/lostinseoul"
          actionLabel={t("continue")}
          eyebrow={t("heading")}
          title={t("refundedTitle")}
        />
      }
      partiallyRefunded={
        <LostPaymentStatusShell
          actionHref="/lostinseoul"
          actionLabel={t("continue")}
          eyebrow={t("heading")}
          title={t("partiallyRefundedTitle")}
        />
      }
      failed={
        <LostPaymentStatusShell
          actionHref="/lostinseoul/checkout"
          actionLabel={t("retry")}
          eyebrow={t("failureEyebrow")}
          title={t("failureTitle")}
        />
      }
      unavailable={
        <LostPaymentStatusShell
          actionHref="/lostinseoul/checkout"
          actionLabel={t("verify")}
          eyebrow={t("pendingLabel")}
          title={t("verificationUnavailable")}
        />
      }
    />
  );
}
