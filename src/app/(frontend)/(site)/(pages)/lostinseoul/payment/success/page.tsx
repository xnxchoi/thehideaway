import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { LostPaymentStatusShell } from "../status-shell";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function LostPaymentSuccessPage({ searchParams }: Props) {
  const t = await getTranslations("LOSTINSEOUL.payment");
  const { order } = await searchParams;
  return (
    <RPage slug={["lostinseoul", "payment", "success"]} type="pages">
      <LostPaymentStatusShell
        actionHref="/lostinseoul"
        actionLabel={t("continue")}
        eyebrow={t("successEyebrow")}
        order={order}
        title={t("successTitle")}
      />
    </RPage>
  );
}
