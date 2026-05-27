import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import { RPage } from "@/components/UX/Transition";
import { Link } from "@/components/core/Link/Link";
import { getServerSession } from "@/lib/auth/getServerSession";
import { signInRedirectPath } from "@/lib/routes/auth";
import { formatLostMoney } from "@/lib/lost-commerce/format";

type Props = {
  params: Promise<{ ref: string }>;
};

export default async function LostOrderPage({ params }: Props) {
  const session = await getServerSession(await nextHeaders());
  const { ref } = await params;
  if (!session?.user?.id)
    redirect(signInRedirectPath(`/lostinseoul/orders/${ref}`));

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "product-orders" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { order_ref: { equals: ref } },
        { user: { equals: session.user.id } }
      ]
    } as never
  });
  const order = result.docs[0] as
    | {
        order_ref: string;
        status: string;
        payment_status: string;
        currency: "KRW" | "USD" | "JPY" | "EUR";
        total_amount: number;
        lines?: Array<{ productName?: string; quantity?: number }>;
      }
    | undefined;
  if (!order) notFound();

  const t = await getTranslations("LOSTINSEOUL.order");

  return (
    <RPage slug={["lostinseoul", "orders", ref]} type="pages">
      <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--fg)] xl:px-10">
        <section className="mx-auto max-w-3xl">
          <Link className="text-sm font-medium" href="/lostinseoul">
            {t("back")}
          </Link>
          <h1 className="mt-8 font-serif text-6xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-4 font-mono text-xs text-[oklch(from_var(--fg)_l_c_h_/_0.65)]">
            {order.order_ref}
          </p>
          <dl className="mt-8 grid gap-4 border-y border-[oklch(from_var(--fg)_l_c_h_/_0.15)] py-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-[oklch(from_var(--fg)_l_c_h_/_0.6)]">
                {t("status")}
              </dt>
              <dd className="mt-1 text-base font-medium">{order.status}</dd>
            </div>
            <div>
              <dt className="text-sm text-[oklch(from_var(--fg)_l_c_h_/_0.6)]">
                {t("payment")}
              </dt>
              <dd className="mt-1 text-base font-medium">
                {order.payment_status}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[oklch(from_var(--fg)_l_c_h_/_0.6)]">
                {t("total")}
              </dt>
              <dd className="mt-1 text-base font-medium">
                {formatLostMoney(
                  Number(order.total_amount ?? 0),
                  order.currency
                )}
              </dd>
            </div>
          </dl>
          <div className="mt-8 divide-y divide-[oklch(from_var(--fg)_l_c_h_/_0.15)]">
            {order.lines?.map((line, index) => (
              <div className="flex justify-between py-4" key={index}>
                <span>{line.productName}</span>
                <span className="font-mono text-xs text-[oklch(from_var(--fg)_l_c_h_/_0.65)]">
                  x {line.quantity ?? 1}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RPage>
  );
}
