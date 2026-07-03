"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import {
  serializeLostCartLines,
  useLostCart
} from "@/lib/lost-commerce/useLostCart";
import "../index.css";

declare global {
  interface Window {
    PortOne?: {
      requestPayment?: (payload: unknown) => Promise<unknown>;
    };
  }
}

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

function isPortOneV2Payload(payload: unknown): payload is { storeId: string } {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "storeId" in payload &&
    typeof (payload as { storeId?: unknown }).storeId === "string"
  );
}

function isPortOneFailure(response: unknown): response is { code: string } {
  return (
    typeof response === "object" &&
    response !== null &&
    "code" in response &&
    typeof (response as { code?: unknown }).code === "string"
  );
}

function loadPortOneSdk(payload: unknown): Promise<void> {
  if (window.PortOne?.requestPayment) return Promise.resolve();

  const sdkVersion = isPortOneV2Payload(payload) ? "v2" : "global";
  const sdkUrl =
    sdkVersion === "v2"
      ? "https://cdn.portone.io/v2/browser-sdk.js"
      : "https://cdn.portone.cloud/global-sdk/v1/portone.js";

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-portone-sdk="${sdkVersion}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = sdkUrl;
    script.async = true;
    script.dataset.portoneSdk = sdkVersion;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `lis_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 18)}`;
}

async function cancelUnpaidOrder(orderRef: string): Promise<void> {
  await fetch("/api/lost/checkout/cancel", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ order_ref: orderRef })
  }).catch(() => undefined);
}

export function LostCheckoutPageClient({
  colophon,
  labels,
  portOneEnabled
}: {
  colophon?: ReactNode;
  labels: Labels;
  portOneEnabled: boolean;
}) {
  const { lines, total, clear } = useLostCart();
  const [provider, setProvider] = useState<"portone" | "manual">(
    portOneEnabled ? "portone" : "manual"
  );
  const [state, setState] = useState<"idle" | "pending" | "failed">("idle");
  const currency = lines[0]?.currency ?? "KRW";

  async function submit(form: HTMLFormElement) {
    setState("pending");
    const formData = new FormData(form);
    const paymentProvider = portOneEnabled ? provider : "manual";
    const response = await fetch("/api/lost/checkout/intent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": createIdempotencyKey()
      },
      body: JSON.stringify({
        paymentProvider,
        contact: {
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone")
        },
        shipping: {
          address: formData.get("address"),
          note: formData.get("note")
        },
        lines: serializeLostCartLines(lines)
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setState("failed");
      return;
    }

    if (paymentProvider === "portone" && data.portone) {
      try {
        await loadPortOneSdk(data.portone);
        const portOneResponse = await window.PortOne?.requestPayment?.(
          data.portone
        );
        if (isPortOneFailure(portOneResponse)) {
          await cancelUnpaidOrder(data.order.order_ref);
          window.location.href = `/lostinseoul/payment/failure?order=${encodeURIComponent(
            data.order.order_ref
          )}`;
          return;
        }
      } catch {
        await cancelUnpaidOrder(data.order.order_ref);
        window.location.href = `/lostinseoul/payment/failure?order=${encodeURIComponent(
          data.order.order_ref
        )}`;
        return;
      }
    }

    clear();
    window.location.href = `/lostinseoul/payment/success?order=${encodeURIComponent(
      data.order.order_ref
    )}`;
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

        {lines.length === 0 ? (
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
                <input
                  className="min-h-[48px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent px-3 text-[16px] outline-none md:text-sm"
                  autoComplete="name"
                  name="name"
                  placeholder={labels.name}
                  required
                />
                <input
                  className="min-h-[48px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent px-3 text-[16px] outline-none md:text-sm"
                  autoComplete="email"
                  inputMode="email"
                  name="email"
                  placeholder={labels.email}
                  required
                  type="email"
                />
                <input
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
                <input
                  className="min-h-[48px] border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent px-3 text-[16px] outline-none md:text-sm"
                  autoComplete="shipping street-address"
                  name="address"
                  placeholder={labels.address}
                  required
                />
                <textarea
                  className="min-h-28 border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)] bg-transparent p-3 text-[16px] outline-none md:text-sm"
                  name="note"
                  placeholder={labels.note}
                />
              </fieldset>
            </div>

            <aside className="border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] bg-[oklch(from_var(--n-s-fg)_l_c_h_/_0.035)] p-4 md:p-5 lg:sticky lg:top-8 lg:h-fit">
              <h2 className="text-lg font-medium">{labels.payment}</h2>
              <div className="mt-4 grid grid-cols-2 border border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.2)]">
                <Button
                  className={`min-h-[44px] border-r border-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)] px-2 text-sm ${
                    provider === "portone"
                      ? "bg-[var(--n-s-fg)] text-[var(--n-s-bg)]"
                      : ""
                  } ${
                    portOneEnabled
                      ? ""
                      : "cursor-not-allowed text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.55)]"
                  }`}
                  disabled={!portOneEnabled}
                  onClick={() => setProvider("portone")}
                  type="button"
                >
                  {labels.portone}
                </Button>
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
              </div>
              {!portOneEnabled ? (
                <p className="mt-3 text-sm leading-relaxed text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.65)]">
                  {labels.portoneUnavailable}
                </p>
              ) : null}
              <div className="mt-6 divide-y divide-[oklch(from_var(--n-s-fg)_l_c_h_/_0.15)]">
                {lines.map((line) => (
                  <div
                    className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4"
                    key={`${line.productId}:${line.variantId ?? ""}:${line.mode}:${line.campaignId ?? ""}`}
                  >
                    <span className="min-w-0 text-sm leading-snug text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.7)]">
                      {line.productName}
                      {line.variantLabel
                        ? ` / ${line.variantLabel}`
                        : ""} x {line.quantity}
                    </span>
                    <span className="justify-self-start font-mono text-[11px] text-[oklch(from_var(--n-s-fg)_l_c_h_/_0.65)] tabular-nums sm:justify-self-end">
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
                <span className="font-mono text-xs tabular-nums">
                  {formatLostMoney(total, currency)}
                </span>
              </p>
              <Button
                className="mt-5 min-h-[48px] w-full bg-[var(--n-s-fg)] px-4 text-sm font-medium text-[var(--n-s-bg)] disabled:cursor-wait disabled:opacity-70"
                disabled={state === "pending"}
                type="submit"
              >
                {state === "pending" ? labels.pending : labels.submit}
              </Button>
              {state === "failed" ? (
                <p className="mt-3 text-sm text-destructive">{labels.failed}</p>
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
