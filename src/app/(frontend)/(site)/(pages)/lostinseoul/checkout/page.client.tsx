"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import {
  serializeLostCartLines,
  useLostCart
} from "@/lib/lost-commerce/useLostCart";

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

export function LostCheckoutPageClient({ labels }: { labels: Labels }) {
  const { lines, total, clear } = useLostCart();
  const [provider, setProvider] = useState<"portone" | "manual">("portone");
  const [state, setState] = useState<"idle" | "pending" | "failed">("idle");
  const currency = lines[0]?.currency ?? "KRW";

  async function submit(form: HTMLFormElement) {
    setState("pending");
    const formData = new FormData(form);
    const response = await fetch("/api/lost/checkout/intent", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": createIdempotencyKey()
      },
      body: JSON.stringify({
        paymentProvider: provider,
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

    if (provider === "portone" && data.portone) {
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
    <main className="min-h-screen bg-[var(--bg)] px-6 py-8 text-[var(--fg)] xl:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between border-b border-[oklch(from_var(--fg)_l_c_h_/_0.15)] pb-4">
          <Link className="text-sm font-medium" href="/lostinseoul/cart">
            {labels.back}
          </Link>
          <h1 className="font-serif text-5xl font-bold tracking-tight">
            {labels.title}
          </h1>
        </div>

        {lines.length === 0 ? (
          <p className="py-24 text-center text-sm text-[oklch(from_var(--fg)_l_c_h_/_0.65)]">
            {labels.empty}
          </p>
        ) : (
          <form
            className="grid gap-8 lg:grid-cols-[1fr_360px]"
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
                  className="min-h-12 border border-[oklch(from_var(--fg)_l_c_h_/_0.2)] bg-transparent px-3 text-sm outline-none"
                  name="name"
                  placeholder={labels.name}
                  required
                />
                <input
                  className="min-h-12 border border-[oklch(from_var(--fg)_l_c_h_/_0.2)] bg-transparent px-3 text-sm outline-none"
                  name="email"
                  placeholder={labels.email}
                  required
                />
                <input
                  className="min-h-12 border border-[oklch(from_var(--fg)_l_c_h_/_0.2)] bg-transparent px-3 text-sm outline-none"
                  name="phone"
                  placeholder={labels.phone}
                />
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="mb-2 text-lg font-medium">
                  {labels.shipping}
                </legend>
                <input
                  className="min-h-12 border border-[oklch(from_var(--fg)_l_c_h_/_0.2)] bg-transparent px-3 text-sm outline-none"
                  name="address"
                  placeholder={labels.address}
                  required
                />
                <textarea
                  className="min-h-24 border border-[oklch(from_var(--fg)_l_c_h_/_0.2)] bg-transparent p-3 text-sm outline-none"
                  name="note"
                  placeholder={labels.note}
                />
              </fieldset>
            </div>

            <aside className="border border-[oklch(from_var(--fg)_l_c_h_/_0.15)] p-5">
              <h2 className="text-lg font-medium">{labels.payment}</h2>
              <div className="mt-4 grid grid-cols-2 border border-[oklch(from_var(--fg)_l_c_h_/_0.2)]">
                <Button
                  className={`min-h-11 border-r border-[oklch(from_var(--fg)_l_c_h_/_0.15)] text-sm ${
                    provider === "portone"
                      ? "bg-[var(--fg)] text-[var(--bg)]"
                      : ""
                  }`}
                  onClick={() => setProvider("portone")}
                  type="button"
                >
                  {labels.portone}
                </Button>
                <Button
                  className={`min-h-11 text-sm ${
                    provider === "manual"
                      ? "bg-[var(--fg)] text-[var(--bg)]"
                      : ""
                  }`}
                  onClick={() => setProvider("manual")}
                  type="button"
                >
                  {labels.manual}
                </Button>
              </div>
              <div className="mt-6 divide-y divide-[oklch(from_var(--fg)_l_c_h_/_0.15)]">
                {lines.map((line) => (
                  <div
                    className="flex justify-between py-3"
                    key={`${line.productId}:${line.variantId ?? ""}:${line.mode}:${line.campaignId ?? ""}`}
                  >
                    <span className="text-sm text-[oklch(from_var(--fg)_l_c_h_/_0.7)]">
                      {line.productName}
                      {line.variantLabel
                        ? ` / ${line.variantLabel}`
                        : ""} x {line.quantity}
                    </span>
                    <span className="font-mono text-[11px] text-[oklch(from_var(--fg)_l_c_h_/_0.65)]">
                      {formatLostMoney(
                        line.unitAmount * line.quantity,
                        line.currency
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-[oklch(from_var(--fg)_l_c_h_/_0.65)]">
                {labels.total} {formatLostMoney(total, currency)}
              </p>
              <Button
                className="mt-5 min-h-12 w-full bg-[var(--fg)] px-4 text-sm font-medium text-[var(--bg)]"
                disabled={state === "pending"}
              >
                {state === "pending" ? labels.pending : labels.submit}
              </Button>
              {state === "failed" ? (
                <p className="mt-3 text-sm text-destructive">{labels.failed}</p>
              ) : null}
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
