"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/components/sections/Pricing/Pricing.module.scss";

export type CheckoutClientProps = {
  planId: string;
  priceId: string;
  tierLabel: string;
};

export function CheckoutClient(props: CheckoutClientProps) {
  const router = useRouter();
  const [method, setMethod] = useState<"bank_transfer" | "cash">(
    "bank_transfer"
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: props.planId,
          price_id: props.priceId,
          method,
          ...(note.trim() ? { note: note.trim() } : {})
        })
      });
      const out = await res.json();
      if (!res.ok || !out.ok) {
        setErr(`Request failed: ${out.error ?? res.status}`);
        setBusy(false);
        return;
      }
      router.push(
        `/checkout/success?sub=${encodeURIComponent(out.subscriptionId)}&pending=1`
      );
    } catch (e) {
      setBusy(false);
      setErr((e as Error).message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p className={s.eyebrow} style={{ marginBottom: 12 }}>
          Method
        </p>
        <div
          role="radiogroup"
          aria-label="Payment method"
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
        >
          {(["bank_transfer", "cash"] as const).map((m) => (
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
              {m === "bank_transfer" ? "Bank transfer" : "Cash"}
            </button>
          ))}
        </div>
      </div>

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
        disabled={busy}
        onClick={submit}
        style={{
          padding: "16px 22px",
          fontSize: 12
        }}
      >
        {busy ? "Sending…" : `Click here — request ${props.tierLabel} access`}
      </button>

      <p
        style={{
          fontSize: 12,
          color: "var(--pricing-fg-faint)",
          marginTop: 16,
          lineHeight: 1.55
        }}
      >
        This creates a pending subscription. Make the transfer when you can —
        your access unlocks the moment we confirm receipt (usually within a
        day). No card stored, no recurring charges.
      </p>
    </div>
  );
}
