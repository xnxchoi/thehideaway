"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { CustomerOrder } from "@/payload/plugins/ecommerce/order-history";
import { readPurchasePayment } from "@/payload/plugins/ecommerce/client/purchase-confirmation";
import { OrderDetail } from "./order-detail";

export function OrderLookup({ orderRef }: { orderRef: string }) {
  const t = useTranslations("LOSTINSEOUL.orders");
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function retrieve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const input = new FormData(form).get("purchaseAccessToken");
    const purchaseAccessToken =
      typeof input === "string" && input
        ? input
        : readPurchasePayment(orderRef)?.purchaseAccessToken;
    setPending(true);
    setError(false);
    setOrder(null);
    try {
      const response = await fetch("/api/lost/orders", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderRef, purchaseAccessToken })
      });
      if (!response.ok) throw new Error("order-read-failed");
      const data = await response.json();
      if (!data.order || data.order.orderRef !== orderRef)
        throw new Error("order-read-failed");
      setOrder(data.order);
      form.reset();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  if (order) return <OrderDetail order={order} />;
  return (
    <form className="mt-8 max-w-lg" onSubmit={retrieve}>
      <p className="text-sm opacity-70">{t("guestHelp")}</p>
      <label className="mt-6 block text-sm" htmlFor="purchase-access">
        {t("accessCode")}
      </label>
      <input
        className="mt-2 w-full border-b border-current/30 bg-transparent py-3"
        id="purchase-access"
        name="purchaseAccessToken"
        type="password"
        autoComplete="off"
        maxLength={512}
      />
      <button
        className="mt-6 border border-current/30 px-5 py-3 text-sm disabled:opacity-65"
        type="submit"
        disabled={pending}
      >
        {pending ? t("loading") : t("viewOrder")}
      </button>
      {error && (
        <p className="mt-4 text-sm" role="alert">
          {t("lookupError")}
        </p>
      )}
    </form>
  );
}
