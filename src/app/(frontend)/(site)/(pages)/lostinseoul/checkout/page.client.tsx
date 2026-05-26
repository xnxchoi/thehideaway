"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button";
import { Link } from "@/components/core/Link/Link";
import { formatLostMoney } from "@/lib/lost-commerce/format";
import { useLostCart } from "@/lib/lost-commerce/useLostCart";

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

function loadPortOneSdk(): Promise<void> {
  if (window.PortOne?.requestPayment) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-portone-global]"
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.portone.cloud/global-sdk/v1/portone.js";
    script.async = true;
    script.dataset.portoneGlobal = "true";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
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
      headers: { "content-type": "application/json" },
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
        lines: lines.map(({ productName, productSlug, price, unitAmount, currency, imageUrl, ...line }) => line)
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setState("failed");
      return;
    }

    if (provider === "portone" && data.portone) {
      await loadPortOneSdk();
      await window.PortOne?.requestPayment?.(data.portone);
    }

    clear();
    window.location.href = `/lostinseoul/payment/success?order=${encodeURIComponent(
      data.order.order_ref
    )}`;
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-6 py-8 text-[#161412] xl:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between border-b border-black/15 pb-4">
          <Link className="text-sm font-medium" href="/lostinseoul/cart">
            {labels.back}
          </Link>
          <h1 className="font-serif text-5xl font-bold tracking-tight">
            {labels.title}
          </h1>
        </div>

        {lines.length === 0 ? (
          <p className="py-24 text-center text-sm text-black/65">
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
                  className="min-h-12 border border-black/20 bg-transparent px-3 text-sm outline-none"
                  name="name"
                  placeholder={labels.name}
                  required
                />
                <input
                  className="min-h-12 border border-black/20 bg-transparent px-3 text-sm outline-none"
                  name="email"
                  placeholder={labels.email}
                  required
                />
                <input
                  className="min-h-12 border border-black/20 bg-transparent px-3 text-sm outline-none"
                  name="phone"
                  placeholder={labels.phone}
                />
              </fieldset>
              <fieldset className="grid gap-3">
                <legend className="mb-2 text-lg font-medium">
                  {labels.shipping}
                </legend>
                <input
                  className="min-h-12 border border-black/20 bg-transparent px-3 text-sm outline-none"
                  name="address"
                  placeholder={labels.address}
                  required
                />
                <textarea
                  className="min-h-24 border border-black/20 bg-transparent p-3 text-sm outline-none"
                  name="note"
                  placeholder={labels.note}
                />
              </fieldset>
            </div>

            <aside className="border border-black/15 p-5">
              <h2 className="text-lg font-medium">{labels.payment}</h2>
              <div className="mt-4 grid grid-cols-2 border border-black/20">
                <Button
                  className={`min-h-11 border-r border-black/15 text-sm ${
                    provider === "portone" ? "bg-black text-[#f5f0e8]" : ""
                  }`}
                  onClick={() => setProvider("portone")}
                  type="button"
                >
                  {labels.portone}
                </Button>
                <Button
                  className={`min-h-11 text-sm ${
                    provider === "manual" ? "bg-black text-[#f5f0e8]" : ""
                  }`}
                  onClick={() => setProvider("manual")}
                  type="button"
                >
                  {labels.manual}
                </Button>
              </div>
              <div className="mt-6 divide-y divide-black/15">
                {lines.map((line) => (
                  <div className="flex justify-between py-3" key={line.productId}>
                    <span className="text-sm text-black/70">
                      {line.productName} x {line.quantity}
                    </span>
                    <span className="font-mono text-[11px] text-black/65">
                      {formatLostMoney(line.unitAmount * line.quantity, line.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-black/65">
                {labels.total} {formatLostMoney(total, currency)}
              </p>
              <Button
                className="mt-5 min-h-12 w-full bg-black px-4 text-sm font-medium text-[#f5f0e8]"
                disabled={state === "pending"}
              >
                {state === "pending" ? labels.pending : labels.submit}
              </Button>
              {state === "failed" ? (
                <p className="mt-3 text-sm text-red-700">{labels.failed}</p>
              ) : null}
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
