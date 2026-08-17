import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { LostPaymentStatusShell } from "../status-shell";
import { ClearPendingProductPayment } from "../clear-pending-payment.client";

export default async function LostPaymentFailurePage() {
  const t = await getTranslations("LOSTINSEOUL.payment");

  return (
    <RPage slug={["lostinseoul", "payment", "failure"]} type="pages">
      <ClearPendingProductPayment />
      <LostPaymentStatusShell
        actionHref="/lostinseoul/cart"
        actionLabel={t("retry")}
        eyebrow={t("failureEyebrow")}
        title={t("failureTitle")}
      />
    </RPage>
  );
}
