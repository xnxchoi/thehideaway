"use client";

import { useTranslations } from "next-intl";
import type {
  CustomerOrder,
  CustomerOrderSummary
} from "@/payload/plugins/ecommerce/order-history";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import { ORDER_STATES, PAYMENT_STATES } from "@/lib/lost-commerce/transitions";

export function OrderSummary({ order }: { order: CustomerOrderSummary }) {
  const t = useTranslations("LOSTINSEOUL.order");
  const history = useTranslations("LOSTINSEOUL.orders");
  const lifecycle =
    (
      [
        ...ORDER_STATES,
        "pending",
        "processing",
        "completed",
        "cancelled"
      ] as const
    ).find((state) => state === order.lifecycleStatus) ?? "unknown";
  const payment =
    ([...PAYMENT_STATES, "unpaid", "pending_manual"] as const).find(
      (state) => state === order.paymentStatus
    ) ?? "unknown";
  const fulfillment =
    (
      [
        "unfulfilled",
        "reserved",
        "in_production",
        "fulfilled",
        "canceled"
      ] as const
    ).find((state) => state === order.fulfillmentStatus) ?? "unknown";
  return (
    <dl className="mt-6 grid gap-4 border-y border-current/15 py-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt className="text-sm opacity-70">{t("status")}</dt>
        <dd>{t(`states.${lifecycle}`)}</dd>
      </div>
      <div>
        <dt className="text-sm opacity-70">{t("payment")}</dt>
        <dd>{t(`payments.${payment}`)}</dd>
      </div>
      <div>
        <dt className="text-sm opacity-70">{history("fulfillment")}</dt>
        <dd>{history(`fulfillments.${fulfillment}`)}</dd>
      </div>
      <div>
        <dt className="text-sm opacity-70">{t("total")}</dt>
        <dd>
          {orderMoney(order.amount, order.currency) ?? history("unavailable")}
        </dd>
      </div>
    </dl>
  );
}

function orderMoney(value: number | null, currency: string | null) {
  if (
    value == null ||
    !currency ||
    !["KRW", "USD", "EUR", "JPY"].includes(currency)
  )
    return null;
  return formatLostMoney(value, currency as "KRW" | "USD" | "EUR" | "JPY");
}

export function OrderDetail({ order }: { order: CustomerOrder }) {
  const t = useTranslations("LOSTINSEOUL.orders");
  const address = (value: Record<string, string>) =>
    Object.values(value).join(" · ");
  return (
    <section aria-label={t("detail")}>
      <p className="mt-4 text-sm break-all">{order.orderRef}</p>
      <OrderSummary order={order} />
      <h2 className="mt-8 text-2xl">{t("items")}</h2>
      <ul className="mt-4 divide-y divide-current/15">
        {order.items.map((item) => (
          <li
            className="grid gap-3 py-5 sm:grid-cols-[1fr_auto]"
            key={item.key}
          >
            <div>
              <h3 className="font-medium">
                {item.productName ?? t("unavailable")}
              </h3>
              {item.skuLabel && (
                <p className="mt-1 text-sm opacity-70">{item.skuLabel}</p>
              )}
              {item.sku && (
                <p className="mt-1 text-sm opacity-70">
                  {t("sku", { sku: item.sku })}
                </p>
              )}
              {item.options.map((option, index) => (
                <p
                  className="mt-1 text-sm opacity-70"
                  key={`${item.key}:option:${index}`}
                >
                  {[option.label, option.value].filter(Boolean).join(": ")}
                </p>
              ))}
            </div>
            <dl className="text-sm">
              <div>
                <dt className="inline opacity-70">{t("quantity")} </dt>
                <dd className="inline">{item.quantity ?? t("unavailable")}</dd>
              </div>
              <div>
                <dt className="inline opacity-70">{t("unitPrice")} </dt>
                <dd className="inline">
                  {orderMoney(item.unitAmount, order.currency) ??
                    t("unavailable")}
                </dd>
              </div>
              <div>
                <dt className="inline opacity-70">{t("lineTotal")} </dt>
                <dd className="inline">
                  {orderMoney(item.lineAmount, order.currency) ??
                    t("unavailable")}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <dl className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="font-medium">{t("shippingAddress")}</dt>
          <dd className="mt-2 text-sm break-words whitespace-pre-wrap opacity-70">
            {address(order.shippingAddress) || t("unavailable")}
          </dd>
        </div>
        <div>
          <dt className="font-medium">{t("billingAddress")}</dt>
          <dd className="mt-2 text-sm break-words whitespace-pre-wrap opacity-70">
            {address(order.billingAddress) || t("unavailable")}
          </dd>
        </div>
        <div>
          <dt className="font-medium">{t("deliveryNote")}</dt>
          <dd className="mt-2 text-sm break-words whitespace-pre-wrap opacity-70">
            {order.deliveryNote || t("unavailable")}
          </dd>
        </div>
        {order.shippingAmount != null && (
          <div>
            <dt>{t("shippingAmount")}</dt>
            <dd>{orderMoney(order.shippingAmount, order.currency)}</dd>
          </div>
        )}
        {order.taxAmount != null && (
          <div>
            <dt>{t("taxAmount")}</dt>
            <dd>{orderMoney(order.taxAmount, order.currency)}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
