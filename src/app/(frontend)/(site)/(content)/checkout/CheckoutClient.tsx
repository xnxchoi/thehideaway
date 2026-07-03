"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/components/sections/Pricing/Pricing.module.scss";

type ManualMethod = "bank_transfer" | "cash";
type CheckoutMethod = "card" | ManualMethod;

type CheckoutLabels = {
  methodLabel: string;
  methodCard: string;
  methodBankTransfer: string;
  methodCash: string;
  payWithCard: string;
  processing: string;
  verifying: string;
  cardHelp: string;
  soldOut: string;
  genericError: string;
  verifyError: string;
  cardUnavailable: string;
};

export type CheckoutClientProps = {
  planId: string;
  priceId: string;
  tierLabel: string;
  cardEnabled: boolean;
  manualMethods: ManualMethod[];
  amountDisplay: string;
  labels: CheckoutLabels;
};

declare global {
  interface Window {
    PortOne?: {
      requestPayment?: (payload: unknown) => Promise<unknown>;
    };
  }
}

function isPortOneFailure(response: unknown): response is { code: string } {
  return (
    typeof response === "object" &&
    response !== null &&
    "code" in response &&
    typeof (response as { code?: unknown }).code === "string"
  );
}

function loadPortOneSdk(): Promise<void> {
  if (window.PortOne?.requestPayment) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-portone-sdk="v2"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.portone.io/v2/browser-sdk.js";
    script.async = true;
    script.dataset.portoneSdk = "v2";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function idempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `hda_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
}

export function CheckoutClient(props: CheckoutClientProps) {
  const router = useRouter();

  const availableMethods = useMemo<CheckoutMethod[]>(
    () => [
      ...(props.cardEnabled ? (["card"] as const) : []),
      ...props.manualMethods
    ],
    [props.cardEnabled, props.manualMethods]
  );

  const [method, setMethod] = useState<CheckoutMethod>(
    availableMethods[0] ?? "bank_transfer"
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<null | "starting" | "verifying">(null);
  const [err, setErr] = useState<string | null>(null);

  const methodLabel = (m: CheckoutMethod): string =>
    m === "card"
      ? props.labels.methodCard
      : m === "bank_transfer"
        ? props.labels.methodBankTransfer
        : props.labels.methodCash;

  const submitManual = async (chosen: ManualMethod) => {
    const res = await fetch("/api/checkout/manual", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": idempotencyKey()
      },
      body: JSON.stringify({
        plan_id: props.planId,
        price_id: props.priceId,
        method: chosen,
        ...(note.trim() ? { note: note.trim() } : {})
      })
    });
    const out = await res.json().catch(() => null);
    if (!res.ok || !out?.ok) {
      setErr(props.labels.genericError);
      setBusy(null);
      return;
    }
    router.push(
      `/checkout/success?sub=${encodeURIComponent(out.subscriptionId)}&pending=1`
    );
  };

  const submitCard = async () => {
    // 1. Server creates a pending subscription + PortOne payload.
    const res = await fetch("/api/checkout/card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "idempotency-key": idempotencyKey()
      },
      body: JSON.stringify({ plan_id: props.planId, price_id: props.priceId })
    });
    const out = await res.json().catch(() => null);
    if (!res.ok || !out?.ok) {
      const code = out?.error;
      setErr(
        code === "sold-out"
          ? props.labels.soldOut
          : code === "card-unavailable" || code === "card-not-enabled"
            ? props.labels.cardUnavailable
            : props.labels.genericError
      );
      setBusy(null);
      return;
    }

    // 2. Browser invokes the PortOne payment window.
    try {
      await loadPortOneSdk();
      const response = await window.PortOne?.requestPayment?.(out.portone);
      if (isPortOneFailure(response)) {
        setErr(props.labels.genericError);
        setBusy(null);
        return;
      }
    } catch {
      setErr(props.labels.genericError);
      setBusy(null);
      return;
    }

    // 3. Server-side verify (desktop / non-redirect path). Mobile redirects
    //    to /checkout/return which runs the same verify.
    setBusy("verifying");
    const verify = await fetch("/api/checkout/card/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_ref: out.paymentRef })
    });
    const verified = await verify.json().catch(() => null);
    if (!verify.ok || !verified?.ok) {
      // Payment may still be settling; the webhook reconciles. Send the
      // user to success with a soft note rather than a hard failure.
      router.push(
        `/checkout/return?payment=${encodeURIComponent(out.paymentRef)}`
      );
      return;
    }
    router.push(
      `/checkout/success?sub=${encodeURIComponent(verified.subscriptionId)}`
    );
  };

  const submit = async () => {
    if (busy) return;
    setBusy("starting");
    setErr(null);
    try {
      if (method === "card") {
        await submitCard();
      } else {
        await submitManual(method);
      }
    } catch (e) {
      setErr((e as Error).message || props.labels.genericError);
      setBusy(null);
    }
  };

  const ctaLabel =
    busy === "verifying"
      ? props.labels.verifying
      : busy === "starting"
        ? method === "card"
          ? props.labels.processing
          : "…"
        : method === "card"
          ? props.labels.payWithCard
          : `Click here — request ${props.tierLabel} access`;

  return (
    <div>
      {availableMethods.length > 1 ? (
        <div style={{ marginBottom: 20 }}>
          <p className={s.eyebrow} style={{ marginBottom: 12 }}>
            {props.labels.methodLabel}
          </p>
          <div
            role="radiogroup"
            aria-label={props.labels.methodLabel}
            style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
          >
            {availableMethods.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={s.cta}
                style={{
                  flex: "0 0 auto",
                  padding: "10px 18px",
                  opacity: method === m ? 1 : 0.6
                }}
              >
                {methodLabel(m)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {method !== "card" ? (
        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="checkout-note"
            className={s.eyebrow}
            style={{ display: "block", marginBottom: 8 }}
          >
            Note <span style={{ opacity: 0.5 }}>(optional)</span>
          </label>
          <textarea
            id="checkout-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Sender name on the transfer, or anything we should know."
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid var(--pricing-line)",
              borderRadius: 6,
              padding: "12px 14px",
              color: "var(--pricing-fg)",
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily: "inherit",
              resize: "vertical"
            }}
          />
        </div>
      ) : null}

      {err ? (
        <div
          role="alert"
          style={{
            color: "oklch(0.7 0.18 30)",
            fontSize: 13,
            marginBottom: 16
          }}
        >
          {err}
        </div>
      ) : null}

      <button
        type="button"
        className={s.cta}
        disabled={busy !== null}
        onClick={submit}
        style={{ padding: "16px 22px", fontSize: 12 }}
      >
        {ctaLabel}
      </button>

      <p
        style={{
          fontSize: 12,
          color: "var(--pricing-fg-faint)",
          marginTop: 16,
          lineHeight: 1.55
        }}
      >
        {method === "card"
          ? props.labels.cardHelp
          : "This creates a pending subscription. Make the transfer when you can — your access unlocks the moment we confirm receipt (usually within a day). No card stored, no recurring charges."}
      </p>
    </div>
  );
}
