import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";

import { RPage } from "@/components/UX/Transition";
import { getServerSession } from "@/lib/auth/getServerSession";
import { LostPaymentStatusShell } from "../status-shell";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export const instant = false;

export default async function LostPaymentPendingPage({ searchParams }: Props) {
  await connection();
  const t = await getTranslations("LOSTINSEOUL.payment");
  const { order } = await searchParams;
  const session = await getServerSession(await nextHeaders());
  if (!order || !session?.user?.id) notFound();

  const payload = await getPayload({ config });
  const orders = await payload.find({
    collection: "orders",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { order_ref: { equals: order } },
        { customer: { equals: String(session.user.id) } }
      ]
    }
  });
  const ownedOrder = orders.docs[0] as
    { payment_status?: string; lifecycle_status?: string } | undefined;
  if (
    !ownedOrder ||
    !["unpaid", "pending", "pending_manual"].includes(
      ownedOrder.payment_status ?? ""
    ) ||
    ownedOrder.lifecycle_status === "paid"
  ) {
    notFound();
  }

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
