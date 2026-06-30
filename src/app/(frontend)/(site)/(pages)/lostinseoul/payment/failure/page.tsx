import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import { RPage } from "@/components/UX/Transition";
import { getServerSession } from "@/lib/auth/getServerSession";
import { cancelUnpaidProductOrder } from "@/lib/lost-commerce/orders";
import { LostPaymentStatusShell } from "../status-shell";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

async function cancelReturnedOrder(orderRef?: string) {
  if (!orderRef) return;
  const headers = await nextHeaders();
  const session = await getServerSession(headers);
  if (!session?.user?.id) return;

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "product-orders" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { order_ref: { equals: orderRef } },
        { user: { equals: String(session.user.id) } }
      ]
    } as never
  });
  const order = result.docs[0] as Record<string, unknown> | undefined;
  if (!order) return;

  await cancelUnpaidProductOrder({ payload, order }).catch((err) => {
    payload.logger.error?.(
      `[lost/payment/failure] failed to cancel ${orderRef}: ${(err as Error).message}`
    );
  });
}

export default async function LostPaymentFailurePage({ searchParams }: Props) {
  const t = await getTranslations("LOSTINSEOUL.payment");
  const { order } = await searchParams;
  await cancelReturnedOrder(order);

  return (
    <RPage slug={["lostinseoul", "payment", "failure"]} type="pages">
      <LostPaymentStatusShell
        actionHref="/lostinseoul/cart"
        actionLabel={t("retry")}
        eyebrow={t("failureEyebrow")}
        title={t("failureTitle")}
      />
    </RPage>
  );
}
