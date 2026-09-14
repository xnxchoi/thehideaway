"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import {
  isLostCommercePaymentUiEnabled,
  shouldExecuteLostCommercePayment
} from "@/lib/lost-commerce/payment-preview";
import { useStoreCart } from "@/lib/lost-commerce/useStoreCart";
import {
  useCart,
  usePayments
} from "@payloadcms/plugin-ecommerce/client/react";
import { pluginPortOneClientPayload } from "@/payload/plugins/ecommerce/client/portone-checkout";
import { clearCheckoutIdempotencyKey } from "./checkout-idempotency";
import { useTranslations } from "next-intl";
import {
  checkoutErrorKey,
  confirmPurchase,
  purchasePaymentFromInitiation,
  readPendingPurchaseForViewer,
  canRecoverPurchase,
  markPurchaseRetryable,
  rememberPurchasePayment,
  rememberPurchaseReceipt,
  type PurchasePayment
} from "@/payload/plugins/ecommerce/client/purchase-confirmation";
import { useRPSession } from "@/lib/auth/session/RP_SessionProvider";
import { loadPortOneSdk } from "@/payload/plugins/ecommerce/client/portone-sdk";
import "@lostinseoul/index.css";

type Labels = {
  title: string;
  back: string;
  contact: string;
  shipping: string;
  payment: string;
  portone: string;
  manual: string;
  submit: string;
  pending: string;
  recovering: string;
  recovery: string;
  failed: string;
  portoneUnavailable: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  note: string;
  empty: string;
  total: string;
};

function isPortOneFailure(response: unknown): response is { code: string } {
  return (
    typeof response === "object" &&
    response !== null &&
    "code" in response &&
    typeof (response as { code?: unknown }).code === "string"
  );
}

