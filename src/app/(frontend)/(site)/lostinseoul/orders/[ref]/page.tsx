import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { Link } from "@/components/core/Link/Link";
import { getServerSession } from "@/lib/auth/getServerSession";
import { getPayload } from "@/lib/payload";
import { getCustomerOrder } from "@/payload/plugins/ecommerce/order-history";
import { OrderDetail } from "@/lostinseoul/order-detail";
import { OrderLookup } from "@/lostinseoul/order-lookup";

export default async function OrderPage({
  params
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  if (!ref || ref.length > 100) notFound();
  const session = await getServerSession(await headers());
  const order = session?.user.id
    ? await getCustomerOrder(await getPayload(), {
        orderRef: ref,
        customerID: session.user.id
      })
    : null;
  const t = await getTranslations("LOSTINSEOUL.orders");
  return (
    <RPage slug={["lostinseoul", "orders", ref]} type="pages">
      <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--fg)] xl:px-10">
        <div className="mx-auto max-w-4xl">
          <Link className="text-sm font-medium" href="/lostinseoul/orders">
            {t("title")}
          </Link>
          <h1 className="mt-8 text-6xl font-light tracking-tight">
            {t("detail")}
          </h1>
          {order ? (
            <OrderDetail order={order} />
          ) : (
            <OrderLookup key={ref} orderRef={ref} />
          )}
        </div>
      </main>
    </RPage>
  );
}
