import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import { RPage } from "@/components/UX/Transition";
import { getServerSession } from "@/lib/auth/getServerSession";
import { canViewPaidLostOrder } from "@/lib/lost-commerce/payment-recovery";
import { LostPaymentStatusShell } from "../status-shell";
import { ClearPendingProductPayment } from "../clear-pending-payment.client";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export const instant = false;

export default async function LostPaymentSuccessPage({ searchParams }: Props) {
  await connection();
  const t = await getTranslations("LOSTINSEOUL.payment");
  const { order } = await searchParams;
  if (!order) notFound();
  const session = await getServerSession(await nextHeaders());

  const payload = await getPayload({ config });
  const orders = await payload.find({
    collection: "orders",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { order_ref: { equals: order } }
  });
  const paidOrder = orders.docs[0] as
    | {
        id: string;
        customer?: string | { id?: string } | null;
        payment_status?: string;
      }
    | undefined;
  const customer =
    typeof paidOrder?.customer === "string"
      ? paidOrder.customer
      : paidOrder?.customer && typeof paidOrder.customer.id === "string"
        ? paidOrder.customer.id
        : null;
  if (
    !paidOrder ||
    !canViewPaidLostOrder({
      customer,
      paymentStatus: paidOrder.payment_status,
      viewerId: session?.user?.id ? String(session.user.id) : null
    })
  ) {
    notFound();
  }

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
