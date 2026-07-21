import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";

import { RPage } from "@/components/UX/Transition";
import { getServerSession } from "@/lib/auth/getServerSession";
import { LostPaymentStatusShell } from "../status-shell";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function LostPaymentPendingPage({ searchParams }: Props) {
  const t = await getTranslations("LOSTINSEOUL.payment");
  const { order } = await searchParams;
  const session = await getServerSession(await nextHeaders());
  if (!order || !session?.user?.id) notFound();

  const payload = await getPayload({ config });
  const orders = await payload.find({
    collection: "product-orders",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { order_ref: { equals: order } },
        { user: { equals: String(session.user.id) } }
      ]
    }
  });
  const ownedOrder = orders.docs[0];
  if (!ownedOrder || ownedOrder.payment_status !== "pending_manual") notFound();

  const payments = await payload.find({
    collection: "product-payments",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { order: { equals: ownedOrder.id } }
  });
  if (payments.docs[0]?.provider !== "manual") notFound();

  return (
    <RPage slug={["lostinseoul", "payment", "pending"]} type="pages">
      <LostPaymentStatusShell
        actionHref={`/lostinseoul/orders/${encodeURIComponent(order)}`}
        actionLabel={t("viewOrder")}
        eyebrow={t("pendingLabel")}
        order={order}
        title={t("pendingTitle")}
      />
    </RPage>
  );
}