export function LostCheckoutPageClient({
  colophon,
  labels,
  manualPaymentEnabled,
  paymentPreviewEnabled,
  portOneEnabled,
  portOneSdkVersion
}: {
  colophon?: ReactNode;
  labels: Labels;
  manualPaymentEnabled: boolean;
  paymentPreviewEnabled: boolean;
  portOneEnabled: boolean;
  portOneSdkVersion: "v2" | "global";
}) {
  const { lines, total } = useStoreCart();
  const viewerID = useRPSession((session) => session.id);
  const operationRef = useRef(0);
  const { cart } = useCart();
  const t = useTranslations("LOSTINSEOUL.checkout");
  const [errorKey, setErrorKey] = useState<
    | ReturnType<typeof checkoutErrorKey>
    | "verificationPending"
    | "paymentFailed"
  >("failed");
  const { confirmOrder, initiatePayment } = usePayments();
  const portOneUiEnabled = isLostCommercePaymentUiEnabled({
    configured: portOneEnabled,
    previewEnabled: paymentPreviewEnabled
  });
  const [provider, setProvider] = useState<"portone" | "manual">(
    portOneUiEnabled ? "portone" : "manual"
  );
  const [state, setState] = useState<
    "idle" | "pending" | "reconciling" | "failed"
  >("idle");
  const [pendingPayment, setPendingPayment] = useState<PurchasePayment | null>(
    null
  );
  const currency = lines[0]?.currency ?? "KRW";

  const recoveryPayment =
    canRecoverPurchase(pendingPayment, viewerID) && !pendingPayment.retryPayment
      ? pendingPayment
      : null;
  useEffect(() => {
    operationRef.current += 1;
    const pending = readPendingPurchaseForViewer(viewerID);
    setPendingPayment(pending && !pending.retryPayment ? pending : null);
    setState("idle");
    return () => {
      operationRef.current += 1;
    };
  }, [viewerID]);

  async function completePurchase(payment: PurchasePayment, operation: number) {
    const confirmed = await confirmPurchase(payment, {
      currentCartID: cart?.id,
      officialConfirm: confirmOrder
    });
    if (["failed", "cancelled"].includes(confirmed.attemptStatus ?? "")) {
      markPurchaseRetryable(payment);
      if (operation !== operationRef.current) return;
      setPendingPayment(null);
      setErrorKey("paymentFailed");
      setState("failed");
      return;
    }
    if (operation !== operationRef.current) return;
    if (
      confirmed.paymentStatus !== "paid" ||
      confirmed.reconciliationRequired
    ) {
      setErrorKey("verificationPending");
      setState("failed");
      return;
    }
    rememberPurchaseReceipt(payment);
    clearCheckoutIdempotencyKey();
    // Do not clear the current cart: it may have changed or merged after initiation.
    window.location.href = `/lostinseoul/payment/success?order=${encodeURIComponent(confirmed.orderRef)}`;
  }

  async function recoverPendingPayment() {
    if (!recoveryPayment || state === "pending" || state === "reconciling")
      return;
    const operation = ++operationRef.current;
    setState("reconciling");
    try {
      await completePurchase(recoveryPayment, operation);
    } catch (error) {
      if (operation !== operationRef.current) return;
      setErrorKey(checkoutErrorKey(error));
      setState("failed");
    }
  }

  async function submit(form: HTMLFormElement) {
    if (state === "pending" || state === "reconciling") return;
    const operation = ++operationRef.current;
    setState("pending");
    setErrorKey("failed");
    const originalCartID = cart?.id ? String(cart.id) : null;
    if (!originalCartID || provider !== "portone" || !portOneUiEnabled) {
      setState("failed");
      return;
    }
    if (
      !shouldExecuteLostCommercePayment({
        paymentPreviewEnabled,
        paymentProvider: provider,
        portOneEnabled
      })
    ) {
      setState("idle");
      return;
    }
    const formData = new FormData(form);
    const previousAttempt = readPendingPurchaseForViewer(viewerID);
    try {
      await loadPortOneSdk(portOneSdkVersion);
      if (operation !== operationRef.current) return;
      if (!window.PortOne?.requestPayment)
        throw new Error("portone-unavailable");
      const address = {
        firstName: String(formData.get("name") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        addressLine1: String(formData.get("address") ?? "").trim()
      };
      const initiated: unknown = await initiatePayment("portone", {
        additionalData: {
          customerEmail: String(formData.get("email") ?? "").trim(),
          retryPayment:
            previousAttempt?.retryPayment === true &&
            previousAttempt.cartID === originalCartID,
          expectedAmount: total,
          expectedCurrency: currency,
          deliveryNote: String(formData.get("note") ?? "").trim(),
          shippingAddress: address,
          billingAddress: address
        }
      });
      const clientPayload = pluginPortOneClientPayload(initiated);
      const payment = purchasePaymentFromInitiation(initiated, originalCartID);
      if (!clientPayload || !payment)
        throw new Error("checkout-initiation-unavailable");
      if (operation !== operationRef.current) return;
      // Persist before opening the SDK; storage loss must not launch an unrecoverable payment.
      rememberPurchasePayment(payment);
      setPendingPayment(payment);
      const portOneResponse =
        await window.PortOne.requestPayment(clientPayload);
      if (operation !== operationRef.current) return;
      if (isPortOneFailure(portOneResponse)) {
        setErrorKey("verificationPending");
        setState("failed");
        return;
      }
      await completePurchase(payment, operation);
    } catch (error) {
      if (operation !== operationRef.current) return;
      // Preserve the purchase capability when the provider or network outcome is uncertain.
      setErrorKey(checkoutErrorKey(error));
      setState("failed");
    }
  }

  return (
    <main className="lost-checkout-root min-h-screen bg-[var(--n-s-bg)] px-4 py-5 text-[var(--n-s-fg)] [--n-s-bg:var(--black)] [--n-s-fg:var(--white)] selection:bg-[var(--n-s-fg)] selection:text-[var(--n-s-bg)] md:px-10 md:py-8">
      <style>
        {`
          body:has(.lost-checkout-root) #rp-header,
          body:has(.lost-checkout-root) footer,
          body:has(.lost-checkout-root) .rp__cursor,
          body:has(.lost-checkout-root) .menu__body,
          body:has(.lost-checkout-root) .menu__frame,
          body:has(.lost-checkout-root) .menu__frame-corner,
          body:has(.lost-checkout-root) .menu__corner-svg,
          body:has(.lost-checkout-root) .menu__preview-preview,
          body:has(.lost-checkout-root) .preview__gradient,
          body:has(.lost-checkout-root) .pt_container,
          body:has(.lost-checkout-root) .pt_mask,
          body:has(.lost-checkout-root) .pt_cornerstones,
          body:has(.lost-checkout-root) .scroll-indicator,
          body:has(.lost-checkout-root) [class*="z-239"],
          body:has(.lost-checkout-root) [class*="z-[248]"],
          body:has(.lost-checkout-root) [class*="top-fx-bottom"] {
            display: none !important;
          }

          body:has(.lost-checkout-root) {
            background: var(--n-s-bg);
          }
        `}
      </style>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 grid gap-5 border-b border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] pb-5 md:mb-10 md:flex md:items-end md:justify-between">
          <Link
            className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.72)]"
            href="/lostinseoul/cart"
          >
            {labels.back}
          </Link>
          <h1 className="font-serif text-5xl leading-none font-bold tracking-tight md:text-6xl">
            {labels.title}
          </h1>
        </div>

        {recoveryPayment ? (
          <section className="mx-auto max-w-md border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] p-5">
            <Button
              className="min-h-[48px] w-full bg-[var(--n-s-fg)] px-4 text-sm font-medium text-[var(--n-s-bg)] disabled:cursor-wait disabled:opacity-70"
              disabled={state === "pending" || state === "reconciling"}
              onClick={() => void recoverPendingPayment()}
              type="button"
            >
              {state === "reconciling" ? labels.recovering : labels.recovery}
            </Button>
            <p aria-live="polite" className="mt-3 text-sm" role="status">
              {state === "reconciling"
                ? labels.recovering
                : state === "failed"
                  ? t(errorKey)
                  : ""}
            </p>
          </section>
        ) : lines.length === 0 ? (
          <p className="py-24 text-center text-sm text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.65)]">
            {labels.empty}
          </p>
        ) : (
          <form
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] lg:gap-8"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(event.currentTarget);
            }}
          >
            <div className="grid gap-6">
              <fieldset className="grid gap-3">
                <legend className="mb-2 text-lg font-medium">
                  {labels.contact}
                </legend>
                <label className="sr-only" htmlFor="lost-checkout-name">
                  {labels.name}
                </label>
                <input
                  id="lost-checkout-name"
                  className="min-h-[48px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent px-3 text-[16px] outline-none md:text-sm"
                  autoComplete="name"
                  name="name"
                  placeholder={labels.name}
                  required
                />
                <label className="sr-only" htmlFor="lost-checkout-email">
                  {labels.email}
                </label>
                <input
                  id="lost-checkout-email"
                  className="min-h-[48px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent px-3 text-[16px] outline-none md:text-sm"
                  autoComplete="email"
                  inputMode="email"
                  name="email"
                  placeholder={labels.email}
                  required
                  type="email"
                />
                <label className="sr-only" htmlFor="lost-checkout-phone">
                  {labels.phone}
                </label>
                <input
                  id="lost-checkout-phone"
                  className="min-h-[48px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent px-3 text-[16px] outline-none md:text-sm"
                  autoComplete="tel"
                  inputMode="tel"
                  name="phone"
                  placeholder={labels.phone}
                  type="tel"
                />
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="mb-2 text-lg font-medium">
                  {labels.shipping}
                </legend>
                <label className="sr-only" htmlFor="lost-checkout-address">
                  {labels.address}
                </label>
                <input
                  id="lost-checkout-address"
                  className="min-h-[48px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent px-3 text-[16px] outline-none md:text-sm"
                  autoComplete="shipping street-address"
                  name="address"
                  placeholder={labels.address}
                  required
                />
                <label className="sr-only" htmlFor="lost-checkout-note">
                  {labels.note}
                </label>
                <textarea
                  id="lost-checkout-note"
                  className="min-h-28 border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent p-3 text-[16px] outline-none md:text-sm"
                  maxLength={2000}
                  name="note"
                  placeholder={labels.note}
                />
              </fieldset>
            </div>

            <aside className="border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.035)] p-4 md:p-5 lg:sticky lg:top-8 lg:h-fit">
              <h2 className="text-lg font-medium">{labels.payment}</h2>
              <div
                className={`mt-4 grid border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] ${
                  manualPaymentEnabled ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                <Button
                  className={`min-h-[44px] border-r border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] px-2 text-sm ${
                    provider === "portone"
                      ? "bg-[var(--n-s-fg)] text-[var(--n-s-bg)]"
                      : ""
                  } ${
                    portOneUiEnabled
                      ? ""
                      : "cursor-not-allowed text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.55)]"
                  }`}
                  disabled={!portOneUiEnabled}
                  onClick={() => setProvider("portone")}
                  type="button"
                >
                  {labels.portone}
                </Button>
                {manualPaymentEnabled ? (
                  <Button
                    className={`min-h-[44px] px-2 text-sm ${
                      provider === "manual"
                        ? "bg-[var(--n-s-fg)] text-[var(--n-s-bg)]"
                        : ""
                    }`}
                    onClick={() => setProvider("manual")}
                    type="button"
                  >
                    {labels.manual}
                  </Button>
                ) : null}
              </div>
              {!portOneUiEnabled ? (
                <p className="mt-3 text-sm leading-relaxed text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.65)]">
                  {labels.portoneUnavailable}
                </p>
              ) : null}
              <div className="mt-6 divide-y divide-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)]">
                {lines.map((line) => (
                  <div
                    className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                    key={`${line.productId}:${line.skuId}:${line.mode}:${line.campaignId ?? ""}`}
                  >
                    <span className="min-w-0 text-sm leading-snug text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.7)]">
                      {line.productName}
                      {line.variantLabel
                        ? ` / ${line.variantLabel}`
                        : ""} x {line.quantity}
                    </span>
                    <span className="justify-self-start font-sans text-[11px] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.65)] tabular-nums sm:justify-self-end">
                      {formatLostMoney(
                        line.unitAmount * line.quantity,
                        line.currency
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 flex items-center justify-between gap-4 border-t border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] pt-5 text-sm text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.65)]">
                <span>{labels.total}</span>
                <span className="font-sans text-xs tabular-nums">
                  {formatLostMoney(total, currency)}
                </span>
              </p>
              <Button
                className="mt-5 min-h-[48px] w-full bg-[var(--n-s-fg)] px-4 text-sm font-medium text-[var(--n-s-bg)] disabled:cursor-wait disabled:opacity-70"
                disabled={
                  state === "pending" ||
                  (!portOneUiEnabled && !manualPaymentEnabled)
                }
                type="submit"
              >
                {state === "pending" ? labels.pending : labels.submit}
              </Button>
              {state === "failed" ? (
                <p className="mt-3 text-sm text-destructive">{t(errorKey)}</p>
              ) : null}
            </aside>
          </form>
        )}
        {colophon ? (
          <div className="mx-auto mt-12 max-w-3xl text-[var(--n-s-fg)]">
            {colophon}
          </div>
        ) : null}
      </div>
    </main>
  );
}
