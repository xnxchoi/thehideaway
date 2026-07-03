"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/components/sections/Pricing/Pricing.module.scss";

export function CheckoutReturnClient({
  paymentRef,
  verifyingLabel,
  errorLabel
}: {
  paymentRef: string | null;
  verifyingLabel: string;
  errorLabel: string;
}) {
  const router = useRouter();
  const started = useRef(false);
  const [state, setState] = useState<"verifying" | "error">("verifying");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!paymentRef) {
      setState("error");
      return;
    }

    void (async () => {
      const res = await fetch("/api/checkout/card/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_ref: paymentRef })
      }).catch(() => null);
      const out = res ? await res.json().catch(() => null) : null;
      if (res?.ok && out?.ok) {
        router.replace(
          `/checkout/success?sub=${encodeURIComponent(out.subscriptionId)}`
        );
        return;
      }
      // Verify did not confirm — the webhook will reconcile. Show a soft
      // note; do not tell the user to pay again.
      setState("error");
    })();
  }, [paymentRef, router]);

  return (
    <div>
      <p className={s.eyebrow} style={{ marginBottom: 12 }}>
        {state === "verifying" ? verifyingLabel : "Payment received"}
      </p>
      <h1
        className={s.gradientTitle}
        style={{
          fontSize: "clamp(30px, 4vw, 48px)",
          fontWeight: 300,
          margin: 0
        }}
      >
        {state === "verifying" ? "…" : "Almost there."}
      </h1>
      {state === "error" ? (
        <p
          role="status"
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--pricing-fg-mute)",
            maxWidth: "44ch",
            margin: "22px auto 0"
          }}
        >
          {errorLabel}
        </p>
      ) : null}
    </div>
  );
}
