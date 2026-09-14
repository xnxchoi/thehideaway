import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { RPage } from "@/components/UX/Transition";
import { Link } from "@/components/core/Link/Link";
import { getServerSession } from "@/lib/auth/getServerSession";
import { getPayload } from "@/lib/payload";
import { signInRedirectPath } from "@/lib/routes/auth";
import {
  listCustomerOrders,
  orderHistoryPage
} from "@/payload/plugins/ecommerce/order-history";
import { OrderSummary } from "@/lostinseoul/order-detail";

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await getServerSession(await headers());
  if (!session?.user.id) redirect(signInRedirectPath("/lostinseoul/orders"));
  const { page } = await searchParams;
  try {
    orderHistoryPage(page);
  } catch {
    notFound();
  }
  const history = await listCustomerOrders(
    await getPayload(),
    session.user.id,
    page
  );
  const t = await getTranslations("LOSTINSEOUL.orders");
  const format = await getFormatter();
  return (
    <RPage slug={["lostinseoul", "orders"]} type="pages">
      <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--fg)] xl:px-10">
        <div className="mx-auto max-w-4xl">
          <Link className="text-sm font-medium" href="/lostinseoul">
            {t("back")}
          </Link>
          <h1 className="mt-8 text-6xl font-light tracking-tight">
            {t("title")}
          </h1>
          {history.orders.length === 0 ? (
            <p className="py-16">{t("empty")}</p>
          ) : (
            <ul className="mt-8 space-y-10">
              {history.orders.map((order) => (
                <li key={order.orderRef}>
                  <Link
                    className="text-lg break-all underline underline-offset-4"
                    href={`/lostinseoul/orders/${encodeURIComponent(order.orderRef)}`}
                  >
                    {order.orderRef}
                  </Link>
                  {order.createdAt && (
                    <p className="mt-2 text-sm opacity-70">
                      <time dateTime={order.createdAt}>
                        {format.dateTime(new Date(order.createdAt), {
                          dateStyle: "medium",
                          timeZone: "Asia/Seoul"
                        })}
                      </time>
                    </p>
                  )}
                  <OrderSummary order={order} />
                </li>
              ))}
            </ul>
          )}
          <nav
            aria-label={t("pagination")}
            className="mt-8 flex items-center justify-between gap-4 text-sm"
          >
            {history.hasPrevPage ? (
              <Link
                className="underline"
                href={`/lostinseoul/orders?page=${history.page - 1}`}
              >
                {t("previous")}
              </Link>
            ) : (
              <span />
            )}
            <span>
              {t("page", {
                page: history.page,
                total: Math.max(1, history.totalPages)
              })}
            </span>
            {history.hasNextPage ? (
              <Link
                className="underline"
                href={`/lostinseoul/orders?page=${history.page + 1}`}
              >
                {t("next")}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </main>
    </RPage>
  );
}
