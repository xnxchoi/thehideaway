import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import { RPage } from "@/components/UX/Transition";
import { Link } from "@/components/core/Link/Link";
import { getServerSession } from "@/lib/auth/getServerSession";
import { cancelUnpaidProductOrder } from "@/lib/lost-commerce/orders";

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
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--fg)]">
        <section className="max-w-xl text-center">
          <p className="font-mono text-[11px] tracking-[0.22em] text-[oklch(from_var(--fg)_l_c_h_/_0.6)] uppercase">
            {t("failureEyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-6xl font-bold tracking-tight">
            {t("failureTitle")}
          </h1>
          <Link
            className="mt-8 inline-flex min-h-12 items-center bg-[var(--fg)] px-6 text-sm font-medium text-[var(--bg)]"
            href="/lostinseoul/cart"
          >
            {t("retry")}
          </Link>
        </section>
      </main>
    </RPage>
  );
}
