import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import { RPage } from "@/components/UX/Transition";
import { getServerSession } from "@/lib/auth/getServerSession";
import { LostPaymentStatusShell } from "../status-shell";
import { ClearPendingProductPayment } from "../clear-pending-payment.client";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function LostPaymentSuccessPage({ searchParams }: Props) {
  const t = await getTranslations("LOSTINSEOUL.payment");
  const { order } = await searchParams;
  const session = await getServerSession(await nextHeaders());
  if (!order || !session?.user?.id) notFound();

  const payload = await getPayload({ config });
  const orders = await payload.find({
    collection: "commerce-orders" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { ref: { equals: order } },
        { user: { equals: String(session.user.id) } }
      ]
    }
  });
  const ownedOrder = orders.docs[0] as
    { id: string; payment_status?: string } | undefined;
  if (!ownedOrder) notFound();

  if (ownedOrder.payment_status !== "paid") notFound();

  return (
    <RPage slug={["lostinseoul", "payment", "success"]} type="pages">
      <ClearPendingProductPayment />
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
